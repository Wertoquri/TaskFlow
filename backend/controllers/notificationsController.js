const { getQuery, run } = require('../db');

// ---------------- GET USER NOTIFICATIONS ----------------
const getNotifications = async (req, res) => {
    const userId = req.user?.id;
    if (!userId) {
        return res.status(400).json({ message: 'User not resolved from token' });
    }
    try {
        const notifications = await getQuery(
            'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50',
            [userId]
        );
        res.json(notifications);
    } catch (err) {
        console.error('Get notifications error:', err);
        res.status(500).json({ message: 'Server error', error: err });
    }
};

// ---------------- MARK NOTIFICATION AS READ ----------------
const markAsRead = async (req, res) => {
    const { id } = req.params;
    const userId = req.user?.id;
    if (!userId) {
        return res.status(400).json({ message: 'User not resolved from token' });
    }
    try {
        // Ensure notification belongs to current user
        const notif = await getQuery('SELECT user_id FROM notifications WHERE id = ?', [id]);
        if (!notif.length) {
            return res.status(404).json({ message: 'Notification not found' });
        }
        if (notif[0].user_id !== userId) {
            return res.status(403).json({ message: 'Not your notification' });
        }
        await run('UPDATE notifications SET is_read = 1 WHERE id = ?', [id]);
        res.json({ message: 'Marked as read' });
    } catch (err) {
        console.error('Mark notification as read error:', err);
        res.status(500).json({ message: 'Server error', error: err });
    }
};

// ---------------- MARK ALL NOTIFICATIONS AS READ ----------------
const markAllAsRead = async (req, res) => {
    const userId = req.user?.id;
    if (!userId) {
        return res.status(400).json({ message: 'User not resolved from token' });
    }
    try {
        await run('UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0', [userId]);
        res.json({ message: 'All notifications marked as read' });
    } catch (err) {
        console.error('Mark all notifications as read error:', err);
        res.status(500).json({ message: 'Server error', error: err });
    }
};

// ---------------- DELETE NOTIFICATION ----------------
const deleteNotification = async (req, res) => {
    const { id } = req.params;
    const userId = req.user?.id;
    if (!userId) {
        return res.status(400).json({ message: 'User not resolved from token' });
    }
    try {
        // Ensure notification belongs to current user
        const notif = await getQuery('SELECT user_id FROM notifications WHERE id = ?', [id]);
        if (!notif.length) {
            return res.status(404).json({ message: 'Notification not found' });
        }
        if (notif[0].user_id !== userId) {
            return res.status(403).json({ message: 'Not your notification' });
        }
        await run('DELETE FROM notifications WHERE id = ?', [id]);
        res.json({ message: 'Notification deleted' });
    } catch (err) {
        console.error('Delete notification error:', err);
        res.status(500).json({ message: 'Server error', error: err });
    }
};

module.exports = { getNotifications, markAsRead, markAllAsRead, deleteNotification };
