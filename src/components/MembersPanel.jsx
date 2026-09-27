import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
  getProjectMembers,
  kickProjectMember,
  updateMemberPermissions,
} from "../api";
import { useI18n } from "../context/I18nContext.jsx";
import styles from "./ProjectPage.module.css";
import { Check, RefreshCw, Trash2, UsersRound, X } from "lucide-react";

const cleanLabel = (value) =>
  String(value || "").replace(/^[^\p{L}\p{N}]+/u, "");

export default function MembersPanel({ projectId }) {
  const { token, user } = useAuth();
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
      setError(e?.response?.data?.message || e.message || t("loadTasksError"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [token, projectId]);

  async function onKick(memberId) {
    if (!confirm(t("confirmKickMember"))) return;
    try {
      await kickProjectMember(projectId, memberId, token);
      setMembers((prev) => prev.filter((m) => m.user_id !== memberId));
    } catch (e) {
      alert(e?.response?.data?.message || e.message || t("removeMemberFailed"));
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
      setMembers((prev) =>
        prev.map((x) =>
          x.user_id === memberId ? { ...x, permissions: tempPerms } : x,
        ),
      );
      setEditingId(null);
      setTempPerms({});
      alert(t("rightsSaved"));
    } catch (e) {
      alert(e?.response?.data?.message || e.message || t("rightsChangeFailed"));
    }
  }

  function onCancel() {
    setEditingId(null);
    setTempPerms({});
  }

  return (
    <div className={styles.panel}>
      <div className={styles.panelHeader}>
        <h3 className={styles.sectionTitle}>
          <UsersRound aria-hidden="true" size={18} />
          {cleanLabel(t("projectMembersTitle"))}
        </h3>
        <button
          onClick={load}
          disabled={loading}
          className={styles.primaryButton}
        >
          <RefreshCw aria-hidden="true" size={15} />
          {cleanLabel(t("refresh"))}
        </button>
      </div>
      {error && (
        <div className={styles.formError} role="alert">
          {error}
        </div>
      )}
      {loading ? (
        <div className={styles.panelNotice}>{t("loadingDots")}</div>
      ) : (
        <div className={styles.memberList}>
          {members.length === 0 ? (
            <div className={styles.panelNotice}>{t("noMembers")}</div>
          ) : (
            members.map((m) => {
              const isEditing = editingId === m.user_id;
              const perms = isEditing ? tempPerms : m.permissions || {};
              return (
                <div
                  key={m.user_id}
                  className={`${styles.memberCard} ${isEditing ? styles.memberCardEditing : ""}`}
                >
                  <div className={styles.memberTop}>
                    <div className={styles.memberInfo}>
                      <div className={styles.memberName}>
                        {m.username || `${t("userHash")}${m.user_id}`}
                      </div>
                      <div className={styles.memberRole}>
                        {cleanLabel(t("roleLabel"))}: {m.role || "member"}
                      </div>
                    </div>
                    <div className={styles.memberActions}>
                      {isEditing ? (
                        <div className={styles.editActions}>
                          <button
                            onClick={() => onSave(m.user_id)}
                            className={`${styles.ghostButton} ${styles.successButton}`}
                            aria-label={t("save")}
                          >
                            <Check aria-hidden="true" size={15} />
                          </button>
                          <button
                            onClick={onCancel}
                            className={styles.ghostButton}
                            aria-label={t("cancelAction")}
                          >
                            <X aria-hidden="true" size={15} />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => onKick(m.user_id)}
                          className={styles.dangerButton}
                        >
                          <Trash2 aria-hidden="true" size={15} />
                          {cleanLabel(t("kick"))}
                        </button>
                      )}
                    </div>
                  </div>
                  <div className={styles.permissionsGrid}>
                    <label className={styles.permissionLabel}>
                      <input
                        type="checkbox"
                        checked={!!perms.can_create}
                        onChange={() => onToggle(m.user_id, "can_create")}
                      />{" "}
                      {t("permCreate")}
                    </label>
                    <label className={styles.permissionLabel}>
                      <input
                        type="checkbox"
                        checked={!!perms.can_edit}
                        onChange={() => onToggle(m.user_id, "can_edit")}
                      />{" "}
                      {t("permEdit")}
                    </label>
                    <label className={styles.permissionLabel}>
                      <input
                        type="checkbox"
                        checked={!!perms.can_delete}
                        onChange={() => onToggle(m.user_id, "can_delete")}
                      />{" "}
                      {t("permDelete")}
                    </label>
                    <label className={styles.permissionLabel}>
                      <input
                        type="checkbox"
                        checked={!!perms.can_assign}
                        onChange={() => onToggle(m.user_id, "can_assign")}
                      />{" "}
                      {t("permAssign")}
                    </label>
                    <label className={styles.permissionLabel}>
                      <input
                        type="checkbox"
                        checked={!!perms.can_comment}
                        onChange={() => onToggle(m.user_id, "can_comment")}
                      />{" "}
                      {t("permComment")}
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
