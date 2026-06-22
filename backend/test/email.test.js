const test = require('node:test');
const assert = require('node:assert/strict');
process.env.EMAIL_MODE = 'console';
const { generateVerificationCode, sendVerificationEmail } = require('../utils/emailService');
test('verification codes contain six digits', () => assert.match(generateVerificationCode(), /^\d{6}$/));
test('console email mode does not require SMTP', async () => assert.equal(await sendVerificationEmail('demo@example.com','123456'), true));

test('HTTPS relay sends the verification payload', { concurrency: false }, async () => {
  const originalFetch = global.fetch;
  const originalMode = process.env.EMAIL_MODE;
  process.env.EMAIL_MODE = 'smtp';
  process.env.EMAIL_API_URL = 'https://example.com/email';
  process.env.EMAIL_API_SECRET = 'test-secret';

  let request;
  global.fetch = async (url, options) => {
    request = { url, ...options };
    return { ok: true, status: 200, json: async () => ({ ok: true }) };
  };

  try {
    assert.equal(await sendVerificationEmail('demo@example.com', '123456'), true);
    assert.equal(request.url, process.env.EMAIL_API_URL);
    assert.deepEqual(JSON.parse(request.body), {
      secret: 'test-secret',
      to: 'demo@example.com',
      code: '123456',
    });
  } finally {
    global.fetch = originalFetch;
    process.env.EMAIL_MODE = originalMode;
    delete process.env.EMAIL_API_URL;
    delete process.env.EMAIL_API_SECRET;
  }
});
