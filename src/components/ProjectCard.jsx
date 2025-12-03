import React from "react";
import { useNavigate } from "react-router-dom";
import styles from "./ProjectCard.module.css";
import { useI18n } from "../context/I18nContext.jsx";

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
  const navigate = useNavigate();
  const { t } = useI18n();

  return (
    <div className={styles.card} onClick={() => onOpen && onOpen(id)}>
      <h3 className={styles.title}>{name}</h3>
      <div className={styles.description}>
        {description || t('noDescription')}
      </div>
      <div className={styles.meta}>
        <div>{t('created')}: {new Date(created_at).toLocaleDateString()}</div>
        <div>{t('updated')}: {new Date(updated_at).toLocaleDateString()}</div>
      </div>
      <div className={styles.actions} onClick={(e) => e.stopPropagation()}>
        <button onClick={() => navigate(`/project/${id}`)} className={styles.editButton}>
          {t('participants')}
        </button>
        <button onClick={() => onEdit(id)} className={styles.editButton}>
          {t('edit')}
        </button>
        <button onClick={() => onDelete(id)} className={styles.deleteButton}>
          {t('delete')}
        </button>
      </div>
    </div>
  );
}
