import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import styles from "./ProfileMenu.module.css";
import { useI18n } from "../context/I18nContext.jsx";

export default function ProfileMenu({ isOpen, onToggle }) {
  const { user, logout } = useAuth();
  const ref = useRef(null);
  const { t } = useI18n();

  useEffect(() => {
    if (!isOpen) return;
    function onDocClick(e) {
      if (ref.current && !ref.current.contains(e.target)) onToggle();
    }
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, [isOpen, onToggle]);

  return (
    <div ref={ref} className={styles.container}>
      <button
        aria-label={t('profile')}
        onClick={onToggle}
        className={styles.button}
      >
        <span role="img" aria-label="user" className={styles.icon}>
          👤
        </span>
      </button>
      {isOpen && (
        <div className={styles.dropdown}>
          <div className={styles.dropdownTitle}>{t('profile')}</div>
          {!user ? (
            <div className={styles.loading}>{t('loading')}</div>
          ) : (
            <div className={styles.userInfo}>
              <div>
                <span className={styles.userInfoLabel}>{t('nameLabel')}</span>{" "}
                {user.username || "—"}
              </div>
              <div>
                <span className={styles.userInfoLabel}>{t('email')}:</span>{" "}
                {user.email || "—"}
              </div>
            </div>
          )}
          <div className={styles.actions}>
            <button onClick={logout} className={styles.logoutButton}>
              {t('logout')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
