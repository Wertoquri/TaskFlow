const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { createHmac, randomInt, timingSafeEqual } = require("node:crypto");
const { pool, nativePool } = require("../db");
const {
  generateVerificationCode,
  sendVerificationEmail,
  sendPasswordResetEmail,
} = require("../utils/emailService");

const hashResetCode = (email, code) =>
  createHmac("sha256", process.env.JWT_SECRET).update(`${email}:${code}`).digest("hex");

// Валідація username
function validateUsername(username) {
  if (!username || username.length < 3 || username.length > 20) {
    return "Username повинен містити від 3 до 20 символів";
  }
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    return "Username може містити тільки літери, цифри та підкреслення";
  }
  return null;
}

// Валідація пароля
function validatePassword(password) {
  if (!password || password.length < 8) {
    return "Пароль повинен містити мінімум 8 символів";
  }
  if (!/[A-Z]/.test(password)) {
    return "Пароль повинен містити хоча б одну велику літеру";
  }
  if (!/[a-z]/.test(password)) {
    return "Пароль повинен містити хоча б одну малу літеру";
  }
  if (!/[0-9]/.test(password)) {
    return "Пароль повинен містити хоча б одну цифру";
  }
  return null;
}

// Валідація email
function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    return "Невірний формат email";
  }
  return null;
}

