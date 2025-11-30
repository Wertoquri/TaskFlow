// frontend/src/components/CreateProject.jsx
import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const CreateProject = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const navigate = useNavigate(); // Заміна useHistory на useNavigate

  const handleCreateProject = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token'); // Токен з localStorage або context

    if (!token) {
      return alert('You must be logged in to create a project');
    }

    try {
      const response = await axios.post('http://localhost:5000/api/projects', {
        title,
        description,
        owner_id: 1, // В даному випадку припускаємо, що id користувача — це 1, насправді це значення повинно братися з токену
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
        }
      });
      navigate('/dashboard'); // Заміна history.push на navigate
    } catch (error) {
      console.error(error);
      alert('Failed to create project');
    }
  };

  return (
    <div>
      <h2>Create Project</h2>
      <form onSubmit={handleCreateProject}>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title"
          required
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description"
          required
        ></textarea>
        <button type="submit">Create Project</button>
      </form>
    </div>
  );
};

export default CreateProject;
