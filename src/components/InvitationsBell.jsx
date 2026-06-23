import React, { useEffect, useState, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { getMyInvitations, acceptInvitation, declineInvitation } from "../api";
import { useI18n } from "../context/I18nContext.jsx";
import ProjectInviteCard from "./ProjectInviteCard.jsx";

export default function InvitationsBell({ isOpen, onToggle }) {
  const { token, user, socket } = useAuth();
  const [invites, setInvites] = useState([]);
  const { t } = useI18n();
  const rootRef = useRef(null);

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

  // close when clicking outside
  useEffect(() => {
    function onDocClick(e) {
      if (!isOpen) return;
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target)) {
        onToggle();
      }
    }
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, [isOpen, onToggle]);

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
    <div style={{ position: "relative" }} ref={rootRef}>
      <button 
        title={t('invitationsTitle')} 
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
        <div style={{ position: "absolute", right: 0, top: "120%", background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, padding: 8, width: "min(260px, calc(100vw - 2rem))", maxWidth: "calc(100vw - 2rem)", boxSizing: "border-box", boxShadow: "0 8px 24px rgba(0,0,0,.12)", zIndex: 1000 }}>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>{t('invitationsTitle')}</div>
          {invites.length === 0 ? (
            <div style={{ color: "#64748b" }}>{t('noInvitations')}</div>
          ) : (
            invites.map((inv) => (
              <div key={inv.id} style={{ display: "flex", flexDirection: 'column', gap: 8, padding: "6px 0" }}>
                <ProjectInviteCard
                  data={{ sender_id: inv.sender_id, project_id: inv.project_id, project_name: inv.project_name, invitation_id: inv.id }}
                  createdAt={inv.created_at}
                />
                <div style={{ display: "flex", gap: 6, alignSelf: 'flex-end' }}>
                  <button onClick={() => onAccept(inv.id)} title={t('accept')}>✅</button>
                  <button onClick={() => onDecline(inv.id)} title={t('decline')}>❌</button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
