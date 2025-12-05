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

    // Try to update users table with avatar path; be defensive if column missing
    try {
      await pool.query('UPDATE users SET avatar = ? WHERE id = ?', [relPath, userId]);
    } catch (e) {
      console.warn('[uploadAvatar] update avatar column failed, trying avatar_url:', e && e.message ? e.message : e);
      try {
        await pool.query('UPDATE users SET avatar_url = ? WHERE id = ?', [relPath, userId]);
      } catch (e2) {
        // ignore DB update errors, return url anyway
        console.warn('Could not persist avatar to users table:', e2 && e2.message ? e2.message : e2);
      }
    }

    // Return a full URL if we can construct one from env, otherwise return relative path
    const host = process.env.PUBLIC_HOST || '';
    const avatarUrl = host ? `${host}${relPath}` : relPath;

    res.json({ avatarUrl });
  } catch (err) {
    console.error('Upload avatar error:', err && err.stack ? err.stack : err);
    res.status(500).json({ message: 'Server error', error: String(err) });
  }
}

module.exports = { uploadAvatar };
