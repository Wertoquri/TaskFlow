const path = require('path');
const { getQuery, run } = require('../db');
const { uploadBuffer, deleteMedia, mediaUrl } = require('../services/mediaStorage');

// POST /api/tasks/:id/attachments
const uploadTaskAttachment = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const file = req.file;

  if (!file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  try {
    // Переконуємось, що задача існує
    const rows = await getQuery('SELECT id, project_id FROM tasks WHERE id = ?', [id]);
    if (!rows.length) {
      return res.status(404).json({ message: 'Task not found' });
    }
    const projectId = rows[0].project_id;
    const storedUrl = await uploadBuffer(file, 'taskflow/attachments');

    const insertResult = await run(
      'INSERT INTO task_attachments (task_id, uploaded_by, filename, original_name, mime_type, size) VALUES (?, ?, ?, ?, ?, ?)',
      [
        id,
        userId,
        storedUrl,
        file.originalname,
        file.mimetype,
        file.size,
      ]
    );

    // Опціональний лічильник вкладень (attachments_count) може бути відсутній.
    // Виконуємо оновлення тільки якщо колонка існує (перевірка з кешем в app).
    let attachmentsCountEnabled = req.app.get('attachmentsCountEnabled');
    if (attachmentsCountEnabled === undefined) {
      try {
        const schema = process.env.DB_NAME;
        const rowsInfo = await getQuery(
          'SELECT COUNT(*) AS cnt FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = "tasks" AND COLUMN_NAME = "attachments_count"',
          [schema]
        );
        attachmentsCountEnabled = !!(rowsInfo[0] && rowsInfo[0].cnt);
        req.app.set('attachmentsCountEnabled', attachmentsCountEnabled);
      } catch (e) {
        // Якщо перевірка схеми не вдалася, в цілях стабільності вимикаємо оновлення лічильника
        attachmentsCountEnabled = false;
        req.app.set('attachmentsCountEnabled', attachmentsCountEnabled);
      }
    }

    if (attachmentsCountEnabled) {
      try {
        await run(
          'UPDATE tasks SET attachments_count = attachments_count + 1 WHERE id = ?',
          [id]
        );
      } catch (e) {
        // Навіть якщо колонка була під час перевірки, може зникнути — тоді просто ігноруємо
        if (e && String(e.sqlMessage || e.message || '').includes('Unknown column')) {
          req.app.set('attachmentsCountEnabled', false);
        } else {
          throw e;
        }
      }
    }

    const attachment = {
      id: insertResult.insertId,
      task_id: Number(id),
      uploaded_by: userId,
      filename: storedUrl,
      original_name: file.originalname,
      mime_type: file.mimetype,
      size: file.size,
      url: storedUrl,
    };

    // Log activity: attachment added (non-fatal)
    try {
      const meta = JSON.stringify({ attachment_id: attachment.id, filename: attachment.original_name });
      // fetch username for nicer UI
      let username = null;
      try {
        const u = await getQuery('SELECT username FROM users WHERE id = ?', [userId]);
        username = u[0]?.username || null;
      } catch {}
      const act = await run(
        'INSERT INTO task_activity (task_id, user_id, `type`, metadata) VALUES (?, ?, ?, ?)',
        [id, userId, 'attachment_added', meta]
      );
      const activity = {
        id: act.insertId,
        task_id: Number(id),
        project_id: Number(projectId),
        user_id: userId,
        username,
        type: 'attachment_added',
        metadata: JSON.parse(meta),
        created_at: new Date().toISOString(),
      };
      const io = req.app.get('io');
      io && io.emit('task-activity', activity);
    } catch (e) {
      if (e && e.code === 'ER_NO_SUCH_TABLE') {
        console.warn('task_activity table missing; skipping activity log for attachment_added');
      } else {
        console.error('Activity log error (attachment added):', e);
      }
    }

    const io = req.app.get('io');
    io && io.emit('task-attachment-added', attachment);

    res.status(201).json({ message: 'Attachment uploaded', attachment });
  } catch (err) {
    console.error('Upload task attachment error:', err);
    res.status(500).json({ message: 'Server error', error: err });
  }
};

