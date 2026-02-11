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
      background: "#fff",
      border: "none",
      borderRadius: "16px",
      padding: "24px",
      boxShadow: "0 4px 6px rgba(0,0,0,0.1)"
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 700, color: "#1e293b" }}>{t('projectMembersTitle')}</h3>
        <button 
          onClick={load} 
          disabled={loading}
          style={{
            padding: "8px 16px",
            background: loading ? "#94a3b8" : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            fontSize: "13px",
            fontWeight: 600,
            cursor: loading ? "not-allowed" : "pointer",
            boxShadow: loading ? "none" : "0 2px 4px rgba(102,126,234,0.3)"
          }}
        >
          🔄 {t('refresh')}
        </button>
      </div>
      {error && <div style={{ color: "#dc2626", marginTop: 8, fontSize: "13px" }}>{error}</div>}
      {loading ? (
        <div style={{ color: "#64748b", marginTop: 8, fontSize: "13px" }}>{t('loadingDots')}</div>
      ) : (
        <div style={{ marginTop: 12 }}>
          {members.length === 0 ? (
            <div style={{ color: "#64748b", padding: "20px", textAlign: "center", fontSize: "14px" }}>{t('noMembers')}</div>
          ) : (
            members.map((m) => {
              const isEditing = editingId === m.user_id;
              const perms = isEditing ? tempPerms : (m.permissions || {});
              return (
              <div key={m.user_id} style={{ 
                padding: "24px", 
                marginBottom: "30px",
                borderRadius: "12px",
                border: "1px solid #e2e8f0",
                background: isEditing ? "#fffbeb" : "#f8fafc",
                transition: "all 0.3s",
                boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: "15px", color: "#1e293b", marginBottom: "4px" }}>{m.username || `${t('userHash')}${m.user_id}`}</div>
                    <div style={{ fontSize: "13px", color: "#64748b" }}>{t('roleLabel')}: {m.role || "member"}</div>
                  </div>
                  <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                    {isEditing ? (
                      <>
                        <button onClick={() => onSave(m.user_id)} style={{ 
                          background: "#10b981", 
                          color: "#fff", 
                          padding: "8px 16px", 
                          border: "none", 
                          borderRadius: "6px", 
                          fontWeight: 600,
                          fontSize: "13px",
                          cursor: "pointer",
                          transition: "all 0.3s"
                        }}>✓</button>
                        <button onClick={onCancel} style={{ 
                          background: "#ef4444", 
                          color: "#fff", 
                          padding: "8px 16px", 
                          border: "none", 
                          borderRadius: "6px",
                          fontWeight: 600,
                          fontSize: "13px",
                          cursor: "pointer",
                          transition: "all 0.3s"
                        }}>✕</button>
                      </>
                    ) : (
                        <button onClick={() => onKick(m.user_id)} style={{ 
                          color: "#fff",
                          background: "#dc2626",
                          padding: "8px 16px",
                          border: "none",
                          borderRadius: "6px",
                          fontSize: "13px",
                          fontWeight: 600,
                          cursor: "pointer",
                          transition: "all 0.3s"
                        }}>{t('kick')} 🗑️</button>
                    )}
                  </div>
                </div>
                <div style={{ display: "flex", gap: "20px", alignItems: "center", flexWrap: "wrap", paddingTop: "12px", borderTop: "1px solid #e2e8f0" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", whiteSpace: "nowrap" }}>
                    <input type="checkbox" checked={!!(perms.can_create)} onChange={() => onToggle(m.user_id, 'can_create')} /> {t('permCreate')}
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", whiteSpace: "nowrap" }}>
                    <input type="checkbox" checked={!!(perms.can_edit)} onChange={() => onToggle(m.user_id, 'can_edit')} /> {t('permEdit')}
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", whiteSpace: "nowrap" }}>
                    <input type="checkbox" checked={!!(perms.can_delete)} onChange={() => onToggle(m.user_id, 'can_delete')} /> {t('permDelete')}
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", whiteSpace: "nowrap" }}>
                    <input type="checkbox" checked={!!(perms.can_assign)} onChange={() => onToggle(m.user_id, 'can_assign')} /> {t('permAssign')}
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", whiteSpace: "nowrap" }}>
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
