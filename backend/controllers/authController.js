const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db'); // підключення до MySQL

const register = async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ message: 'Заповніть всі поля' });
  }

  try {
    const [existing] = await pool.query('SELECT * FROM users WHERE email = ? OR username = ?', [email, username]);
    if (existing.length > 0) {
      return res.status(400).json({ message: 'Користувач з таким email або username вже існує' });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);

    const [result] = await pool.query(
      'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
      [username, email, hashedPassword]
    );

    const user = { id: result.insertId, username, email };
    const token = jwt.sign({ id: user.id }, 'your_jwt_secret', { expiresIn: '1h' });

    res.status(201).json({ token, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Помилка реєстрації' });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ where: { email } });

  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).send('Invalid credentials');
  }

  const token = jwt.sign({ id: user.id }, 'your_jwt_secret', { expiresIn: '1h' });
  res.json({ token });
};


module.exports = { register, login };
