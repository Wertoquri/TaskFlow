const { getQuery, run } = require('../db');
const { getQuery: q } = require('../db');
const { createNotification } = require('../helpers/notifications');

// ---------------- CREATE TASK ----------------
const createTask = async (req, res) => {
    const { project_id, title, description, status, priority, labels } = req.body;
    const userId = req.user.id;
    if (!project_id || !title) {
        return res.status(400).json({ message: "Project ID and title are required" });
    }
    try {
        // Check permissions: project owner OR member with admin OR explicit permission
        const proj = await q('SELECT owner_id FROM projects WHERE id = ?', [project_id]);
        const isOwner = proj.length && proj[0].owner_id === userId;
        const rows = await q('SELECT role, permissions FROM project_members WHERE project_id = ? AND user_id = ?', [project_id, userId]);
        const rawPerms = rows.length && rows[0].permissions;
        const perms = rawPerms ? (typeof rawPerms === 'string' ? JSON.parse(rawPerms) : rawPerms) : null;
        const canCreate = !!(perms && (perms.create === true || perms.can_create === true));
        const isAdmin = rows.length && rows[0].role === 'admin';
        const allowed = isOwner || isAdmin || canCreate;
        console.log('CREATE TASK DEBUG:', { userId, project_id, owner_id: proj[0]?.owner_id, isOwner, role: rows[0]?.role, isAdmin, perms, canCreate, allowed });
        if (!allowed) return res.status(403).json({ message: 'Not allowed to create tasks' });

        const insert = await run('INSERT INTO tasks (project_id, title, description, status, priority, owner_id, created_by, labels) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [
            project_id,
            title,
            description || null,
            status || 'pending',
            priority || 'medium',
            userId,
            userId,
            labels ? JSON.stringify(labels) : null
        ]);
        const io = req.app.get('io');
        io && io.emit('task-created', {
            id: insert.insertId,
            project_id,
            title,
            description,
            status: status || 'pending',
            priority: priority || 'medium',
            labels: labels || []
        });
        res.status(201).json({ message: "Task created", taskId: insert.insertId });
    } catch (err) {
        console.error('Create task error:', err);
        res.status(500).json({ message: "Server error", error: err });
    }
};

// ---------------- GET TASKS BY PROJECT ----------------
const getTasks = async (req, res) => {
    const { project_id } = req.params;
    const query = 'SELECT * FROM tasks WHERE project_id = ? ORDER BY id ASC';
    try {
        const results = await getQuery(query, [project_id]);
        res.json(results);
    } catch (err) {
        console.error('Get tasks error:', err);
        res.status(500).json({ message: 'Error retrieving tasks', error: err });
    }
};

