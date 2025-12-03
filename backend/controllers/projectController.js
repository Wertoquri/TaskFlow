const { getQuery, run } = require('../db'); // Підключення до БД

const getProjects = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(400).json({ message: 'User not resolved from token' });
        }
        // Get projects where user is owner OR member
        const projects = await getQuery(
            `SELECT DISTINCT p.* FROM projects p 
             LEFT JOIN project_members pm ON p.id = pm.project_id 
             WHERE p.owner_id = ? OR pm.user_id = ?
             ORDER BY p.created_at DESC`,
            [userId, userId]
        );
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
        // Ensure creator is also a project member with admin role for permission checks
        await run(
            'INSERT IGNORE INTO project_members (project_id, user_id, role) VALUES (?, ?, "admin")',
            [result.insertId, ownerId]
        );
        res.status(201).json({ message: 'Project created', projectId: result.insertId });
    } catch (err) {
        console.error('Create project error:', err);
        res.status(500).json({ message: 'Server error', error: err });
    }
};
// ---------------- UPDATE PROJECT ----------------
const updateProject = async (req, res) => {
    const { id, name, description } = req.body;

    const query = 'UPDATE projects SET name = ?, description = ?, updated_at = NOW() WHERE id = ?';
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
    const userId = req.user?.id;

    if (!userId) {
        return res.status(400).json({ message: 'User not resolved from token' });
    }

    try {
        // Only project owner can delete the project
        const proj = await getQuery('SELECT owner_id FROM projects WHERE id = ?', [id]);
        if (!proj.length) {
            return res.status(404).json({ message: 'Project not found' });
        }
        const isOwner = proj[0].owner_id === userId;
        console.log('DELETE PROJECT DEBUG:', { userId, projectId: id, owner_id: proj[0].owner_id, isOwner });
        
        if (!isOwner) {
            return res.status(403).json({ message: 'Only project owner can delete the project' });
        }

        // Delete all tasks from this project
        const deleteTasksQuery = 'DELETE FROM tasks WHERE project_id = ?';
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
