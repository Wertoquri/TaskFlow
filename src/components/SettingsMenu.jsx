import React, { useEffect, useRef, useState } from 'react';
import { useI18n } from '../context/I18nContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { deleteMyAccount } from '../api.js';
import useMobileMenuPosition from './useMobileMenuPosition.js';

export default function SettingsMenu({ isOpen, onToggle }) {
  const { t, language, setLanguage } = useI18n();
  const { logout } = useAuth();
  const ref = useRef(null);
  const { triggerRef, menuStyle } = useMobileMenuPosition(isOpen, { maxWidth: 340 });
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    function handleClickOutside(e) {
      if (isOpen && ref.current && !ref.current.contains(e.target)) onToggle();
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onToggle]);

  async function handleDeleteAccount() {
    if (!confirming) { setConfirming(true); return; }
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await deleteMyAccount(token);
      // cleanup and logout
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      logout();
      window.location.href = '/login';
    } catch (e) {
      alert(t('deleteAccountFailed'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        ref={triggerRef}
        onClick={onToggle}
        aria-label={t('settings')}
        title={t('settings')}
        style={{
          position: 'relative',
          padding: '10px 16px',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: '#fff',
          border: 'none',
          borderRadius: 10,
          cursor: 'pointer',
          fontWeight: 600,
          fontSize: 16,
          boxShadow: '0 2px 8px rgba(102,126,234,0.3)',
          transition: 'all 0.3s',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(102,126,234,0.4)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 2px 8px rgba(102,126,234,0.3)';
        }}
      >
        ⚙️ {t('settings')}
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            right: 0,
            top: '120%',
            background: '#fff',
            border: '1px solid #e2e8f0',
            borderRadius: 12,
            padding: 16,
            width: 'min(300px, calc(100vw - 2rem))',
            maxWidth: 'calc(100vw - 2rem)',
            boxSizing: 'border-box',
            boxShadow: '0 8px 24px rgba(0,0,0,.12)',
            zIndex: 1000,
            ...menuStyle
          }}
        >
          <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: 12 }}>{t('settings')}</div>

          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 12, color: '#64748b', marginBottom: 8 }}>{t('language')}</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => setLanguage('uk')}
                style={{
                  flex: 1,
                  padding: '8px 10px',
                  borderRadius: 8,
                  border: language === 'uk' ? '2px solid #667eea' : '1px solid #e2e8f0',
                  background: language === 'uk' ? 'rgba(102,126,234,0.1)' : '#fff',
                  cursor: 'pointer'
                }}
              >{t('ukrainian')}</button>
              <button
                onClick={() => setLanguage('en')}
                style={{
                  flex: 1,
                  padding: '8px 10px',
                  borderRadius: 8,
                  border: language === 'en' ? '2px solid #667eea' : '1px solid #e2e8f0',
                  background: language === 'en' ? 'rgba(102,126,234,0.1)' : '#fff',
                  cursor: 'pointer'
                }}
              >{t('english')}</button>
            </div>
          </div>
          

          <div style={{ marginTop: 8, paddingTop: 12, borderTop: '1px solid #e2e8f0' }}>
            <div style={{ fontWeight: 600, color: '#b91c1c', marginBottom: 8 }}>{t('deleteAccount')}</div>
            {!confirming ? (
              <div style={{ fontSize: 12, color: '#64748b', marginBottom: 10 }}>{t('deleteAccountDesc')}</div>
            ) : null}
            <div style={{ display: 'flex', gap: 8 }}>
              {confirming && (
                <button
                  disabled={loading}
                  onClick={() => setConfirming(false)}
                  style={{ flex: 1, padding: 10, borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer' }}
                >{t('cancel')}</button>
              )}
              <button
                disabled={loading}
                onClick={handleDeleteAccount}
                style={{
                  flex: 1,
                  padding: 10,
                  borderRadius: 8,
                  border: 'none',
                  background: confirming ? '#ef4444' : 'linear-gradient(135deg, #fde68a 0%, #fca5a5 100%)',
                  color: confirming ? '#fff' : '#1f2937',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >{confirming ? t('confirmDelete') : t('deleteAccount')}</button>
            </div>
          </div>

          <div style={{ marginTop: 12 }}>
            <button
              onClick={() => { localStorage.clear(); logout(); window.location.href = '/login'; }}
              style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer' }}
            >{t('logout')}</button>
          </div>
        </div>
      )}
    </div>
  );
}
