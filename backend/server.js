const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const mysql = require('mysql2/promise');
const http = require('http');
const { Server } = require('socket.io');

// Завантажуємо .env з кореня проекту
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:3000'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Підключаємо роутер проектів (CRUD)
const projectRoutes = require('./routes/projectRoutes');
app.use('/api/projects', projectRoutes);
// Підключаємо роутер завдань (CRUD)
const taskRoutes = require('./routes/taskRoutes');
app.use('/api/tasks', taskRoutes);

// Me endpoint (requires auth)
const authenticate = require('./middleware/authenticate');
const { getQuery } = require('./db');
app.get('/api/me', authenticate, async (req, res) => {
    try {
        const rows = await getQuery('SELECT id, username, email FROM users WHERE id = ?', [req.user.id]);
        if (!rows || rows.length === 0) return res.status(404).json({ message: 'User not found' });
        res.json(rows[0]);
    } catch (err) {
        console.error('Get me error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// MySQL config (з .env)
const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
};

// Функція отримання з'єднання
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
    const { username, email, password } = req.body;
    try {
        const conn = await getConnection();

        // Перевірка, чи існує користувач
        const [existing] = await conn.query("SELECT * FROM users WHERE email = ?", [email]);
        if (existing.length > 0) {
            await conn.end();
            return res.status(400).json({ message: "User already exists" });
        }

        // Хешуємо пароль
        const hashedPassword = await bcrypt.hash(password, 10);

        // Додаємо користувача
        await conn.query(
            "INSERT INTO users (username, email, password) VALUES (?, ?, ?)",
            [username, email, hashedPassword]
        );

        await conn.end();
        res.json({ message: "Registration successful" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});

// Логін користувача
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const conn = await getConnection();
        // Знаходимо користувача
        const [rows] = await conn.query("SELECT * FROM users WHERE email = ?", [email]);
        if (rows.length === 0) {
            await conn.end();
            return res.status(400).json({ message: "User not found" });
        }
        const user = rows[0];

        // Перевірка пароля
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            await conn.end();
            return res.status(400).json({ message: "Invalid password" });
        }

        // Генеруємо JWT
        const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });

        await conn.end();
        res.json({ token });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});

// HTTP server + Socket.io
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: ['http://localhost:5173', 'http://localhost:3000'],
        methods: ['GET','POST','PUT','DELETE']
    }
});
app.set('io', io);

io.on('connection', (socket) => {
    // Optionally authenticate socket with token
    socket.on('disconnect', () => {});
});

// Запуск сервера
server.listen(port, () => {
    console.log(`Сервер працює на порту ${port}`);
});