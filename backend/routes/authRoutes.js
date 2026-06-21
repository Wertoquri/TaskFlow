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
const upload = multer({
	storage: multer.memoryStorage(),
	limits: { fileSize: 5 * 1024 * 1024, files: 1 },
	fileFilter: (req, file, cb) => cb(null, /^image\/(jpeg|png|webp|gif)$/.test(file.mimetype)),
});
const { uploadAvatar } = require('../controllers/avatarController');
const { updateProfile } = require('../controllers/authController');
router.post('/me/avatar', authenticate, upload.single('avatar'), uploadAvatar);
// PATCH /api/me - update profile fields (e.g., nickname)
router.patch('/me', authenticate, updateProfile);

module.exports = router;
