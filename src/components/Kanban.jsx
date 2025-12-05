import React, { useEffect, useState, useRef } from "react";
import { getTasksByProject, updateTask, uploadTaskAttachment, getTaskAttachments, deleteTaskAttachment as apiDeleteAttachment } from "../api";
import io from "socket.io-client";
import Toast from "./Toast";
import styles from "./Kanban.module.css";
import { useI18n } from "../context/I18nContext.jsx";

const columnsFor = (t) => ([
  { key: "pending", title: t('kanbanPending') },
  { key: "in_progress", title: t('kanbanInProgress') },
  { key: "done", title: t('kanbanDone') },
]);

export default function Kanban({ project, filters }) {
  const [tasks, setTasks] = useState([]);
  const [socket, setSocket] = useState(null);
  const [toast, setToast] = useState(null);
  const [editingLabels, setEditingLabels] = useState(null);
  const [newLabel, setNewLabel] = useState("");
  const [loadingAttachments, setLoadingAttachments] = useState({});
  const [expandedAttachments, setExpandedAttachments] = useState({});
  const debounceTimer = useRef(null);
  const kanbanRef = useRef(null);
  const animatedRef = useRef(false);
  const { t } = useI18n();

  useEffect(() => {
    async function load() {
      if (!project) return;
      const token = localStorage.getItem("token");
      const data = await getTasksByProject(project.id, token);
      setTasks(data);
    }
    load();
  }, [project]);

  useEffect(() => {
    // GSAP анімація для Kanban колонок та карток - лише один раз
    if (animatedRef.current || !tasks.length || !window.gsap || !window.ScrollTrigger) return;
    
    const columns = document.querySelectorAll('[data-kanban-column]');
    if (columns.length > 0) {
      window.gsap.fromTo(columns, 
        {
          y: 30,
          opacity: 0
        },
        {
          y: 0,
          opacity: 1,
          duration: 0.6,
          stagger: 0.15,
          ease: "power2.out"
        }
      );
    }
    
    setTimeout(() => {
      const cards = document.querySelectorAll('[data-kanban-card]');
      if (cards.length > 0) {
        window.gsap.fromTo(cards,
          {
            scale: 0.9,
            opacity: 0
          },
          {
            scale: 1,
            opacity: 1,
            duration: 0.4,
            stagger: 0.05,
            ease: "back.out(1.2)"
          }
        );
        animatedRef.current = true;
      }
    }, 300);
  }, [tasks]);

  useEffect(() => {
    const s = io("http://localhost:5000");
    setSocket(s);
    function onCreated(task) {
      if (task.project_id !== project?.id) return;
      setTasks((prev) => [task, ...prev]);
    }
    function onUpdated(task) {
      setTasks((prev) =>
        prev.map((x) => (String(x.id) === String(task.id) ? { ...x, ...task } : x))
      );
    }
    function onDeleted({ id }) {
      setTasks((prev) => prev.filter((x) => String(x.id) !== String(id)));
    }
    function onAttachmentAdded(payload) {
      // payload: { id, task_id, filename, original_name, mime_type, size, url, uploaded_by }
      const taskId = String(payload.task_id);
      setTasks((prev) =>
        prev.map((t) => {
          if (String(t.id) !== taskId) return t;
          const exists = (t.attachments || []).some((a) => Number(a.id) === Number(payload.id));
          if (exists) return t; // avoid duplicate when optimistic + socket both add
          return { ...t, attachments: [payload, ...(t.attachments || [])] };
        })
      );
    }

    function onAttachmentDeleted(payload) {
      // payload: { id, task_id }
      const taskId = String(payload.task_id);
      const attId = Number(payload.id);
      setTasks((prev) =>
        prev.map((t) =>
          String(t.id) === taskId
            ? { ...t, attachments: (t.attachments || []).filter((a) => a.id !== attId) }
            : t
        )
      );
    }
    s.on("task-created", onCreated);
    s.on("task-updated", onUpdated);
    s.on("task-deleted", onDeleted);
    s.on('task-attachment-added', onAttachmentAdded);
    s.on('task-attachment-deleted', onAttachmentDeleted);
    return () => {
      s.off("task-created", onCreated);
      s.off("task-updated", onUpdated);
      s.off("task-deleted", onDeleted);
      s.off('task-attachment-added', onAttachmentAdded);
      s.off('task-attachment-deleted', onAttachmentDeleted);
      s.disconnect();
    };
  }, [project?.id]);

  function onDragStart(e, taskId) {
    e.dataTransfer.setData("text/plain", String(taskId));
  }

  async function onDrop(e, status) {
    const taskId = e.dataTransfer.getData("text/plain");
    if (!taskId) return;
    // optimistic move
    setTasks((prev) =>
      prev.map((t) => (t.id == taskId ? { ...t, status } : t))
    );
    try {
      const token = localStorage.getItem("token");
      console.log('updateTask (drop):', { taskId, status });
      await updateTask(taskId, { status }, token);
    } catch (err) {
      // TODO: revert, or reload
    }
  }

  function onDragOver(e) {
    e.preventDefault();
  }

  const visible = (task) => {
    if (filters?.status && task.status !== filters.status) return false;
    if (filters?.priority && (task.priority || "medium") !== filters.priority)
      return false;
    if (filters?.label) {
      const labels = Array.isArray(task.labels) ? task.labels : [];
      if (
        !labels.some((l) =>
          String(l).toLowerCase().includes(filters.label.toLowerCase())
        )
      )
        return false;
    }
    return true;
  };

  async function handleUploadAttachment(task) {
    const token = localStorage.getItem("token");
    const input = document.createElement("input");
    input.type = "file";
    input.onchange = async (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      try {
        setLoadingAttachments((prev) => ({ ...prev, [task.id]: true }));
        const { attachment } = await uploadTaskAttachment(task.id, file, token);
        setTasks((prev) =>
          prev.map((x) => {
            if (x.id !== task.id) return x;
            const exists = (x.attachments || []).some((a) => Number(a.id) === Number(attachment.id));
            if (exists) return x;
            return { ...x, attachments: [attachment, ...(x.attachments || [])] };
          })
        );
        setToast({ message: t('attachmentUploaded') || 'Attachment uploaded', type: 'success' });
      } catch (err) {
        console.error('Upload attachment error', err);
        setToast({ message: t('attachmentUploadError') || 'Attachment upload error', type: 'error' });
      } finally {
        setLoadingAttachments((prev) => ({ ...prev, [task.id]: false }));
      }
    };
    input.click();
  }

  function triggerDownload(url, filename) {
    try {
      const a = document.createElement('a');
      a.href = url;
      a.download = filename || '';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (e) {
      console.error('Download attachment error', e);
    }
  }

  return (
    <div className={styles.container} ref={kanbanRef}>
      {columnsFor(t).map((col) => (
        <div
          key={col.key}
          onDragOver={onDragOver}
          onDrop={(e) => onDrop(e, col.key)}
          className={styles.column}
          data-kanban-column
        >
          <div className={styles.columnTitle}>
            {col.title}
          </div>
          {tasks
            .filter((task) => task.status === col.key)
            .filter(visible)
            .map((task) => (
              <div
                key={task.id}
                draggable
                onDragStart={(e) => onDragStart(e, task.id)}
                className={styles.taskCard}
                data-kanban-card
              >
                <div className={styles.taskTitle}>
                  {task.title}
                </div>
                {task.description && (
                  <div className={styles.taskDescription}>
                    {task.description}
                  </div>
                )}
                {/* Attachments section */}
                <div className={styles.attachmentsRow}>
                  <button
                    type="button"
                    className={styles.attachmentButton}
                    onClick={() => handleUploadAttachment(task)}
                    draggable={false}
                    onMouseDown={(e) => e.stopPropagation()}
                    disabled={!!loadingAttachments[task.id]}
                  >
                    📎 {loadingAttachments[task.id] ? (t('uploading') || 'Uploading...') : (t('addAttachment') || 'Додати файл')}
                  </button>
                  {Array.isArray(task.attachments) && task.attachments.length > 0 && (
                    <div className={styles.attachmentsList}>
                      {((expandedAttachments[task.id]) ? task.attachments : task.attachments.slice(0, 2)).map((att) => (
                        <span key={att.id} className={styles.attachmentItem} title={att.original_name}>
                          <a
                            href={att.url}
                            onClick={(e) => { e.preventDefault(); triggerDownload(att.url, att.original_name); }}
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
                                await apiDeleteAttachment(task.id, att.id, token);
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
                      {task.attachments.length > 2 && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setExpandedAttachments((prev) => ({ ...prev, [task.id]: !prev[task.id] }));
                          }}
                          className={styles.moreAttachments}
                          aria-expanded={!!expandedAttachments[task.id]}
                          title={expandedAttachments[task.id] ? (t('showLess') || 'Show less') : `${t('showAllFiles') || 'Show all'} (${task.attachments.length})`}
                        >
                          {expandedAttachments[task.id] ? (t('showLess') || '−') : `+${task.attachments.length - 2}`}
                        </button>
                      )}
                    </div>
                  )}
                </div>
                <div className={styles.priorityRow}>
                  <span className={styles.priorityLabel}>
                    {t('priorityText')}
                  </span>
                  <select
                    value={task.priority || "medium"}
                    onChange={async (e) => {
                      const newPriority = e.target.value;
                      // optimistic
                      setTasks((prev) =>
                        prev.map((x) =>
                          x.id === task.id ? { ...x, priority: newPriority } : x
                        )
                      );
                      try {
                        const token = localStorage.getItem("token");
                        console.log('updateTask (priority):', { taskId: task.id, newPriority });
                        await updateTask(
                          task.id,
                          { priority: newPriority },
                          token
                        );
                        setToast({
                          message: t('priorityUpdated'),
                          type: "success",
                        });
                      } catch (err) {
                        // revert on fail
                        setTasks((prev) =>
                          prev.map((x) =>
                            x.id === task.id
                              ? { ...x, priority: task.priority || "medium" }
                              : x
                          )
                        );
                        setToast({
                          message: t('priorityUpdateError'),
                          type: "error",
                        });
                      }
                    }}
                    className={styles.prioritySelect}
                  >
                    <option value="low">{t('priorityLow')}</option>
                    <option value="medium">{t('priorityMedium')}</option>
                    <option value="high">{t('priorityHigh')}</option>
                  </select>
                </div>
                <div className={styles.labelsSection}>
                  {editingLabels === task.id ? (
                    <div className={styles.labelsEditMode}>
                      {(Array.isArray(task.labels) ? task.labels : []).map(
                        (l, idx) => (
                          <span
                            key={idx}
                            className={styles.labelChip}
                          >
                            🏷️ {l}
                            <button
                              onClick={async () => {
                                const newLabels = (
                                  Array.isArray(task.labels) ? task.labels : []
                                ).filter((_, i) => i !== idx);
                                setTasks((prev) =>
                                  prev.map((x) =>
                                    x.id === task.id
                                      ? { ...x, labels: newLabels }
                                      : x
                                  )
                                );
                                try {
                                  const token = localStorage.getItem("token");
                                  console.log('updateTask (labels remove):', { taskId: task.id, newLabels });
                                  await updateTask(
                                    task.id,
                                    { labels: newLabels },
                                    token
                                  );
                                  setToast({
                                    message: t('labelRemoved'),
                                    type: "success",
                                  });
                                } catch (err) {
                                  setTasks((prev) =>
                                    prev.map((x) =>
                                      x.id === task.id
                                        ? { ...x, labels: task.labels }
                                        : x
                                    )
                                  );
                                  setToast({
                                    message: t('labelRemoveError'),
                                    type: "error",
                                  });
                                }
                              }}
                              className={styles.labelRemove}
                              draggable={false}
                              onMouseDown={(e) => e.stopPropagation()}
                            >
                              ×
                            </button>
                          </span>
                        )
                      )}
                      <input
                        value={newLabel}
                        onChange={(e) => setNewLabel(e.target.value)}
                        placeholder={t('labelInputPlaceholder')}
                        className={styles.labelInput}
                      />
                      <button
                        onClick={async () => {
                          if (!newLabel.trim()) {
                            setEditingLabels(null);
                            setNewLabel("");
                            return;
                          }

                          const current = Array.isArray(task.labels) ? task.labels : [];
                          const newLabels = [...current, newLabel.trim()];

                          setTasks((prev) =>
                            prev.map((x) =>
                              x.id === task.id ? { ...x, labels: newLabels } : x
                            )
                          );
                          setNewLabel("");

                          try {
                            const token = localStorage.getItem("token");
                            await updateTask(task.id, { labels: newLabels }, token);
                            setToast({ message: t('labelAdded'), type: 'success' });
                          } catch (err) {
                            setTasks((prev) =>
                              prev.map((x) =>
                                x.id === task.id ? { ...x, labels: current } : x
                              )
                            );
                            setToast({ message: t('labelAddError'), type: 'error' });
                          }

                          setEditingLabels(null);
                        }}
                        className={styles.labelConfirm}
                        draggable={false}
                        onMouseDown={(e) => e.stopPropagation()}
                      >
                        ✓
                      </button>
                    </div>
                  ) : (
                    <div className={styles.labelsDisplayMode}>
                      {(Array.isArray(task.labels) ? task.labels : []).map(
                        (l, idx) => (
                          <span
                            key={idx}
                            className={styles.labelChip}
                          >
                            🏷️ {l}
                          </span>
                        )
                      )}
                      <button
                        onClick={(e) => {
                          console.log('labelEdit clicked', { taskId: task.id });
                          setEditingLabels(task.id);
                        }}
                        className={styles.labelEdit}
                        draggable={false}
                        onMouseDown={(e) => e.stopPropagation()}
                      >
                        {Array.isArray(task.labels) && task.labels.length
                          ? t('labelEdit')
                          : t('labelInputPlaceholder') || '+ мітка'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
        </div>
      ))}
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
