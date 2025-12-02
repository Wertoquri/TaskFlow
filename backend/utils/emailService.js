const nodemailer = require('nodemailer');

// Обчислюємо secure: true для 465 або якщо явно вказано EMAIL_SECURE=true
const port = Number(process.env.EMAIL_PORT || 587);
const explicitSecure = typeof process.env.EMAIL_SECURE === 'string'
  ? process.env.EMAIL_SECURE.toLowerCase() === 'true'
  : undefined;
const secure = explicitSecure ?? port === 465;

// Опціональний відправник у форматі "Name <email@domain>"
const fromAddress = process.env.EMAIL_FROM || process.env.EMAIL_USER;

// Конфігурація transporter (використовуйте свої дані SMTP)
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port,
  secure,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Генерація 6-значного коду
function generateVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Надсилання коду підтвердження
async function sendVerificationEmail(email, code) {
  const mailOptions = {
    from: fromAddress,
    to: email,
    subject: '🔐 Підтвердження реєстрації TaskFlow',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 16px;">
        <div style="background: #fff; padding: 40px; border-radius: 12px; text-align: center;">
          <h1 style="color: #1e293b; margin-bottom: 20px;">📅 TaskFlow</h1>
          <h2 style="color: #475569; margin-bottom: 30px;">Підтвердження реєстрації</h2>
          <p style="color: #64748b; font-size: 16px; margin-bottom: 30px;">
            Дякуємо за реєстрацію! Ваш код підтвердження:
          </p>
          <div style="background: #f1f5f9; padding: 20px; border-radius: 8px; margin: 30px 0;">
            <span style="font-size: 32px; font-weight: 700; color: #667eea; letter-spacing: 5px;">
              ${code}
            </span>
          </div>
          <p style="color: #64748b; font-size: 14px;">
            Цей код дійсний протягом 15 хвилин.
          </p>
          <p style="color: #94a3b8; font-size: 12px; margin-top: 30px;">
            Якщо ви не реєструвалися в TaskFlow, проігноруйте цей лист.
          </p>
        </div>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Помилка надсилання email:', error);
    return false;
  }
}

module.exports = {
  generateVerificationCode,
  sendVerificationEmail,
};
 
// Додатково: верифікація SMTP (можна використати у скриптах перевірки)
module.exports.verifySmtp = async function verifySmtp() {
  try {
    await transporter.verify();
    return { ok: true, secure, host: process.env.EMAIL_HOST, port };
  } catch (err) {
    return { ok: false, error: err?.message || String(err), secure, host: process.env.EMAIL_HOST, port };
  }
};
