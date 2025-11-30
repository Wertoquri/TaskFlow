const { getQuery, run } = require('../db');

// ---------------- CREATE TASK ----------------
const createTask = async (req, res) => {
    const { project_id, title, description, assigned_to, due_date, status, priority, labels } = req.body;

    if (!project_id || !title) {
        return res.status(400).json({ message: "Project ID and title are required" });
    }

    const query = `
        INSERT INTO tasks (project_id, title, description, assigned_to, due_date, status, priority, labels)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    try {
        const result = await run(query, [
            project_id,
            title,
            description || null,
            assigned_to || null,
            due_date || null,
            status || 'pending',
            priority || 'medium',
            labels ? JSON.stringify(labels) : null
        ]);
        const io = req.app.get('io');
        io && io.emit('task-created', {
            id: result.insertId,
            project_id,
            title,
            description,
            status: status || 'pending',
            priority: priority || 'medium',
            labels: labels || []
        });
        res.status(201).json({ message: "Task created", taskId: result.insertId });
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
    const { title, description, assigned_to, due_date, status, priority, labels } = req.body;

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
        const io = req.app.get('io');
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
