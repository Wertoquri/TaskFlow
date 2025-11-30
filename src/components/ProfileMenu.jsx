import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import styles from "./ProfileMenu.module.css";

export default function ProfileMenu() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function onDocClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  return (
    <div ref={ref} className={styles.container}>
      <button
        aria-label="Profile"
        onClick={() => setOpen((o) => !o)}
        className={styles.button}
      >
        <span role="img" aria-label="user" className={styles.icon}>
          👤
        </span>
      </button>
      {open && (
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
