import React, { useEffect, useState, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { getNotifications, markNotificationAsRead, markAllNotificationsAsRead, deleteNotification } from "../api";
import { useI18n } from "../context/I18nContext.jsx";
import NotificationCard from "./NotificationCard.jsx";
import ProjectInviteCard from "./ProjectInviteCard.jsx";

export default function NotificationsBell({ isOpen, onToggle }) {
  const { token, socket } = useAuth();
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
      // New notification received via socket
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
        🔔 
        {unreadCount > 0 && (
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
            {unreadCount}
          </span>
        )}
      </button>
      {isOpen && (
        <div
          style={{
            position: "absolute",
            right: 0,
            top: "120%",
            background: "#fff",
            border: "1px solid #e2e8f0",
            borderRadius: "8px",
            padding: "12px",
            width: "min(320px, calc(100vw - 2rem))",
            maxWidth: "calc(100vw - 2rem)",
            maxHeight: "500px",
            overflowY: "auto",
            boxSizing: "border-box",
            boxShadow: "0 8px 24px rgba(0,0,0,.12)",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "12px",
            }}
          >
            <div style={{ fontWeight: 700, fontSize: "16px" }}>{t('notificationsTitle')}</div>
            {unreadCount > 0 && (
              <button
                onClick={onMarkAllAsRead}
                style={{
                  fontSize: "12px",
                  padding: "4px 8px",
                  background: "#e2e8f0",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                }}
              >
                {t('markAllRead')}
              </button>
            )}
          </div>
          {notifications.length === 0 ? (
            <div style={{ color: "#64748b", textAlign: "center", padding: "16px" }}>
              {t('noNotifications')}
            </div>
          ) : (
            notifications.map((notif) => {
              // Parse payload if it's a JSON string
              let parsedPayload = notif.payload;
              if (typeof parsedPayload === 'string') {
                try {
                  parsedPayload = JSON.parse(parsedPayload);
                } catch {
                  // leave as string if not valid JSON
                }
              }

              const isProjectInvite = notif.type === 'project_invite' && parsedPayload && typeof parsedPayload === 'object';

              return (
                <div key={notif.id} style={{ marginBottom: 8 }}>
                  {isProjectInvite ? (
                    <ProjectInviteCard data={parsedPayload} createdAt={notif.created_at} />
                  ) : (
                    <NotificationCard
                      title={notif.type}
                      body={typeof parsedPayload === 'string' ? parsedPayload : JSON.stringify(parsedPayload)}
                      createdAt={notif.created_at}
                    />
                  )}
                  <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', marginTop: 6 }}>
                    {!notif.is_read && (
                      <button
                        onClick={() => onMarkAsRead(notif.id)}
                        title={t('markAsRead') || 'Позначити прочитаним'}
                        style={{ fontSize: 14, padding: '4px 8px', background: '#e2e8f0', border: 'none', borderRadius: 6, cursor: 'pointer' }}
                      >
                        ✓
                      </button>
                    )}
                    <button
                      onClick={() => onDelete(notif.id)}
                      title={t('delete')}
                      style={{ fontSize: 14, padding: '4px 8px', background: '#fee2e2', border: 'none', borderRadius: 6, cursor: 'pointer' }}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
