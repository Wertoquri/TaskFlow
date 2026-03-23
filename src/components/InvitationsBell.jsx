import React, { useEffect, useState, useRef } from "react";
import { useAuthApi } from "../context/authApi";
import { getMyInvitations, acceptInvitation, declineInvitation } from "../api";
import { useI18n } from "../context/I18nContext.jsx";
import ProjectInviteCard from "./ProjectInviteCard.jsx";

export default function InvitationsBell({ isOpen, onToggle }) {
  const auth = useAuthApi();
  const token = auth.token ?? (typeof auth.getToken === 'function' ? auth.getToken() : undefined);
  const user = typeof auth.getUser === 'function' ? auth.getUser() : auth.user;
  const socket = auth.socket ?? (typeof auth.getSocket === 'function' ? auth.getSocket() : undefined);
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
          padding: "12px 18px",
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          color: "#fff",
          border: "none",
          borderRadius: "12px",
          cursor: "pointer",
          fontWeight: 600,
          fontSize: "18px",
          boxShadow: "0 4px 14px rgba(102,126,234,0.4)",
          transition: "all 0.3s cubic-bezier(0.4,0,0.2,1)",
          display: "flex",
          alignItems: "center",
          gap: "8px"
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "translateY(-3px) scale(1.02)";
          e.currentTarget.style.boxShadow = "0 6px 20px rgba(102,126,234,0.5)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "translateY(0) scale(1)";
          e.currentTarget.style.boxShadow = "0 4px 14px rgba(102,126,234,0.4)";
        }}
      >
        <span style={{ position: "relative", display: "inline-block" }}>
          📨
          {count > 0 && (
            <span style={{
              position: "absolute",
              top: "-8px",
              right: "-8px",
              background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
              color: "#fff",
              borderRadius: "50%",
              padding: "3px 7px",
              fontSize: "11px",
              fontWeight: 800,
              minWidth: "22px",
              textAlign: "center",
              boxShadow: "0 2px 6px rgba(239,68,68,0.4)",
              animation: "pulse 2s infinite"
            }}>
              {count > 99 ? '99+' : count}
            </span>
          )}
        </span>
      </button>
      {isOpen && (
        <div
          style={{
            position: "absolute",
            right: 0,
            top: "calc(100% + 12px)",
            background: "#fff",
            border: "1px solid #e2e8f0",
            borderRadius: "16px",
            padding: "0",
            minWidth: "380px",
            maxWidth: "460px",
            maxHeight: "520px",
            overflowY: "auto",
            boxShadow: "0 12px 40px rgba(0,0,0,0.15)",
            zIndex: 1000,
          }}
        >
          {/* Header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "16px 20px",
              borderBottom: "1px solid #e2e8f0",
              background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)"
            }}
          >
            <div style={{
              fontWeight: 800,
              fontSize: "16px",
              color: "#1e293b",
              display: "flex",
              alignItems: "center",
              gap: "8px"
            }}>
              📨 {t('invitationsTitle')}
              {count > 0 && (
                <span style={{
                  background: "#ef4444",
                  color: "#fff",
                  borderRadius: "50%",
                  padding: "2px 8px",
                  fontSize: "11px",
                  fontWeight: 700
                }}>
                  {count}
                </span>
              )}
            </div>
          </div>

          {/* Content */}
          <div style={{ padding: "16px" }}>
            {invites.length === 0 ? (
              <div style={{
                color: "#64748b",
                textAlign: "center",
                padding: "32px 16px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "12px"
              }}>
                <span style={{ fontSize: "48px" }}>📨</span>
                <div style={{ fontSize: "14px", fontWeight: 500 }}>{t('noInvitations')}</div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                {invites.map((inv) => (
                  <div key={inv.id} style={{
                    position: "relative",
                    paddingBottom: "14px",
                    marginBottom: "14px",
                    borderBottom: "1px dashed #e2e8f0"
                  }}>
                    <ProjectInviteCard
                      data={{ sender_id: inv.sender_id, project_id: inv.project_id, project_name: inv.project_name, invitation_id: inv.id }}
                      createdAt={inv.created_at}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
      `}</style>
    </div>
  );
}
