const { getQuery, run } = require('../db');
const { getQuery: q } = require('../db');
const { createNotification } = require('../helpers/notifications');
const { mediaUrl } = require('../services/mediaStorage');

const createTask = async (req, res) => {
    const { project_id, title, description, status, priority, labels, assigned_to, due_date } = req.body;
    const userId = req.user.id;
    if (!project_id || !title) {
        return res.status(400).json({ message: "Project ID and title are required" });
    }
    try {
        // Check permissions: project owner OR member with admin OR explicit permission
        const proj = await q('SELECT owner_id FROM projects WHERE id = ?', [project_id]);
        const isOwner = proj.length && String(proj[0].owner_id) === String(userId);
        const rows = await q('SELECT role, permissions FROM project_members WHERE project_id = ? AND user_id = ?', [project_id, userId]);
        const rawPerms = rows.length && rows[0].permissions;
        const perms = rawPerms ? (typeof rawPerms === 'string' ? JSON.parse(rawPerms) : rawPerms) : null;
        const canCreate = !!(perms && (perms.create === true || perms.can_create === true));
        const isAdmin = rows.length && rows[0].role === 'admin';
        const allowed = isOwner || isAdmin || canCreate;
        if (!allowed) return res.status(403).json({ message: 'Not allowed to create tasks' });

        const assigneeId = assigned_to === null || assigned_to === undefined || assigned_to === '' ? null : Number(assigned_to);
        if (assigneeId !== null) {
            if (!Number.isInteger(assigneeId) || assigneeId <= 0) return res.status(400).json({ message: 'Invalid assignee' });
            const assigneeMembership = await q('SELECT 1 FROM project_members WHERE project_id = ? AND user_id = ?', [project_id, assigneeId]);
            if (!assigneeMembership.length && String(proj[0].owner_id) !== String(assigneeId)) {
                return res.status(400).json({ message: 'Assignee must be a project member' });
            }
        }
        if (due_date && (typeof due_date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(due_date) || Number.isNaN(Date.parse(due_date)))) {
            return res.status(400).json({ message: 'Invalid due date' });
        }

        const insert = await run('INSERT INTO tasks (project_id, title, description, status, priority, owner_id, created_by, labels, assigned_to, due_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [
            project_id,
            title,
            description || null,
            status || 'pending',
            priority || 'medium',
            userId,
            userId,
            labels ? JSON.stringify(labels) : null,
            assigneeId,
            due_date || null
        ]);
        const io = req.app.get('io');
        io && io.to(`project:${project_id}`).emit('task-created', {
            id: insert.insertId,
            project_id,
            title,
            description,
            status: status || 'pending',
            priority: priority || 'medium',
            labels: labels || [],
            assigned_to: assigneeId,
            due_date: due_date || null
        });
        res.status(201).json({ message: "Task created", taskId: insert.insertId });
    } catch (err) {
        console.error('Create task error:', err);
        res.status(500).json({ message: "Server error", error: err });
    }
};

const getTasks = async (req, res) => {
    const { project_id } = req.params;
    const tasksQuery = 'SELECT * FROM tasks WHERE project_id = ? ORDER BY id ASC';
    const attachmentsQuery = 'SELECT id, task_id, uploaded_by, filename, original_name, mime_type, size, created_at FROM task_attachments WHERE task_id IN (?)';
    try {
        const tasks = await getQuery(tasksQuery, [project_id]);
        if (!tasks.length) {
            return res.json([]);
        }

        const taskIds = tasks.map((t) => t.id);
        let attachments = [];
        try {
            attachments = await getQuery(attachmentsQuery, [taskIds]);
        } catch (e) {
            console.error('Get task attachments for list error:', e);
        }

        const byTask = {};
        for (const att of attachments) {
            const key = att.task_id;
            if (!byTask[key]) byTask[key] = [];
            byTask[key].push({
                ...att,
                url: mediaUrl(att.filename, 'tasks'),
            });
        }

        const enriched = tasks.map((t) => ({
            ...t,
            attachments: byTask[t.id] || [],
        }));

        res.json(enriched);
    } catch (err) {
        console.error('Get tasks error:', err);
        res.status(500).json({ message: 'Error retrieving tasks', error: err });
    }
};

