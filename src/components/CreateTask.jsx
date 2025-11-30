// frontend/src/components/CreateTask.jsx
import React, { useState } from 'react';
import axios from 'axios';

const CreateTask = () => {
  // Стан для збереження введених даних
  const [taskData, setTaskData] = useState({
    project_id: '',
    title: '',
    description: '',
    assigned_to: '',
    due_date: ''
  });

  // Обробка змін у формах
  const handleChange = (e) => {
    const { name, value } = e.target;
    setTaskData((prevData) => ({
      ...prevData,
      [name]: value
    }));
  };

  // Обробка відправки форми
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Перевірка, чи є всі поля
    if (!taskData.project_id || !taskData.title || !taskData.assigned_to || !taskData.due_date) {
      alert('Будь ласка, заповніть всі поля!');
      return;
    }

    try {
      const response = await axios.post('http://localhost:5000/api/tasks', taskData);
      console.log('Task created:', response.data);
      alert('Завдання створено успішно!');
    } catch (error) {
      console.error('Error creating task:', error.response ? error.response.data : error.message);
      alert('Щось пішло не так. Спробуйте ще раз.');
    }
  };

  return (
    <div>
      <h2>Створити завдання</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Project ID:</label>
          <input
            type="number"
            name="project_id"
            value={taskData.project_id}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label>Title:</label>
          <input
            type="text"
            name="title"
            value={taskData.title}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label>Description:</label>
          <textarea
            name="description"
            value={taskData.description}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label>Assigned To (User ID):</label>
          <input
            type="number"
            name="assigned_to"
            value={taskData.assigned_to}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label>Due Date:</label>
          <input
            type="date"
            name="due_date"
            value={taskData.due_date}
            onChange={handleChange}
            required
          />
        </div>
        <button type="submit">Створити завдання</button>
      </form>
    </div>
  );
};

export default CreateTask;
