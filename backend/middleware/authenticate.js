// backend/middleware/authenticate.js
const jwt = require('jsonwebtoken');
const db = require('../db'); // Підключення до БД

const authenticate = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1]; // Беремо токен з заголовка

  if (!token) {
    return res.status(403).json({ message: 'No token provided' });
  }

  // Перевіряємо токен
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Якщо токен правильний, зберігаємо користувача в req.user
    req.user = decoded; // Тепер у вас є доступ до користувача
    next(); // Передаємо запит далі
  });
};

module.exports = authenticate;
