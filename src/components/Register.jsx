import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { registerUser, loginUser } from '../api';
import styles from './Register.module.css';

const Register = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await registerUser(username, email, password);
      // Автологін після реєстрації
      const data = await loginUser(email, password);
      login(data.token, data.user);
      navigate('/dashboard');
    } catch (error) {
      alert('Failed to register');
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <h2 className={styles.title}>Реєстрація</h2>
          <p className={styles.subtitle}>Створіть акаунт для роботи з TaskFlow</p>
        </div>
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <label className={styles.label}>Ім'я користувача</label>
            <input
              placeholder="Ваше ім'я"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
              className={styles.input}
            />
          </div>
          <div className={styles.inputGroup}>
            <label className={styles.label}>Email</label>
            <input
              type="email"
              placeholder="example@mail.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
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
              onChange={e => setPassword(e.target.value)}
              required
              className={styles.input}
            />
          </div>
          <button type="submit" className={styles.submitButton}>Зареєструватись</button>
        </form>
        <div className={styles.footer}>
          <span className={styles.footerText}>Вже маєте акаунт? </span>
          <button onClick={() => navigate('/login')} className={styles.link}>Увійти</button>
        </div>
      </div>
    </div>
  );
};

export default Register;
