const { getQuery, run } = require('../db'); // Підключення до БД

const getProjects = async (req, res) => {
    try {
        const ownerId = req.user?.id;
        if (!ownerId) {
            return res.status(400).json({ message: 'Owner not resolved from token' });
        }
        const projects = await getQuery('SELECT * FROM projects WHERE owner_id = ?', [ownerId]);
        res.json(projects);
    } catch (error) {
        console.error('Get projects error:', error);
        res.status(500).json({ message: 'Server error', error });
    }
};
// ---------------- CREATE PROJECT ----------------
const createProject = async (req, res) => {
    const { name, description } = req.body;
    const ownerId = req.user?.id;

    if (!name) {
        return res.status(400).json({ message: 'Project name is required' });
    }
    if (!ownerId) {
        return res.status(400).json({ message: 'Owner not resolved from token' });
    }

    const query = 'INSERT INTO projects (name, description, owner_id) VALUES (?, ?, ?)';
    try {
        const result = await run(query, [name, description || null, ownerId]);
        res.status(201).json({ message: 'Project created', projectId: result.insertId });
    } catch (err) {
        console.error('Create project error:', err);
        res.status(500).json({ message: 'Server error', error: err });
    }
};
// ---------------- UPDATE PROJECT ----------------
const updateProject = async (req, res) => {
    const { id, name, description } = req.body;

    const query = 'UPDATE projects SET name = ?, description = ? WHERE id = ?';
    try {
        const results = await run(query, [name, description, id]);
        if (results.affectedRows === 0) {
            return res.status(404).json({ message: 'Project not found' });
        }
        res.json({ message: 'Project updated', id });
    } catch (err) {
        console.error('Update project error:', err);
        res.status(500).json({ message: 'Server error', error: err });
    }
};

const deleteProject = async (req, res) => {
    const { id } = req.params;

    // Spawning all tasks from this project
    const deleteTasksQuery = 'DELETE FROM tasks WHERE project_id = ?';
    try {
        await getQuery(deleteTasksQuery, [id]);
        const deleteProjectQuery = 'DELETE FROM projects WHERE id = ?';
        const results = await run(deleteProjectQuery, [id]);
        if (results.affectedRows === 0) {
            return res.status(404).json({ message: 'Project not found' });
        }
        res.json({ message: 'Project deleted' });
    } catch (err) {
        console.error('Delete project error:', err);
        res.status(500).json({ message: 'Error deleting project', error: err });
    }
};

module.exports = { getProjects, createProject, updateProject, deleteProject };
