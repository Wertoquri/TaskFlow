import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

// ====================== Auth ======================

export const registerUser = async (username, email, password) => {
  const response = await axios.post(`${API_URL}/register`, { username, email, password });
  return response.data; // { userId, email } - now requires verification
};

export const verifyEmail = async (userId, code) => {
  const response = await axios.post(`${API_URL}/verify-email`, { userId, code });
  return response.data; // { token, user } after successful verification
};

export const resendVerificationCode = async (userId) => {
  const response = await axios.post(`${API_URL}/resend-code`, { userId });
  return response.data; // { message }
};

export const loginUser = (email, password) =>
  axios.post(`${API_URL}/login`, { email, password })
       .then(res => res.data); // { token, user } or { needsVerification: true, userId }

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

// ====================== Invitations ======================

export const createInvitation = async (projectId, email, token) => {
  const res = await axios.post(
    `${API_URL}/projects/${projectId}/invite`,
    { email },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return res.data;
};

export const getMyInvitations = async (token) => {
  const res = await axios.get(`${API_URL}/projects/me/invitations`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

export const acceptInvitation = async (id, token) => {
  const res = await axios.post(
    `${API_URL}/projects/invitations/${id}/accept`,
    {},
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return res.data;
};

export const declineInvitation = async (id, token) => {
  const res = await axios.post(
    `${API_URL}/projects/invitations/${id}/decline`,
    {},
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return res.data;
};

// ====================== Members & Permissions ======================

export const getProjectMembers = async (projectId, token) => {
  const res = await axios.get(`${API_URL}/projects/${projectId}/members`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

export const kickProjectMember = async (projectId, userId, token) => {
  const res = await axios.delete(`${API_URL}/projects/${projectId}/members/${userId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

export const updateMemberPermissions = async (projectId, userId, permissions, token) => {
  const res = await axios.put(
    `${API_URL}/projects/${projectId}/members/${userId}/permissions`,
    permissions,
    { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
  );
  return res.data;
};

// ====================== Notifications ======================

export const getNotifications = async (token) => {
  const res = await axios.get(`${API_URL}/notifications`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

export const markNotificationAsRead = async (id, token) => {
  const res = await axios.put(
    `${API_URL}/notifications/${id}/read`,
    {},
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return res.data;
};

export const markAllNotificationsAsRead = async (token) => {
  const res = await axios.put(
    `${API_URL}/notifications/read-all`,
    {},
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return res.data;
};

export const deleteNotification = async (id, token) => {
  const res = await axios.delete(`${API_URL}/notifications/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

// ====================== Chat Messages ======================

export const getProjectMessages = async (projectId, token) => {
  const res = await axios.get(`${API_URL}/projects/${projectId}/messages`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

export const sendProjectMessage = async (projectId, content, token) => {
  const res = await axios.post(
    `${API_URL}/projects/${projectId}/messages`,
    { content },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return res.data;
};

export const updateProjectMessage = async (projectId, messageId, content, token) => {
  const res = await axios.put(
    `${API_URL}/projects/${projectId}/messages/${messageId}`,
    { content },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return res.data;
};

export const deleteProjectMessage = async (projectId, messageId, token) => {
  const res = await axios.delete(
    `${API_URL}/projects/${projectId}/messages/${messageId}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return res.data;
};
