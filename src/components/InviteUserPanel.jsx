import React, { useState } from 'react';
import { useAuthApi } from '../context/authApi';
import { createInvitation } from '../api';
import { useI18n } from '../context/I18nContext.jsx';

export default function InviteUserPanel({ projectId, token }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const auth = useAuthApi();
  const { t } = useI18n();
  const authToken = token || auth.token;

  const handleInvite = async (e) => {
    e?.preventDefault();
    if (!authToken) {
      setError('Not authenticated');
      return;
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email');
      return;
    }
    
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      await createInvitation(projectId, email, authToken);
      setSuccess('✅ Invitation sent!');
      setEmail('');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send invitation');
      setTimeout(() => setError(''), 5000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      background: 'linear-gradient(135deg, #818cf8 0%, #a78bfa 100%)',
      borderRadius: '12px',
      padding: '16px',
      boxShadow: '0 4px 14px rgba(129,140,248,0.4)',
      transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
      height: 'fit-content',
      position: 'relative'
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = 'translateY(-3px) scale(1.02)';
      e.currentTarget.style.boxShadow = '0 6px 20px rgba(129,140,248,0.5)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = 'translateY(0) scale(1)';
      e.currentTarget.style.boxShadow = '0 4px 14px rgba(129,140,248,0.4)';
    }}
    >
      <h3 style={{
        margin: '0 0 14px 0',
        fontSize: '16px',
        fontWeight: 700,
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        📧 Invite Member
      </h3>
      
      <form onSubmit={handleInvite} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div>
          <label style={{
            display: 'block',
            fontSize: '12px',
            fontWeight: 600,
            color: '#fff',
            marginBottom: '5px',
            textShadow: '0 1px 2px rgba(0,0,0,0.1)'
          }}>
            Email Address
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="colleague@company.com"
            disabled={loading}
            style={{
              width: '100%',
              padding: '10px 14px',
              border: '2px solid rgba(255,255,255,0.5)',
              borderRadius: '8px',
              fontSize: '13px',
              background: 'rgba(255,255,255,0.98)',
              color: '#1e293b',
              outline: 'none',
              transition: 'all 0.2s',
              boxSizing: 'border-box'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = 'rgba(255,255,255,0.9)';
              e.target.style.boxShadow = '0 0 0 3px rgba(255,255,255,0.3)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'rgba(255,255,255,0.5)';
              e.target.style.boxShadow = 'none';
            }}
          />
        </div>

        {error && (
          <div style={{
            padding: '8px 12px',
            background: 'rgba(254,226,226,0.95)',
            border: '1px solid rgba(239,68,68,0.5)',
            borderRadius: '8px',
            color: '#991b1b',
            fontSize: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            ⚠️ {error}
          </div>
        )}

        {success && (
          <div style={{
            padding: '8px 12px',
            background: 'rgba(220,252,231,0.95)',
            border: '1px solid rgba(34,197,94,0.5)',
            borderRadius: '8px',
            color: '#166534',
            fontSize: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            {success}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !email}
          style={{
            padding: '10px 18px',
            background: '#fff',
            color: '#667eea',
            border: 'none',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: 700,
            cursor: (loading || !email) ? 'not-allowed' : 'pointer',
            opacity: (loading || !email) ? 0.7 : 1,
            transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
          }}
          onMouseEnter={(e) => {
            if (!loading && email) {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
          }}
        >
          {loading ? (
            <>
              <span style={{
                width: '14px',
                height: '14px',
                border: '2px solid #667eea',
                borderTopColor: 'transparent',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite'
              }} />
              Sending...
            </>
          ) : (
            <>
              🚀 Send
            </>
          )}
        </button>
      </form>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