// GET /api/tasks/:id/attachments
const getTaskAttachments = async (req, res) => {
  const { id } = req.params;
  try {
    const rows = await getQuery(
      'SELECT id, task_id, uploaded_by, filename, original_name, mime_type, size, created_at FROM task_attachments WHERE task_id = ? ORDER BY created_at DESC',
      [id]
    );
    const enriched = rows.map((a) => ({
      ...a,
      url: mediaUrl(a.filename, 'tasks'),
    }));
    res.json(enriched);
  } catch (err) {
    console.error('Get task attachments error:', err);
    res.status(500).json({ message: 'Server error', error: err });
  }
};

module.exports = { uploadTaskAttachment, getTaskAttachments };

// DELETE /api/tasks/:id/attachments/:attachmentId
const fs = require('fs');
const deleteTaskAttachment = async (req, res) => {
  const { id, attachmentId } = req.params;
  try {
    const taskRows = await getQuery('SELECT project_id FROM tasks WHERE id = ?', [id]);
    const projectId = taskRows[0]?.project_id;
    const rows = await getQuery(
      'SELECT id, filename FROM task_attachments WHERE id = ? AND task_id = ?',
      [attachmentId, id]
    );
    if (!rows.length) {
      console.warn('Attachment not found for delete', { taskId: id, attachmentId });
      return res.status(404).json({ message: 'Attachment not found' });
    }
    const filename = rows[0].filename;
    if (/^https?:\/\//i.test(filename)) {
      await deleteMedia(filename).catch((error) => {
        console.warn('Attachment media could not be removed:', error.message);
      });
    } else {
      const filePath = path.join(__dirname, '..', 'uploads', 'tasks', filename);
      try { fs.unlinkSync(filePath); } catch {}
    }

    await run('DELETE FROM task_attachments WHERE id = ?', [attachmentId]);

    // decrement counter if enabled
    let attachmentsCountEnabled = req.app.get('attachmentsCountEnabled');
    if (attachmentsCountEnabled) {
      try {
        await run('UPDATE tasks SET attachments_count = GREATEST(attachments_count - 1, 0) WHERE id = ?', [id]);
      } catch (e) {
        if (String(e.sqlMessage || e.message || '').includes('Unknown column')) {
          req.app.set('attachmentsCountEnabled', false);
        } else {
          throw e;
        }
      }
    }

    const io = req.app.get('io');
    io && io.emit('task-attachment-deleted', { id: Number(attachmentId), task_id: Number(id) });

    // Log activity: attachment deleted (non-fatal)
    try {
      const meta = JSON.stringify({ attachment_id: Number(attachmentId), filename });
      // fetch username
      let username = null;
      try {
        const u = await getQuery('SELECT username FROM users WHERE id = ?', [req.user.id]);
        username = u[0]?.username || null;
      } catch {}
      const act = await run(
        'INSERT INTO task_activity (task_id, user_id, `type`, metadata) VALUES (?, ?, ?, ?)',
        [id, req.user.id, 'attachment_deleted', meta]
      );
      const activity = {
        id: act.insertId,
        task_id: Number(id),
        project_id: Number(projectId),
        user_id: req.user.id,
        username,
        type: 'attachment_deleted',
        metadata: JSON.parse(meta),
        created_at: new Date().toISOString(),
      };
      io && io.emit('task-activity', activity);
    } catch (e) {
      if (e && e.code === 'ER_NO_SUCH_TABLE') {
        console.warn('task_activity table missing; skipping activity log for attachment_deleted');
      } else {
        console.error('Activity log error (attachment deleted):', e);
      }
    }

    res.json({ message: 'Attachment deleted' });
  } catch (err) {
    console.error('Delete task attachment error:', err);
    res.status(err.statusCode || 500).json({
      message: err.statusCode ? err.message : 'Server error'
    });
  }
};

module.exports.deleteTaskAttachment = deleteTaskAttachment;
