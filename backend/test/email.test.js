const test = require('node:test');
const assert = require('node:assert/strict');
process.env.EMAIL_MODE = 'console';
const { generateVerificationCode, sendVerificationEmail } = require('../utils/emailService');
test('verification codes contain six digits', () => assert.match(generateVerificationCode(), /^\d{6}$/));
test('console email mode does not require SMTP', async () => assert.equal(await sendVerificationEmail('demo@example.com','123456'), true));
