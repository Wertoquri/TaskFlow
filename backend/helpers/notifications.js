const { run } = require('../db');

/**
 * Create a notification for a user
 * @param {number} userId - Recipient user ID
 * @param {string} type - Notification type (e.g., 'task_assigned', 'project_invite', 'mention')
 * @param {object} payload - JSON payload with notification details
 * @param {object} io - Socket.io instance (optional)
 */
async function createNotification(userId, type, payload, io = null) {
    try {
        const result = await run(
            'INSERT INTO notifications (user_id, type, payload, is_read) VALUES (?, ?, ?, 0)',
            [userId, type, JSON.stringify(payload)]
        );
        
        const notification = {
            id: result.insertId,
            user_id: userId,
            type,
            payload,
            is_read: 0,
            created_at: new Date().toISOString()
        };

        // Emit real-time notification via socket
        if (io) {
            io.to(`user:${userId}`).emit('notification:new', notification);
        }

        return notification;
    } catch (err) {
        console.error('Create notification error:', err);
        throw err;
    }
}

module.exports = { createNotification };
