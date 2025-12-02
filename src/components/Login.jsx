import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { loginUser } from "../api";
import VerifyEmail from "./VerifyEmail";
import styles from "./Login.module.css";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [needsVerification, setNeedsVerification] = useState(false);
  const [userId, setUserId] = useState(null);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await loginUser(email, password);
      login(data.token, data.user);
      navigate("/dashboard");
    } catch (err) {
      const response = err.response?.data;
      if (response?.needsVerification) {
        setUserId(response.userId);
        setNeedsVerification(true);
      } else {
        setError(response?.message || "Невірні облікові дані");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerified = (data) => {
    login(data.token, data.user);
    navigate('/dashboard');
    window.location.reload();
  };

  if (needsVerification) {
    return <VerifyEmail userId={userId} email={email} onVerified={handleVerified} />;
  }

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

          {error && (
            <div style={{
              padding: '12px',
              background: '#fee2e2',
              color: '#dc2626',
              borderRadius: '8px',
              fontSize: '14px',
              marginBottom: '16px'
            }}>
              ❌ {error}
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className={styles.submitButton}
            style={{
              opacity: loading ? 0.6 : 1,
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Вхід...' : 'Увійти'}
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
