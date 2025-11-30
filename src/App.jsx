// frontend/src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Register from './components/Register';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import { Navigate } from 'react-router-dom';
import ProjectPage from './components/ProjectPage';

const App = () => {
  return (
    <Routes>
      <Route path="/register" element={<Register />} />
      <Route path="/login" element={<Login />} />
      <Route path="/dashboard" element={<ProtectedRoute component={Dashboard} />} />
      <Route path="/" element={<Navigate to="/dashboard" />} />
      <Route path="/project/:id" element={<ProtectedRoute component={ProjectPage} />} />
    </Routes>
  );

};

// Компонент для захисту доступу до маршруту
const ProtectedRoute = ({ component: Component }) => {
  const { token } = useAuth();
  if (!token) return <Navigate to="/login" />;
  return <Component />;
};

export default App;
