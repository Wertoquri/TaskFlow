import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

// ====================== Auth ======================

export const registerUser = async (username, email, password) => {
  const response = await axios.post(`${API_URL}/register`, { username, email, password });
  return response.data; // { token, user }
};

export const loginUser = (email, password) =>
  axios.post(`${API_URL}/login`, { email, password })
       .then(res => res.data);

export const getMe = async (token) => {
  const res = await axios.get(`${API_URL}/me`, { headers: { Authorization: `Bearer ${token}` } });
  return res.data; // { id, username, email }
};


// ====================== Projects ======================

export const getProjects = async (token) => {
  const response = await axios.get(`${API_URL}/projects`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data; // масив проектів
};

export const createProject = async (name, description, token) => {
  const response = await axios.post(
    `${API_URL}/projects`,
    { name, description },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.data; // новий проект
};

export const deleteProject = async (id, token) => {
  const response = await axios.delete(`${API_URL}/projects/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

export const updateProject = async (id, name, description, token) => {
  const response = await axios.put(`${API_URL}/projects/${id}`, 
    { id, name, description }, 
    { headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

// ====================== Tasks ======================

export const getTasksByProject = async (projectId, token) => {
  const response = await axios.get(`${API_URL}/tasks/${projectId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data; // масив задач
};

export const createTask = async ({ project_id, title, description, status }, token) => {
  const response = await axios.post(
    `${API_URL}/tasks`,
    { project_id, title, description, status },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.data;
};

export const updateTask = async (id, payload, token) => {
  const response = await axios.put(
    `${API_URL}/tasks/${id}`,
    payload,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.data;
};

export const deleteTask = async (id, token) => {
  const response = await axios.delete(`${API_URL}/tasks/${id}` , {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};
