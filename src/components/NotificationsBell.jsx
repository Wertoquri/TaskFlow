import React, { useEffect, useState, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
} from "../api";
import { useI18n } from "../context/I18nContext.jsx";
import NotificationCard from "./NotificationCard.jsx";
import ProjectInviteCard from "./ProjectInviteCard.jsx";
import useMobileMenuPosition from "./useMobileMenuPosition.js";
import { Bell, Check, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotificationsBell({ isOpen, onToggle }) {
  const { token, socket } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const { t } = useI18n();
  const rootRef = useRef(null);
  const { triggerRef, menuStyle } = useMobileMenuPosition(isOpen, {
    maxWidth: 360,
  });

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
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
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
        prev.map((n) => (n.id === id ? { ...n, is_read: 1 } : n)),
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
      <Button
        ref={triggerRef}
        title={t("notificationsTitle")}
        aria-label={`${t("notificationsTitle")} (${unreadCount})`}
        aria-expanded={isOpen}
        onClick={onToggle}
        variant="ghost"
        size="icon-lg"
        className="workspaceIconButton"
      >
        <Bell aria-hidden="true" />
        {unreadCount > 0 && (
          <span className="workspaceIconCount" aria-hidden="true">
            {unreadCount}
          </span>
        )}
      </Button>
      {isOpen && (
        <div className="workspaceDropdown" style={menuStyle || undefined}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "12px",
            }}
          >
            <div className="workspaceDropdownTitle">
              {t("notificationsTitle")}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={onMarkAllAsRead}
                className="workspaceDropdownSecondary"
              >
                {t("markAllRead")}
              </button>
            )}
          </div>
          {notifications.length === 0 ? (
            <div className="workspaceDropdownEmpty">{t("noNotifications")}</div>
          ) : (
            notifications.map((notif) => {
              // Parse payload if it's a JSON string
              let parsedPayload = notif.payload;
              if (typeof parsedPayload === "string") {
                try {
                  parsedPayload = JSON.parse(parsedPayload);
                } catch {
                  // leave as string if not valid JSON
                }
              }

              const isProjectInvite =
                notif.type === "project_invite" &&
                parsedPayload &&
                typeof parsedPayload === "object";

              return (
                <div key={notif.id} style={{ marginBottom: 8 }}>
                  {isProjectInvite ? (
                    <ProjectInviteCard
                      data={parsedPayload}
                      createdAt={notif.created_at}
                    />
                  ) : (
                    <NotificationCard
                      title={notif.type}
                      body={
                        typeof parsedPayload === "string"
                          ? parsedPayload
                          : JSON.stringify(parsedPayload)
                      }
                      createdAt={notif.created_at}
                    />
                  )}
                  <div className="workspaceDropdownActions">
                    {!notif.is_read && (
                      <button
                        onClick={() => onMarkAsRead(notif.id)}
                        title={t("markAsRead") || "Позначити прочитаним"}
                        aria-label={t("markAsRead") || "Позначити прочитаним"}
                      >
                        <Check aria-hidden="true" size={14} />
                      </button>
                    )}
                    <button
                      onClick={() => onDelete(notif.id)}
                      title={t("delete")}
                      aria-label={t("delete")}
                      className="danger"
                    >
                      <Trash2 aria-hidden="true" size={14} />
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
