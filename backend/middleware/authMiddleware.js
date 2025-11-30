// middleware/authMiddleware.js
const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ message: 'Не авторизовано' });

  jwt.verify(token, 'your_jwt_secret', (err, decoded) => {
    if (err) return res.status(403).json({ message: 'Невірний токен' });
    req.userId = decoded.id;
    next();
  });
};

module.exports = authMiddleware;
