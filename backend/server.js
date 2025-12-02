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

// Підключаємо роутер автентифікації (реєстрація, логін, верифікація email)
const authRoutes = require('./routes/authRoutes');
app.use('/api', authRoutes);

// Підключаємо роутер проектів (CRUD)
const projectRoutes = require('./routes/projectRoutes');
app.use('/api/projects', projectRoutes);
// Підключаємо роутер завдань (CRUD)
const taskRoutes = require('./routes/taskRoutes');
app.use('/api/tasks', taskRoutes);

// Підключаємо роутер сповіщень
const notificationsRoutes = require('./routes/notificationsRoutes');
app.use('/api/notifications', notificationsRoutes);

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

// Маршрути реєстрації/логіну перенесено в authRoutes з підтримкою верифікації email

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
    // Join project rooms and user personal room
    socket.on('join-project', (projectId) => {
        socket.join(`project:${projectId}`);
    });
    socket.on('leave-project', (projectId) => {
        socket.leave(`project:${projectId}`);
    });
    socket.on('join-user', (userId) => {
        socket.join(`user:${userId}`);
    });
    socket.on('disconnect', () => {});
});

// Запуск сервера
server.listen(port, () => {
    console.log(`Сервер працює на порту ${port}`);
});