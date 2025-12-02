import React, { useState } from "react";
import { verifyEmail, resendVerificationCode } from '../api';

export default function VerifyEmail({ userId, email, onVerified }) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resending, setResending] = useState(false);

  async function handleVerify(e) {
    e.preventDefault();
    if (!code || code.length !== 6) {
      setError("Введіть 6-значний код");
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
      setError(err.response?.data?.message || "Помилка підтвердження");
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    setResending(true);
    setError("");

    try {
      await resendVerificationCode(userId);
      alert("✅ Новий код надіслано на вашу пошту");
    } catch (err) {
      setError(err.response?.data?.message || "Помилка повторного надсилання");
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
            📧 Підтвердження Email
          </h1>
          <p style={{ color: "#64748b", fontSize: "14px", lineHeight: "1.6" }}>
            Ми надіслали 6-значний код на<br />
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
              Код підтвердження
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
            {loading ? "Перевірка..." : "Підтвердити"}
          </button>

          <button
            type="button"
            onClick={handleResend}
            disabled={resending}
            style={{
              width: "100%",
              padding: "12px",
              background: "transparent",
              color: "#667eea",
              border: "2px solid #667eea",
              borderRadius: "10px",
              fontSize: "14px",
              fontWeight: 600,
              cursor: resending ? "not-allowed" : "pointer",
              transition: "all 0.3s"
            }}
          >
            {resending ? "Надсилання..." : "🔄 Надіслати код повторно"}
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
          <strong>💡 Порада:</strong> Перевірте папку "Спам" якщо не отримали код протягом кількох хвилин.
        </div>
      </div>
    </div>
  );
}
