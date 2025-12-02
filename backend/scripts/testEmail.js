// Quick SMTP verification + optional test email send
// Usage:
//   node backend/scripts/testEmail.js               -> only verify SMTP
//   node backend/scripts/testEmail.js you@domain.tld -> verify + send test email

const path = require('path');
const dotenv = require('dotenv');
// Load .env from project root
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const { verifySmtp, sendVerificationEmail } = require('../utils/emailService');

(async () => {
  console.log('Checking SMTP configuration...');
  const res = await verifySmtp();
  if (!res.ok) {
    console.error('❌ SMTP verify failed:', res);
    process.exit(1);
  }
  console.log('✅ SMTP OK:', res);

  const recipient = process.argv[2];
  if (!recipient) {
    console.log('No recipient provided. Skipping test email send.');
    process.exit(0);
  }

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  console.log(`Sending test verification code ${code} to: ${recipient}`);
  const sent = await sendVerificationEmail(recipient, code);
  if (sent) {
    console.log('✅ Test email sent. Check your inbox/spam.');
    process.exit(0);
  } else {
    console.error('❌ Failed to send test email.');
    process.exit(2);
  }
})();
