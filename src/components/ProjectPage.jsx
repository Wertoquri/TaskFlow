// src/components/ProjectPage.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

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
    <div>
      <h1>Завдання проєкту #{id}</h1>

      <div style={{ marginBottom: 12 }}>
        <input
          placeholder="Назва"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
        />
        <input
          placeholder="Опис"
          value={newDescription}
          onChange={(e) => setNewDescription(e.target.value)}
        />
        <input
          type="date"
          value={newDueDate}
          onChange={(e) => setNewDueDate(e.target.value)}
        />
        <input
          type="number"
          placeholder="ID користувача"
          value={assignedTo}
          onChange={(e) => setAssignedTo(e.target.value)}
        />
        <button onClick={addTask}>Додати завдання</button>
      </div>

      <ul>
        {tasks.map((task) => (
          <li key={task.id}>
            <strong>{task.title}</strong> — {task.description}
            <button onClick={() => updateTask(task.id)}>Редагувати</button>
            <button
              onClick={() => deleteTask(task.id)}
              style={{ color: "red" }}
            >
              Видалити
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ProjectPage;
