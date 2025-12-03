import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getNotifications, markNotificationAsRead, markAllNotificationsAsRead, deleteNotification } from "../api";
import { useI18n } from "../context/I18nContext.jsx";

export default function NotificationsBell({ isOpen, onToggle }) {
  const { token, socket } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const { t } = useI18n();

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
    <div style={{ position: "relative" }}>
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
            minWidth: "320px",
            maxWidth: "400px",
            maxHeight: "500px",
            overflowY: "auto",
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
            notifications.map((notif) => (
              <div
                key={notif.id}
                style={{
                  padding: "10px",
                  marginBottom: "8px",
                  background: notif.is_read ? "#f8fafc" : "#eff6ff",
                  border: `1px solid ${notif.is_read ? "#e2e8f0" : "#bfdbfe"}`,
                  borderRadius: "6px",
                  fontSize: "14px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, marginBottom: "4px" }}>
                      {notif.type}
                    </div>
                    <div style={{ color: "#475569", fontSize: "13px" }}>
                      {typeof notif.payload === "string"
                        ? notif.payload
                        : JSON.stringify(notif.payload)}
                    </div>
                    <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "6px" }}>
                      {new Date(notif.created_at).toLocaleString("uk-UA")}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "6px", marginLeft: "8px" }}>
                    {!notif.is_read && (
                      <button
                        onClick={() => onMarkAsRead(notif.id)}
                        title="Позначити прочитаним"
                        style={{
                          fontSize: "16px",
                          padding: "4px",
                          background: "transparent",
                          border: "none",
                          cursor: "pointer",
                        }}
                      >
                        ✓
                      </button>
                    )}
                    <button
                      onClick={() => onDelete(notif.id)}
                      title="Видалити"
                      style={{
                        fontSize: "16px",
                        padding: "4px",
                        background: "transparent",
                        border: "none",
                        cursor: "pointer",
                      }}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
