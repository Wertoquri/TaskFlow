const { getQuery, run } = require('../db');
const { createNotification } = require('../helpers/notifications');

async function createInvitation(req, res) {
  const projectId = Number(req.params.id);
  const { email } = req.body;
  const senderId = req.user.id;
  try {
    const users = await getQuery('SELECT id FROM users WHERE email = ?', [email]);
    if (!users.length) return res.status(404).json({ message: 'User not found' });
    const recipientId = users[0].id;
    const existing = await getQuery('SELECT id FROM invitations WHERE project_id = ? AND recipient_user_id = ? AND status = "pending"', [projectId, recipientId]);
    if (existing.length) return res.status(400).json({ message: 'Invitation already pending' });
    const result = await run('INSERT INTO invitations (project_id, sender_id, recipient_user_id, status) VALUES (?, ?, ?, "pending")', [projectId, senderId, recipientId]);
    // notify recipient
    const io = req.app.get('io');
    
    // Get project name for notification
    const proj = await getQuery('SELECT name FROM projects WHERE id = ?', [projectId]);
    const projectName = proj.length ? proj[0].name : `Project #${projectId}`;
    
    // Create notification in DB + emit via socket
    if (io) {
      await createNotification(
        recipientId,
        'project_invite',
        { invitation_id: result.insertId, project_id: projectId, project_name: projectName, sender_id: senderId },
        io
      );
    }
    
    io && io.to(`user:${recipientId}`).emit('invite:new', { id: result.insertId, project_id: projectId });
    res.status(201).json({ id: result.insertId });
  } catch (e) {
    console.error('createInvitation', e);
    res.status(500).json({ message: 'Server error' });
  }
}

async function listProjectInvitations(req, res) {
  const projectId = Number(req.params.id);
  try {
    const rows = await getQuery('SELECT i.*, u.email AS recipient_email FROM invitations i JOIN users u ON u.id = i.recipient_user_id WHERE i.project_id = ? ORDER BY i.created_at DESC', [projectId]);
    res.json(rows);
  } catch (e) { res.status(500).json({ message: 'Server error' }); }
}

async function listMyInvitations(req, res) {
  const userId = req.user.id;
  console.log('listMyInvitations called for userId:', userId);
  try {
    // Avoid selecting a specific project name column due to schema differences (name/title)
    const rows = await getQuery(
      'SELECT i.* FROM invitations i WHERE i.recipient_user_id = ? AND i.status = "pending" ORDER BY i.created_at DESC',
      [userId]
    );
    console.log('listMyInvitations result:', rows);
    res.json(rows);
  } catch (e) {
    console.error('listMyInvitations ERROR:', e);
    res.status(500).json({ message: 'Server error' });
  }
}

async function acceptInvitation(req, res) {
  const invId = Number(req.params.invId);
  const userId = req.user.id;
  try {
    const inv = await getQuery('SELECT * FROM invitations WHERE id = ?', [invId]);
    if (!inv.length) return res.status(404).json({ message: 'Invitation not found' });
    const { project_id, recipient_user_id, status } = inv[0];
    if (recipient_user_id !== userId) return res.status(403).json({ message: 'Not your invitation' });
    if (status !== 'pending') return res.status(400).json({ message: 'Invitation already processed' });
    await run('UPDATE invitations SET status = "accepted" WHERE id = ?', [invId]);
    await run('INSERT IGNORE INTO project_members (project_id, user_id, role) VALUES (?, ?, "member")', [project_id, userId]);
    const io = req.app.get('io');
    io && io.to(`project:${project_id}`).emit('member:joined', { user_id: userId, project_id });
    res.json({ message: 'Joined project' });
  } catch (e) { console.error('acceptInvitation', e); res.status(500).json({ message: 'Server error' }); }
}

async function declineInvitation(req, res) {
  const invId = Number(req.params.invId);
  const userId = req.user.id;
  try {
    const inv = await getQuery('SELECT * FROM invitations WHERE id = ?', [invId]);
    if (!inv.length) return res.status(404).json({ message: 'Invitation not found' });
    const { recipient_user_id, status } = inv[0];
    if (recipient_user_id !== userId) return res.status(403).json({ message: 'Not your invitation' });
    if (status !== 'pending') return res.status(400).json({ message: 'Invitation already processed' });
    await run('UPDATE invitations SET status = "declined" WHERE id = ?', [invId]);
    const io = req.app.get('io');
    io && io.to(`project:${inv[0].project_id}`).emit('invite:declined', { user_id: userId, project_id: inv[0].project_id });
    res.json({ message: 'Declined' });
  } catch (e) { res.status(500).json({ message: 'Server error' }); }
}

module.exports = { createInvitation, listProjectInvitations, listMyInvitations, acceptInvitation, declineInvitation };
