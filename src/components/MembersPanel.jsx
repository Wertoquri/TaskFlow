import React, { useEffect, useState } from "react";
import { getProjectMembers, kickProjectMember, updateMemberPermissions } from "../api";
import { useI18n } from "../context/I18nContext.jsx";

export default function MembersPanel({ projectId }) {
  const token = localStorage.getItem('token');
  let user = null;
  try { user = JSON.parse(localStorage.getItem('user') || 'null'); } catch { user = null; }
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [tempPerms, setTempPerms] = useState({});
  const { t } = useI18n();

  async function load() {
    if (!token || !projectId) return;
    setLoading(true);
    setError("");
    try {
      const rows = await getProjectMembers(projectId, token);
      setMembers(rows || []);
    } catch (e) {
      setError(e?.response?.data?.message || e.message || t('loadTasksError'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [token, projectId]);

  async function onKick(memberId) {
    if (!confirm(t('confirmKickMember'))) return;
    try {
      await kickProjectMember(projectId, memberId, token);
      setMembers((prev) => prev.filter((m) => m.user_id !== memberId));
    } catch (e) {
      alert(e?.response?.data?.message || e.message || t('removeMemberFailed'));
    }
  }



  async function onToggle(memberId, key) {
    if (!editingId || editingId !== memberId) {
      // Start editing
      const m = members.find((x) => x.user_id === memberId);
      setEditingId(memberId);
      setTempPerms({ ...(m?.permissions || {}) });
    }
    // Toggle in temp state
    setTempPerms((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  async function onSave(memberId) {
    try {
      await updateMemberPermissions(projectId, memberId, tempPerms, token);
      setMembers((prev) => prev.map((x) => x.user_id === memberId ? { ...x, permissions: tempPerms } : x));
      setEditingId(null);
      setTempPerms({});
      alert(t('rightsSaved'));
    } catch (e) {
      alert(e?.response?.data?.message || e.message || t('rightsChangeFailed'));
    }
  }

  function onCancel() {
    setEditingId(null);
    setTempPerms({});
  }

  return (
    <div style={{
      background: 'linear-gradient(135deg, #818cf8 0%, #a78bfa 100%)',
      borderRadius: '12px',
      padding: '16px',
      boxShadow: '0 4px 14px rgba(129,140,248,0.4)',
      transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
      height: 'fit-content',
      position: 'relative'
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = 'translateY(-3px) scale(1.02)';
      e.currentTarget.style.boxShadow = '0 6px 20px rgba(129,140,248,0.5)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = 'translateY(0) scale(1)';
      e.currentTarget.style.boxShadow = '0 4px 14px rgba(129,140,248,0.4)';
    }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
        <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "#fff", textShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>{t('projectMembersTitle')}</h3>
        <button
          onClick={load}
          disabled={loading}
          style={{
            padding: "8px 14px",
            background: loading ? "#94a3b8" : "#fff",
            color: loading ? "#64748b" : "#818cf8",
            border: "none",
            borderRadius: "8px",
            fontSize: "12px",
            fontWeight: 700,
            cursor: loading ? "not-allowed" : "pointer",
            boxShadow: loading ? "none" : "0 2px 6px rgba(0,0,0,0.15)",
            transition: "all 0.3s cubic-bezier(0.4,0,0.2,1)"
          }}
          onMouseEnter={(e) => {
            if (!loading) {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 4px 10px rgba(0,0,0,0.2)';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = loading ? "none" : "0 2px 6px rgba(0,0,0,0.15)";
          }}
        >
          🔄 {t('refresh')}
        </button>
      </div>
      {error && <div style={{ color: "#991b1b", background: "rgba(254,226,226,0.95)", padding: "8px 12px", borderRadius: "8px", fontSize: "12px", marginBottom: "10px", border: '1px solid rgba(239,68,68,0.5)' }}>{error}</div>}
      {loading ? (
        <div style={{ color: "#fff", padding: "12px", textAlign: "center", fontSize: "13px" }}>{t('loadingDots')}</div>
      ) : (
        <div style={{ marginTop: 10 }}>
          {members.length === 0 ? (
            <div style={{ color: "#fff", padding: "16px", textAlign: "center", fontSize: "13px" }}>{t('noMembers')}</div>
          ) : (
            members.map((m) => {
              const isEditing = editingId === m.user_id;
              const perms = isEditing ? tempPerms : (m.permissions || {});
              return (
              <div key={m.user_id} style={{
                padding: "12px",
                marginBottom: "10px",
                borderRadius: "10px",
                border: "1px solid rgba(255,255,255,0.5)",
                background: isEditing ? "rgba(255,255,255,0.98)" : "rgba(255,255,255,0.95)",
                transition: "all 0.3s",
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: "14px", color: "#1e293b", marginBottom: "3px" }}>{m.username || `${t('userHash')}${m.user_id}`}</div>
                    <div style={{ fontSize: "12px", color: "#64748b" }}>{t('roleLabel')}: {m.role || "member"}</div>
                  </div>
                  <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                    {isEditing ? (
                      <>
                        <button onClick={() => onSave(m.user_id)} style={{
                          background: "#10b981",
                          color: "#fff",
                          padding: "6px 12px",
                          border: "none",
                          borderRadius: "6px",
                          fontWeight: 600,
                          fontSize: "12px",
                          cursor: "pointer",
                          transition: "all 0.3s"
                        }}>✓</button>
                        <button onClick={onCancel} style={{
                          background: "#ef4444",
                          color: "#fff",
                          padding: "6px 12px",
                          border: "none",
                          borderRadius: "6px",
                          fontWeight: 600,
                          fontSize: "12px",
                          cursor: "pointer",
                          transition: "all 0.3s"
                        }}>✕</button>
                      </>
                    ) : (
                        <button onClick={() => onKick(m.user_id)} style={{
                          color: "#fff",
                          background: "#dc2626",
                          padding: "6px 12px",
                          border: "none",
                          borderRadius: "6px",
                          fontSize: "12px",
                          fontWeight: 600,
                          cursor: "pointer",
                          transition: "all 0.3s"
                        }}>{t('kick')} 🗑️</button>
                    )}
                  </div>
                </div>
                <div style={{ display: "flex", gap: "16px", alignItems: "center", flexWrap: "wrap", paddingTop: "10px", borderTop: "1px dashed rgba(255,255,255,0.4)" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "12px", whiteSpace: "nowrap", color: "#374151" }}>
                    <input type="checkbox" checked={!!(perms.can_create)} onChange={() => onToggle(m.user_id, 'can_create')} /> {t('permCreate')}
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "12px", whiteSpace: "nowrap", color: "#374151" }}>
                    <input type="checkbox" checked={!!(perms.can_edit)} onChange={() => onToggle(m.user_id, 'can_edit')} /> {t('permEdit')}
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "12px", whiteSpace: "nowrap", color: "#374151" }}>
                    <input type="checkbox" checked={!!(perms.can_delete)} onChange={() => onToggle(m.user_id, 'can_delete')} /> {t('permDelete')}
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "12px", whiteSpace: "nowrap", color: "#374151" }}>
                    <input type="checkbox" checked={!!(perms.can_assign)} onChange={() => onToggle(m.user_id, 'can_assign')} /> {t('permAssign')}
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "12px", whiteSpace: "nowrap", color: "#374151" }}>
                    <input type="checkbox" checked={!!(perms.can_comment)} onChange={() => onToggle(m.user_id, 'can_comment')} /> {t('permComment')}
                  </label>
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
