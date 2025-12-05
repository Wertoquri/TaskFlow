const { getQuery, run } = require('../db');

// GET /api/tasks/:id/activity
// supports pagination: ?page=1&limit=20
const getTaskActivity = async (req, res) => {
  const { id } = req.params;
  const page = Math.max(1, parseInt(req.query.page || '1', 10));
  const limit = Math.min(200, Math.max(5, parseInt(req.query.limit || '20', 10)));
  const offset = (page - 1) * limit;
  try {
    const rows = await getQuery(
      `SELECT a.id, a.task_id, a.user_id, a.type, a.metadata, a.created_at, u.username
       FROM task_activity a
       LEFT JOIN users u ON u.id = a.user_id
       WHERE a.task_id = ?
       ORDER BY a.created_at DESC
       LIMIT ? OFFSET ?`,
      [id, limit, offset]
    );
    const countRow = await getQuery('SELECT COUNT(*) AS cnt FROM task_activity WHERE task_id = ?', [id]);
    const total = countRow[0]?.cnt || 0;
    const formatted = rows.map((r) => ({
      id: r.id,
      task_id: r.task_id,
      user_id: r.user_id,
      username: r.username,
      type: r.type,
      metadata: r.metadata ? (typeof r.metadata === 'string' ? JSON.parse(r.metadata) : r.metadata) : null,
      created_at: r.created_at,
    }));
    res.json({ items: formatted, page, limit, total, hasMore: offset + rows.length < total });
  } catch (err) {
    console.error('Get task activity error:', err);
    res.status(500).json({ message: 'Server error', error: err });
  }
};

module.exports = { getTaskActivity };

// GET /api/projects/:id/activity
const getProjectActivity = async (req, res) => {
  const { id } = req.params;
  const page = Math.max(1, parseInt(req.query.page || '1', 10));
  const limit = Math.min(200, Math.max(10, parseInt(req.query.limit || '20', 10)));
  const offset = (page - 1) * limit;
  try {
    const rows = await getQuery(
      `SELECT a.id, a.task_id, a.user_id, a.type, a.metadata, a.created_at, u.username
       FROM task_activity a
       LEFT JOIN users u ON u.id = a.user_id
       WHERE a.task_id IN (SELECT id FROM tasks WHERE project_id = ?)
       ORDER BY a.created_at DESC
       LIMIT ? OFFSET ?`,
      [id, limit, offset]
    );
    const countRow = await getQuery(
      `SELECT COUNT(*) AS cnt FROM task_activity WHERE task_id IN (SELECT id FROM tasks WHERE project_id = ?)`,
      [id]
    );
    const total = countRow[0]?.cnt || 0;
    const formatted = rows.map((r) => ({
      id: r.id,
      task_id: r.task_id,
      user_id: r.user_id,
      username: r.username,
      type: r.type,
      metadata: r.metadata ? (typeof r.metadata === 'string' ? JSON.parse(r.metadata) : r.metadata) : null,
      created_at: r.created_at,
    }));
    res.json({ items: formatted, page, limit, total, hasMore: offset + rows.length < total });
  } catch (err) {
    console.error('Get project activity error:', err);
    res.status(500).json({ message: 'Server error', error: err });
  }
};

module.exports.getProjectActivity = getProjectActivity;
// DELETE /api/projects/:id/activity -- clear project activity (only project owner)
const deleteProjectActivity = async (req, res) => {
  const { id: projectId } = req.params;
  const userId = req.user?.id;
  try {
    // Check if user is project owner OR an admin member
    const [project] = await getQuery(
      `SELECT
         p.owner_id,
         pm.role
       FROM projects p
       LEFT JOIN project_members pm ON p.id = pm.project_id AND pm.user_id = ?
       WHERE p.id = ?`,
      [userId, projectId]
    );

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const isOwner = project.owner_id === userId;
    const isAdmin = project.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Only project owner or admins can clear activity' });
    }

    // Delete all activity rows for tasks in this project
    await run('DELETE FROM task_activity WHERE task_id IN (SELECT id FROM tasks WHERE project_id = ?)', [projectId]);
    res.json({ message: 'Project activity cleared' });
  } catch (err) {
    console.error('Delete project activity error:', err);
    res.status(500).json({ message: 'Server error', error: err });
  }
};

module.exports.deleteProjectActivity = deleteProjectActivity;