// backend/routes/authRoutes.js
const express = require('express');
const { register, login, verifyEmail, resendCode, deleteAccount } = require('../controllers/authController');
const authenticate = require('../middleware/authenticate');
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
router.post('/me/avatar', authenticate, upload.single('avatar'), uploadAvatar);
// PATCH /api/me - update profile fields (e.g., nickname)
router.patch('/me', authenticate, updateProfile);

module.exports = router;
