import React, { useState } from "react";
import { createInvitation } from "../api";

export default function InviteUserPanel({ projectId, token, onSuccess }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleInvite(e) {
    e.preventDefault();
    if (!email.trim()) {
      setError("Введіть email");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      await createInvitation(projectId, email.trim(), token);
      setSuccess(`Запрошення надіслано на ${email}`);
      setEmail("");
      onSuccess && onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || "Помилка відправки запрошення");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        background: "#fff",
        border: "none",
        borderRadius: "16px",
        padding: "24px",
        boxShadow: "0 4px 6px rgba(0,0,0,0.1)"
      }}
    >
      <h3 style={{ margin: "0 0 16px 0", fontSize: "18px", fontWeight: 700, color: "#1e293b" }}>
        🔗 Запросити користувача
      </h3>
      <form onSubmit={handleInvite} style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
        <div style={{ flex: 1 }}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Введіть email користувача"
            disabled={loading}
            style={{
              width: "100%",
              padding: "10px 12px",
              border: "1px solid #cbd5e1",
              borderRadius: "6px",
              fontSize: "14px",
              boxSizing: "border-box",
            }}
          />
          {error && (
            <div style={{ color: "#ef4444", fontSize: "13px", marginTop: "6px" }}>
              ❌ {error}
            </div>
          )}
          {success && (
            <div style={{ color: "#10b981", fontSize: "13px", marginTop: "6px" }}>
              ✅ {success}
            </div>
          )}
        </div>
        <button
          type="submit"
          disabled={loading}
          style={{
            padding: "10px 20px",
            background: loading ? "#94a3b8" : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            color: "#fff",
            border: "none",
            borderRadius: "10px",
            fontSize: "14px",
            fontWeight: 600,
            cursor: loading ? "not-allowed" : "pointer",
            whiteSpace: "nowrap",
            boxShadow: loading ? "none" : "0 2px 4px rgba(102,126,234,0.3)",
            transition: "all 0.3s",
          }}
        >
          {loading ? "Відправка..." : "Запросити"}
        </button>
      </form>
    </div>
  );
}
