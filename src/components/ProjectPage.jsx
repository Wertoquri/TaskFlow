export function ProjectSocketJoin({ projectId }) {
  const { socket } = useAuth();
  useEffect(() => {
    if (!socket || !projectId) return;
    socket.emit("join-project", projectId);
    return () => {
      socket.emit("leave-project", projectId);
    };
  }, [socket, projectId]);
  return null;
}
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import MembersPanel from "./MembersPanel.jsx";
import InviteUserPanel from "./InviteUserPanel.jsx";
import ProjectChat from "./ProjectChat.jsx";
import WorkspaceShell from "./WorkspaceShell.jsx";
import { ProjectInsights } from "./WorkspaceInsights.jsx";
import { useI18n } from "../context/I18nContext.jsx";
import {
  API_URL,
  getProjects,
  getProjectMembers,
  getProjectActivity,
  clearProjectActivity,
} from "../api";
import styles from "./ProjectPage.module.css";
import {
  Activity,
  ArrowLeft,
  ListTodo,
  Pencil,
  Plus,
  RotateCw,
  Trash2,
} from "lucide-react";

const ProjectPage = () => {
  const { id } = useParams(); // project id
  const navigate = useNavigate();
  const { token, socket } = useAuth();
  const { t } = useI18n();

  const [tasks, setTasks] = useState([]);
  const [project, setProject] = useState(null);
  const [workspaceProjects, setWorkspaceProjects] = useState([]);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newDueDate, setNewDueDate] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [members, setMembers] = useState([]);
  const [projectActivity, setProjectActivity] = useState([]);
  const [activityPage, setActivityPage] = useState(1);
  const [activityHasMore, setActivityHasMore] = useState(false);
  const [activityLoading, setActivityLoading] = useState(false);

  useEffect(() => {
    if (!token) return;
    fetchTasks();
    loadProjectActivity(1);
    getProjects(token)
      .then((rows) => {
        const list = Array.isArray(rows) ? rows : [];
        setWorkspaceProjects(list);
        setProject(list.find((item) => String(item.id) === String(id)) || null);
      })
      .catch(() => {
        setWorkspaceProjects([]);
        setProject(null);
      });
    // Load project members for assignee dropdown
    (async () => {
      try {
        const rows = await getProjectMembers(Number(id), token);
        setMembers(rows || []);
      } catch (e) {
        // silently ignore, tasks view still works
      }
    })();
    // eslint-disable-next-line
  }, [token, id]);

  useEffect(() => {
    if (!socket) return;
    function onTaskActivity(activity) {
      try {
        const belongs = Number(activity.project_id) === Number(id);
        if (!belongs) return;
        setProjectActivity((prev) => [activity, ...prev]);
      } catch (e) {
        console.error("ProjectPage task-activity handler error", e);
      }
    }
    socket.on("task-activity", onTaskActivity);
    return () => socket.off("task-activity", onTaskActivity);
  }, [socket, id]);

  const fetchTasks = async () => {
    try {
      const res = await axios.get(`${API_URL}/tasks/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTasks(res.data);
    } catch (err) {
      console.error("Error loading tasks", err);
      // якщо 401/403 — перенаправити на логін
      if (err.response?.status === 401) navigate("/login");
    }
  };

  const loadProjectActivity = async (page = 1) => {
    if (!token) return;
    try {
      setActivityLoading(true);
      const data = await getProjectActivity(Number(id), page, 20, token);
      if (page === 1) setProjectActivity(data.items || []);
      else setProjectActivity((p) => [...p, ...(data.items || [])]);
      setActivityPage(data.page || page);
      setActivityHasMore(Boolean(data.hasMore));
    } catch (err) {
      console.error("Load project activity error", err);
    } finally {
      setActivityLoading(false);
    }
  };

  const addTask = async () => {
    if (!newTitle.trim()) {
      return alert(t("promptTitleRequired") || "Введіть назву");
    }

    const payload = {
      project_id: Number(id),
      title: newTitle,
      description: newDescription || "",
      assigned_to: assignedTo || null,
      due_date: newDueDate || null,
    };

    try {
      await axios.post(`${API_URL}/tasks`, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      setNewTitle("");
      setNewDescription("");
      setNewDueDate("");
      setAssignedTo("");
      fetchTasks();
    } catch (err) {
      console.error("Add task error", err);
      alert(err.response?.data?.message || t("errorGeneric") || "Помилка");
    }
  };

  const deleteTask = async (taskId) => {
    if (!confirm(t("confirmDeleteTask") || "Видалити завдання?")) return;
    try {
      await axios.delete(`${API_URL}/tasks/${taskId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTasks((s) => s.filter((t) => t.id !== taskId));
    } catch (err) {
      console.error("Delete task error", err);
      alert(t("deleteTaskError"));
    }
  };

  const updateTask = async (taskId) => {
    const newName = prompt(t("promptNewTaskTitle") || "Нова назва завдання:");
    if (!newName) return;
    try {
      await axios.put(
        `${API_URL}/tasks/${taskId}`,
        { title: newName },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );
      fetchTasks();
    } catch (err) {
      console.error("Update task error", err);
      const msg = err.response?.data?.message || err.message;
      alert((t("updateTaskFailed") || "Не вдалося оновити завдання: ") + msg);
    }
  };

  return (
    <WorkspaceShell
      sectionLabel={project?.name || `${t("projectLabel")} #${id}`}
      projects={workspaceProjects}
      activeProjectId={id}
    >
      <main className={styles.page}>
        <ProjectSocketJoin projectId={Number(id)} />

        <div className={styles.shell}>
          <div className={styles.hero}>
            <div className={styles.heroCopy}>
              <h1 className={styles.heroTitle}>
                {project?.name || `${t("projectLabel")} #${id}`}
              </h1>
              <p className={styles.heroSubtitle}>
                {project?.description ||
                  t("projectManageMembersChat") ||
                  "Керування учасниками та спілкування"}
              </p>
            </div>
            <button
              onClick={() => navigate("/dashboard")}
              className={styles.backButton}
            >
              <ArrowLeft aria-hidden="true" size={16} />
              {t("backToDashboard") || "Назад до Dashboard"}
            </button>
          </div>

          <ProjectInsights tasks={tasks} members={members} projectId={id} />

          <div id="project-team" className={styles.topGrid}>
            <div>
              <InviteUserPanel projectId={Number(id)} token={token} />
            </div>
            <div>
              <MembersPanel projectId={Number(id)} />
            </div>
          </div>

          <div id="project-chat" className={styles.chatWrap}>
            <ProjectChat projectId={Number(id)} />
          </div>

          <div id="project-tasks" className={styles.tasksCard}>
            <h2 className={styles.sectionTitle}>
              <ListTodo aria-hidden="true" />
              {t("tasksTitle") || "Завдання"}
            </h2>

            <div className={styles.taskForm}>
              <label className={styles.formField}>
                <span>{t("taskTitlePlaceholder")}</span>
                <input
                  placeholder={t("taskTitlePlaceholder") || "Назва"}
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className={styles.field}
                />
              </label>
              <label className={styles.formField}>
                <span>{t("taskDescPlaceholder")}</span>
                <input
                  placeholder={t("taskDescPlaceholder") || "Опис"}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className={styles.field}
                />
              </label>
              <label className={styles.formField}>
                <span>{t("dueDateLabel")}</span>
                <input
                  type="date"
                  value={newDueDate}
                  onChange={(e) => setNewDueDate(e.target.value)}
                  className={styles.field}
                />
              </label>
              <div className={styles.taskAssigneeRow}>
                <label className={styles.formField}>
                  <span>{t("selectMember")}</span>
                  <select
                    value={assignedTo}
                    onChange={(e) => setAssignedTo(e.target.value)}
                    className={styles.taskAssigneeSelect}
                  >
                    <option value="">
                      {t("selectMember") || "Виберіть учасника"}
                    </option>
                    {members.map((m) => (
                      <option key={m.user_id} value={m.user_id}>
                        {m.username || `${t("userHash")}${m.user_id}`}
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  onClick={async () => {
                    try {
                      const rows = await getProjectMembers(Number(id), token);
                      setMembers(rows || []);
                    } catch {}
                  }}
                  className={styles.ghostButton}
                >
                  <RotateCw aria-hidden="true" size={14} />
                  {t("refresh") || "Оновити"}
                </button>
              </div>
              {members.length === 0 && (
                <div style={{ color: "#64748b", fontSize: 12 }}>
                  {t("noMembers") || "Немає учасників"}
                </div>
              )}
              <div className={styles.addButtonWrap}>
                <button onClick={addTask} className={styles.primaryButton}>
                  <Plus aria-hidden="true" size={15} />
                  {t("add")}
                </button>
              </div>
            </div>

            <ul className={styles.taskList}>
              {tasks.map((task) => (
                <li key={task.id} className={styles.taskItem}>
                  <div className={styles.taskText}>
                    <strong>{task.title}</strong>
                    <span className={styles.taskDescription}>
                      - {task.description}
                    </span>
                  </div>
                  <div className={styles.taskActions}>
                    <button
                      onClick={() => updateTask(task.id)}
                      className={`${styles.dangerButton} ${styles.successButton}`}
                    >
                      <Pencil aria-hidden="true" size={14} />
                      {t("edit").replace(/^[^\p{L}\p{N}]+/u, "")}
                    </button>
                    <button
                      onClick={() => deleteTask(task.id)}
                      className={styles.dangerButton}
                    >
                      <Trash2 aria-hidden="true" size={14} />
                      {t("delete").replace(/^[^\p{L}\p{N}]+/u, "")}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div id="project-activity" className={styles.activityCard}>
            <h2 className={styles.sectionTitle}>
              <Activity aria-hidden="true" />
              {t("projectActivity") || "Активність проекту"}
            </h2>
            <div className={styles.activityList}>
              <div className={styles.activityActions}>
                <button
                  onClick={async () => {
                    if (!confirm(t("clearActivityConfirm") || "Are you sure?"))
                      return;
                    try {
                      await clearProjectActivity(
                        Number(id),
                        token || localStorage.getItem("token"),
                      );
                      setProjectActivity([]);
                      alert(
                        t("activityClearedSuccess") ||
                          "Project activity cleared",
                      );
                    } catch (err) {
                      console.error("Clear activity failed", err);
                      alert(
                        err?.response?.data?.message ||
                          err?.message ||
                          "Failed to clear activity",
                      );
                    }
                  }}
                  className={styles.dangerButton}
                >
                  <Trash2 aria-hidden="true" size={14} />
                  {t("clearActivity")}
                </button>
              </div>
              {projectActivity.length === 0 && !activityLoading && (
                <div style={{ color: "#64748b" }}>
                  {t("noActivityYet") || "Активності поки немає"}
                </div>
              )}
              {projectActivity.map((a) => {
                // Safely parse metadata if it's a JSON string
                let meta = a.metadata;
                if (typeof meta === "string") {
                  try {
                    meta = JSON.parse(meta);
                  } catch {
                    /* leave as string */
                  }
                }
                // Localize type title. If the localized string contains placeholders
                // (e.g. "{filename}") don't show the raw template as the title —
                // fallback to a short type label instead and put the interpolated
                // sentence into the body.
                const typeKey = `activity.${a.type}`;
                const rawTitle = t(typeKey);
                let title = rawTitle;
                // If the localized title still contains an unfilled placeholder,
                // fallback to a short label (humanized type)
                if (typeof rawTitle === "string" && rawTitle.includes("{")) {
                  // humanize type, e.g. 'attachment_added' -> 'attachment added'
                  title = a.type.replace(/_/g, " ");
                }
                // Build a concise body string from metadata
                let body = "";
                if (meta && typeof meta === "object") {
                  // Prefer common fields
                  if (a.type === "task_updated") {
                    const changes = [];
                    if (meta.status)
                      changes.push(
                        `${t("statusLabel") || "Status"}: ${meta.status}`,
                      );
                    if (meta.priority)
                      changes.push(
                        `${t("priorityLabel") || "Priority"}: ${meta.priority}`,
                      );
                    if (meta.title)
                      changes.push(
                        `${t("taskName") || "Title"}: ${meta.title}`,
                      );
                    const changesStr = changes.join(", ");
                    body = changesStr
                      ? t("activity.task_updated_changes", {
                          changes: changesStr,
                        })
                      : "";
                  } else if (a.type === "attachment_added") {
                    body = meta.filename
                      ? t("activity.attachment_added", {
                          filename: meta.filename,
                        })
                      : t("activity.attachment_added_generic");
                  } else if (a.type === "attachment_deleted") {
                    body = meta.filename
                      ? t("activity.attachment_deleted", {
                          filename: meta.filename,
                        })
                      : t("activity.attachment_deleted_generic");
                  } else {
                    body = JSON.stringify(meta);
                  }
                } else if (typeof meta === "string") {
                  body = meta;
                }

                return (
                  <div key={a.id} className={styles.activityItem}>
                    <div className={styles.activityBody}>
                      <div style={{ fontWeight: 700 }}>
                        {a.username || `user:${a.user_id}`}
                      </div>
                      <div style={{ color: "#475569", fontSize: 13 }}>
                        {title}
                        {body ? ` - ${body}` : ""}
                      </div>
                    </div>
                    <div className={styles.activityTime}>
                      {new Date(a.created_at).toLocaleString()}
                    </div>
                  </div>
                );
              })}
              {activityHasMore && (
                <div style={{ textAlign: "center" }}>
                  <button
                    onClick={() => loadProjectActivity(activityPage + 1)}
                    disabled={activityLoading}
                    style={{
                      padding: "8px 12px",
                      borderRadius: 8,
                      border: "none",
                      background: "#eef2ff",
                      cursor: "pointer",
                    }}
                  >
                    {activityLoading
                      ? t("loading")
                      : t("loadMore") || "Load more"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </WorkspaceShell>
  );
};

export default ProjectPage;
