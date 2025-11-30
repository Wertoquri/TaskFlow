// backend/routes/taskRoutes.js
const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const authenticate = require('../middleware/authenticate'); // Middleware для авторизації

// Тепер шляхи чисті, без дублювання 'tasks'
router.post('/', authenticate, taskController.createTask);           // POST /api/tasks
router.get('/:project_id', authenticate, taskController.getTasks);    // GET /api/tasks/:project_id
router.put('/:id', authenticate, taskController.updateTask);          // PUT /api/tasks/:id
router.delete('/:id', authenticate, taskController.deleteTask);       // DELETE /api/tasks/:id

module.exports = router;
    