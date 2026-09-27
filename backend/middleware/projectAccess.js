const { getQuery } = require("../db");

async function getProjectAccess(projectId, userId) {
  const rows = await getQuery(
    `SELECT p.id, p.owner_id, pm.role
     FROM projects p
     LEFT JOIN project_members pm ON pm.project_id = p.id AND pm.user_id = ?
     WHERE p.id = ?`,
    [userId, projectId],
  );
  if (!rows.length) return { exists: false, allowed: false, admin: false };
  const owner = String(rows[0].owner_id) === String(userId);
  const member = rows[0].role === "admin" || rows[0].role === "member";
  return {
    exists: true,
    allowed: owner || member,
    admin: owner || rows[0].role === "admin",
  };
}

function requireProjectAccess(parameter = "id", admin = false) {
  return async (req, res, next) => {
    const projectId = Number(req.params[parameter]);
    if (!Number.isInteger(projectId) || projectId <= 0) {
      return res.status(400).json({ message: "Invalid project ID" });
    }
    try {
      const access = await getProjectAccess(projectId, req.user.id);
      if (!access.exists)
        return res.status(404).json({ message: "Project not found" });
      if (!access.allowed || (admin && !access.admin)) {
        return res.status(403).json({ message: "Project access denied" });
      }
      req.projectId = projectId;
      req.projectAccess = access;
      next();
    } catch (error) {
      next(error);
    }
  };
}

function requireTaskAccess() {
  return async (req, res, next) => {
    const taskId = Number(req.params.id);
    if (!Number.isInteger(taskId) || taskId <= 0) {
      return res.status(400).json({ message: "Invalid task ID" });
    }
    try {
      const tasks = await getQuery(
        "SELECT project_id FROM tasks WHERE id = ?",
        [taskId],
      );
      if (!tasks.length)
        return res.status(404).json({ message: "Task not found" });
      const access = await getProjectAccess(tasks[0].project_id, req.user.id);
      if (!access.allowed)
        return res.status(403).json({ message: "Project access denied" });
      req.projectId = tasks[0].project_id;
      req.projectAccess = access;
      next();
    } catch (error) {
      next(error);
    }
  };
}

module.exports = { getProjectAccess, requireProjectAccess, requireTaskAccess };
