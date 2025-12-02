// Socket room join helper: include this component inside project view if needed
export function ProjectSocketJoin({ projectId }) {
  const { socket } = useAuth();
  useEffect(() => {
    if (!socket || !projectId) return;
    socket.emit("join-project", projectId);
    return () => { socket.emit("leave-project", projectId); };
  }, [socket, projectId]);
  return null;
}
// src/components/ProjectPage.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import MembersPanel from "./MembersPanel.jsx";
import InviteUserPanel from "./InviteUserPanel.jsx";
import ProjectChat from "./ProjectChat.jsx";

const ProjectPage = () => {
  const { id } = useParams(); // project id
  const navigate = useNavigate();
  const { token, user } = useAuth();

  const [tasks, setTasks] = useState([]);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newDueDate, setNewDueDate] = useState("");
  const [assignedTo, setAssignedTo] = useState("");

  useEffect(() => {
    if (!token) return;
    fetchTasks();
    // eslint-disable-next-line
  }, [token, id]);

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

  const addTask = async () => {
    if (!newTitle.trim()) {
      return alert("Введіть назву");
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
      alert(err.response?.data?.message || "Помилка");
    }
  };

  const deleteTask = async (taskId) => {
    if (!confirm("Видалити завдання?")) return;
    try {
      await axios.delete(`http://localhost:5000/api/tasks/${taskId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTasks((s) => s.filter((t) => t.id !== taskId));
    } catch (err) {
      console.error("Delete task error", err);
      alert("Не вдалося видалити завдання");
    }
  };

  const updateTask = async (taskId) => {
    const newName = prompt("Нова назва завдання:");
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
      alert("Не вдалося оновити завдання: " + msg);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", padding: "20px" }}>
      <ProjectSocketJoin projectId={Number(id)} />
      
      <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
        {/* Header */}
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
            <h1 style={{ margin: 0, fontSize: "28px", fontWeight: 700, color: "#1e293b" }}>📋 Проєкт #{id}</h1>
            <p style={{ margin: "8px 0 0 0", color: "#64748b", fontSize: "14px" }}>Керування учасниками та спілкування</p>
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
            ← Назад до Dashboard
          </button>
        </div>

        {/* Main Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "30px" }}>
          <div>
            <InviteUserPanel projectId={Number(id)} token={token} />
          </div>
          <div>
            <MembersPanel projectId={Number(id)} />
          </div>
        </div>

        {/* Chat Section */}
        <div style={{ marginBottom: "30px" }}>
          <ProjectChat projectId={Number(id)} />
        </div>

        {/* Tasks Section */}
        <div style={{ 
          background: "#fff", 
          borderRadius: "16px", 
          padding: "24px",
          boxShadow: "0 4px 6px rgba(0,0,0,0.1)"
        }}>
          <h3 style={{ margin: "0 0 20px 0", fontSize: "18px", fontWeight: 700, color: "#1e293b" }}>
            ✅ Завдання
          </h3>

          <div style={{ 
            display: "grid", 
            gridTemplateColumns: "1fr 2fr 150px 150px auto", 
            gap: "12px",
            marginBottom: "20px",
            alignItems: "center"
          }}>
            <input
              placeholder="Назва"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              style={{
                padding: "10px",
                border: "1px solid #e2e8f0",
                borderRadius: "8px",
                fontSize: "14px"
              }}
            />
            <input
              placeholder="Опис"
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              style={{
                padding: "10px",
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
                padding: "10px",
                border: "1px solid #e2e8f0",
                borderRadius: "8px",
                fontSize: "14px"
              }}
            />
            <input
              type="number"
              placeholder="ID користувача"
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
              style={{
                padding: "10px",
                border: "1px solid #e2e8f0",
                borderRadius: "8px",
                fontSize: "14px"
              }}
            />
            <button 
              onClick={addTask}
              style={{
                padding: "10px 20px",
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: 600,
                cursor: "pointer",
                boxShadow: "0 2px 4px rgba(102,126,234,0.3)",
                transition: "all 0.3s"
              }}
            >
              + Додати
            </button>
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
                    onClick={() => updateTask(task.id)}
                    style={{
                      padding: "8px 16px",
                      background: "#10b981",
                      color: "#fff",
                      border: "none",
                      borderRadius: "8px",
                      fontSize: "13px",
                      fontWeight: 600,
                      cursor: "pointer",
                      transition: "all 0.3s"
                    }}
                  >
                    ✏️ Редагувати
                  </button>
                  <button
                    onClick={() => deleteTask(task.id)}
                    style={{
                      padding: "8px 16px",
                      background: "#ef4444",
                      color: "#fff",
                      border: "none",
                      borderRadius: "8px",
                      fontSize: "13px",
                      fontWeight: 600,
                      cursor: "pointer",
                      transition: "all 0.3s"
                    }}
                  >
                    🗑️ Видалити
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ProjectPage;