const register = async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ message: "Заповніть всі поля" });
  }

  // reCAPTCHA removed

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
    const [existing] = await pool.query(
      "SELECT * FROM users WHERE email = ? OR username = ?",
      [email, username],
    );
    if (existing.length > 0) {
      return res
        .status(400)
        .json({ message: "Користувач з таким email або username вже існує" });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    const verificationCode = generateVerificationCode();
    const codeExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 хвилин

    // Зберігаємо тимчасово неактивованого користувача
    const [result] = await pool.query(
      "INSERT INTO users (username, email, password, is_verified, verification_code, code_expiry) VALUES (?, ?, ?, ?, ?, ?)",
      [username, email, hashedPassword, false, verificationCode, codeExpiry],
    );

    // Надсилаємо email
    const emailSent = await sendVerificationEmail(email, verificationCode);

    if (!emailSent) {
      // Видаляємо користувача якщо не вдалося надіслати email
      await pool.query("DELETE FROM users WHERE id = ?", [result.insertId]);
      return res
        .status(500)
        .json({ message: "Помилка надсилання email. Спробуйте пізніше." });
    }

    res.status(201).json({
      message: "Код підтвердження надіслано на вашу пошту",
      userId: result.insertId,
      email,
      ...(process.env.EMAIL_MODE === "console" ? { verificationCode } : {}),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Помилка реєстрації" });
  }
};

const verifyEmail = async (req, res) => {
  const { userId, code } = req.body;

  if (!userId || !code) {
    return res.status(400).json({ message: "Не вказано userId або код" });
  }

  try {
    // Ліміт спроб: 5 за 15 хв
    const now = new Date();
    const [userRows] = await pool.query("SELECT * FROM users WHERE id = ?", [
      userId,
    ]);
    if (userRows.length === 0)
      return res.status(400).json({ message: "Користувача не знайдено" });
    let user = userRows[0];

    let attempts = user.verify_attempts || 0;
    let resetAt = user.verify_reset_at ? new Date(user.verify_reset_at) : null;
    if (!resetAt || now > resetAt) {
      attempts = 0;
      resetAt = new Date(now.getTime() + 15 * 60 * 1000);
    }
    if (attempts >= 5) {
      const minutesLeft = Math.ceil((resetAt - now) / 60000);
      return res
        .status(429)
        .json({
          message: `Забагато спроб. Спробуйте через ${minutesLeft} хв.`,
        });
    }

    // Збіг коду
    const [matchRows] = await pool.query(
      "SELECT * FROM users WHERE id = ? AND verification_code = ?",
      [userId, code],
    );
    if (matchRows.length === 0) {
      attempts += 1;
      await pool.query(
        "UPDATE users SET verify_attempts = ?, verify_reset_at = ? WHERE id = ?",
        [attempts, resetAt, userId],
      );
      return res.status(400).json({ message: "Невірний код підтвердження" });
    }
    user = matchRows[0];

    if (now > new Date(user.code_expiry)) {
      return res
        .status(400)
        .json({ message: "Код підтвердження застарів. Запросіть новий." });
    }

    await pool.query(
      "UPDATE users SET is_verified = ?, verification_code = NULL, code_expiry = NULL, verify_attempts = 0, verify_reset_at = NULL WHERE id = ?",
      [true, userId],
    );

    const token = jwt.sign(
      { id: user.id, v: user.token_version || 0 },
      process.env.JWT_SECRET,
      { expiresIn: "1h" },
    );
    res.json({
      token,
      user: { id: user.id, username: user.username, email: user.email },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Помилка підтвердження" });
  }
};

const resendCode = async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ message: "Не вказано userId" });
  }

  try {
    const [users] = await pool.query(
      "SELECT * FROM users WHERE id = ? AND is_verified = ?",
      [userId, false],
    );
    if (users.length === 0)
      return res
        .status(400)
        .json({ message: "Користувач не знайдений або вже підтверджений" });

    const user = users[0];

    // Ліміти: 1 раз / 60с, не більше 5 разів / год
    const now = new Date();
    let count = user.resend_count || 0;
    let resetAt = user.resend_reset_at ? new Date(user.resend_reset_at) : null;
    if (!resetAt || now > resetAt) {
      count = 0;
      resetAt = new Date(now.getTime() + 60 * 60 * 1000);
    }
    if (count >= 5) {
      const minutesLeft = Math.ceil((resetAt - now) / 60000);
      return res
        .status(429)
        .json({
          message: `Перевищено ліміт. Спробуйте через ${minutesLeft} хв.`,
        });
    }

    const verificationCode = generateVerificationCode();
    const codeExpiry = new Date(Date.now() + 15 * 60 * 1000);
    count += 1;

    await pool.query(
      "UPDATE users SET verification_code = ?, code_expiry = ?, resend_count = ?, resend_reset_at = ? WHERE id = ?",
      [verificationCode, codeExpiry, count, resetAt, userId],
    );

    const emailSent = await sendVerificationEmail(user.email, verificationCode);
    if (!emailSent)
      return res.status(500).json({ message: "Помилка надсилання email" });

    res.json({
      message: "Новий код надіслано на вашу пошту",
      retryAfter: 60,
      ...(process.env.EMAIL_MODE === "console" ? { verificationCode } : {}),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Помилка повторного надсилання коду" });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Заповніть всі поля" });
  }

  try {
    const [users] = await pool.query("SELECT * FROM users WHERE email = ?", [
      email,
    ]);

    if (users.length === 0) {
      return res.status(401).json({ message: "Невірний email або пароль" });
    }

    const user = users[0];

    // Перевірка підтвердження email
    if (!user.is_verified) {
      return res.status(403).json({
        message: "Email не підтверджено. Перевірте вашу пошту.",
        userId: user.id,
        needsVerification: true,
      });
    }

    const isPasswordValid = bcrypt.compareSync(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Невірний email або пароль" });
    }

    const token = jwt.sign(
      { id: user.id, v: user.token_version || 0 },
      process.env.JWT_SECRET,
      { expiresIn: "1h" },
    );

    res.json({
      token,
      user: { id: user.id, username: user.username, email: user.email },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Помилка входу" });
  }
};

const forgotPassword = async (req, res) => {
  const email =
    typeof req.body?.email === "string"
      ? req.body.email.trim().toLowerCase()
      : "";
  if (!email || email.length > 255 || validateEmail(email)) {
    return res.status(400).json({ message: "Введіть коректний email" });
  }

  const genericMessage =
    "Якщо акаунт із цією адресою існує, код для скидання надіслано на пошту.";
  try {
    const code = randomInt(100_000, 1_000_000).toString();
    const codeHash = hashResetCode(email, code);
    const result = await nativePool.query(
      `UPDATE users SET reset_code_hash = $1, reset_expires_at = NOW() + INTERVAL '15 minutes',
       reset_requested_at = NOW(), reset_attempts = 0
       WHERE LOWER(email) = $2 AND is_verified = TRUE
       AND (reset_requested_at IS NULL OR reset_requested_at <= NOW() - INTERVAL '60 seconds')
       RETURNING email`,
      [codeHash, email],
    );
    if (result.rowCount) {
      const sent = await sendPasswordResetEmail(result.rows[0].email, code);
      if (!sent) {
        console.error("Password reset email delivery failed");
        await nativePool.query(
          "UPDATE users SET reset_code_hash = NULL, reset_expires_at = NULL WHERE LOWER(email) = $1 AND reset_code_hash = $2",
          [email, codeHash],
        );
      }
    }
    return res.json({ message: genericMessage });
  } catch (error) {
    console.error("Forgot password error:", error);
    return res
      .status(500)
      .json({ message: "Не вдалося обробити запит. Спробуйте пізніше." });
  }
};

const resetPassword = async (req, res) => {
  const email =
    typeof req.body?.email === "string"
      ? req.body.email.trim().toLowerCase()
      : "";
  const code = typeof req.body?.code === "string" ? req.body.code.trim() : "";
  const password = req.body?.password;
  if (
    !email ||
    email.length > 255 ||
    validateEmail(email) ||
    !/^\d{6}$/.test(code)
  ) {
    return res
      .status(400)
      .json({ message: "Невірна адреса або код підтвердження" });
  }
  const passwordError =
    typeof password === "string" && password.length <= 128
      ? validatePassword(password)
      : "Пароль повинен містити від 8 до 128 символів";
  if (passwordError) return res.status(400).json({ message: passwordError });

  try {
    const attempt = await nativePool.query(
      `UPDATE users SET reset_attempts = reset_attempts + 1
       WHERE LOWER(email) = $1 AND reset_code_hash IS NOT NULL
       AND reset_expires_at > NOW() AND reset_attempts < 5
       RETURNING id, reset_code_hash`,
      [email],
    );
    if (!attempt.rowCount)
      return res
        .status(400)
        .json({
          message: "Код недійсний або термін його дії минув. Запросіть новий.",
        });

    const candidate = Buffer.from(hashResetCode(email, code), "hex");
    const expected = Buffer.from(attempt.rows[0].reset_code_hash, "hex");
    if (
      candidate.length !== expected.length ||
      !timingSafeEqual(candidate, expected)
    ) {
      return res
        .status(400)
        .json({
          message: "Код недійсний або термін його дії минув. Запросіть новий.",
        });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const updated = await nativePool.query(
      `UPDATE users SET password = $1, reset_code_hash = NULL, reset_expires_at = NULL,
       reset_requested_at = NULL, reset_attempts = 0, token_version = token_version + 1
       WHERE id = $2 AND reset_code_hash = $3 AND reset_expires_at > NOW()
       AND reset_attempts <= 5 RETURNING id`,
      [passwordHash, attempt.rows[0].id, attempt.rows[0].reset_code_hash],
    );
    if (!updated.rowCount)
      return res
        .status(400)
        .json({
          message: "Код недійсний або термін його дії минув. Запросіть новий.",
        });
    req.app.get("io")?.in(`user:${updated.rows[0].id}`).disconnectSockets(true);
    return res.json({ message: "Пароль змінено. Увійдіть із новим паролем." });
  } catch (error) {
    console.error("Reset password error:", error);
    return res
      .status(500)
      .json({ message: "Не вдалося змінити пароль. Спробуйте пізніше." });
  }
};

// Видалення поточного акаунта
const deleteAccount = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const [rows] = await pool.query("SELECT id FROM users WHERE id = ?", [
      userId,
    ]);
    if (!rows || rows.length === 0)
      return res.status(404).json({ message: "User not found" });

    await pool.query("DELETE FROM users WHERE id = ?", [userId]);

    return res.json({ message: "Акаунт видалено успішно" });
  } catch (err) {
    console.error("Delete account error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  register,
  login,
  verifyEmail,
  resendCode,
  deleteAccount,
  forgotPassword,
  resetPassword,
};
// Add profile update handler for editable fields (nickname)
async function updateProfile(req, res) {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    const { nickname } = req.body;
    // allow clearing nickname by sending null or empty string
    const nickVal = nickname && nickname.trim() ? nickname.trim() : null;
    await pool.query("UPDATE users SET nickname = ? WHERE id = ?", [
      nickVal,
      userId,
    ]);
    return res.json({ ok: true, nickname: nickVal });
  } catch (err) {
    console.error("Update profile error:", err && err.stack ? err.stack : err);
    return res.status(500).json({ message: "Server error" });
  }
}

module.exports.updateProfile = updateProfile;
