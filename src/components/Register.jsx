import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { registerUser } from '../api';
import VerifyEmail from './VerifyEmail';
import styles from './Register.module.css';

const Register = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [needsVerification, setNeedsVerification] = useState(false);
  const [userId, setUserId] = useState(null);
  const navigate = useNavigate();

  // Валідація на фронтенді
  const validateForm = () => {
    if (username.length < 3 || username.length > 20) {
      return 'Username повинен містити від 3 до 20 символів';
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return 'Username може містити тільки літери, цифри та підкреслення';
    }
    if (password.length < 8) {
      return 'Пароль повинен містити мінімум 8 символів';
    }
    if (!/[A-Z]/.test(password)) {
      return 'Пароль повинен містити хоча б одну велику літеру';
    }
    if (!/[a-z]/.test(password)) {
      return 'Пароль повинен містити хоча б одну малу літеру';
    }
    if (!/[0-9]/.test(password)) {
      return 'Пароль повинен містити хоча б одну цифру';
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);

    try {
      const response = await registerUser(username, email, password);
      setUserId(response.userId);
      setNeedsVerification(true);
    } catch (error) {
      setError(error.response?.data?.message || 'Помилка реєстрації');
    } finally {
      setLoading(false);
    }
  };

  const handleVerified = (data) => {
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    navigate('/dashboard');
    window.location.reload();
  };

  if (needsVerification) {
    return <VerifyEmail userId={userId} email={email} onVerified={handleVerified} />;
  }

  const passwordStrength = () => {
    if (password.length === 0) return null;
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    
    if (strength <= 2) return { label: 'Слабкий', color: '#ef4444' };
    if (strength === 3) return { label: 'Середній', color: '#f59e0b' };
    return { label: 'Сильний', color: '#10b981' };
  };

  const strength = passwordStrength();

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
              placeholder="username123"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
              className={styles.input}
            />
            <small style={{ color: '#64748b', fontSize: '12px', marginTop: '4px', display: 'block' }}>
              3-20 символів, тільки літери, цифри та _
            </small>
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
            <small style={{ color: '#64748b', fontSize: '12px', marginTop: '4px', display: 'block' }}>
              Мінімум 8 символів, велика літера, мала літера та цифра
            </small>
            {strength && (
              <div style={{ marginTop: '8px' }}>
                <div style={{ display: 'flex', gap: '4px', marginBottom: '4px' }}>
                  {[1,2,3,4].map(i => (
                    <div key={i} style={{
                      flex: 1,
                      height: '4px',
                      background: i <= (strength.label === 'Слабкий' ? 1 : strength.label === 'Середній' ? 2 : 3) ? strength.color : '#e2e8f0',
                      borderRadius: '2px'
                    }} />
                  ))}
                </div>
                <span style={{ fontSize: '12px', color: strength.color, fontWeight: 600 }}>
                  {strength.label}
                </span>
              </div>
            )}
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
            {loading ? 'Реєстрація...' : 'Зареєструватись'}
          </button>
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
