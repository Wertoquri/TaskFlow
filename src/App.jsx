import React from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { useAuthApi } from './context/authApi';
import Register from './components/Register';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import ProjectPage from './components/ProjectPage';
import Footer from './components/Footer';

const App = () => {
  return (
    <>
      <Routes>
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<ProtectedRoute component={Dashboard} />} />
        <Route path="/" element={<HomeRedirect />} />
        <Route path="/project/:id" element={<ProtectedRoute component={ProjectPage} />} />
      </Routes>
      <Footer />
    </>
  );

};

const ProtectedRoute = ({ component: Component }) => {
  const auth = useAuthApi();
  const token = auth.token ?? (typeof auth.getToken === 'function' ? auth.getToken() : undefined);
  if (!token) return <Navigate to="/login" />;
  return <Component />;
};

const HomeRedirect = () => {
  const auth = useAuthApi();
  const token = auth.token ?? (typeof auth.getToken === 'function' ? auth.getToken() : undefined);
  return token ? <Navigate to="/dashboard" /> : <Navigate to="/login" />;
};

export default App;
