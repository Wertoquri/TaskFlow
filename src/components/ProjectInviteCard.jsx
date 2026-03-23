import React, { useState } from 'react';
import { acceptInvitation, declineInvitation } from '../api';
import { useAuthApi } from '../context/authApi';

export default function ProjectInviteCard({ data, createdAt }) {
  const { sender_id, project_id, project_name, invitation_id } = data || {};
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const auth = useAuthApi();
  const token = auth.token;

  const dt = createdAt ? new Date(createdAt) : null;
  const formatted = dt ? dt.toLocaleString() : '';

  const handleAccept = async () => {
    if (!token || !invitation_id) return;
    setLoading(true);
    try {
      await acceptInvitation(invitation_id, token);
      setStatus('accepted');
      setTimeout(() => setStatus(''), 4000);
    } catch (err) {
      alert('Failed to accept: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleDecline = async () => {
    if (!token || !invitation_id) return;
    setLoading(true);
    try {
      await declineInvitation(invitation_id, token);
      setStatus('declined');
      setTimeout(() => setStatus(''), 4000);
    } catch (err) {
      alert('Failed to decline: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      background: 'linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)',
      border: '1px solid #a5b4fc',
      borderRadius: 14,
      padding: 0,
      boxShadow: '0 3px 12px rgba(99,102,241,0.15)',
      transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
      overflow: 'hidden'
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = 'translateY(-3px) scale(1.01)';
      e.currentTarget.style.boxShadow = '0 6px 18px rgba(99,102,241,0.25)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = 'translateY(0) scale(1)';
      e.currentTarget.style.boxShadow = '0 3px 12px rgba(99,102,241,0.15)';
    }}
    >
      {/* Animated top border */}
      <div style={{
        height: '3px',
        background: 'linear-gradient(90deg, #6366f1 0%, #a5b4fc 50%, #6366f1 100%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 2s infinite linear'
      }} />
      
      <div style={{ padding: '16px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 12,
          marginBottom: 12
        }}>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 40,
            height: 40,
            borderRadius: 12,
            background: 'linear-gradient(135deg, #fff 0%, #eef2ff 100%)',
            color: '#4f46e5',
            fontSize: 20,
            flexShrink: 0,
            boxShadow: '0 2px 6px rgba(79,70,229,0.2)',
            border: '1px solid rgba(99,102,241,0.2)'
          }}>
            🎉
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontWeight: 700,
              fontSize: 15,
              color: '#3730a3',
              marginBottom: 8,
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span style={{
                padding: '4px 10px',
                background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                color: '#fff',
                borderRadius: '6px',
                fontSize: '10px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                INVITATION
              </span>
              Project Invitation
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 8,
              fontSize: 12
            }}>
              <div style={{
                padding: '8px 12px',
                background: 'rgba(255,255,255,0.8)',
                borderRadius: '8px',
                border: '1px solid rgba(99,102,241,0.2)'
              }}>
                <span style={{ color: '#6366f1', fontWeight: 700, fontSize: '10px', textTransform: 'uppercase', display: 'block', marginBottom: '3px' }}>📁 Project</span>
                <span style={{ fontWeight: 700, color: '#3730a3' }}>{project_name || `Project #${project_id}`}</span>
              </div>
              <div style={{
                padding: '8px 12px',
                background: 'rgba(255,255,255,0.8)',
                borderRadius: '8px',
                border: '1px solid rgba(99,102,241,0.2)'
              }}>
                <span style={{ color: '#6366f1', fontWeight: 700, fontSize: '10px', textTransform: 'uppercase', display: 'block', marginBottom: '3px' }}>👤 From</span>
                <span style={{ fontWeight: 600, color: '#4338ca' }}>User #{sender_id}</span>
              </div>
            </div>
          </div>
        </div>

        {status === 'accepted' && (
          <div style={{
            padding: '10px 14px',
            background: 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)',
            border: '1px solid #86efac',
            borderRadius: 10,
            color: '#166534',
            fontSize: 13,
            marginBottom: 12,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            animation: 'slideIn 0.3s ease-out'
          }}>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 22,
              height: 22,
              borderRadius: '50%',
              background: '#22c55e',
              color: '#fff',
              fontSize: 13,
              fontWeight: 700
            }}>✓</span>
            <span style={{ fontWeight: 600 }}>🎉 Invitation accepted! Welcome aboard!</span>
          </div>
        )}

        {status === 'declined' && (
          <div style={{
            padding: '10px 14px',
            background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
            border: '1px solid #fca5a5',
            borderRadius: 10,
            color: '#991b1b',
            fontSize: 13,
            marginBottom: 12,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            animation: 'slideIn 0.3s ease-out'
          }}>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 22,
              height: 22,
              borderRadius: '50%',
              background: '#ef4444',
              color: '#fff',
              fontSize: 13,
              fontWeight: 700
            }}>✕</span>
            <span style={{ fontWeight: 600 }}>Invitation declined</span>
          </div>
        )}

        <div style={{
          display: 'flex',
          gap: 10,
          justifyContent: 'flex-end',
          marginTop: 12
        }}>
          <button
            onClick={handleDecline}
            disabled={loading}
            style={{
              padding: '9px 18px',
              background: 'linear-gradient(135deg, #fff 0%, #fef2f2 100%)',
              color: '#dc2626',
              border: '1px solid #fca5a5',
              borderRadius: 9,
              fontSize: 13,
              fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1,
              transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
              boxShadow: '0 2px 5px rgba(220,38,38,0.2)'
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.currentTarget.style.background = 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)';
                e.currentTarget.style.color = '#fff';
                e.currentTarget.style.borderColor = '#991b1b';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 10px rgba(220,38,38,0.3)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, #fff 0%, #fef2f2 100%)';
              e.currentTarget.style.color = '#dc2626';
              e.currentTarget.style.borderColor = '#fca5a5';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 5px rgba(220,38,38,0.2)';
            }}
          >
            ✕ Decline
          </button>
          <button
            onClick={handleAccept}
            disabled={loading}
            style={{
              padding: '9px 20px',
              background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
              color: '#fff',
              border: 'none',
              borderRadius: 9,
              fontSize: 13,
              fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
              boxShadow: '0 3px 10px rgba(34,197,94,0.35)'
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
                e.currentTarget.style.boxShadow = '0 5px 14px rgba(34,197,94,0.45)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0) scale(1)';
              e.currentTarget.style.boxShadow = '0 3px 10px rgba(34,197,94,0.35)';
            }}
          >
            🚀 Accept & Join
          </button>
        </div>

        {formatted && (
          <div style={{
            fontSize: 11,
            color: '#6366f1',
            marginTop: 10,
            paddingTop: 8,
            borderTop: '1px dashed rgba(99,102,241,0.25)',
            textAlign: 'right',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '6px'
          }}>
            <span style={{ color: '#818cf8' }}>📅</span>
            {formatted}
          </div>
        )}
      </div>

      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
