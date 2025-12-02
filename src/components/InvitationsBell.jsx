import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getMyInvitations, acceptInvitation, declineInvitation } from "../api";

export default function InvitationsBell({ isOpen, onToggle }) {
  const { token, user, socket } = useAuth();
  const [invites, setInvites] = useState([]);

  async function load() {
    if (!token) return;
    try {
      const rows = await getMyInvitations(token);
      setInvites(rows || []);
    } catch {}
  }

  useEffect(() => {
    load();
  }, [token]);

  useEffect(() => {
    if (!socket) return;
    const handler = (payload) => {
      // new invite for current user
      load();
    };
    socket.on("invite:new", handler);
    return () => socket.off("invite:new", handler);
  }, [socket]);

  async function onAccept(id) {
    try {
      await acceptInvitation(id, token);
      setInvites((prev) => prev.filter((x) => x.id !== id));
    } catch {}
  }
  async function onDecline(id) {
    try {
      await declineInvitation(id, token);
      setInvites((prev) => prev.filter((x) => x.id !== id));
    } catch {}
  }

  const count = invites.length;

  return (
    <div style={{ position: "relative" }}>
      <button 
        title="Запрошення" 
        onClick={onToggle}
        style={{
          position: "relative",
          padding: "10px 16px",
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          color: "#fff",
          border: "none",
          borderRadius: "10px",
          cursor: "pointer",
          fontWeight: 600,
          fontSize: "16px",
          boxShadow: "0 2px 8px rgba(102,126,234,0.3)",
          transition: "all 0.3s",
          display: "flex",
          alignItems: "center",
          gap: "6px"
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "translateY(-2px)";
          e.currentTarget.style.boxShadow = "0 4px 12px rgba(102,126,234,0.4)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.boxShadow = "0 2px 8px rgba(102,126,234,0.3)";
        }}
      >
        📨
        {count > 0 && (
          <span style={{ 
            background: "#ef4444", 
            color: "#fff", 
            borderRadius: "50%", 
            padding: "2px 6px",
            fontSize: "12px",
            fontWeight: 700,
            minWidth: "20px",
            textAlign: "center"
          }}>
            {count}
          </span>
        )}
      </button>
      {isOpen && (
        <div style={{ position: "absolute", right: 0, top: "120%", background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, padding: 8, minWidth: 260, boxShadow: "0 8px 24px rgba(0,0,0,.12)" }}>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>Запрошення</div>
          {invites.length === 0 ? (
            <div style={{ color: "#64748b" }}>Немає нових запрошень</div>
          ) : (
            invites.map((inv) => (
              <div key={inv.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, padding: "6px 0" }}>
                <div>
                  <div style={{ fontWeight: 600 }}>Проєкт: {inv.project_name || inv.project_id}</div>
                  <div style={{ fontSize: 12, color: "#64748b" }}>Запрошення #{inv.id}</div>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button onClick={() => onAccept(inv.id)} title="Прийняти">✅</button>
                  <button onClick={() => onDecline(inv.id)} title="Відхилити">❌</button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
