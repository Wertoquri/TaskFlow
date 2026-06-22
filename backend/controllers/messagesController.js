const { getQuery, run } = require('../db');

async function listMessages(req, res) {
  const projectId = Number(req.params.id);
  try {
    // Check whether users table has avatar/avatar_url columns to include them defensively
    const sql = 'SELECT m.*, u.username, u.avatar, u.avatar_url FROM messages m JOIN users u ON u.id = m.user_id WHERE m.project_id = ? ORDER BY m.created_at ASC';
    const rows = await getQuery(sql, [projectId]);
    res.json(rows);
  } catch (e) { console.error('listMessages', e); res.status(500).json({ message: 'Server error' }); }
}

async function postMessage(req, res) {
  const projectId = Number(req.params.id);
  const userId = req.user.id;
  const { content } = req.body;
  if (!content || !content.trim()) return res.status(400).json({ message: 'Empty message' });
  try {
    const result = await run('INSERT INTO messages (project_id, user_id, content) VALUES (?, ?, ?)', [projectId, userId, content]);
    // Get username and (optionally) avatar fields for response and socket
    const userRows = await getQuery('SELECT username, avatar, avatar_url FROM users WHERE id = ?', [userId]);
    const u = userRows.length ? userRows[0] : { username: `User #${userId}` };
    const message = { id: result.insertId, project_id: projectId, user_id: userId, content, username: u.username, created_at: new Date().toISOString() };
    if (u.avatar) message.avatar = u.avatar;
    if (u.avatar_url) message.avatar_url = u.avatar_url;
    const io = req.app.get('io');
    io && io.to(`project:${projectId}`).emit('chat:message', message);
    res.status(201).json(message);
  } catch (e) { console.error('postMessage', e); res.status(500).json({ message: 'Server error' }); }
}

async function updateMessage(req, res) {
  const messageId = Number(req.params.messageId);
  const userId = req.user.id;
  const { content } = req.body;
  if (!content || !content.trim()) return res.status(400).json({ message: 'Empty message' });
  try {
    const msg = await getQuery('SELECT project_id, user_id FROM messages WHERE id = ?', [messageId]);
    if (!msg.length) return res.status(404).json({ message: 'Message not found' });
    if (msg[0].user_id !== userId) return res.status(403).json({ message: 'Not your message' });
    await run('UPDATE messages SET content = ? WHERE id = ?', [content, messageId]);
    const io = req.app.get('io');
    io && io.to(`project:${msg[0].project_id}`).emit('chat:updated', { id: messageId, content });
    res.json({ message: 'Message updated' });
  } catch (e) { console.error('updateMessage', e); res.status(500).json({ message: 'Server error' }); }
}

async function deleteMessage(req, res) {
  const messageId = Number(req.params.messageId);
  const userId = req.user.id;
  try {
    const msg = await getQuery('SELECT project_id, user_id FROM messages WHERE id = ?', [messageId]);
    if (!msg.length) return res.status(404).json({ message: 'Message not found' });
    if (msg[0].user_id !== userId) return res.status(403).json({ message: 'Not your message' });
    await run('DELETE FROM messages WHERE id = ?', [messageId]);
    const io = req.app.get('io');
    io && io.to(`project:${msg[0].project_id}`).emit('chat:deleted', { id: messageId });
    res.json({ message: 'Message deleted' });
  } catch (e) { console.error('deleteMessage', e); res.status(500).json({ message: 'Server error' }); }
}

module.exports = { listMessages, postMessage, updateMessage, deleteMessage };