const updateTask = async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    const { title, description, assigned_to, due_date, status, priority, labels } = req.body;
    // permission check
    const taskRow = await q('SELECT project_id FROM tasks WHERE id = ?', [id]);
    if (!taskRow.length) return res.status(404).json({ message: 'Task not found' });
    const projectId = taskRow[0].project_id;
    const proj = await q('SELECT owner_id FROM projects WHERE id = ?', [projectId]);
    const isOwner = proj.length && String(proj[0].owner_id) === String(userId);
    const rows = await q('SELECT role, permissions FROM project_members WHERE project_id = ? AND user_id = ?', [projectId, userId]);
    const rawPerms = rows.length && rows[0].permissions;
    const perms = rawPerms ? (typeof rawPerms === 'string' ? JSON.parse(rawPerms) : rawPerms) : null;
    const hasEdit = !!(perms && (perms.edit === true || perms.can_edit === true));
    const isAdmin = rows.length && rows[0].role === 'admin';
    const canEdit = isOwner || isAdmin || hasEdit;
    if (!canEdit) return res.status(403).json({ message: 'Not allowed to edit tasks' });

    const normalizedAssignee = assigned_to === undefined ? undefined :
        (assigned_to === null || assigned_to === '' ? null : Number(assigned_to));
    if (normalizedAssignee !== undefined && normalizedAssignee !== null) {
        const assigneeId = normalizedAssignee;
        if (!Number.isInteger(assigneeId) || assigneeId <= 0) {
            return res.status(400).json({ message: 'Invalid assignee' });
        }
        const assigneeAccess = await q('SELECT 1 FROM project_members WHERE project_id = ? AND user_id = ?', [projectId, assigneeId]);
        if (!assigneeAccess.length && String(proj[0].owner_id) !== String(assigneeId)) {
            return res.status(400).json({ message: 'Assignee must be a project member' });
        }
    }
    const normalizedDueDate = due_date === '' ? null : due_date;
    if (normalizedDueDate && (typeof normalizedDueDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(normalizedDueDate) || Number.isNaN(Date.parse(normalizedDueDate)))) {
        return res.status(400).json({ message: 'Invalid due date' });
    }

    // Build dynamic SET clause only for provided fields
    const sets = [];
    const params = [];
    if (title !== undefined) { sets.push('title = ?'); params.push(title); }
    if (description !== undefined) { sets.push('description = ?'); params.push(description); }
    if (normalizedAssignee !== undefined) { sets.push('assigned_to = ?'); params.push(normalizedAssignee); }
    if (normalizedDueDate !== undefined) { sets.push('due_date = ?'); params.push(normalizedDueDate); }
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
        if (normalizedAssignee && String(normalizedAssignee) !== String(userId) && io) {
            await createNotification(
                normalizedAssignee,
                'task_assigned',
                { task_id: id, title, project_id: projectId, assigned_by: userId },
                io
            );
        }
        
        io && io.to(`project:${projectId}`).emit('task-updated', {
            id,
            ...(title !== undefined ? { title } : {}),
            ...(description !== undefined ? { description } : {}),
            ...(normalizedAssignee !== undefined ? { assigned_to: normalizedAssignee } : {}),
            ...(normalizedDueDate !== undefined ? { due_date: normalizedDueDate } : {}),
            ...(status !== undefined ? { status } : {}),
            ...(priority !== undefined ? { priority } : {}),
            ...(labels !== undefined ? { labels: labels || [] } : {})
        });

                // Log activity for this update (non-fatal)
                try {
                    const meta = JSON.stringify({ ...(title !== undefined ? { title } : {}), ...(description !== undefined ? { description } : {}), ...(assigned_to !== undefined ? { assigned_to } : {}), ...(due_date !== undefined ? { due_date } : {}), ...(status !== undefined ? { status } : {}), ...(priority !== undefined ? { priority } : {}), ...(labels !== undefined ? { labels } : {}) });
                    // fetch username for nicer UI
                    let username = null;
                    try {
                        const u = await q('SELECT username FROM users WHERE id = ?', [userId]);
                        username = u[0]?.username || null;
                    } catch {}
                    const act = await run('INSERT INTO task_activity (task_id, user_id, `type`, metadata) VALUES (?, ?, ?, ?)', [id, userId, 'task_updated', meta]);
                    const activity = {
                        id: act.insertId,
                        task_id: Number(id),
                        project_id: Number(projectId),
                        user_id: userId,
                        username,
                        type: 'task_updated',
                        metadata: JSON.parse(meta),
                        created_at: new Date().toISOString(),
                    };
                    io && io.to(`project:${projectId}`).emit('task-activity', activity);
                } catch (e) {
                    if (e && e.code === 'ER_NO_SUCH_TABLE') {
                        console.warn('task_activity table missing; skipping activity log for task_updated');
                    } else {
                        console.error('Activity log error (task updated):', e);
                    }
                }
        res.json({ message: 'Task updated', id });
    } catch (err) {
        console.error('Update task error:', err);
        res.status(500).json({ message: 'Error updating task', error: err });
    }
};

const deleteTask = async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    // permission check
    const taskRow = await q('SELECT project_id FROM tasks WHERE id = ?', [id]);
    if (!taskRow.length) return res.status(404).json({ message: 'Task not found' });
    const projectId = taskRow[0].project_id;
    const proj = await q('SELECT owner_id FROM projects WHERE id = ?', [projectId]);
    const isOwner = proj.length && String(proj[0].owner_id) === String(userId);
    const rows = await q('SELECT role, permissions FROM project_members WHERE project_id = ? AND user_id = ?', [projectId, userId]);
    const rawPerms = rows.length && rows[0].permissions;
    const perms = rawPerms ? (typeof rawPerms === 'string' ? JSON.parse(rawPerms) : rawPerms) : null;
    const hasDelete = !!(perms && (perms.delete === true || perms.can_delete === true));
    const isAdmin = rows.length && rows[0].role === 'admin';
    const canDelete = isOwner || isAdmin || hasDelete;
    if (!canDelete) return res.status(403).json({ message: 'Not allowed to delete tasks' });
    const query = 'DELETE FROM tasks WHERE id = ?';
    try {
        const results = await run(query, [id]);
        if (results && results.affectedRows === 0) {
            return res.status(404).json({ message: 'Task not found' });
        }
        const io = req.app.get('io');
        io && io.to(`project:${projectId}`).emit('task-deleted', { id });
        res.status(200).json({ message: 'Task deleted' });
    } catch (err) {
        console.error('Delete task error:', err);
        res.status(500).json({ message: 'Error deleting task', error: err });
    }
};

module.exports = { createTask, getTasks, updateTask, deleteTask };
