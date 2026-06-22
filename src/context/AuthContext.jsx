import React, { createContext, useState, useContext, useEffect } from "react";
import io from "socket.io-client";
import { useNavigate } from "react-router-dom";
import axios from 'axios';
import { getMe, SOCKET_URL } from '../api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem("token") || null);
  const [user, setUser] = useState(null);
  const [socket, setSocket] = useState(null);
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
    // Attach token to axios defaults
    axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
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

  // expose a refreshUser helper to update current user data after profile changes
  const refreshUser = async () => {
    if (!token) return;
    try {
      const u = await getMe(token);
      setUser(u);
      return u;
    } catch (e) {
      return null;
    }
  };

  useEffect(() => {
    if (!token || isTokenExpired(token)) return;
    const nextSocket = io(SOCKET_URL, { auth: { token } });
    setSocket(nextSocket);
    return () => {
      nextSocket.disconnect();
      setSocket(null);
    };
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
    delete axios.defaults.headers.common["Authorization"];
    navigate("/login");
    if (socket) {
      socket.disconnect();
      setSocket(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, socket, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
