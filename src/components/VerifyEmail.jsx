import React, { useEffect, useState } from "react";
import { verifyEmail, resendVerificationCode } from '../api';
import { useI18n } from '../context/I18nContext.jsx';

export default function VerifyEmail({ userId, email, onVerified }) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0); // сек до наступного ресенду
  const { t } = useI18n();

  // Тікер для відліку часу блокування на клієнті
  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setInterval(() => setCooldown((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, [cooldown]);

  async function handleVerify(e) {
    e.preventDefault();
    if (!code || code.length !== 6) {
      setError(t('sixDigitsPrompt'));
      return;
    }

    setLoading(true);
    setError("");

    try {
      const data = await verifyEmail(userId, code);
      if (onVerified) {
        onVerified(data);
      }
    } catch (err) {
      setError(err.response?.data?.message || t('verifyError'));
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    setResending(true);
    setError("");

    try {
      await resendVerificationCode(userId);
      setCooldown(60); // локальний таймер
      alert(t('resendSuccess'));
    } catch (err) {
      setError(err.response?.data?.message || t('resendError'));
    } finally {
      setResending(false);
    }
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "20px"
    }}>
      <div style={{
        background: "#fff",
        borderRadius: "16px",
        padding: "40px",
        maxWidth: "400px",
        width: "100%",
        boxShadow: "0 8px 24px rgba(0,0,0,0.15)"
      }}>
        <div style={{ textAlign: "center", marginBottom: "30px" }}>
          <h1 style={{ fontSize: "28px", fontWeight: 700, color: "#1e293b", marginBottom: "10px" }}>
            {t('verifyEmailTitle')}
          </h1>
          <p style={{ color: "#64748b", fontSize: "14px", lineHeight: "1.6" }}>
            {t('verifyEmailSentTo')}<br />
            <strong>{email}</strong>
          </p>
        </div>

        <form onSubmit={handleVerify}>
          <div style={{ marginBottom: "20px" }}>
            <label style={{
              display: "block",
              marginBottom: "8px",
              color: "#475569",
              fontSize: "14px",
              fontWeight: 600
            }}>
              {t('verificationCode')}
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="000000"
              maxLength={6}
              style={{
                width: "100%",
                padding: "14px",
                fontSize: "20px",
                fontWeight: 600,
                textAlign: "center",
                letterSpacing: "8px",
                border: "2px solid #e2e8f0",
                borderRadius: "8px",
                outline: "none",
                transition: "all 0.3s",
                boxSizing: "border-box"
              }}
              onFocus={(e) => e.target.style.borderColor = "#667eea"}
              onBlur={(e) => e.target.style.borderColor = "#e2e8f0"}
            />
          </div>

          {error && (
            <div style={{
              padding: "12px",
              background: "#fee2e2",
              color: "#dc2626",
              borderRadius: "8px",
              fontSize: "14px",
              marginBottom: "20px"
            }}>
              ❌ {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || code.length !== 6}
            style={{
              width: "100%",
              padding: "14px",
              background: loading || code.length !== 6 ? "#94a3b8" : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              color: "#fff",
              border: "none",
              borderRadius: "10px",
              fontSize: "16px",
              fontWeight: 600,
              cursor: loading || code.length !== 6 ? "not-allowed" : "pointer",
              transition: "all 0.3s",
              boxShadow: loading || code.length !== 6 ? "none" : "0 4px 12px rgba(102,126,234,0.4)",
              marginBottom: "16px"
            }}
          >
            {loading ? t('verifying') : t('verify')}
          </button>

          <button
            type="button"
            onClick={handleResend}
            disabled={resending || cooldown > 0}
            style={{
              width: "100%",
              padding: "12px",
              background: "transparent",
              color: "#667eea",
              border: "2px solid #667eea",
              borderRadius: "10px",
              fontSize: "14px",
              fontWeight: 600,
              cursor: resending || cooldown > 0 ? "not-allowed" : "pointer",
              transition: "all 0.3s"
            }}
          >
            {resending ? t('resending') : cooldown > 0 ? `${t('resendIn')} ${cooldown}s` : t('resend')}
          </button>
        </form>

        <div style={{
          marginTop: "24px",
          padding: "16px",
          background: "#f1f5f9",
          borderRadius: "8px",
          fontSize: "13px",
          color: "#64748b",
          lineHeight: "1.6"
        }}>
          {t('tipSpam')}
        </div>
      </div>
    </div>
  );
}
