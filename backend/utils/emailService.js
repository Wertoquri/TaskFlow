const nodemailer = require('nodemailer');
const dns = require('node:dns').promises;
const net = require('node:net');

function getSmtpConfig() {
  const port = Number(process.env.EMAIL_PORT || 587);
  const explicitSecure = typeof process.env.EMAIL_SECURE === 'string'
    ? process.env.EMAIL_SECURE.toLowerCase() === 'true'
    : undefined;

  return {
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port,
    secure: explicitSecure ?? port === 465,
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
  };
}

async function createTransporter(config) {
  let connectionHost = config.host;

  if (!net.isIP(config.host)) {
    const ipv4Addresses = await dns.resolve4(config.host);
    if (!ipv4Addresses.length) {
      throw new Error(`No IPv4 address found for SMTP host ${config.host}`);
    }
    connectionHost = ipv4Addresses[0];
  }

  return nodemailer.createTransport({
    host: connectionHost,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.user,
      pass: config.pass,
    },
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 15_000,
    tls: {
      servername: net.isIP(config.host) ? undefined : config.host,
    },
  });
}

function generateVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function sendVerificationEmail(email, code) {
  if ((process.env.EMAIL_MODE || '').toLowerCase() === 'console') {
    console.log(`[demo-email] verification code for ${email}: ${code}`);
    return true;
  }

  const config = getSmtpConfig();
  if (!config.user || !config.pass || !config.from) {
    console.error('SMTP is not configured: EMAIL_USER, EMAIL_PASS and EMAIL_FROM are required.');
    return false;
  }

  const mailOptions = {
    from: config.from,
    to: email,
    subject: 'Підтвердження реєстрації в TaskFlow',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 16px;">
        <div style="background: #fff; padding: 40px; border-radius: 12px; text-align: center;">
          <h1 style="color: #1e293b; margin-bottom: 20px;">TaskFlow</h1>
          <h2 style="color: #475569; margin-bottom: 30px;">Підтвердження реєстрації</h2>
          <p style="color: #64748b; font-size: 16px; margin-bottom: 30px;">
            Дякуємо за реєстрацію. Ваш код підтвердження:
          </p>
          <div style="background: #f1f5f9; padding: 20px; border-radius: 8px; margin: 30px 0;">
            <span style="font-size: 32px; font-weight: 700; color: #667eea; letter-spacing: 5px;">
              ${code}
            </span>
          </div>
          <p style="color: #64748b; font-size: 14px;">
            Код дійсний протягом 15 хвилин.
          </p>
          <p style="color: #94a3b8; font-size: 12px; margin-top: 30px;">
            Якщо ви не реєструвалися в TaskFlow, проігноруйте цей лист.
          </p>
        </div>
      </div>
    `,
  };

  try {
    const transporter = await createTransporter(config);
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Failed to send verification email:', error?.message || error);
    return false;
  }
}

async function verifySmtp() {
  const config = getSmtpConfig();
  if (!config.user || !config.pass || !config.from) {
    return {
      ok: false,
      error: 'EMAIL_USER, EMAIL_PASS and EMAIL_FROM are required',
      secure: config.secure,
      host: config.host,
      port: config.port,
    };
  }

  try {
    const transporter = await createTransporter(config);
    await transporter.verify();
    return { ok: true, secure: config.secure, host: config.host, port: config.port };
  } catch (error) {
    return {
      ok: false,
      error: error?.message || String(error),
      secure: config.secure,
      host: config.host,
      port: config.port,
    };
  }
}

module.exports = {
  generateVerificationCode,
  sendVerificationEmail,
  verifySmtp,
};
