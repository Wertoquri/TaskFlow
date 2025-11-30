import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getProjects } from "../api";

const Dashboard = () => {
  const { token, user, logout } = useAuth();
  const [projects, setProjects] = useState([]);

  const fetchProjects = async () => {
    try {
      const data = await getProjects(token);
      setProjects(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const projects = await getProjects(token);
        setProjects(projects);
      } catch (err) {
        console.error(err);
      }
    };
    fetchProjects();
  }, [token]);
};

export default Dashboard;
