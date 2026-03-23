const fs = require('fs');
const path = require('path');
const { pool } = require('../db');

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

    const filename = req.file.filename;
    const relPath = `/uploads/avatars/${filename}`;
    const absPath = path.join(__dirname, '..', 'uploads', 'avatars', filename);

    console.log('[uploadAvatar] file saved:', {
      originalname: req.file.originalname,
      filename: req.file.filename,
      mimetype: req.file.mimetype,
      size: req.file.size,
      absPath
    });

    if (!fs.existsSync(absPath)) {
      console.error('[uploadAvatar] saved file not found on disk:', absPath);
      return res.status(500).json({ message: 'Uploaded file not found on server' });
    }

    // Update users table with avatar path
    await pool.query('UPDATE users SET avatar = ? WHERE id = ?', [relPath, userId]);

    // Return a full URL if we can construct one from env, otherwise return relative path
    const host = process.env.PUBLIC_HOST || '';
    const avatarUrl = host ? `${host}${relPath}` : relPath;

    // Also return updated user data
    const [rows] = await pool.query('SELECT id, username, email, avatar FROM users WHERE id = ?', [userId]);
    const user = rows[0];

    res.json({ 
      avatarUrl,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        avatar: relPath,
        avatar_url: avatarUrl
      }
    });
  } catch (err) {
    console.error('Upload avatar error:', err && err.stack ? err.stack : err);
    res.status(500).json({ message: 'Server error', error: String(err) });
  }
}

module.exports = { uploadAvatar };
