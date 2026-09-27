import React, { useEffect, useState, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import {
  getProjectMessages,
  sendProjectMessage,
  updateProjectMessage,
  deleteProjectMessage,
  API_URL,
} from "../api";
import { useI18n } from "../context/I18nContext.jsx";
import styles from "./ProjectPage.module.css";
import { Check, MessageCircle, Pencil, Send, Trash2, X } from "lucide-react";

const cleanLabel = (value) =>
  String(value || "").replace(/^[^\p{L}\p{N}]+/u, "");

export default function ProjectChat({ projectId }) {
  const { token, user, socket } = useAuth();
  const { t } = useI18n();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editContent, setEditContent] = useState("");
  const messagesPaneRef = useRef(null);

  async function loadMessages() {
    if (!token || !projectId) return;
    setLoading(true);
    try {
      const rows = await getProjectMessages(projectId, token);
      setMessages(rows || []);
    } catch (err) {
      console.error("Failed to load messages:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMessages();
  }, [token, projectId]);

  useEffect(() => {
    if (!socket) return;
    const handleNew = (msg) => {
      setMessages((prev) => {
        if (prev.find((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    };
    const handleUpdate = ({ id, content }) => {
      setMessages((prev) =>
        prev.map((m) => (m.id === id ? { ...m, content } : m)),
      );
    };
    const handleDelete = ({ id }) => {
      setMessages((prev) => prev.filter((m) => m.id !== id));
    };
    socket.on("chat:message", handleNew);
    socket.on("chat:updated", handleUpdate);
    socket.on("chat:deleted", handleDelete);
    return () => {
      socket.off("chat:message", handleNew);
      socket.off("chat:updated", handleUpdate);
      socket.off("chat:deleted", handleDelete);
    };
  }, [socket]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  function scrollToBottom() {
    const pane = messagesPaneRef.current;
    if (pane) pane.scrollTop = pane.scrollHeight;
  }

  async function handleSend(e) {
    e.preventDefault();
    if (!input.trim()) return;
    const content = input.trim();
    setInput("");
    try {
      const newMessage = await sendProjectMessage(projectId, content, token);
      // Add message immediately (will be deduplicated if socket sends it again)
      setMessages((prev) => {
        if (prev.find((m) => m.id === newMessage.id)) return prev;
        return [...prev, newMessage];
      });
    } catch (err) {
      console.error("Failed to send message:", err);
      alert(t("sendMessageError"));
    }
  }

  function startEdit(msg) {
    setEditingId(msg.id);
    setEditContent(msg.content);
  }

  async function handleEdit() {
    if (!editContent.trim()) return;
    try {
      await updateProjectMessage(
        projectId,
        editingId,
        editContent.trim(),
        token,
      );
      setMessages((prev) =>
        prev.map((m) =>
          m.id === editingId ? { ...m, content: editContent.trim() } : m,
        ),
      );
      setEditingId(null);
      setEditContent("");
    } catch (err) {
      console.error("Failed to edit message:", err);
      alert(t("editMessageError"));
    }
  }

  function cancelEdit() {
    setEditingId(null);
    setEditContent("");
  }

  async function handleDelete(msgId) {
    if (!confirm(t("confirmDeleteMessage"))) return;
    try {
      await deleteProjectMessage(projectId, msgId, token);
      setMessages((prev) => prev.filter((m) => m.id !== msgId));
    } catch (err) {
      console.error("Failed to delete message:", err);
      alert(t("deleteMessageError"));
    }
  }

  return (
    <div className={`${styles.panel} ${styles.chatPanel}`}>
      <h3 className={styles.sectionTitle}>
        <MessageCircle aria-hidden="true" size={18} />
        {cleanLabel(t("projectChatTitle"))}
      </h3>

      <div className={styles.messagesPane} ref={messagesPaneRef}>
        {loading ? (
          <div className={styles.panelNotice}>{t("messagesLoading")}</div>
        ) : messages.length === 0 ? (
          <div className={styles.panelNotice}>{t("noMessagesYet")}</div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.user_id === user?.id;
            const isEditing = editingId === msg.id;
            const avatarVal = msg.avatar || msg.avatar_url || null;
            const backendBase = API_URL.replace(/\/api$/i, "");
            const avatarSrc = avatarVal
              ? avatarVal.startsWith("http")
                ? avatarVal
                : `${backendBase}${avatarVal}`
              : null;
            const timeStr = new Date(msg.created_at).toLocaleTimeString(
              "uk-UA",
              { hour: "2-digit", minute: "2-digit" },
            );
            return (
              <div
                key={msg.id}
                className={`${styles.messageRow} ${isMe ? styles.messageRowOwn : styles.messageRowOther}`}
              >
                <div className={styles.messageInner}>
                  {avatarSrc && (
                    <img
                      src={avatarSrc}
                      alt={msg.username || "avatar"}
                      className={styles.chatAvatar}
                    />
                  )}
                  <div
                    className={`${styles.messageBubble} ${isMe ? styles.messageBubbleOwn : styles.messageBubbleOther}`}
                  >
                    {!isMe && (
                      <div className={styles.chatAuthor}>
                        {msg.username || `${t("userHash")}${msg.user_id}`}
                      </div>
                    )}
                    {isEditing ? (
                      <div>
                        <input
                          type="text"
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && handleEdit()}
                          className={styles.chatInput}
                          autoFocus
                        />
                        <div className={styles.editActions}>
                          <button
                            onClick={handleEdit}
                            className={`${styles.ghostButton} ${styles.successButton}`}
                          >
                            <Check aria-hidden="true" size={14} />
                            {cleanLabel(t("save"))}
                          </button>
                          <button
                            onClick={cancelEdit}
                            className={styles.ghostButton}
                          >
                            <X aria-hidden="true" size={14} />
                            {cleanLabel(t("cancelAction"))}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className={styles.messageText}>{msg.content}</div>
                        <div className={styles.messageMeta}>
                          <span>{timeStr}</span>
                          {isMe && (
                            <div className={styles.messageActions}>
                              <button
                                onClick={() => startEdit(msg)}
                                title={t("editTitle")}
                                aria-label={t("editTitle")}
                              >
                                <Pencil aria-hidden="true" size={14} />
                              </button>
                              <button
                                onClick={() => handleDelete(msg.id)}
                                title={t("deleteTitle")}
                                aria-label={t("deleteTitle")}
                              >
                                <Trash2 aria-hidden="true" size={14} />
                              </button>
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <form onSubmit={handleSend} className={styles.chatComposer}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t("messagePlaceholder")}
          className={styles.chatInput}
          autoComplete="off"
          aria-label={t("messagePlaceholder")}
        />
        <button
          type="submit"
          disabled={!input.trim()}
          className={styles.primaryButton}
        >
          <Send aria-hidden="true" size={15} />
          {cleanLabel(t("send"))}
        </button>
      </form>
    </div>
  );
}
