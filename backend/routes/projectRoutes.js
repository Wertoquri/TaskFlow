const express = require('express');
const router = express.Router();

// Debug: log when this router is loaded
console.log('[debug] projectRoutes loaded');
const projectController = require('../controllers/projectController');
const invitationsController = require('../controllers/invitationsController');
const membersController = require('../controllers/membersController');
const permissionsController = require('../controllers/permissionsController');
const messagesController = require('../controllers/messagesController');
const authenticate = require('../middleware/authenticate');
const { getProjectActivity, deleteProjectActivity } = require('../controllers/activityController');


// всі маршрути під '/api/projects' (в server.js)
router.get('/', authenticate, projectController.getProjects);
router.post('/', authenticate, projectController.createProject);

// My invitations (MUST be before /:id routes!)
router.get('/me/invitations', authenticate, invitationsController.listMyInvitations);
router.post('/invitations/:invId/accept', authenticate, invitationsController.acceptInvitation);
router.post('/invitations/:invId/decline', authenticate, invitationsController.declineInvitation);

// Project-specific routes
router.put('/:id', authenticate, projectController.updateProject);
router.delete('/:id', authenticate, projectController.deleteProject);

// Invitations
router.post('/:id/invite', authenticate, invitationsController.createInvitation);
router.post('/:id/invitations', authenticate, invitationsController.createInvitation);
router.get('/:id/invitations', authenticate, invitationsController.listProjectInvitations);

// Members
router.get('/:id/members', authenticate, membersController.listMembers);
router.post('/:id/members/:userId/kick', authenticate, membersController.kickMember);
// Per-user permissions update
router.put('/:id/members/:userId/permissions', authenticate, permissionsController.updateMemberPermissions);
// Clear a member's custom permissions (admin only)
router.post('/:id/members/:userId/clear-permissions', authenticate, permissionsController.clearMemberPermissions);

// Permissions
router.get('/:id/permissions', authenticate, permissionsController.getPermissions);
router.put('/:id/permissions', authenticate, permissionsController.updatePermissions);

// Chat messages
router.get('/:id/messages', authenticate, messagesController.listMessages);
router.post('/:id/messages', authenticate, messagesController.postMessage);
router.put('/:id/messages/:messageId', authenticate, messagesController.updateMessage);
router.delete('/:id/messages/:messageId', authenticate, messagesController.deleteMessage);

// Project activity feed
router.get('/:id/activity', authenticate, getProjectActivity);
// Log and expose a simple debug endpoint to confirm route registration
router.get('/:id/activity/debug', authenticate, (req, res) => {
	console.log(`[debug] GET /api/projects/${req.params.id}/activity/debug called by user ${req.user?.id}`);
	res.json({ ok: true, projectId: Number(req.params.id), user: req.user?.id });
});

// Wrap delete route with a small logger middleware so we see attempts
router.delete('/:id/activity', authenticate, (req, res, next) => {
	console.log(`[debug] DELETE /api/projects/${req.params.id}/activity invoked by user ${req.user?.id}`);
	next();
}, deleteProjectActivity);

module.exports = router;
