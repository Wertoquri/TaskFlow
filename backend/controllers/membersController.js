const { getQuery, run } = require('../db');

async function listMembers(req, res) {
  const projectId = Number(req.params.id);
  try {
    const rows = await getQuery('SELECT pm.*, u.username, u.email FROM project_members pm JOIN users u ON u.id = pm.user_id WHERE pm.project_id = ?', [projectId]);
    res.json(rows);
  } catch (e) { res.status(500).json({ message: 'Server error' }); }
}

async function kickMember(req, res) {
  const projectId = Number(req.params.id);
  const userId = Number(req.params.userId);
  const requesterId = req.user.id;
  try {
    // verify requester is admin
    const admins = await getQuery('SELECT role FROM project_members WHERE project_id = ? AND user_id = ?', [projectId, requesterId]);
    if (!admins.length || admins[0].role !== 'admin') return res.status(403).json({ message: 'Admin only' });
    const result = await run('DELETE FROM project_members WHERE project_id = ? AND user_id = ?', [projectId, userId]);
    if (!result.affectedRows) return res.status(404).json({ message: 'Member not found' });
    res.json({ message: 'Member removed' });
  } catch (e) { res.status(500).json({ message: 'Server error' }); }
}

module.exports = { listMembers, kickMember };
