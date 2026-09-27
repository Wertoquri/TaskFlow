import React, { useState } from "react";
import { createInvitation } from "../api";
import { useI18n } from "../context/I18nContext.jsx";
import styles from "./ProjectPage.module.css";
import { Link2 } from "lucide-react";

const cleanLabel = (value) =>
  String(value || "").replace(/^[^\p{L}\p{N}]+/u, "");

export default function InviteUserPanel({ projectId, token, onSuccess }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const { t } = useI18n();

  async function handleInvite(e) {
    e.preventDefault();
    if (!email.trim()) {
      setError(t("enterEmail"));
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      await createInvitation(projectId, email.trim(), token);
      setSuccess(`${t("inviteSentTo")} ${email}`);
      setEmail("");
      onSuccess && onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || t("inviteError"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.panel}>
      <h3 className={styles.sectionTitle}>
        <Link2 aria-hidden="true" size={18} />
        {cleanLabel(t("inviteUserTitle"))}
      </h3>
      <form onSubmit={handleInvite} className={styles.inviteForm}>
        <div className={styles.inviteInputWrap}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t("invitePlaceholder")}
            disabled={loading}
            aria-label={t("invitePlaceholder")}
          />
          {error && (
            <div className={styles.formError} role="alert">
              {error}
            </div>
          )}
          {success && (
            <div className={styles.formSuccess} role="status">
              {success}
            </div>
          )}
        </div>
        <button
          type="submit"
          disabled={loading}
          className={styles.primaryButton}
        >
          {cleanLabel(loading ? t("inviting") : t("inviteBtn"))}
        </button>
      </form>
    </div>
  );
}
