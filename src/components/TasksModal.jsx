import React, { useEffect, useState } from "react";
import { getTasksByProject, createTask, updateTask, deleteTask } from "../api";
import Toast from "./Toast";
import styles from "./TasksModal.module.css";

export default function TasksModal({ open, onClose, project, filters }) {
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
        setError("Не вдалося завантажити завдання");
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
      setToast({ message: "Не вдалося створити завдання", type: "error" });
    }
  }

  function startEdit(t) {
    setEditTask(t);
    setTitle(t.title || "");
    setDescription(t.description || "");
    setStatus(t.status || "pending");
    setPriority(t.priority || "medium");
    setLabelsInput(
      Array.isArray(t.labels)
        ? t.labels.join(", ")
        : t.labels
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
      await updateTask(
        editTask.id,
        {
          title,
          description,
          status,
          priority,
          labels: parseLabels(labelsInput),
        },
        token
      );
      cancelEdit();
      // sync
      const data = await getTasksByProject(project.id, token);
      setTasks(data);
      // Прибрано сповіщення про оновлення завдання за запитом користувача
    } catch (e) {
      setToast({ message: "Не вдалося оновити завдання", type: "error" });
    }
  }

  async function handleDelete(id) {
    if (!confirm("Видалити це завдання?")) return;
    try {
      const token = localStorage.getItem("token");
      // optimistic remove
      const prevTasks = tasks;
      setTasks((prev) => prev.filter((t) => t.id !== id));
      await deleteTask(id, token);
      // sync
      const data = await getTasksByProject(project.id, token);
      setTasks(data);
      setToast({ message: "Завдання видалено", type: "success" });
    } catch (e) {
      // revert
      setTasks((prev) => prev);
      setToast({ message: "Не вдалося видалити завдання", type: "error" });
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

  if (!open || !project) return null;

  return (
    <div className={styles.overlay} onClick={handleOverlayClick}>
      <div className={styles.modal} data-tasks-modal>
        <div className={styles.header}>
          <h3 className={styles.headerTitle}>
            📋 Завдання проєкту: <span className={styles.projectName}>{project.name}</span>
          </h3>
          <button
            onClick={onClose}
            className={styles.closeButton}
            title="Закрити"
          >
            ✕
          </button>
        </div>
        <div className={styles.content}>
          {loading && <div className={styles.loading}>⏳ Завантаження завдань...</div>}
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
                <div className={styles.emptyText}>Завдань поки немає</div>
                <div className={styles.emptyHint}>Створіть перше завдання нижче</div>
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
                  .map((t) => (
                    <li key={t.id} className={styles.taskItem}>
                      <div className={styles.taskContent}>
                        <div className={styles.taskHeader}>
                          <span className={styles.taskTitle}>{t.title}</span>
                          {t.priority && (
                            <span className={`${styles.priorityBadge} ${styles[`priority-${t.priority}`]}`}>
                              {t.priority === 'high' ? '🔴' : t.priority === 'medium' ? '🟡' : '🟢'} {t.priority}
                            </span>
                          )}
                        </div>
                        {t.description && (
                          <div className={styles.taskDescription}>
                            {t.description}
                          </div>
                        )}
                        {t.labels && Array.isArray(t.labels) && t.labels.length > 0 && (
                          <div className={styles.taskLabels}>
                            {t.labels.map((label, idx) => (
                              <span key={idx} className={styles.labelChip}>
                                🏷️ {label}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className={styles.taskActions}>
                        <span className={`${styles.statusBadge} ${styles[`status-${t.status}`]}`}>
                          {t.status === 'done' ? '✅' : t.status === 'in_progress' ? '🔄' : '⏳'} {t.status}
                        </span>
                        <button
                          onClick={() => startEdit(t)}
                          className={styles.editButton}
                          title="Редагувати завдання"
                        >
                          ✏️ Редагувати
                        </button>
                        <button
                          onClick={() => handleDelete(t.id)}
                          className={styles.deleteButton}
                          title="Видалити завдання"
                        >
                          🗑️ Видалити
                        </button>
                      </div>
                    </li>
                  ))}
              </ul>
            ))}
          <hr className={styles.divider} />
          <div className={styles.formSection}>
            <h4 className={styles.formTitle}>
              {editTask ? "✏️ Редагувати завдання" : "➕ Створити нове завдання"}
            </h4>
            <form
              onSubmit={editTask ? handleUpdate : handleCreate}
              className={styles.form}
            >
              <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>
                  <span className={styles.labelIcon}>📌</span>
                  Назва завдання
                  <span className={styles.required}>*</span>
                </label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Введіть назву завдання..."
                  className={styles.input}
                  required
                  maxLength={150}
                />
              </div>
              <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>
                  <span className={styles.labelIcon}>📝</span>
                  Опис
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Додайте опис завдання..."
                  className={styles.textarea}
                  rows={3}
                  maxLength={300}
                />
              </div>
              <div className={styles.selectGrid}>
                <div className={styles.inputGroup}>
                  <label className={styles.inputLabel}>
                    <span className={styles.labelIcon}>📊</span>
                    Статус
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
                    Пріоритет
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
                  Мітки
                </label>
                <input
                  value={labelsInput}
                  onChange={(e) => setLabelsInput(e.target.value)}
                  placeholder="Введіть мітки через кому (наприклад: urgent, bug, feature)..."
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
                    Скасувати
                  </button>
                )}
                <button
                  type="submit"
                  className={styles.submitButton}
                >
                  {editTask ? "💾 Зберегти зміни" : "🚀 Створити завдання"}
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