// ---------------- UPDATE TASK ----------------
const updateTask = async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    const { title, description, assigned_to, due_date, status, priority, labels } = req.body;
    // permission check
    const taskRow = await q('SELECT project_id FROM tasks WHERE id = ?', [id]);
    if (!taskRow.length) return res.status(404).json({ message: 'Task not found' });
    const projectId = taskRow[0].project_id;
    const proj = await q('SELECT owner_id FROM projects WHERE id = ?', [projectId]);
    const isOwner = proj.length && proj[0].owner_id === userId;
    const rows = await q('SELECT role, permissions FROM project_members WHERE project_id = ? AND user_id = ?', [projectId, userId]);
    const rawPerms = rows.length && rows[0].permissions;
    const perms = rawPerms ? (typeof rawPerms === 'string' ? JSON.parse(rawPerms) : rawPerms) : null;
    const hasEdit = !!(perms && (perms.edit === true || perms.can_edit === true));
    const isAdmin = rows.length && rows[0].role === 'admin';
    const canEdit = isOwner || isAdmin || hasEdit;
    console.log('UPDATE TASK DEBUG:', { userId, projectId, owner_id: proj[0]?.owner_id, isOwner, role: rows[0]?.role, isAdmin, perms, hasEdit, canEdit });
    if (!canEdit) return res.status(403).json({ message: 'Not allowed to edit tasks' });

    // Build dynamic SET clause only for provided fields
    const sets = [];
    const params = [];
    if (title !== undefined) { sets.push('title = ?'); params.push(title); }
    if (description !== undefined) { sets.push('description = ?'); params.push(description); }
    if (assigned_to !== undefined) { sets.push('assigned_to = ?'); params.push(assigned_to); }
    if (due_date !== undefined) { sets.push('due_date = ?'); params.push(due_date); }
    if (status !== undefined) { sets.push('status = ?'); params.push(status); }
    if (priority !== undefined) { sets.push('priority = ?'); params.push(priority); }
    if (labels !== undefined) { sets.push('labels = ?'); params.push(labels ? JSON.stringify(labels) : null); }

    if (sets.length === 0) {
        return res.status(400).json({ message: 'No fields provided to update' });
    }

    const query = `UPDATE tasks SET ${sets.join(', ')} WHERE id = ?`;
    params.push(id);

    try {
        const results = await run(query, params);
        if (results && results.affectedRows === 0) {
            return res.status(404).json({ message: 'Task not found' });
        }
        
        // Notify assigned user if task was assigned to someone
        const io = req.app.get('io');
        if (assigned_to && assigned_to !== userId && io) {
            await createNotification(
                assigned_to,
                'task_assigned',
                { task_id: id, title, project_id: projectId, assigned_by: userId },
                io
            );
        }
        
        io && io.emit('task-updated', {
            id,
            ...(title !== undefined ? { title } : {}),
            ...(description !== undefined ? { description } : {}),
            ...(assigned_to !== undefined ? { assigned_to } : {}),
            ...(due_date !== undefined ? { due_date } : {}),
            ...(status !== undefined ? { status } : {}),
            ...(priority !== undefined ? { priority } : {}),
            ...(labels !== undefined ? { labels: labels || [] } : {})
        });
        res.json({ message: 'Task updated', id });
    } catch (err) {
        console.error('Update task error:', err);
        res.status(500).json({ message: 'Error updating task', error: err });
    }
};

// ---------------- DELETE TASK ----------------
const deleteTask = async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    // permission check
    const taskRow = await q('SELECT project_id FROM tasks WHERE id = ?', [id]);
    if (!taskRow.length) return res.status(404).json({ message: 'Task not found' });
    const projectId = taskRow[0].project_id;
    const proj = await q('SELECT owner_id FROM projects WHERE id = ?', [projectId]);
    const isOwner = proj.length && proj[0].owner_id === userId;
    const rows = await q('SELECT role, permissions FROM project_members WHERE project_id = ? AND user_id = ?', [projectId, userId]);
    const rawPerms = rows.length && rows[0].permissions;
    const perms = rawPerms ? (typeof rawPerms === 'string' ? JSON.parse(rawPerms) : rawPerms) : null;
    const hasDelete = !!(perms && (perms.delete === true || perms.can_delete === true));
    const isAdmin = rows.length && rows[0].role === 'admin';
    const canDelete = isOwner || isAdmin || hasDelete;
    console.log('DELETE TASK DEBUG:', { userId, projectId, owner_id: proj[0]?.owner_id, isOwner, role: rows[0]?.role, isAdmin, perms, hasDelete, canDelete });
    if (!canDelete) return res.status(403).json({ message: 'Not allowed to delete tasks' });
    const query = 'DELETE FROM tasks WHERE id = ?';
    try {
        const results = await run(query, [id]);
        if (results && results.affectedRows === 0) {
            return res.status(404).json({ message: 'Task not found' });
        }
        const io = req.app.get('io');
        io && io.emit('task-deleted', { id });
        res.status(200).json({ message: 'Task deleted' });
    } catch (err) {
        console.error('Delete task error:', err);
        res.status(500).json({ message: 'Error deleting task', error: err });
    }
};

module.exports = { createTask, getTasks, updateTask, deleteTask };
