import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { registerUser } from '../api';
import VerifyEmail from './VerifyEmail';
import styles from './Register.module.css';
import { useI18n } from '../context/I18nContext.jsx';

const Register = () => {
  const { t } = useI18n();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [needsVerification, setNeedsVerification] = useState(false);
  const [userId, setUserId] = useState(null);
  const [demoCode, setDemoCode] = useState('');
  // Captcha removed
  const navigate = useNavigate();

  // Валідація на фронтенді
  const validateForm = () => {
    if (username.length < 3 || username.length > 20) {
      return t('usernameLenErr');
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return t('usernameCharsErr');
    }
    if (password.length < 8) {
      return t('passwordLenErr');
    }
    if (!/[A-Z]/.test(password)) {
      return t('passwordUpperErr');
    }
    if (!/[a-z]/.test(password)) {
      return t('passwordLowerErr');
    }
    if (!/[0-9]/.test(password)) {
      return t('passwordDigitErr');
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    // captcha removed

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    // reCAPTCHA removed

    setLoading(true);

    try {
      const response = await registerUser(username, email, password);
      setUserId(response.userId);
      setDemoCode(response.verificationCode || '');
      setNeedsVerification(true);
    } catch (error) {
      setError(error.response?.data?.message || t('registerError'));
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
    return <VerifyEmail userId={userId} email={email} onVerified={handleVerified} demoCode={demoCode} />;
  }

  const passwordStrength = () => {
    if (password.length === 0) return null;
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    
    if (strength <= 2) return { label: t('weak'), color: '#ef4444', bars: 1 };
    if (strength === 3 || strength === 4) return { label: t('medium'), color: '#f59e0b', bars: 2 };
    return { label: t('strong'), color: '#10b981', bars: 4 };
  };

  const strength = passwordStrength();

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <h2 className={styles.title}>{t('registerTitle')}</h2>
          <p className={styles.subtitle}>{t('registerSubtitle')}</p>
        </div>
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <label className={styles.label}>{t('username')}</label>
            <input
              placeholder="username123"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
              className={styles.input}
            />
            <small style={{ color: '#64748b', fontSize: '12px', marginTop: '4px', display: 'block' }}>
              {t('usernameHint')}
            </small>
          </div>
          <div className={styles.inputGroup}>
            <label className={styles.label}>{t('email')}</label>
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
            <label className={styles.label}>{t('password')}</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className={styles.input}
            />
            <small style={{ color: '#64748b', fontSize: '12px', marginTop: '4px', display: 'block' }}>
              {t('passwordLenErr')}
            </small>
            {strength && (
              <div style={{ marginTop: '8px' }}>
                <div style={{ display: 'flex', gap: '4px', marginBottom: '4px' }}>
                  {[1,2,3,4].map(i => (
                    <div key={i} style={{
                      flex: 1,
                      height: '4px',
                      background: i <= strength.bars ? strength.color : '#e2e8f0',
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

          {/* Captcha UI removed */}

          <button 
            type="submit" 
            disabled={loading}
            className={styles.submitButton}
            style={{
              opacity: loading ? 0.6 : 1,
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? t('registerBtn') + '...' : t('registerBtn')}
          </button>
        </form>
        <div className={styles.footer}>
          <span className={styles.footerText}>{t('haveAccount')} </span>
          <button onClick={() => navigate('/login')} className={styles.link}>{t('goLogin')}</button>
        </div>
      </div>
    </div>
  );
};

export default Register;
