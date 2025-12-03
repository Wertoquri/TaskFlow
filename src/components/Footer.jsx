import React from 'react';
import { useI18n } from '../context/I18nContext.jsx';

export default function Footer() {
  const { t } = useI18n();
  const year = new Date().getFullYear();
  return (
    <footer style={{
      marginTop: 24,
      padding: '16px 24px',
      color: '#64748b',
      fontSize: '13px',
      textAlign: 'center'
    }}>
      © {year} TaskFlow — {t('rightsReserved')}
    </footer>
  );
}
