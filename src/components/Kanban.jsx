import React, { useEffect, useState, useRef } from "react";
import { getTasksByProject, updateTask } from "../api";
import io from "socket.io-client";
import Toast from "./Toast";
import styles from "./Kanban.module.css";

const columns = [
  { key: "pending", title: "Pending" },
  { key: "in_progress", title: "In Progress" },
  { key: "done", title: "Done" },
];

export default function Kanban({ project, filters }) {
  const [tasks, setTasks] = useState([]);
  const [socket, setSocket] = useState(null);
  const [toast, setToast] = useState(null);
  const [editingLabels, setEditingLabels] = useState(null);
  const [newLabel, setNewLabel] = useState("");
  const debounceTimer = useRef(null);
  const kanbanRef = useRef(null);
  const animatedRef = useRef(false);

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
    function onCreated(t) {
      if (t.project_id !== project?.id) return;
      setTasks((prev) => [t, ...prev]);
    }
    function onUpdated(t) {
      setTasks((prev) =>
        prev.map((x) => (String(x.id) === String(t.id) ? { ...x, ...t } : x))
      );
    }
    function onDeleted({ id }) {
      setTasks((prev) => prev.filter((x) => String(x.id) !== String(id)));
    }
    s.on("task-created", onCreated);
    s.on("task-updated", onUpdated);
    s.on("task-deleted", onDeleted);
    return () => {
      s.off("task-created", onCreated);
      s.off("task-updated", onUpdated);
      s.off("task-deleted", onDeleted);
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
      await updateTask(taskId, { status }, token);
    } catch (err) {
      // TODO: revert, or reload
    }
  }

  function onDragOver(e) {
    e.preventDefault();
  }

  const visible = (t) => {
    if (filters?.status && t.status !== filters.status) return false;
    if (filters?.priority && (t.priority || "medium") !== filters.priority)
      return false;
    if (filters?.label) {
      const labels = Array.isArray(t.labels) ? t.labels : [];
      if (
        !labels.some((l) =>
          String(l).toLowerCase().includes(filters.label.toLowerCase())
        )
      )
        return false;
    }
    return true;
  };

  return (
    <div className={styles.container} ref={kanbanRef}>
      {columns.map((col) => (
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
            .filter((t) => t.status === col.key)
            .filter(visible)
            .map((t) => (
              <div
                key={t.id}
                draggable
                onDragStart={(e) => onDragStart(e, t.id)}
                className={styles.taskCard}
                data-kanban-card
              >
                <div className={styles.taskTitle}>
                  {t.title}
                </div>
                {t.description && (
                  <div className={styles.taskDescription}>
                    {t.description}
                  </div>
                )}
                <div className={styles.priorityRow}>
                  <span className={styles.priorityLabel}>
                    🎯 Пріоритет:
                  </span>
                  <select
                    value={t.priority || "medium"}
                    onChange={async (e) => {
                      const newPriority = e.target.value;
                      // optimistic
                      setTasks((prev) =>
                        prev.map((x) =>
                          x.id === t.id ? { ...x, priority: newPriority } : x
                        )
                      );
                      try {
                        const token = localStorage.getItem("token");
                        await updateTask(
                          t.id,
                          { priority: newPriority },
                          token
                        );
                        setToast({
                          message: "Пріоритет оновлено",
                          type: "success",
                        });
                      } catch (err) {
                        // revert on fail
                        setTasks((prev) =>
                          prev.map((x) =>
                            x.id === t.id
                              ? { ...x, priority: t.priority || "medium" }
                              : x
                          )
                        );
                        setToast({
                          message: "Помилка оновлення пріоритету",
                          type: "error",
                        });
                      }
                    }}
                    className={styles.prioritySelect}
                  >
                    <option value="low">🟢 Low</option>
                    <option value="medium">🟡 Medium</option>
                    <option value="high">🔴 High</option>
                  </select>
                </div>
                <div className={styles.labelsSection}>
                  {editingLabels === t.id ? (
                    <div className={styles.labelsEditMode}>
                      {(Array.isArray(t.labels) ? t.labels : []).map(
                        (l, idx) => (
                          <span
                            key={idx}
                            className={styles.labelChip}
                          >
                            🏷️ {l}
                            <button
                              onClick={async () => {
                                const newLabels = (
                                  Array.isArray(t.labels) ? t.labels : []
                                ).filter((_, i) => i !== idx);
                                setTasks((prev) =>
                                  prev.map((x) =>
                                    x.id === t.id
                                      ? { ...x, labels: newLabels }
                                      : x
                                  )
                                );
                                try {
                                  const token = localStorage.getItem("token");
                                  await updateTask(
                                    t.id,
                                    { labels: newLabels },
                                    token
                                  );
                                  setToast({
                                    message: "Мітку видалено",
                                    type: "success",
                                  });
                                } catch (err) {
                                  setTasks((prev) =>
                                    prev.map((x) =>
                                      x.id === t.id
                                        ? { ...x, labels: t.labels }
                                        : x
                                    )
                                  );
                                  setToast({
                                    message: "Помилка видалення мітки",
                                    type: "error",
                                  });
                                }
                              }}
                              className={styles.labelRemove}
                            >
                              ×
                            </button>
                          </span>
                        )
                      )}
                      <input
                        value={newLabel}
                        onChange={(e) => setNewLabel(e.target.value)}
                        onKeyDown={async (e) => {
                          if (e.key === "Enter" && newLabel.trim()) {
                            const newLabels = [
                              ...(Array.isArray(t.labels) ? t.labels : []),
                              newLabel.trim(),
                            ];
                            setTasks((prev) =>
                              prev.map((x) =>
                                x.id === t.id ? { ...x, labels: newLabels } : x
                              )
                            );
                            setNewLabel("");
                            if (debounceTimer.current)
                              clearTimeout(debounceTimer.current);
                            debounceTimer.current = setTimeout(async () => {
                              try {
                                const token = localStorage.getItem("token");
                                await updateTask(
                                  t.id,
                                  { labels: newLabels },
                                  token
                                );
                                setToast({
                                  message: "Мітку додано",
                                  type: "success",
                                });
                              } catch (err) {
                                setTasks((prev) =>
                                  prev.map((x) =>
                                    x.id === t.id
                                      ? { ...x, labels: t.labels }
                                      : x
                                  )
                                );
                                setToast({
                                  message: "Помилка додавання мітки",
                                  type: "error",
                                });
                              }
                            }, 300);
                          }
                        }}
                        placeholder="+ мітка"
                        className={styles.labelInput}
                      />
                      <button
                        onClick={() => {
                          setEditingLabels(null);
                          setNewLabel("");
                        }}
                        className={styles.labelConfirm}
                      >
                        ✓
                      </button>
                    </div>
                  ) : (
                    <div className={styles.labelsDisplayMode}>
                      {(Array.isArray(t.labels) ? t.labels : []).map(
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
                        onClick={() => setEditingLabels(t.id)}
                        className={styles.labelEdit}
                      >
                        ✏️ редагувати
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
