const db = require('../db'); // підключення до MySQL

// ---------------- CREATE TASK ----------------
const createTask = (req, res) => {
    const { project_id, title, description, assigned_to, due_date, status } = req.body;

    if (!project_id || !title) {
        return res.status(400).json({ message: "Project ID and title are required" });
    }

    const query = `
        INSERT INTO tasks (project_id, title, description, assigned_to, due_date, status)
        VALUES (?, ?, ?, ?, ?, ?)
    `;
    db.query(query, [
        project_id,
        title,
        description || null,
        assigned_to || null,
        due_date || null,
        status || 'pending'
    ], (err, results) => {
        if (err) {
            console.error('Create task error:', err);
            return res.status(500).json({ message: "Server error", error: err });
        }
        res.status(201).json({ message: "Task created", taskId: results.insertId });
    });
};

// ---------------- GET TASKS BY PROJECT ----------------
const getTasks = (req, res) => {
    const { project_id } = req.params;
    const query = 'SELECT * FROM tasks WHERE project_id = ? ORDER BY id ASC';
    db.query(query, [project_id], (err, results) => {
        if (err) {
            console.error('Get tasks error:', err);
            return res.status(500).json({ message: 'Error retrieving tasks', error: err });
        }
        res.json(results);
    });
};

// ---------------- UPDATE TASK ----------------
const updateTask = (req, res) => {
    const { id } = req.params;
    const { title, description, assigned_to, due_date, status } = req.body;

    const query = `
        UPDATE tasks 
        SET title = ?, description = ?, assigned_to = ?, due_date = ?, status = ?
        WHERE id = ?
    `;
    db.query(query, [title, description, assigned_to, due_date, status, id], (err, results) => {
        if (err) {
            console.error('Update task error:', err);
            return res.status(500).json({ message: 'Error updating task', error: err });
        }
        if (results.affectedRows === 0) {
            return res.status(404).json({ message: 'Task not found' });
        }
        res.json({ message: 'Task updated', id });
    });
};

// ---------------- DELETE TASK ----------------
const deleteTask = (req, res) => {
    const { id } = req.params;
    const query = 'DELETE FROM tasks WHERE id = ?';
    db.query(query, [id], (err, results) => {
        if (err) {
            console.error('Delete task error:', err);
            return res.status(500).json({ message: 'Error deleting task', error: err });
        }
        if (results.affectedRows === 0) {
            return res.status(404).json({ message: 'Task not found' });
        }
        res.status(200).json({ message: 'Task deleted' });
    });
};

module.exports = { createTask, getTasks, updateTask, deleteTask };
