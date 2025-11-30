const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
const authenticate = require('../middleware/authenticate');

// всі маршрути під '/api/projects' (в server.js)
router.get('/', authenticate, projectController.getProjects);
router.post('/', authenticate, projectController.createProject);
router.put('/:id', authenticate, projectController.updateProject);
router.delete('/:id', authenticate, projectController.deleteProject);

module.exports = router;
