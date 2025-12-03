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

module.exports = router;
