import React, { useEffect, useState, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { getProjectMessages, sendProjectMessage, updateProjectMessage, deleteProjectMessage, API_URL } from "../api";
import { useI18n } from "../context/I18nContext.jsx";
import styles from "./ProjectPage.module.css";

export default function ProjectChat({ projectId }) {
  const { token, user, socket } = useAuth();
  const { t } = useI18n();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editContent, setEditContent] = useState("");
  const messagesEndRef = useRef(null);

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
        if (prev.find(m => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
      scrollToBottom();
    };
    const handleUpdate = ({ id, content }) => {
      setMessages((prev) => prev.map(m => m.id === id ? { ...m, content } : m));
    };
    const handleDelete = ({ id }) => {
      setMessages((prev) => prev.filter(m => m.id !== id));
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
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
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
        if (prev.find(m => m.id === newMessage.id)) return prev;
        return [...prev, newMessage];
      });
      scrollToBottom();
    } catch (err) {
      console.error("Failed to send message:", err);
      alert(t('sendMessageError'));
    }
  }

  function startEdit(msg) {
    setEditingId(msg.id);
    setEditContent(msg.content);
  }

  async function handleEdit() {
    if (!editContent.trim()) return;
    try {
      await updateProjectMessage(projectId, editingId, editContent.trim(), token);
      setMessages((prev) => prev.map(m => m.id === editingId ? { ...m, content: editContent.trim() } : m));
      setEditingId(null);
      setEditContent("");
    } catch (err) {
      console.error("Failed to edit message:", err);
      alert(t('editMessageError'));
    }
  }

  function cancelEdit() {
    setEditingId(null);
    setEditContent("");
  }

  async function handleDelete(msgId) {
    if (!confirm(t('confirmDeleteMessage'))) return;
    try {
      await deleteProjectMessage(projectId, msgId, token);
      setMessages((prev) => prev.filter(m => m.id !== msgId));
    } catch (err) {
      console.error("Failed to delete message:", err);
      alert(t('deleteMessageError'));
    }
  }

  return (
    <div
      className={`${styles.panel} ${styles.chatPanel}`}
      style={{
        background: "#fff",
        border: "none",
        borderRadius: "16px",
        padding: "24px",
        boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
        height: "500px",
      }}
    >
      <h3 style={{ margin: "0 0 16px 0", fontSize: "18px", fontWeight: 700, color: "#1e293b" }}>
        {t('projectChatTitle')}
      </h3>

      <div
        className={styles.messagesPane}
        style={{
          background: "#f8fafc",
          borderRadius: "6px",
        }}
      >
        {loading ? (
          <div style={{ color: "#64748b", textAlign: "center", padding: "20px" }}>
            {t('messagesLoading')}
          </div>
        ) : messages.length === 0 ? (
          <div style={{ color: "#64748b", textAlign: "center", padding: "20px" }}>
            {t('noMessagesYet')}
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.user_id === user?.id;
            const isEditing = editingId === msg.id;
            const avatarVal = msg.avatar || msg.avatar_url || null;
            const backendBase = API_URL.replace(/\/api$/i, '');
            const avatarSrc = avatarVal ? (avatarVal.startsWith('http') ? avatarVal : `${backendBase}${avatarVal}`) : null;
            const timeStr = new Date(msg.created_at).toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' });
            return (
              <div key={msg.id} className={`${styles.messageRow} ${isMe ? styles.messageRowOwn : styles.messageRowOther}`}>
                <div className={styles.messageInner}>
                  {avatarSrc && (
                    <img src={avatarSrc} alt={msg.username || 'avatar'} style={{ width: 28, height: 28, borderRadius: 14, objectFit: 'cover', border: '2px solid #ffffff', boxShadow: '0 0 0 1px rgba(15,23,42,0.06)' }} />
                  )}
                  <div className={`${styles.messageBubble} ${isMe ? styles.messageBubbleOwn : styles.messageBubbleOther}`}>
                    {!isMe && <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4, opacity: 0.8 }}>{msg.username || `${t('userHash')}${msg.user_id}`}</div>}
                    {isEditing ? (
                      <div>
                        <input type="text" value={editContent} onChange={(e) => setEditContent(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleEdit()} style={{ width: '100%', padding: '6px 8px', border: '1px solid #cbd5e1', borderRadius: 4, marginBottom: 6, fontSize: 14 }} autoFocus />
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button onClick={handleEdit} style={{ padding: '4px 10px', background: '#10b981', color: '#fff', border: 'none', borderRadius: 4, fontSize: 12, cursor: 'pointer' }}>✓ {t('save')}</button>
                          <button onClick={cancelEdit} style={{ padding: '4px 10px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: 4, fontSize: 12, cursor: 'pointer' }}>✕ {t('cancelAction')}</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div style={{ fontSize: 14, wordBreak: 'break-word' }}>{msg.content}</div>
                        <div className={styles.messageMeta} style={{ fontSize: 11, marginTop: 4, opacity: 0.7 }}>
                          <span>{timeStr}</span>
                          {isMe && (
                            <div style={{ display: 'flex', gap: 6, marginLeft: 8 }}>
                              <button onClick={() => startEdit(msg)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 14, padding: 2 }} title={t('editTitle')}>✏️</button>
                              <button onClick={() => handleDelete(msg.id)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 14, padding: 2 }} title={t('deleteTitle')}>🗑️</button>
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
        <div ref={messagesEndRef} />
      </div>

      <form
        onSubmit={handleSend}
        className={styles.chatComposer}
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t('messagePlaceholder')}
          className={styles.chatInput}
          style={{
            padding: "10px 14px",
            border: "1px solid #cbd5e1",
            borderRadius: "8px",
            fontSize: "14px",
            outline: "none",
          }}
          autoComplete="off"
        />
        <button
          type="submit"
          disabled={!input.trim()}
          className={styles.primaryButton}
          style={{
            background: input.trim() ? "#3b82f6" : "#cbd5e1",
            cursor: input.trim() ? "pointer" : "not-allowed",
          }}
        >
          📤 {t('send')}
        </button>
      </form>
    </div>
  );
}
