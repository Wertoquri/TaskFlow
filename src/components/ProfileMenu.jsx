import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { uploadAvatar, API_URL as API_BASE_URL } from "../api";
import styles from "./ProfileMenu.module.css";
import { useI18n } from "../context/I18nContext.jsx";
import useMobileMenuPosition from "./useMobileMenuPosition.js";

export default function ProfileMenu({ isOpen, onToggle }) {
  const { user, logout, refreshUser, token } = useAuth();
  const ref = useRef(null);
  const { t } = useI18n();
  const [uploading, setUploading] = useState(false);
  const { triggerRef, menuStyle } = useMobileMenuPosition(isOpen, { maxWidth: 320 });

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
        ref={triggerRef}
        aria-label={t('profile')}
        onClick={onToggle}
        className={styles.button}
      >
        {user && (user.avatar || user.avatar_url) ? (
          (() => {
            const raw = user.avatar || user.avatar_url;
            const src = raw && raw.startsWith('/') ? API_BASE_URL.replace(/\/api$/, '') + raw : raw;
            return <img src={src} alt={user.username || 'avatar'} className={styles.avatarSmall} />;
          })()
        ) : (
          <span role="img" aria-label="user" className={styles.icon}>👤</span>
        )}
      </button>
      {isOpen && (
        <div className={styles.dropdown} style={menuStyle || undefined}>
          <div className={styles.dropdownTitle}>{t('profile')}</div>
          {!user ? (
            <div className={styles.loading}>{t('loading')}</div>
          ) : (
            <div>
              <div className={styles.userHeader}>
                {(user.avatar || user.avatar_url) ? (
                  (() => {
                    const raw = user.avatar || user.avatar_url;
                    const src = raw && raw.startsWith('/') ? API_BASE_URL.replace(/\/api$/, '') + raw : raw;
                    return <img src={src} alt={user.username || 'avatar'} className={styles.avatar} />;
                  })()
                ) : (
                  <div style={{ width: 56, height: 56, borderRadius: 9999, background: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>
                    👤
                  </div>
                )}
                <div>
                  <div className={styles.username}>{user.username || '—'}</div>
                  <div style={{ color: '#64748b', fontSize: 13 }}>{user.email || '—'}</div>
                </div>
              </div>
              <div className={styles.userInfo}>
                <div style={{ marginTop: 4 }}>
                  <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <input type="file" accept="image/*" style={{ display: 'none' }} onChange={async (e) => {
                      const f = e.target.files && e.target.files[0];
                      if (!f) return;
                      try {
                        setUploading(true);
                        await uploadAvatar(f, token || localStorage.getItem('token'));
                        if (typeof refreshUser === 'function') await refreshUser();
                      } catch (err) {
                        console.error('Avatar upload failed', err);
                      } finally { setUploading(false); }
                    }} ref={(el) => { /* keep ref-less, forwarded by button click */ }} />
                    <button type="button" className={styles.uploadBtn} onClick={(ev) => {
                      const input = ev.currentTarget.parentElement.querySelector('input[type=file]');
                      if (input) input.click();
                    }}>
                      {uploading ? (t('uploadingAvatar') || 'Uploading...') : (t('uploadAvatar') || 'Upload avatar')}
                    </button>
                  </label>
                </div>
                
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
