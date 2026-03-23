export function ProjectSocketJoin({ projectId }) {
  const auth = useAuthApi();
  const socket = auth.socket ?? (typeof auth.getSocket === 'function' ? auth.getSocket() : undefined);
  useEffect(() => {
    if (!socket || !projectId) return;
    socket.emit("join-project", projectId);
    return () => { socket.emit("leave-project", projectId); };
  }, [socket, projectId]);
  return null;
}
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { useAuthApi } from "../context/authApi";
import MembersPanel from "./MembersPanel.jsx";
import InviteUserPanel from "./InviteUserPanel.jsx";
import ProjectChat from "./ProjectChat.jsx";
import { useI18n } from "../context/I18nContext.jsx";
import { getProjectMembers, getProjectActivity, clearProjectActivity } from "../api";
import io from "socket.io-client";

const ProjectPage = () => {
  const { id } = useParams(); // project id
  const navigate = useNavigate();
  const auth = useAuthApi();
  const token = auth.token ?? (typeof auth.getToken === 'function' ? auth.getToken() : undefined);
  const user = typeof auth.getUser === 'function' ? auth.getUser() : auth.user;
  const { t } = useI18n();

  const [tasks, setTasks] = useState([]);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newDueDate, setNewDueDate] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [members, setMembers] = useState([]);
  const [projectActivity, setProjectActivity] = useState([]);
  const [activityPage, setActivityPage] = useState(1);
  const [activityHasMore, setActivityHasMore] = useState(false);
  const [activityLoading, setActivityLoading] = useState(false);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (!token) return;
    fetchTasks();
    loadProjectActivity(1);
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
    // Real-time project activity: listen to task-activity and append if task belongs to this project
    const s = io("http://localhost:5000");
    setSocket(s);
    function onTaskActivity(activity) {
      try {
        const belongs = Number(activity.project_id) === Number(id);
        if (!belongs) return;
        // If user previously paged beyond first page, refresh to keep newest at top
        if (activityPage > 1) {
          loadProjectActivity(1);
        } else {
          setProjectActivity((prev) => [activity, ...prev]);
        }
      } catch (e) {
        console.error('ProjectPage task-activity handler error', e);
      }
    }
    s.on('task-activity', onTaskActivity);
    return () => { s.off('task-activity', onTaskActivity); s.disconnect(); };
  }, [tasks]);

  const fetchTasks = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/tasks/${id}`, {
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
      console.error('Load project activity error', err);
    } finally {
      setActivityLoading(false);
    }
  };

  const addTask = async () => {
    if (!newTitle.trim()) {
      return alert(t('promptTitleRequired') || 'Введіть назву');
    }

    const payload = {
      project_id: Number(id),
      title: newTitle,
      description: newDescription || "",
      assigned_to: assignedTo, // ← ВАЖЛИВО! Призначити собі
      due_date: newDueDate || "2025-12-01", // ← тимчасова дата щоб не давало 400
    };

    try {
      const res = await axios.post("http://localhost:5000/api/tasks", payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      fetchTasks();
    } catch (err) {
      console.error("Add task error", err);
      alert(err.response?.data?.message || (t('errorGeneric') || 'Помилка'));
    }
  };

  const deleteTask = async (taskId) => {
    if (!confirm(t('confirmDeleteTask') || 'Видалити завдання?')) return;
    try {
      await axios.delete(`http://localhost:5000/api/tasks/${taskId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTasks((s) => s.filter((t) => t.id !== taskId));
    } catch (err) {
      console.error("Delete task error", err);
      alert(t('deleteTaskError'));
    }
  };

  const updateTask = async (taskId) => {
    const newName = prompt(t('promptNewTaskTitle') || 'Нова назва завдання:');
    if (!newName) return;
    try {
      await axios.put(
        `http://localhost:5000/api/tasks/${taskId}`,
        { title: newName },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      fetchTasks();
    } catch (err) {
      console.error("Update task error", err);
      const msg = err.response?.data?.message || err.message;
      alert((t('updateTaskFailed') || 'Не вдалося оновити завдання: ') + msg);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", padding: "20px" }}>
      <ProjectSocketJoin projectId={Number(id)} />
      
      <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
        <div style={{ 
          background: "#fff", 
          borderRadius: "16px", 
          padding: "24px", 
          marginBottom: "20px",
          boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}>
          <div>
            <h1 style={{ margin: 0, fontSize: "28px", fontWeight: 700, color: "#1e293b" }}>📋 {t('projectLabel')} #{id}</h1>
            <p style={{ margin: "8px 0 0 0", color: "#64748b", fontSize: "14px" }}>{t('projectManageMembersChat') || 'Керування учасниками та спілкування'}</p>
          </div>
          <button
            onClick={() => navigate("/dashboard")}
            style={{
              padding: "12px 24px",
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              color: "#fff",
              border: "none",
              borderRadius: "10px",
              fontSize: "14px",
              fontWeight: 600,
              cursor: "pointer",
              boxShadow: "0 2px 4px rgba(102,126,234,0.3)",
              transition: "all 0.3s",
              display: "flex",
              alignItems: "center",
              gap: "8px"
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-2px)"}
            onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
          >
            ← {t('backToDashboard') || 'Назад до Dashboard'}
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "30px", alignItems: 'start' }}>
          <div>
            <InviteUserPanel projectId={Number(id)} token={token} />
          </div>
          <div>
            <MembersPanel projectId={Number(id)} />
          </div>
        </div>

        <div style={{ marginBottom: "30px" }}>
          <ProjectChat projectId={Number(id)} />
        </div>

        <div style={{ 
          background: "#fff", 
          borderRadius: "16px", 
          padding: "24px",
          boxShadow: "0 4px 6px rgba(0,0,0,0.1)"
        }}>
          <h3 style={{ margin: "0 0 20px 0", fontSize: "18px", fontWeight: 700, color: "#1e293b" }}>
            ✅ {t('tasksTitle') || 'Завдання'}
          </h3>

          <div style={{ 
            display: "grid", 
            gridTemplateColumns: "1fr 2fr 160px 180px minmax(120px, 220px)", 
            gap: "20px",
            marginBottom: "20px",
            alignItems: "center"
          }}>
            <input
              placeholder={t('taskTitlePlaceholder') || 'Назва'}
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              style={{
                padding: "12px",
                border: "1px solid #e2e8f0",
                borderRadius: "8px",
                fontSize: "14px"
              }}
            />
            <input
              placeholder={t('taskDescPlaceholder') || 'Опис'}
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              style={{
                padding: "12px",
                border: "1px solid #e2e8f0",
                borderRadius: "8px",
                fontSize: "14px"
              }}
            />
            <input
              type="date"
              value={newDueDate}
              onChange={(e) => setNewDueDate(e.target.value)}
              style={{
                padding: "12px",
                border: "1px solid #e2e8f0",
                borderRadius: "8px",
                fontSize: "14px"
              }}
            />
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <select
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                style={{
                  padding: "10px 14px",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                  fontSize: "14px",
                  background: "#fff",
                  cursor: 'pointer',
                  outline: 'none',
                  transition: 'all 0.2s'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#6366f1';
                  e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#e2e8f0';
                  e.target.style.boxShadow = 'none';
                }}
              >
                <option value="">{t('selectMember') || 'Виберіть учасника'}</option>
                {members.map((m) => (
                  <option key={m.user_id} value={m.user_id}>
                    {m.username || `${t('userHash')}${m.user_id}`}
                  </option>
                ))}
              </select>
              <button
                onClick={async () => {
                  try {
                    const rows = await getProjectMembers(Number(id), token);
                    setMembers(rows || []);
                  } catch {}
                }}
                style={{ 
                  padding: '10px 14px', 
                  borderRadius: 8, 
                  border: 'none', 
                  background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)', 
                  color: '#fff', 
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '13px',
                  boxShadow: '0 2px 8px rgba(6,182,212,0.3)',
                  transition: 'all 0.3s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(6,182,212,0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(6,182,212,0.3)';
                }}
              >
                🔄 {t('refresh') || 'Оновити'}
              </button>
            </div>
            {members.length === 0 && (
              <div style={{ color: '#64748b', fontSize: 12 }}>{t('noMembers') || 'Немає учасників'}</div>
            )}
            <div style={{ justifySelf: 'end' }}>
              <button
                onClick={addTask}
                style={{
                  padding: "12px 24px",
                  background: "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)",
                  color: "#fff",
                  border: "none",
                  borderRadius: "10px",
                  fontSize: "14px",
                  fontWeight: 700,
                  cursor: "pointer",
                  boxShadow: "0 4px 12px rgba(34,197,94,0.3)",
                  transition: "all 0.3s cubic-bezier(0.4,0,0.2,1)",
                  whiteSpace: 'nowrap'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-3px)";
                  e.currentTarget.style.boxShadow = "0 6px 16px rgba(34,197,94,0.4)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 4px 12px rgba(34,197,94,0.3)";
                }}
              >
                ✨ + {t('add')}
              </button>
            </div>
          </div>

          <ul style={{ 
            listStyle: "none", 
            padding: 0, 
            margin: 0,
            display: "flex",
            flexDirection: "column",
            gap: "12px"
          }}>
            {tasks.map((task) => (
              <li key={task.id} style={{
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                borderRadius: "12px",
                padding: "16px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
              }}>
                <div>
                  <strong style={{ fontSize: "15px", color: "#1e293b" }}>{task.title}</strong>
                  <span style={{ color: "#64748b", marginLeft: "12px", fontSize: "14px" }}>— {task.description}</span>
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    onClick={() => {
                      console.log('ProjectPage edit click', { taskId: task.id });
                      updateTask(task.id)
                    }}
                    style={{
                      padding: "10px 18px",
                      background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
                      color: "#fff",
                      border: "none",
                      borderRadius: "8px",
                      fontSize: "13px",
                      fontWeight: 700,
                      cursor: "pointer",
                      transition: "all 0.3s cubic-bezier(0.4,0,0.2,1)",
                      boxShadow: "0 2px 8px rgba(59,130,246,0.3)"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "translateY(-2px)";
                      e.currentTarget.style.boxShadow = "0 4px 12px rgba(59,130,246,0.4)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow = "0 2px 8px rgba(59,130,246,0.3)";
                    }}
                  >
                    ✏️ {t('edit')}
                  </button>
                  <button
                    onClick={() => deleteTask(task.id)}
                    style={{
                      padding: "10px 18px",
                      background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
                      color: "#fff",
                      border: "none",
                      borderRadius: "8px",
                      fontSize: "13px",
                      fontWeight: 700,
                      cursor: "pointer",
                      transition: "all 0.3s cubic-bezier(0.4,0,0.2,1)",
                      boxShadow: "0 2px 8px rgba(239,68,68,0.3)"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "translateY(-2px)";
                      e.currentTarget.style.boxShadow = "0 4px 12px rgba(239,68,68,0.4)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow = "0 2px 8px rgba(239,68,68,0.3)";
                    }}
                  >
                    🗑️ {t('delete')}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
        
        <div style={{ marginTop: 20, background: "#fff", borderRadius: "16px", padding: "24px", boxShadow: "0 4px 6px rgba(0,0,0,0.06)" }}>
          <h3 style={{ margin: "0 0 12px 0", fontSize: "18px", fontWeight: 700 }}>📝 {t('projectActivity') || 'Активність проекту'}</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button
                onClick={async () => {
                  if (!confirm(t('clearActivityConfirm') || 'Are you sure?')) return;
                  try {
                    await clearProjectActivity(Number(id), token || localStorage.getItem('token'));
                    setProjectActivity([]);
                    alert(t('activityClearedSuccess') || 'Project activity cleared');
                  } catch (err) {
                    console.error('Clear activity failed', err);
                    alert(err?.response?.data?.message || err?.message || 'Failed to clear activity');
                  }
                }}
                style={{
                  padding: '10px 16px',
                  borderRadius: 10,
                  border: 'none',
                  background: 'linear-gradient(135deg, #f97316 0%, #ef4444 100%)',
                  color: '#fff',
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: '13px',
                  boxShadow: '0 3px 10px rgba(249,115,22,0.3)',
                  transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 5px 14px rgba(249,115,22,0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 3px 10px rgba(249,115,22,0.3)';
                }}
              >
                🧹 {t('clearActivity')}
              </button>
            </div>
            {projectActivity.length === 0 && !activityLoading && (
              <div style={{ color: '#64748b' }}>{t('noActivityYet') || 'Активності поки немає'}</div>
            )}
            {projectActivity.map((a) => {
              // Safely parse metadata if it's a JSON string
              let meta = a.metadata;
              if (typeof meta === 'string') {
                try { meta = JSON.parse(meta); } catch { /* leave as string */ }
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
              if (typeof rawTitle === 'string' && rawTitle.includes('{')) {
                // humanize type, e.g. 'attachment_added' -> 'attachment added'
                title = a.type.replace(/_/g, ' ');
              }
              // Build a concise body string from metadata
              let body = '';
              if (meta && typeof meta === 'object') {
                // Prefer common fields
                if (a.type === 'task_updated') {
                  const changes = [];
                  if (meta.status) changes.push(`${t('statusLabel') || 'Status'}: ${meta.status}`);
                  if (meta.priority) changes.push(`${t('priorityLabel') || 'Priority'}: ${meta.priority}`);
                  if (meta.title) changes.push(`${t('taskName') || 'Title'}: ${meta.title}`);
                  const changesStr = changes.join(', ');
                  body = changesStr ? t('activity.task_updated_changes', { changes: changesStr }) : '';
                } else if (a.type === 'attachment_added') {
                  body = meta.filename ? t('activity.attachment_added', { filename: meta.filename }) : t('activity.attachment_added_generic');
                } else if (a.type === 'attachment_deleted') {
                  body = meta.filename ? t('activity.attachment_deleted', { filename: meta.filename }) : t('activity.attachment_deleted_generic');
                } else {
                  body = JSON.stringify(meta);
                }
              } else if (typeof meta === 'string') {
                body = meta;
              }

              return (
                <div key={a.id} style={{ padding: 12, borderRadius: 8, background: '#f8fafc', display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'center', gap: 10 }}>
                  <div>
                    <div style={{ fontWeight: 700 }}>{a.username || `user:${a.user_id}`}</div>
                    <div style={{ color: '#475569', fontSize: 13 }}>{title}{body ? ` — ${body}` : ''}</div>
                  </div>
                  <div style={{ color: '#94a3b8', fontSize: 12, textAlign: 'right' }}>{new Date(a.created_at).toLocaleString()}</div>
                </div>
              );
            })}
            {activityHasMore && (
              <div style={{ textAlign: 'center', marginTop: '16px' }}>
                <button 
                  onClick={() => loadProjectActivity(activityPage + 1)} 
                  disabled={activityLoading} 
                  style={{ 
                    padding: '10px 20px', 
                    borderRadius: 10, 
                    border: 'none', 
                    background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', 
                    color: '#fff',
                    cursor: activityLoading ? 'not-allowed' : 'pointer',
                    opacity: activityLoading ? 0.7 : 1,
                    fontWeight: 700,
                    fontSize: '13px',
                    boxShadow: activityLoading ? 'none' : '0 3px 10px rgba(99,102,241,0.3)',
                    transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)'
                  }}
                  onMouseEnter={(e) => {
                    if (!activityLoading) {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 5px 14px rgba(99,102,241,0.4)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = activityLoading ? 'none' : '0 3px 10px rgba(99,102,241,0.3)';
                  }}
                >
                  {activityLoading ? '⏳ Loading...' : '📖 ' + (t('loadMore') || 'Load more')}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectPage;
