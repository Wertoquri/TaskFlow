const { pool } = require('../db');
const { uploadBuffer, deleteMedia } = require('../services/mediaStorage');

async function uploadAvatar(req, res) {
  try {
    if (!req.file) {
      console.warn('[uploadAvatar] no file in request');
      return res.status(400).json({ message: 'No file uploaded' });
    }
    const userId = req.user?.id;
    if (!userId) {
      console.warn('[uploadAvatar] unauthorized request');
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const [users] = await pool.query('SELECT avatar, avatar_url FROM users WHERE id = ?', [userId]);
    const previousAvatar = users[0]?.avatar_url || users[0]?.avatar || null;
    const avatarUrl = await uploadBuffer(req.file, 'taskflow/avatars');

    // Try to update users table with avatar path; be defensive if column missing
    try {
      await pool.query('UPDATE users SET avatar = ? WHERE id = ?', [avatarUrl, userId]);
    } catch (e) {
      console.warn('[uploadAvatar] update avatar column failed, trying avatar_url:', e && e.message ? e.message : e);
      try {
        await pool.query('UPDATE users SET avatar_url = ? WHERE id = ?', [avatarUrl, userId]);
      } catch (e2) {
        // ignore DB update errors, return url anyway
        console.warn('Could not persist avatar to users table:', e2 && e2.message ? e2.message : e2);
      }
    }

    await deleteMedia(previousAvatar).catch((error) => {
      console.warn('Previous avatar could not be removed:', error.message);
    });

    res.json({ avatarUrl });
  } catch (err) {
    console.error('Upload avatar error:', err && err.stack ? err.stack : err);
    res.status(err.statusCode || 500).json({
      message: err.statusCode ? err.message : 'Server error'
    });
  }
}

module.exports = { uploadAvatar };
