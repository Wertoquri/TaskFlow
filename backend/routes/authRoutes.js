// backend/routes/authRoutes.js
const express = require('express');
const { register, login, verifyEmail, resendCode, deleteAccount } = require('../controllers/authController');
const authenticate = require('../middleware/authenticate');
const { pool } = require('../db');
const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/verify-email', verifyEmail);
router.post('/resend-code', resendCode);
router.delete('/account', authenticate, deleteAccount);

// Avatar upload (small profile image)
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const avatarsDir = path.join(__dirname, '..', 'uploads', 'avatars');
if (!fs.existsSync(avatarsDir)) fs.mkdirSync(avatarsDir, { recursive: true });
const storage = multer.diskStorage({
	destination: (req, file, cb) => cb(null, avatarsDir),
	filename: (req, file, cb) => {
		const safe = file.originalname.replace(/[^a-zA-Z0-9_.-]/g, '_');
		cb(null, Date.now() + '-' + Math.round(Math.random()*1e9) + '-' + safe);
	}
});
// Allow slightly larger avatars (5MB). If you prefer smaller limits, reduce this value
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } }); // 5MB limit
const { uploadAvatar } = require('../controllers/avatarController');
const { updateProfile } = require('../controllers/authController');

// GET /me - return current user data with avatar
router.get('/me', authenticate, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });
    
    const [rows] = await pool.query('SELECT id, username, email, avatar, avatar_url, nickname FROM users WHERE id = ?', [userId]);
    if (rows.length === 0) return res.status(404).json({ message: 'User not found' });
    
    const user = rows[0];
    // Return full user data with avatar URL
    const host = process.env.PUBLIC_HOST || '';
    const avatarRel = user.avatar || user.avatar_url;
    const avatarUrl = avatarRel ? (host ? `${host}${avatarRel}` : avatarRel) : null;
    
    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      nickname: user.nickname,
      avatar: avatarRel,
      avatar_url: avatarUrl
    });
  } catch (err) {
    console.error('GET /me error:', err && err.stack ? err.stack : err);
    res.status(500).json({ message: 'Server error', error: String(err) });
  }
});

router.post('/me/avatar', authenticate, upload.single('avatar'), uploadAvatar);
// PATCH /api/me - update profile fields (e.g., nickname)
router.patch('/me', authenticate, updateProfile);

module.exports = router;
