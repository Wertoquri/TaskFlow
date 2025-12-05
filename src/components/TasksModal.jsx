import React, { useEffect, useState } from "react";
import { getTasksByProject, createTask, updateTask, deleteTask, uploadTaskAttachment, deleteTaskAttachment, getTaskActivity, getProjectActivity } from "../api";
import Toast from "./Toast";
import styles from "./TasksModal.module.css";
import { useI18n } from "../context/I18nContext.jsx";
import io from 'socket.io-client';

export default function TasksModal({ open, onClose, project, filters }) {
  const { t } = useI18n();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("pending");
  const [priority, setPriority] = useState("medium");
  const [labelsInput, setLabelsInput] = useState("");
  const [editTask, setEditTask] = useState(null);
  const [toast, setToast] = useState(null);
  const [uploadingFor, setUploadingFor] = useState(null);
  const [activityMap, setActivityMap] = useState({}); // { [taskId]: { open, loading, items } }

  useEffect(() => {
    async function load() {
      if (!open || !project) return;
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem("token");
        const data = await getTasksByProject(project.id, token);
        setTasks(data);
      } catch (e) {
        setError(t('loadTasksError'));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [open, project]);

  useEffect(() => {
    function handleEscape(e) {
      if (e.key === "Escape" && open) {
        onClose();
      }
    }
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open, onClose]);

  useEffect(() => {
    // GSAP анімація для модального вікна
    if (open && window.gsap) {
      const modal = document.querySelector('[data-tasks-modal]');
      if (modal) {
        window.gsap.fromTo(modal, 
          {
            scale: 0.95,
            opacity: 0,
            y: 20
          },
          {
            scale: 1,
            opacity: 1,
            y: 0,
            duration: 0.3,
            ease: "power2.out"
          }
        );
      }
    }
  }, [open]);

  useEffect(() => {
    // Socket sync for attachments in modal
    const s = io?.("http://localhost:5000");
    if (!s) return;

    function onAttachmentAdded(payload) {
      const taskId = String(payload.task_id);
      setTasks((prev) =>
        prev.map((t) =>
          String(t.id) === taskId ? { ...t, attachments: [payload, ...(t.attachments || [])] } : t
        )
      );
    }

    function onAttachmentDeleted(payload) {
      const taskId = String(payload.task_id);
      const attId = Number(payload.id);
      setTasks((prev) =>
        prev.map((t) =>
          String(t.id) === taskId ? { ...t, attachments: (t.attachments || []).filter((a) => a.id !== attId) } : t
        )
      );
    }

    function onTaskActivity(payload) {
      // payload should include task_id and activity record
      try {
        const taskId = String(payload.task_id || payload.taskId || payload.task_id);
        const activity = payload.activity || payload;
        setActivityMap((prev) => {
          const key = String(taskId);
          const prevEntry = prev?.[key] || { open: false, loading: false, items: [], page: 1, hasMore: false };
          return {
            ...(prev || {}),
            [key]: { ...prevEntry, items: [activity, ...(prevEntry.items || [])] },
          };
        });
      } catch (e) {
        console.error('task-activity handler error', e);
      }
    }

    s.on('task-attachment-added', onAttachmentAdded);
    s.on('task-attachment-deleted', onAttachmentDeleted);
    s.on('task-activity', onTaskActivity);

    return () => {
      s.off('task-attachment-added', onAttachmentAdded);
      s.off('task-attachment-deleted', onAttachmentDeleted);
      s.off('task-activity', onTaskActivity);
      s.disconnect();
    };
  }, []);

  async function handleCreate(e) {
    e.preventDefault();
    if (!title.trim()) return;
    try {
      const token = localStorage.getItem("token");
      // optimistic add
      const tempId = `temp-${Date.now()}`;
      const newTask = {
        id: tempId,
        project_id: project.id,
        title,
        description,
        status,
      };
      setTasks((prev) => [newTask, ...prev]);
      setTitle("");
      setDescription("");
      setStatus("pending");
      await createTask(
        {
          project_id: project.id,
          title: newTask.title,
          description: newTask.description,
          status: newTask.status,
          priority,
          labels: parseLabels(labelsInput),
        },
        token
      );
      // sync: fetch authoritative list
      const data = await getTasksByProject(project.id, token);
      setTasks(data);
    } catch (e) {
      // revert optimistic
      setTasks((prev) => prev.filter((t) => !String(t.id).startsWith("temp-")));
      setToast({ message: t('createTaskError'), type: "error" });
    }
  }

  function startEdit(task) {
    setEditTask(task);
    setTitle(task.title || "");
    setDescription(task.description || "");
    setStatus(task.status || "pending");
    setPriority(task.priority || "medium");
    setLabelsInput(
      Array.isArray(task.labels)
        ? task.labels.join(", ")
        : task.labels
        ? tryParseLabelsToString(t.labels)
        : ""
    );
  }

  function cancelEdit() {
    setEditTask(null);
    setTitle("");
    setDescription("");
    setStatus("pending");
    setPriority("medium");
    setLabelsInput("");
  }

  async function handleUpdate(e) {
    e.preventDefault();
    if (!editTask) return;
    try {
      const token = localStorage.getItem("token");
      // optimistic update
      setTasks((prev) =>
        prev.map((t) =>
          t.id === editTask.id ? { ...t, title, description, status } : t
        )
      );
      const payload = {
        title,
        description,
        status,
        priority,
        labels: parseLabels(labelsInput),
      };
      console.log('updateTask (handleUpdate):', { taskId: editTask.id, payload });
      await updateTask(editTask.id, payload, token);
      cancelEdit();
      // sync
      const data = await getTasksByProject(project.id, token);
      setTasks(data);
      // Прибрано сповіщення про оновлення завдання за запитом користувача
    } catch (e) {
      setToast({ message: t('updateTaskError'), type: "error" });
    }
  }

  async function handleDelete(id) {
    if (!confirm(t('confirmDeleteThisTask'))) return;
    try {
      const token = localStorage.getItem("token");
      // optimistic remove
      const prevTasks = tasks;
      setTasks((prev) => prev.filter((t) => t.id !== id));
      await deleteTask(id, token);
      // sync
      const data = await getTasksByProject(project.id, token);
      setTasks(data);
      setToast({ message: t('taskDeleted'), type: "success" });
    } catch (e) {
      // revert
      setTasks((prev) => prev);
      setToast({ message: t('deleteTaskError'), type: "error" });
    }
  }

  function parseLabels(str) {
    return str
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }

  function tryParseLabelsToString(val) {
    try {
      const arr = JSON.parse(val);
      return Array.isArray(arr) ? arr.join(", ") : "";
    } catch {
      return "";
    }
  }

  function handleOverlayClick(e) {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }

  async function handleUploadAttachment(task) {
    const token = localStorage.getItem("token");
    const input = document.createElement("input");
    input.type = "file";
    input.onchange = async (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      try {
        setUploadingFor(task.id);
        const { attachment } = await uploadTaskAttachment(task.id, file, token);
        setTasks((prev) =>
          prev.map((x) => (x.id === task.id ? { ...x, attachments: [attachment, ...(x.attachments || [])] } : x))
        );
        setToast({ message: t('attachmentUploaded') || 'Attachment uploaded', type: 'success' });
      } catch (err) {
        console.error('Upload attachment error', err);
        setToast({ message: t('attachmentUploadError') || 'Attachment upload error', type: 'error' });
      } finally {
        setUploadingFor(null);
      }
    };
    input.click();
  }

  async function toggleActivity(taskId) {
    const key = String(taskId);
    const prevEntry = activityMap[key];
    const willOpen = !(prevEntry?.open);
    setActivityMap((prev) => ({ ...(prev || {}), [key]: { ...(prev?.[key] || {}), open: willOpen } }));
    if (willOpen && (!prevEntry || (!prevEntry.items || prevEntry.items.length === 0))) {
      setActivityMap((prev) => ({ ...(prev || {}), [key]: { ...(prev?.[key] || {}), loading: true } }));
      try {
        const token = localStorage.getItem('token');
        const data = await getTaskActivity(taskId, 1, 20, token);
        setActivityMap((prev) => ({ ...(prev || {}), [key]: { ...(prev?.[key] || {}), loading: false, items: data.items || [], page: data.page || 1, hasMore: data.hasMore, open: true } }));
      } catch (err) {
        console.error('Load activity error', err);
        setActivityMap((prev) => ({ ...(prev || {}), [key]: { ...(prev?.[key] || {}), loading: false, items: [], page: 1, hasMore: false } }));
      }
    }
  }

  async function loadMoreActivity(taskId) {
    const key = String(taskId);
    const entry = activityMap[key] || { page: 1, items: [], hasMore: false };
    if (!entry.hasMore) return;
    const nextPage = (entry.page || 1) + 1;
    setActivityMap((prev) => ({ ...(prev || {}), [key]: { ...(prev?.[key] || {}), loading: true } }));
    try {
      const token = localStorage.getItem('token');
      const data = await getTaskActivity(taskId, nextPage, 20, token);
      setActivityMap((prev) => ({ ...(prev || {}), [key]: { ...(prev?.[key] || {}), loading: false, items: [...(prev?.[key]?.items || []), ...(data.items || [])], page: data.page || nextPage, hasMore: data.hasMore } }));
    } catch (err) {
      console.error('Load more activity error', err);
      setActivityMap((prev) => ({ ...(prev || {}), [key]: { ...(prev?.[key] || {}), loading: false } }));
    }
  }

  function formatActivityMessage(a) {
    try {
      const meta = a.metadata || {};
      switch (a.type) {
        case 'attachment_added':
          return meta.filename ? t('activity.attachment_added', { filename: meta.filename }) : t('activity.attachment_added_generic');
        case 'attachment_deleted':
          return meta.filename ? t('activity.attachment_deleted', { filename: meta.filename }) : t('activity.attachment_deleted_generic');
        case 'task_assigned':
          return t('activity.task_assigned', { user: meta.user || meta.assigned_to || '' });
        case 'task_deleted':
          return t('activity.task_deleted');
        case 'task_updated':
          if (meta.changes) {
            const parts = Object.keys(meta.changes).map((k) => `${k}: ${meta.changes[k].old} → ${meta.changes[k].new}`);
            return t('activity.task_updated_changes', { changes: parts.join('; ') });
          }
          return t('activity.task_updated');
        case 'task_created':
          return t('activity.task_created');
        default:
          return t(`activity.${a.type}`) || a.type || '';
      }
    } catch (e) {
      return t(`activity.${a.type}`) || a.type || '';
    }
  }

  if (!open || !project) return null;

  return (
    <div className={styles.overlay} onClick={handleOverlayClick}>
      <div className={styles.modal} data-tasks-modal>
        <div className={styles.header}>
          <h3 className={styles.headerTitle}>
            {t('tasksProjectTitle')} <span className={styles.projectName}>{project.name}</span>
          </h3>
          <button
            onClick={onClose}
            className={styles.closeButton}
            title={t('close')}
          >
            ✕
          </button>
        </div>
        <div className={styles.content}>
          {loading && <div className={styles.loading}>{t('loadingTasks')}</div>}
          {error && <div className={styles.error}>❌ {error}</div>}
          {!loading &&
            !error &&
            (tasks.filter((t) => {
              if (filters?.status && t.status !== filters.status) return false;
              if (
                filters?.priority &&
                (t.priority || "medium") !== filters.priority
              )
                return false;
              if (filters?.label) {
                const labels = Array.isArray(t.labels) ? t.labels : [];
                if (
                  !labels.some((l) =>
                    String(l)
                      .toLowerCase()
                      .includes(filters.label.toLowerCase())
                  )
                )
                  return false;
              }
              return true;
            }).length === 0 ? (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>📭</div>
                <div className={styles.emptyText}>{t('noTasksYet')}</div>
                <div className={styles.emptyHint}>{t('createFirstTaskHint')}</div>
              </div>
            ) : (
              <ul className={styles.tasksList}>
                {tasks
                  .filter((t) => {
                    if (filters?.status && t.status !== filters.status)
                      return false;
                    if (
                      filters?.priority &&
                      (t.priority || "medium") !== filters.priority
                    )
                      return false;
                    if (filters?.label) {
                      const labels = Array.isArray(t.labels) ? t.labels : [];
                      if (
                        !labels.some((l) =>
                          String(l)
                            .toLowerCase()
                            .includes(filters.label.toLowerCase())
                        )
                      )
                        return false;
                    }
                    return true;
                  })
                  .map((task) => (
                    <li key={task.id} className={styles.taskItem}>
                      <div className={styles.taskContent}>
                        <div className={styles.taskHeader}>
                          <span className={styles.taskTitle}>{task.title}</span>
                          {task.priority && (
                            <span className={`${styles.priorityBadge} ${styles[`priority-${task.priority}`]}`}>
                              {task.priority === 'high' ? '🔴' : task.priority === 'medium' ? '🟡' : '🟢'} {task.priority}
                            </span>
                          )}
                        </div>
                        {task.description && (
                          <div className={styles.taskDescription}>
                            {task.description}
                          </div>
                        )}
                        {task.labels && Array.isArray(task.labels) && task.labels.length > 0 && (
                          <div className={styles.taskLabels}>
                            {Array.isArray(task.attachments) && task.attachments.length > 0 && (
                              <div className={styles.taskAttachments}>
                                {task.attachments.slice(0, 3).map((att) => (
                                  <span key={att.id} className={styles.attachmentItem} title={att.original_name}>
                                    <a
                                      href={att.url}
                                      onClick={(e) => {
                                        e.preventDefault();
                                        const a = document.createElement('a');
                                        a.href = att.url;
                                        a.download = att.original_name || '';
                                        document.body.appendChild(a);
                                        a.click();
                                        document.body.removeChild(a);
                                      }}
                                    >
                                      📄 {att.original_name}
                                    </a>
                                    <button
                                      type="button"
                                      className={styles.attachmentDelete}
                                      draggable={false}
                                      onMouseDown={(e) => e.stopPropagation()}
                                      title={t('deleteAttachment') || 'Видалити файл'}
                                      aria-label={t('deleteAttachment') || 'Видалити файл'}
                                      onClick={async (e) => {
                                        e.stopPropagation();
                                        try {
                                          const token = localStorage.getItem('token');
                                          await deleteTaskAttachment(task.id, att.id, token);
                                          setTasks((prev) => prev.map((x) => x.id === task.id ? { ...x, attachments: (x.attachments || []).filter(a => a.id !== att.id) } : x));
                                          setToast({ message: t('attachmentDeleted') || 'Файл успішно видалено', type: 'success' });
                                        } catch (err) {
                                          console.error('Delete attachment error', err);
                                          setToast({ message: t('attachmentDeleteError') || 'Не вдалося видалити файл. Спробуйте ще раз.', type: 'error' });
                                        }
                                      }}
                                    >
                                      🗑
                                    </button>
                                  </span>
                                ))}
                                {task.attachments.length > 3 && (
                                  <span className={styles.moreAttachments}>+{task.attachments.length - 3}</span>
                                )}
                              </div>
                            )}
                            {task.labels.map((label, idx) => (
                              <span key={idx} className={styles.labelChip}>
                                🏷️ {label}
                              </span>
                            ))}
                            <div style={{display:'flex', gap:8, alignItems:'center'}}>
                              <button
                                type="button"
                                className={styles.attachmentButton}
                                onClick={() => handleUploadAttachment(task)}
                                disabled={uploadingFor === task.id}
                                title={t('addAttachment') || 'Add attachment'}
                              >
                                📎 {uploadingFor === task.id ? t('uploading') || 'Uploading...' : ''}
                              </button>
                              <button
                                type="button"
                                className={styles.activityButton}
                                onClick={() => toggleActivity(task.id)}
                                title={t('showActivity') || 'Показати активність'}
                              >
                                🕘 {t('activity') || 'Activity'}
                              </button>
                            </div>
                          </div>
                        )}
                        {/* Activity panel for this task */}
                        {activityMap[String(task.id)] && activityMap[String(task.id)].open && (
                          <div className={styles.activityList}>
                            {activityMap[String(task.id)].loading ? (
                              <div className={styles.activityLoading}>{t('loading') || 'Loading...'}</div>
                            ) : (
                              <>
                                {(activityMap[String(task.id)].items || []).map((a) => (
                                  <div key={a.id} className={styles.activityItem}>
                                    <div className={styles.activityHeader}>
                                      <strong>{a.username || `user:${a.user_id}`}</strong>
                                      <span className={styles.activityTime}>{new Date(a.created_at).toLocaleString()}</span>
                                    </div>
                                    <div className={styles.activityBody}>
                                      <div className={styles.activityMessage}>{formatActivityMessage(a)}</div>
                                    </div>
                                  </div>
                                ))}
                                {activityMap[String(task.id)].hasMore && (
                                  <div className={styles.activityLoadMoreWrap}>
                                    <button className={styles.loadMoreButton} onClick={() => loadMoreActivity(task.id)} disabled={activityMap[String(task.id)].loading}>
                                      {activityMap[String(task.id)].loading ? t('loading') : t('loadMore') || 'Load more'}
                                    </button>
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        )}
                      </div>
                      <div className={styles.taskActions}>
                        <span className={`${styles.statusBadge} ${styles[`status-${task.status}`]}`}>
                          {task.status === 'done' ? '✅' : task.status === 'in_progress' ? '🔄' : '⏳'} {task.status}
                        </span>
                        <button
                          onClick={() => startEdit(task)}
                          className={styles.editButton}
                          title={t('editTaskBtnTitle')}
                        >
                          ✏️ {t('edit')}
                        </button>
                        <button
                          onClick={() => handleDelete(task.id)}
                          className={styles.deleteButton}
                          title={t('deleteTaskBtnTitle')}
                        >
                          {t('delete')}
                        </button>
                      </div>
                    </li>
                  ))}
              </ul>
            ))}
          <hr className={styles.divider} />
          <div className={styles.formSection}>
            <h4 className={styles.formTitle}>
              {editTask ? t('editTaskTitle') : t('createTaskTitle')}
            </h4>
            <form
              onSubmit={editTask ? handleUpdate : handleCreate}
              className={styles.form}
            >
              <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>
                  <span className={styles.labelIcon}>📌</span>
                  {t('taskName')}
                  <span className={styles.required}>*</span>
                </label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={t('taskNamePlaceholder')}
                  className={styles.input}
                  required
                  maxLength={150}
                />
              </div>
              <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>
                  <span className={styles.labelIcon}>📝</span>
                  {t('taskDescriptionLabel')}
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={t('taskDescPlaceholderModal')}
                  className={styles.textarea}
                  rows={3}
                  maxLength={300}
                />
              </div>
              <div className={styles.selectGrid}>
                <div className={styles.inputGroup}>
                  <label className={styles.inputLabel}>
                    <span className={styles.labelIcon}>📊</span>
                    {t('statusLabel')}
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className={styles.select}
                  >
                    <option value="pending">⏳ Pending</option>
                    <option value="in_progress">🔄 In Progress</option>
                    <option value="done">✅ Done</option>
                  </select>
                </div>
                <div className={styles.inputGroup}>
                  <label className={styles.inputLabel}>
                    <span className={styles.labelIcon}>🎯</span>
                    {t('priorityLabel')}
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className={styles.select}
                  >
                    <option value="low">🟢 Low</option>
                    <option value="medium">🟡 Medium</option>
                    <option value="high">🔴 High</option>
                  </select>
                </div>
              </div>
              <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>
                  <span className={styles.labelIcon}>🏷️</span>
                  {t('labelsLabel')}
                </label>
                <input
                  value={labelsInput}
                  onChange={(e) => setLabelsInput(e.target.value)}
                  placeholder={t('labelsPlaceholder')}
                  className={styles.input}
                />
              </div>
              <div className={styles.formActions}>
                {editTask && (
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className={styles.cancelEditButton}
                  >
                    {t('cancel')}
                  </button>
                )}
                <button
                  type="submit"
                  className={styles.submitButton}
                >
                  {editTask ? t('saveChanges') : t('createTaskBtn')}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
