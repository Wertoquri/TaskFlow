const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
const invitationsController = require('../controllers/invitationsController');
const membersController = require('../controllers/membersController');
const permissionsController = require('../controllers/permissionsController');
const messagesController = require('../controllers/messagesController');
const authenticate = require('../middleware/authenticate');


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

// Permissions
router.get('/:id/permissions', authenticate, permissionsController.getPermissions);
router.put('/:id/permissions', authenticate, permissionsController.updatePermissions);

// Chat messages
router.get('/:id/messages', authenticate, messagesController.listMessages);
router.post('/:id/messages', authenticate, messagesController.postMessage);
router.put('/:id/messages/:messageId', authenticate, messagesController.updateMessage);
router.delete('/:id/messages/:messageId', authenticate, messagesController.deleteMessage);

module.exports = router;
