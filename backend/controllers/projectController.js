const db = require('../db'); // Підключення до БД

// ---------------- GET ALL PROJECTS ----------------
const getProjects = (req, res) => {
    const query = 'SELECT * FROM projects ORDER BY id ASC';
    db.query(query, (err, results) => {
        if (err) {
            console.error('Get projects error:', err);
            return res.status(500).json({ message: 'Server error', error: err });
        }
        res.json(results);
    });
};

// ---------------- CREATE PROJECT ----------------
const createProject = (req, res) => {
    const { name, description } = req.body;

    if (!name) {
        return res.status(400).json({ message: 'Project name is required' });
    }

    const query = 'INSERT INTO projects (name, description) VALUES (?, ?)';
    db.query(query, [name, description || null], (err, results) => {
        if (err) {
            console.error('Create project error:', err);
            return res.status(500).json({ message: 'Server error', error: err });
        }
        res.status(201).json({ message: 'Project created', projectId: results.insertId });
    });
};

// ---------------- UPDATE PROJECT ----------------
const updateProject = (req, res) => {
    const { id, name, description } = req.body;

    const query = 'UPDATE projects SET name = ?, description = ? WHERE id = ?';
    db.query(query, [name, description, id], (err, results) => {
        if (err) {
            console.error('Update project error:', err);
            return res.status(500).json({ message: 'Server error', error: err });
        }
        if (results.affectedRows === 0) {
            return res.status(404).json({ message: 'Project not found' });
        }
        res.json({ message: 'Project updated', id });
    });
};

const deleteProject = (req, res) => {
    const { id } = req.params;

    // Спочатку видаляємо всі задачі цього проекту
    const deleteTasksQuery = 'DELETE FROM tasks WHERE project_id = ?';
    db.query(deleteTasksQuery, [id], (err) => {
        if (err) {
            console.error('Delete tasks error:', err);
            return res.status(500).json({ message: 'Error deleting tasks', error: err });
        }

        // Потім видаляємо сам проект
        const deleteProjectQuery = 'DELETE FROM projects WHERE id = ?';
        db.query(deleteProjectQuery, [id], (err, results) => {
            if (err) {
                console.error('Delete project error:', err);
                return res.status(500).json({ message: 'Error deleting project', error: err });
            }
            if (results.affectedRows === 0) {
                return res.status(404).json({ message: 'Project not found' });
            }
            res.json({ message: 'Project deleted' });
        });
    });
};

module.exports = { getProjects, createProject, updateProject, deleteProject };
