// backend/routes/taskRoutes.js
const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const authenticate = require('../middleware/authenticate'); // Middleware для авторизації
const { uploadTaskAttachment, getTaskAttachments, deleteTaskAttachment } = require('../controllers/taskAttachmentsController');
const { getTaskActivity } = require('../controllers/activityController');

// Тепер шляхи чисті, без дублювання 'tasks'
router.post('/', authenticate, taskController.createTask);           // POST /api/tasks
router.get('/:project_id', authenticate, taskController.getTasks);    // GET /api/tasks/:project_id
router.put('/:id', authenticate, taskController.updateTask);          // PUT /api/tasks/:id
router.delete('/:id', authenticate, taskController.deleteTask);       // DELETE /api/tasks/:id

// Вкладення до задач
router.post('/:id/attachments', authenticate, (req, res, next) => {
	const upload = req.app.get('uploadTasks');
	upload.single('file')(req, res, (err) => {
		if (err) return res.status(400).json({ message: 'File upload error', error: err.message || err.toString() });
		next();
	});
}, uploadTaskAttachment);

router.get('/:id/attachments', authenticate, getTaskAttachments);
router.delete('/:id/attachments/:attachmentId', authenticate, (req, res, next) => {
	console.log('[ROUTE] DELETE attachment', req.params);
	next();
}, deleteTaskAttachment);

// Activity
router.get('/:id/activity', authenticate, getTaskActivity);

module.exports = router;
    