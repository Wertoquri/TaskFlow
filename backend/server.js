const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const mysql = require('mysql2/promise');
const http = require('http');
const { Server } = require('socket.io');
const multer = require('multer');

// Завантажуємо .env з кореня проекту
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(cors({
    origin: (process.env.CLIENT_ORIGIN || 'http://localhost:3000').split(','),
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Статика для завантажених файлів задач
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Налаштування multer для вкладень задач
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, 'uploads', 'tasks'));
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const safeName = file.originalname.replace(/[^a-zA-Z0-9_.-]/g, '_');
        cb(null, uniqueSuffix + '-' + safeName);
    }
});

const upload = multer({ storage });
app.set('uploadTasks', upload);

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
const { getQuery, run, pool } = require('./db');
app.get('/api/me', authenticate, async (req, res) => {
    try {
        // Defensive select: some deployments may not have `avatar` or `avatar_url` columns.
        const cols = await getQuery(
          `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users'`,
          [process.env.DB_NAME]
        );
        const colSet = new Set((cols || []).map((c) => c.COLUMN_NAME));
        const fields = ['id', 'username', 'email'];
        if (colSet.has('nickname')) fields.push('nickname');
        if (colSet.has('avatar')) fields.push('avatar');
        if (colSet.has('avatar_url')) fields.push('avatar_url');
        const q = `SELECT ${fields.join(', ')} FROM users WHERE id = ?`;
        console.log('[debug] /api/me selecting fields:', fields.join(', '));
        const rows = await getQuery(q, [req.user.id]);
        if (!rows || rows.length === 0) return res.status(404).json({ message: 'User not found' });
        res.json(rows[0]);
    } catch (err) {
                console.error('Get me error:', err && err.stack ? err.stack : err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Health endpoint to verify DB connectivity and basic server status
app.get('/api/health', async (req, res) => {
    try {
        // Try a lightweight query via pool
        if (!pool) return res.status(500).json({ ok: false, message: 'DB pool not initialized' });
        const [rows] = await pool.query('SELECT 1 AS ok');
        res.json({ ok: true, db: rows && rows.length ? rows[0].ok : null });
    } catch (err) {
        console.error('Health check error:', err && err.stack ? err.stack : err);
        res.status(500).json({ ok: false, message: 'DB error', error: String(err) });
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
        origin: (process.env.CLIENT_ORIGIN || 'http://localhost:3000').split(','),
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

// Автоочищення непідтверджених акаунтів старших за 24 години (щогодини)
setInterval(async () => {
    try {
        const result = await run(
            `DELETE FROM users 
             WHERE is_verified = 0 
             AND created_at < (NOW() - INTERVAL 24 HOUR)`
        );
        if (result && result.affectedRows) {
            console.log(`[cleanup] Видалено непідтверджених користувачів: ${result.affectedRows}`);
        }
    } catch (e) {
        console.error('[cleanup] Помилка очищення непідтверджених користувачів:', e.message || e);
    }
}, 60 * 60 * 1000);
