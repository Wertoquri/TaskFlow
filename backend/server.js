const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const multer = require('multer');

// Завантажуємо .env з кореня проекту
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = express();
const port = process.env.PORT || 5000;
const isProduction = process.env.NODE_ENV === 'production';
const clientOrigins = (
    process.env.CLIENT_ORIGIN || process.env.RENDER_EXTERNAL_URL || 'http://localhost:3000'
).split(',').map((origin) => origin.trim()).filter(Boolean);

if (isProduction && (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32)) {
    throw new Error('JWT_SECRET must contain at least 32 characters in production.');
}

if (isProduction) app.set('trust proxy', 1);

// Middleware
app.use(express.json());
app.use(cors({
    origin: clientOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Статика для завантажених файлів задач
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Налаштування multer для вкладень задач
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024, files: 1 },
});
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
        const rows = await getQuery(
          'SELECT id, username, email, nickname, avatar, avatar_url FROM users WHERE id = ?',
          [req.user.id]
        );
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
        res.status(500).json({ ok: false, message: 'DB error' });
    }
});

// MySQL config (з .env)

// Функція отримання з'єднання

// Тестовий маршрут
if (!isProduction) {
    app.get('/', (req, res) => {
        res.send('Hello, TaskFlow API!');
    });
}

if (isProduction) {
    const frontendDist = path.resolve(__dirname, '../dist');
    app.use(express.static(frontendDist));
    app.use((req, res, next) => {
        if (req.method !== 'GET' || req.path.startsWith('/api/') || req.path.startsWith('/uploads/')) {
            return next();
        }
        return res.sendFile(path.join(frontendDist, 'index.html'));
    });
}

// Маршрути реєстрації/логіну перенесено в authRoutes з підтримкою верифікації email

// HTTP server + Socket.io
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: clientOrigins,
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
             WHERE is_verified = FALSE
             AND created_at < (NOW() - INTERVAL '24 hours')`
        );
        if (result && result.affectedRows) {
            console.log(`[cleanup] Видалено непідтверджених користувачів: ${result.affectedRows}`);
        }
    } catch (e) {
        console.error('[cleanup] Помилка очищення непідтверджених користувачів:', e.message || e);
    }
}, 60 * 60 * 1000);
