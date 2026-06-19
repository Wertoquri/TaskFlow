import axios from 'axios';

export const API_URL = import.meta.env.VITE_API_URL || '/api';

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

export const deleteMyAccount = async (token) => {
  const res = await axios.delete(`${API_URL}/account`, { headers: { Authorization: `Bearer ${token}` } });
  return res.data;
};



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

export const uploadTaskAttachment = async (taskId, file, token) => {
  const formData = new FormData();
  formData.append('file', file);
  const res = await axios.post(
    `${API_URL}/tasks/${taskId}/attachments`,
    formData,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      },
    }
  );
  return res.data;
};

export const getTaskAttachments = async (taskId, token) => {
  const res = await axios.get(`${API_URL}/tasks/${taskId}/attachments`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

export const deleteTaskAttachment = async (taskId, attachmentId, token) => {
  const res = await axios.delete(`${API_URL}/tasks/${taskId}/attachments/${attachmentId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

export const getTaskActivity = async (taskId, page = 1, limit = 20, token) => {
  const res = await axios.get(`${API_URL}/tasks/${taskId}/activity?page=${page}&limit=${limit}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data; // { items, page, limit, total, hasMore }
};

export const getProjectActivity = async (projectId, page = 1, limit = 20, token) => {
  const res = await axios.get(`${API_URL}/projects/${projectId}/activity?page=${page}&limit=${limit}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data; // { items, page, limit, total, hasMore }
};

export const uploadAvatar = async (file, token) => {
  const fd = new FormData();
  fd.append('avatar', file);
  const res = await axios.post(`${API_URL}/me/avatar`, fd, {
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
};

export const updateMe = async (payload, token) => {
  const res = await axios.patch(`${API_URL}/me`, payload, {
    headers: token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' }
  });
  return res.data;
};

export const clearProjectActivity = async (projectId, token) => {
  const res = await axios.delete(`${API_URL}/projects/${projectId}/activity`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};


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

export const clearMemberPermissions = async (projectId, userId, token) => {
  const res = await axios.post(
    `${API_URL}/projects/${projectId}/members/${userId}/clear-permissions`,
    {},
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return res.data;
};


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
