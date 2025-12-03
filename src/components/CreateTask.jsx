import React, { useEffect, useState } from "react";
import axios from "axios";
import { useI18n } from "../context/I18nContext.jsx";
import { getProjectMembers } from "../api";
import { useAuth } from "../context/AuthContext.jsx";

const CreateTask = () => {
  // Стан для збереження введених даних
  const { t } = useI18n();
  const { token } = useAuth();
  const [taskData, setTaskData] = useState({
    project_id: "",
    title: "",
    description: "",
    assigned_to: "",
    due_date: "",
  });
  const [members, setMembers] = useState([]);

  // Обробка змін у формах
  const handleChange = (e) => {
    const { name, value } = e.target;
    setTaskData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  // Обробка відправки форми
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Перевірка, чи є всі поля
    if (
      !taskData.project_id ||
      !taskData.title ||
      !taskData.assigned_to ||
      !taskData.due_date
    ) {
      alert(t('pleaseFillAllFields'));
      return;
    }

    try {
      const response = await axios.post(
        "http://localhost:5000/api/tasks",
        taskData
      );
      console.log("Task created:", response.data);
      alert(t('taskCreatedSuccess'));
    } catch (error) {
      console.error(
        "Error creating task:",
        error.response ? error.response.data : error.message
      );
      alert(t('somethingWentWrong'));
    }
  };

  // Load members when project_id changes
  useEffect(() => {
    async function loadMembers() {
      if (!taskData.project_id) { setMembers([]); return; }
      try {
        const rows = await getProjectMembers(Number(taskData.project_id), token);
        setMembers(rows || []);
      } catch (e) {
        setMembers([]);
      }
    }
    loadMembers();
  }, [taskData.project_id]);

  return (
    <div>
      <h2>{t('createTaskTitlePage')}</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>{t('projectIdLabel')}:</label>
          <input
            type="number"
            name="project_id"
            value={taskData.project_id}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label>{t('titleLabel')}:</label>
          <input
            type="text"
            name="title"
            value={taskData.title}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label>{t('descriptionLabel')}:</label>
          <textarea
            name="description"
            value={taskData.description}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label>{t('assignedToLabel')}:</label>
          <select
            name="assigned_to"
            value={taskData.assigned_to}
            onChange={handleChange}
            required
            disabled={!taskData.project_id}
          >
            <option value="">{t('selectMember') || 'Виберіть учасника'}</option>
            {members.map((m) => (
              <option key={m.user_id} value={m.user_id}>
                {m.username || `${t('userHash')}${m.user_id}`}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label>{t('dueDateLabel')}:</label>
          <input
            type="date"
            name="due_date"
            value={taskData.due_date}
            onChange={handleChange}
            required
          />
        </div>
        <button type="submit">{t('createTaskTitlePage')}</button>
      </form>
    </div>
  );
};

export default CreateTask;
