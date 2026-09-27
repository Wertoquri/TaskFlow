// backend/routes/taskRoutes.js
const express = require("express");
const router = express.Router();
const taskController = require("../controllers/taskController");
const authenticate = require("../middleware/authenticate"); // Middleware для авторизації
const {
  requireProjectAccess,
  requireTaskAccess,
} = require("../middleware/projectAccess");
const {
  uploadTaskAttachment,
  getTaskAttachments,
  deleteTaskAttachment,
} = require("../controllers/taskAttachmentsController");
const { getTaskActivity } = require("../controllers/activityController");

// Тепер шляхи чисті, без дублювання 'tasks'
router.post("/", authenticate, taskController.createTask); // POST /api/tasks
router.get(
  "/:project_id",
  authenticate,
  requireProjectAccess("project_id"),
  taskController.getTasks,
); // GET /api/tasks/:project_id
router.put("/:id", authenticate, taskController.updateTask); // PUT /api/tasks/:id
router.delete("/:id", authenticate, taskController.deleteTask); // DELETE /api/tasks/:id

// Вкладення до задач
router.post(
  "/:id/attachments",
  authenticate,
  requireTaskAccess(),
  (req, res, next) => {
    const upload = req.app.get("uploadTasks");
    upload.single("file")(req, res, (err) => {
      if (err)
        return res
          .status(400)
          .json({
            message: "File upload error",
            error: err.message || err.toString(),
          });
      next();
    });
  },
  uploadTaskAttachment,
);

router.get(
  "/:id/attachments",
  authenticate,
  requireTaskAccess(),
  getTaskAttachments,
);
router.delete(
  "/:id/attachments/:attachmentId",
  authenticate,
  requireTaskAccess(),
  deleteTaskAttachment,
);

// Activity
router.get("/:id/activity", authenticate, requireTaskAccess(), getTaskActivity);

module.exports = router;
