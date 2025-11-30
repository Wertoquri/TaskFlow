import React, { createContext, useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from 'axios';
import { getMe } from '../api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem("token") || null);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  function isTokenExpired(t) {
    try {
      const payload = JSON.parse(atob(t.split('.')[1]));
      const nowSec = Math.floor(Date.now() / 1000);
      return payload.exp && payload.exp <= nowSec;
    } catch {
      return true; // treat malformed as expired
    }
  }

  useEffect(() => {
    if (!token) return;
    if (isTokenExpired(token)) {
      // Автоматичний вихід при простроченому токені
      localStorage.removeItem('token');
      setToken(null);
      setUser(null);
      navigate('/login');
      return;
    }
    (async () => {
      try {
        const u = await getMe(token);
        setUser(u);
      } catch (e) {
        // if server returns 401/403, logout
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
        navigate('/login');
      }
    })();
  }, [token]);

  const login = (newToken, userData) => {
    localStorage.setItem("token", newToken);
    setToken(newToken);
    // fetch user via /me after setting token
    (async () => {
      try {
        const u = await getMe(newToken);
        setUser(u);
      } catch (e) {
        setUser(userData || null);
      }
    })();
  };

  // Axios interceptor to auto-logout on 401
  useEffect(() => {
    const id = axios.interceptors.response.use(
      (res) => res,
      (error) => {
        if (error?.response?.status === 401) {
          localStorage.removeItem('token');
          setToken(null);
          setUser(null);
          navigate('/login');
        }
        return Promise.reject(error);
      }
    );
    return () => axios.interceptors.response.eject(id);
  }, [navigate]);

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
    navigate("/login");
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
