import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import styles from "./ProfileMenu.module.css";

export default function ProfileMenu({ isOpen, onToggle }) {
  const { user, logout } = useAuth();
  const ref = useRef(null);

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
        aria-label="Profile"
        onClick={onToggle}
        className={styles.button}
      >
        <span role="img" aria-label="user" className={styles.icon}>
          👤
        </span>
      </button>
      {isOpen && (
        <div className={styles.dropdown}>
          <div className={styles.dropdownTitle}>Профіль</div>
          {!user ? (
            <div className={styles.loading}>Завантаження...</div>
          ) : (
            <div className={styles.userInfo}>
              <div>
                <span className={styles.userInfoLabel}>Ім'я:</span>{" "}
                {user.username || "—"}
              </div>
              <div>
                <span className={styles.userInfoLabel}>Email:</span>{" "}
                {user.email || "—"}
              </div>
            </div>
          )}
          <div className={styles.actions}>
            <button onClick={logout} className={styles.logoutButton}>
              Вийти
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
