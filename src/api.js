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
