import React, { useEffect, useId, useState } from 'react';
import { verifyEmail, resendVerificationCode } from '../api';
import { useI18n } from '../context/I18nContext.jsx';
import styles from './VerifyEmail.module.css';

const cleanLabel = (value) => String(value || '').replace(/^[^\p{L}\p{N}]+/u, '');

export default function VerifyEmail({ userId, email, onVerified, demoCode = '' }) {
  const [code, setCode] = useState(demoCode);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState(demoCode ? `Demo code: ${demoCode}` : '');
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const { t } = useI18n();
  const codeId = useId();

  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const id = window.setInterval(() => setCooldown((seconds) => Math.max(0, seconds - 1)), 1000);
    return () => window.clearInterval(id);
  }, [cooldown]);

  async function handleVerify(event) {
    event.preventDefault();
    if (code.length !== 6) {
      setError(t('sixDigitsPrompt'));
      return;
    }
    setLoading(true);
    setError('');
    try {
      const data = await verifyEmail(userId, code);
      onVerified?.(data);
    } catch (requestError) {
      setError(requestError.response?.data?.message || t('verifyError'));
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    setResending(true);
    setError('');
    setNotice('');
    try {
      const response = await resendVerificationCode(userId);
      setCooldown(response.retryAfter || 60);
      if (response.verificationCode) {
        setCode(response.verificationCode);
        setNotice(`Demo code: ${response.verificationCode}`);
      } else {
        setNotice(cleanLabel(t('resendSuccess')));
      }
    } catch (requestError) {
      setError(requestError.response?.data?.message || t('resendError'));
    } finally {
      setResending(false);
    }
  }

  return (
    <main className={styles.page}>
      <section className={styles.card} aria-labelledby="verify-email-title">
        <header className={styles.header}>
          <span className={styles.icon} aria-hidden="true">
            <svg viewBox="0 0 24 24"><path d="M3 6.5h18v11H3zM3.5 7l8.5 6L20.5 7" /></svg>
          </span>
          <p className={styles.eyebrow}>TaskFlow / Secure access</p>
          <h1 id="verify-email-title">{cleanLabel(t('verifyEmailTitle'))}</h1>
          <p>{t('verifyEmailSentTo')} <strong>{email}</strong></p>
        </header>

        <form onSubmit={handleVerify} className={styles.form} noValidate>
          <label htmlFor={codeId}>{t('verificationCode')}</label>
          <input id={codeId} type="text" inputMode="numeric" autoComplete="one-time-code" value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="000000" maxLength={6} aria-invalid={Boolean(error)} aria-describedby={error ? `${codeId}-error` : undefined} autoFocus />
          {error && <p id={`${codeId}-error`} className={styles.error} role="alert">{error}</p>}
          {notice && <p className={styles.notice} role="status">{notice}</p>}
          <button className={styles.primary} type="submit" disabled={loading || code.length !== 6}>{loading ? t('verifying') : t('verify')}</button>
          <button className={styles.secondary} type="button" onClick={handleResend} disabled={resending || cooldown > 0}>{resending ? t('resending') : cooldown > 0 ? `${cleanLabel(t('resendIn'))} ${cooldown}s` : cleanLabel(t('resend'))}</button>
        </form>
        <p className={styles.tip}>{cleanLabel(t('tipSpam'))}</p>
      </section>
    </main>
  );
}
