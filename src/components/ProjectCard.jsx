import React from "react";
import styles from "./ProjectCard.module.css";

export default function ProjectCard({
  id,
  name,
  description,
  created_at,
  updated_at,
  onEdit,
  onDelete,
  onOpen,
}) {
  return (
    <div className={styles.card} onClick={() => onOpen && onOpen(id)}>
      <h3 className={styles.title}>{name}</h3>
      <div className={styles.description}>
        {description || "Опис відсутній"}
      </div>
      <div className={styles.meta}>
        <div>📅 Створено: {new Date(created_at).toLocaleDateString()}</div>
        <div>♻️ Оновлено: {new Date(updated_at).toLocaleDateString()}</div>
      </div>
      <div className={styles.actions} onClick={(e) => e.stopPropagation()}>
        <button onClick={() => onEdit(id)} className={styles.editButton}>
          ✏️ Редагувати
        </button>
        <button onClick={() => onDelete(id)} className={styles.deleteButton}>
          🗑️ Видалити
        </button>
      </div>
    </div>
  );
}
