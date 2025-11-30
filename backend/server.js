// server.js
const express = require('express');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const mysql = require('mysql2/promise'); // промісна версія
const { sequelize } = require('./models/userModel');
const projectRoutes = require('./routes/projectRoutes');
const taskRoutes = require('./routes/taskRoutes');
const authRoutes = require('./routes/authRoutes');

dotenv.config({ path: '../.env' });

const app = express();
const port = 5000;

// Middleware
app.use(express.json());
app.use(cors({
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Підключення до бази
const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: 'root', // заміни на свій пароль
    database: 'taskflow'
};

// Функція для отримання підключення
async function getConnection() {
    const connection = await mysql.createConnection(dbConfig);
    return connection;
}

// Тестовий маршрут
app.get('/', (req, res) => {
    res.send('Hello, TaskFlow API!');
});

// Реєстрація користувача
app.post('/api/register', async (req, res) => {
    const { name, email, password } = req.body;

    try {
        const conn = await getConnection();

        // Перевірка, чи існує користувач
        const [existing] = await conn.query("SELECT * FROM users WHERE email = ?", [email]);
        if (existing.length > 0) {
            return res.status(400).json({ message: "User already exists" });
        }

        // Хешуємо пароль
        const hashedPassword = await bcrypt.hash(password, 10);

        // Додаємо користувача
        await conn.query(
            "INSERT INTO users (name, email, password) VALUES (?, ?, ?)",
            [name, email, hashedPassword]
        );

        res.json({ message: "Registration successful" });
        await conn.end();
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});

// Login користувача
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const conn = await getConnection();

        // Знаходимо користувача
        const [rows] = await conn.query("SELECT * FROM users WHERE email = ?", [email]);
        if (rows.length === 0) {
            return res.status(400).json({ message: "User not found" });
        }

        const user = rows[0];

        // Перевірка пароля
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid password" });
        }

        // Генеруємо JWT
        const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });

        res.json({ token });
        await conn.end();
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});

// Підключаємо роутери


sequelize.sync().then(() => {
  console.log('DB synced!');
});

app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api', authRoutes);

// Запуск сервера
app.listen(port, () => {
    console.log(`Сервер працює на порту ${port}`);
});
