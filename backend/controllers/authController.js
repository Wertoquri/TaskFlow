const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../db');
const { generateVerificationCode, sendVerificationEmail } = require('../utils/emailService');

// Валідація username
function validateUsername(username) {
  if (!username || username.length < 3 || username.length > 20) {
    return 'Username повинен містити від 3 до 20 символів';
  }
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    return 'Username може містити тільки літери, цифри та підкреслення';
  }
  return null;
}

// Валідація пароля
function validatePassword(password) {
  if (!password || password.length < 8) {
    return 'Пароль повинен містити мінімум 8 символів';
  }
  if (!/[A-Z]/.test(password)) {
    return 'Пароль повинен містити хоча б одну велику літеру';
  }
  if (!/[a-z]/.test(password)) {
    return 'Пароль повинен містити хоча б одну малу літеру';
  }
  if (!/[0-9]/.test(password)) {
    return 'Пароль повинен містити хоча б одну цифру';
  }
  return null;
}

// Валідація email
function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    return 'Невірний формат email';
  }
  return null;
}

const register = async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ message: 'Заповніть всі поля' });
  }

  // Валідація
  const usernameError = validateUsername(username);
  if (usernameError) {
    return res.status(400).json({ message: usernameError });
  }

  const emailError = validateEmail(email);
  if (emailError) {
    return res.status(400).json({ message: emailError });
  }

  const passwordError = validatePassword(password);
  if (passwordError) {
    return res.status(400).json({ message: passwordError });
  }

  try {
    const [existing] = await pool.query('SELECT * FROM users WHERE email = ? OR username = ?', [email, username]);
    if (existing.length > 0) {
      return res.status(400).json({ message: 'Користувач з таким email або username вже існує' });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    const verificationCode = generateVerificationCode();
    const codeExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 хвилин

    // Зберігаємо тимчасово неактивованого користувача
    const [result] = await pool.query(
      'INSERT INTO users (username, email, password, is_verified, verification_code, code_expiry) VALUES (?, ?, ?, ?, ?, ?)',
      [username, email, hashedPassword, false, verificationCode, codeExpiry]
    );

    // Надсилаємо email
    const emailSent = await sendVerificationEmail(email, verificationCode);
    
    if (!emailSent) {
      // Видаляємо користувача якщо не вдалося надіслати email
      await pool.query('DELETE FROM users WHERE id = ?', [result.insertId]);
      return res.status(500).json({ message: 'Помилка надсилання email. Спробуйте пізніше.' });
    }

    res.status(201).json({ 
      message: 'Код підтвердження надіслано на вашу пошту',
      userId: result.insertId,
      email: email
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Помилка реєстрації' });
  }
};

const verifyEmail = async (req, res) => {
  const { userId, code } = req.body;

  if (!userId || !code) {
    return res.status(400).json({ message: 'Не вказано userId або код' });
  }

  try {
    const [users] = await pool.query(
      'SELECT * FROM users WHERE id = ? AND verification_code = ?',
      [userId, code]
    );

    if (users.length === 0) {
      return res.status(400).json({ message: 'Невірний код підтвердження' });
    }

    const user = users[0];

    // Перевірка строку дії коду
    if (new Date() > new Date(user.code_expiry)) {
      return res.status(400).json({ message: 'Код підтвердження застарів. Запросіть новий.' });
    }

    // Активуємо користувача
    await pool.query(
      'UPDATE users SET is_verified = ?, verification_code = NULL, code_expiry = NULL WHERE id = ?',
      [true, userId]
    );

    // Генеруємо токен
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.json({ 
      token, 
      user: { id: user.id, username: user.username, email: user.email }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Помилка підтвердження' });
  }
};

const resendCode = async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ message: 'Не вказано userId' });
  }

  try {
    const [users] = await pool.query('SELECT * FROM users WHERE id = ? AND is_verified = ?', [userId, false]);

    if (users.length === 0) {
      return res.status(400).json({ message: 'Користувач не знайдений або вже підтверджений' });
    }

    const user = users[0];
    const verificationCode = generateVerificationCode();
    const codeExpiry = new Date(Date.now() + 15 * 60 * 1000);

    await pool.query(
      'UPDATE users SET verification_code = ?, code_expiry = ? WHERE id = ?',
      [verificationCode, codeExpiry, userId]
    );

    const emailSent = await sendVerificationEmail(user.email, verificationCode);

    if (!emailSent) {
      return res.status(500).json({ message: 'Помилка надсилання email' });
    }

    res.json({ message: 'Новий код надіслано на вашу пошту' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Помилка повторного надсилання коду' });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Заповніть всі поля' });
  }

  try {
    const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);

    if (users.length === 0) {
      return res.status(401).json({ message: 'Невірний email або пароль' });
    }

    const user = users[0];

    // Перевірка підтвердження email
    if (!user.is_verified) {
      return res.status(403).json({ 
        message: 'Email не підтверджено. Перевірте вашу пошту.',
        userId: user.id,
        needsVerification: true
      });
    }

    const isPasswordValid = bcrypt.compareSync(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Невірний email або пароль' });
    }

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    
    res.json({ 
      token,
      user: { id: user.id, username: user.username, email: user.email }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Помилка входу' });
  }
};


module.exports = { register, login, verifyEmail, resendCode };
