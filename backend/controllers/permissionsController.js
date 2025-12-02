const { getQuery, run } = require('../db');

function defaultPermissions(role) {
  if (role === 'admin') return { create: true, edit: true, delete: true };
  return { create: false, edit: true, delete: false };
}

async function getPermissions(req, res) {
  const projectId = Number(req.params.id);
  const userId = req.user.id;
  try {
    const rows = await getQuery('SELECT role, permissions FROM project_members WHERE project_id = ? AND user_id = ?', [projectId, userId]);
    if (!rows.length) return res.status(403).json({ message: 'Not a member' });
    const { role, permissions } = rows[0];
    const perms = permissions ? JSON.parse(permissions) : defaultPermissions(role);
    res.json({ role, permissions: perms });
  } catch (e) { res.status(500).json({ message: 'Server error' }); }
}

async function updatePermissions(req, res) {
  const projectId = Number(req.params.id);
  const requesterId = req.user.id;
  const { permissions } = req.body;
  try {
    const me = await getQuery('SELECT role FROM project_members WHERE project_id = ? AND user_id = ?', [projectId, requesterId]);
    if (!me.length || me[0].role !== 'admin') return res.status(403).json({ message: 'Admin only' });
    // apply shared default permissions for members
    await run('UPDATE project_members SET permissions = ? WHERE project_id = ? AND role = "member" AND (permissions IS NULL)', [JSON.stringify(permissions), projectId]);
    res.json({ message: 'Default member permissions updated' });
  } catch (e) { res.status(500).json({ message: 'Server error' }); }
}

// Per-user granular permissions
async function updateMemberPermissions(req, res) {
  const projectId = Number(req.params.id);
  const targetUserId = Number(req.params.userId);
  const requesterId = req.user.id;
  const permissions = req.body; // JSON object (whole body is permissions)
  console.log('updateMemberPermissions DEBUG:', { projectId, targetUserId, requesterId, permissions });
  try {
    const me = await getQuery('SELECT role FROM project_members WHERE project_id = ? AND user_id = ?', [projectId, requesterId]);
    if (!me.length || me[0].role !== 'admin') return res.status(403).json({ message: 'Admin only' });
    const member = await getQuery('SELECT id FROM project_members WHERE project_id = ? AND user_id = ?', [projectId, targetUserId]);
    if (!member.length) return res.status(404).json({ message: 'Member not found' });
    await run('UPDATE project_members SET permissions = ? WHERE project_id = ? AND user_id = ?', [JSON.stringify(permissions || {}), projectId, targetUserId]);
    console.log('updateMemberPermissions SUCCESS: updated permissions for user', targetUserId);
    res.json({ message: 'Member permissions updated' });
  } catch (e) { console.error('updateMemberPermissions ERROR:', e); res.status(500).json({ message: 'Server error' }); }
}

module.exports = { getPermissions, updatePermissions, updateMemberPermissions };
