import { Check, FolderKanban, ListChecks, UsersRound } from 'lucide-react';
import { useI18n } from '../context/I18nContext.jsx';
import styles from './AuthLayout.module.css';

export function BrandMark({ compact = false }) {
  return (
    <span className={`${styles.brand} ${compact ? styles.brandCompact : ''}`}>
      <span className={styles.brandIcon} aria-hidden="true"><FolderKanban /></span>
      <span>TaskFlow</span>
    </span>
  );
}

export default function AuthLayout({ children }) {
  const { t } = useI18n();

  return (
    <main className={styles.layout}>
      <section className={styles.story} aria-label="TaskFlow">
        <BrandMark />
        <div className={styles.storyContent}>
          <h1>{t('authBrandTitle')}</h1>
          <p>{t('authBrandDescription')}</p>
          <div className={styles.diagram} aria-hidden="true">
            <div className={`${styles.diagramCard} ${styles.cardOne}`}><ListChecks /><span><i /><i /></span><b /></div>
            <div className={styles.diagramHub}><FolderKanban /></div>
            <div className={`${styles.diagramCard} ${styles.cardTwo}`}><UsersRound /><span><i /><i /></span><b /></div>
            <div className={`${styles.diagramCard} ${styles.cardThree}`}><Check /><span><i /><i /></span><b /></div>
          </div>
        </div>
      </section>
      <section className={styles.formSide}>
        <div className={styles.formCard}>{children}</div>
      </section>
    </main>
  );
}
