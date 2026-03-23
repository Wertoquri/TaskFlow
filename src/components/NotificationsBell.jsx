import React, { useEffect, useState, useRef } from "react";
import { useAuthApi } from "../context/authApi";
import { getNotifications, markNotificationAsRead, markAllNotificationsAsRead, deleteNotification } from "../api";
import { useI18n } from "../context/I18nContext.jsx";
import NotificationCard from "./NotificationCard.jsx";
import ProjectInviteCard from "./ProjectInviteCard.jsx";

export default function NotificationsBell({ isOpen, onToggle }) {
  const auth = useAuthApi();
  const token = auth.token ?? (typeof auth.getToken === 'function' ? auth.getToken() : undefined);
  const socket = auth.socket ?? (typeof auth.getSocket === 'function' ? auth.getSocket() : undefined);
  const [notifications, setNotifications] = useState([]);
  const { t } = useI18n();
  const rootRef = useRef(null);

  async function load() {
    if (!token) return;
    try {
      const rows = await getNotifications(token);
      setNotifications(rows || []);
    } catch (err) {
      console.error("Failed to load notifications:", err);
    }
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
      setNotifications((prev) => [payload, ...prev]);
    };
    socket.on("notification:new", handler);
    return () => socket.off("notification:new", handler);
  }, [socket]);

  async function onMarkAsRead(id) {
    try {
      await markNotificationAsRead(id, token);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: 1 } : n))
      );
    } catch (err) {
      console.error("Failed to mark as read:", err);
    }
  }

  async function onMarkAllAsRead() {
    try {
      await markAllNotificationsAsRead(token);
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: 1 })));
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    }
  }

  async function onDelete(id) {
    try {
      await deleteNotification(id, token);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (err) {
      console.error("Failed to delete notification:", err);
    }
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div style={{ position: "relative" }} ref={rootRef}>
      <button
        title={t('notificationsTitle')}
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
          🔔
          {unreadCount > 0 && (
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
              {unreadCount > 99 ? '99+' : unreadCount}
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
            minWidth: "360px",
            maxWidth: "440px",
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
              🔔 {t('notificationsTitle')}
              {unreadCount > 0 && (
                <span style={{
                  background: "#ef4444",
                  color: "#fff",
                  borderRadius: "50%",
                  padding: "2px 8px",
                  fontSize: "11px",
                  fontWeight: 700
                }}>
                  {unreadCount}
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={onMarkAllAsRead}
                style={{
                  fontSize: "12px",
                  padding: "6px 12px",
                  background: "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)",
                  color: "#fff",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontWeight: 600,
                  transition: "all 0.2s",
                  boxShadow: "0 2px 6px rgba(34,197,94,0.3)"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-1px)";
                  e.currentTarget.style.boxShadow = "0 3px 8px rgba(34,197,94,0.4)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 2px 6px rgba(34,197,94,0.3)";
                }}
              >
                ✓ {t('markAllRead')}
              </button>
            )}
          </div>
          
          {/* Content */}
          <div style={{ padding: "16px" }}>
            {notifications.length === 0 ? (
              <div style={{ 
                color: "#64748b", 
                textAlign: "center", 
                padding: "32px 16px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "12px"
              }}>
                <span style={{ fontSize: "48px" }}>🔔</span>
                <div style={{ fontSize: "14px", fontWeight: 500 }}>{t('noNotifications')}</div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {notifications.map((notif) => {
                  let parsedPayload = notif.payload;
                  if (typeof parsedPayload === 'string') {
                    try {
                      parsedPayload = JSON.parse(parsedPayload);
                    } catch {
                      // leave as string
                    }
                  }

                  const isProjectInvite = notif.type === 'project_invite' && parsedPayload && typeof parsedPayload === 'object';

                  return (
                    <div key={notif.id} style={{
                      position: "relative",
                      opacity: notif.is_read ? 0.85 : 1,
                      transition: "all 0.2s"
                    }}>
                      {!notif.is_read && (
                        <div style={{
                          position: "absolute",
                          left: "-8px",
                          top: "50%",
                          transform: "translateY(-50%)",
                          width: "8px",
                          height: "8px",
                          borderRadius: "50%",
                          background: "#3b82f6",
                          boxShadow: "0 0 8px rgba(59,130,246,0.6)"
                        }} />
                      )}
                      <div style={{ paddingLeft: !notif.is_read ? "12px" : "0" }}>
                        {isProjectInvite ? (
                          <ProjectInviteCard data={parsedPayload} createdAt={notif.created_at} />
                        ) : (
                          <NotificationCard
                            title={notif.type}
                            body={typeof parsedPayload === 'string' ? parsedPayload : JSON.stringify(parsedPayload)}
                            createdAt={notif.created_at}
                          />
                        )}
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '8px' }}>
                          {!notif.is_read && (
                            <button
                              onClick={() => onMarkAsRead(notif.id)}
                              title={t('markAsRead') || 'Позначити прочитаним'}
                              style={{ 
                                fontSize: 12, 
                                padding: '6px 12px', 
                                background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)', 
                                color: '#fff',
                                border: 'none', 
                                borderRadius: '8px', 
                                cursor: 'pointer',
                                fontWeight: 600,
                                transition: 'all 0.2s'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-1px)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                              }}
                            >
                              ✓
                            </button>
                          )}
                          <button
                            onClick={() => onDelete(notif.id)}
                            title={t('delete')}
                            style={{ 
                              fontSize: 12, 
                              padding: '6px 12px', 
                              background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', 
                              color: '#fff',
                              border: 'none', 
                              borderRadius: '8px', 
                              cursor: 'pointer',
                              fontWeight: 600,
                              transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.transform = 'translateY(-1px)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = 'translateY(0)';
                            }}
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
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
