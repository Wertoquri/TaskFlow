import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { loginUser } from "../api";
import styles from "./Login.module.css";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  // Login.jsx
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = await loginUser(email, password);
      login(data.token, data.user); // зберігаємо токен та user у контексті
      navigate("/dashboard");
    } catch (err) {
      alert(err.response?.data?.message || "Невірні облікові дані");
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <h2 className={styles.title}>Вхід до TaskFlow</h2>
          <p className={styles.subtitle}>Введіть свої дані для продовження</p>
        </div>
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <label className={styles.label}>Email</label>
            <input
              type="email"
              placeholder="example@mail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className={styles.input}
            />
          </div>
          <div className={styles.inputGroup}>
            <label className={styles.label}>Пароль</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className={styles.input}
            />
          </div>
          <button type="submit" className={styles.submitButton}>
            Увійти
          </button>
        </form>
        <div className={styles.footer}>
          <span className={styles.footerText}>Не маєте акаунту? </span>
          <button onClick={() => navigate("/register")} className={styles.link}>
            Зареєструватись
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
