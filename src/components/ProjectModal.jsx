import React, { useState, useEffect } from "react";
import styles from "./ProjectModal.module.css";

export default function ProjectModal({
  open,
  onClose,
  onSubmit,
  initialData, // { id, name, description }
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [nameError, setNameError] = useState("");

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || "");
      setDescription(initialData.description || "");
    } else {
      setName("");
      setDescription("");
    }
    setNameError("");
  }, [initialData, open]);

  useEffect(() => {
    function handleEscape(e) {
      if (e.key === "Escape" && open) {
        onClose();
      }
    }
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open, onClose]);

  useEffect(() => {
    // GSAP анімація для модального вікна
    if (open && window.gsap) {
      const modal = document.querySelector('[data-modal-content]');
      if (modal) {
        window.gsap.fromTo(modal, 
          {
            scale: 0.9,
            opacity: 0,
            y: -30
          },
          {
            scale: 1,
            opacity: 1,
            y: 0,
            duration: 0.3,
            ease: "power2.out"
          }
        );
      }
    }
  }, [open]);

  function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) {
      setNameError("Назва проекту обов'язкова!");
      return;
    }
    if (name.trim().length < 3) {
      setNameError("Назва має бути не менше 3 символів");
      return;
    }
    setNameError("");
    onSubmit({ id: initialData?.id, name: name.trim(), description: description.trim() });
  }

  function handleClose(e) {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }

  if (!open) return null;

  return (
    <div className={styles.overlay} onClick={handleClose}>
      <form onSubmit={handleSubmit} className={styles.modal} data-modal-content>
        <div className={styles.header}>
          <h3 className={styles.title}>
            {initialData ? "✏️ Редагувати проект" : "➕ Створити новий проект"}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className={styles.closeIcon}
            title="Закрити"
          >
            ✕
          </button>
        </div>
        <div className={styles.content}>
          <div className={styles.inputGroup}>
            <label className={styles.label}>
              <span className={styles.labelIcon}>📌</span>
              Назва проекту
              <span className={styles.required}>*</span>
            </label>
            <input
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setNameError("");
              }}
              className={`${styles.input} ${nameError ? styles.inputError : ""}`}
              placeholder="Введіть назву проекту..."
              autoFocus
              maxLength={100}
            />
            {nameError && <span className={styles.errorText}>{nameError}</span>}
            <span className={styles.charCount}>{name.length}/100</span>
          </div>
          <div className={styles.inputGroup}>
            <label className={styles.label}>
              <span className={styles.labelIcon}>📝</span>
              Опис проекту
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={styles.textarea}
              placeholder="Додайте опис проекту (необов'язково)..."
              maxLength={500}
              rows={4}
            />
            <span className={styles.charCount}>{description.length}/500</span>
          </div>
        </div>
        <div className={styles.footer}>
          <button
            type="button"
            onClick={onClose}
            className={styles.cancelButton}
          >
            Скасувати
          </button>
          <button type="submit" className={styles.submitButton}>
            {initialData ? "💾 Зберегти зміни" : "🚀 Створити проект"}
          </button>
        </div>
      </form>
    </div>
  );
}
