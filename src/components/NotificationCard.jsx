import React from 'react';

export default function NotificationCard({ title, body, createdAt }) {
  const dt = createdAt ? new Date(createdAt) : null;
  const formatted = dt ? dt.toLocaleString() : '';
  
  // Humanize notification type
  const displayTitle = typeof title === 'string' 
    ? title.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
    : 'Notification';

  return (
    <div style={{
      background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
      border: '1px solid #f59e0b',
      borderRadius: 12,
      padding: 14,
      boxShadow: '0 2px 8px rgba(245,158,11,0.15)',
      transition: 'all 0.2s'
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = 'translateY(-2px)';
      e.currentTarget.style.boxShadow = '0 4px 12px rgba(245,158,11,0.25)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = '0 2px 8px rgba(245,158,11,0.15)';
    }}
    >
      <div style={{ 
        display: 'flex', 
        alignItems: 'flex-start', 
        gap: 12,
        marginBottom: 8
      }}>
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 28, 
          height: 28,
          borderRadius: 8,
          background: '#fff',
          color: '#b45309',
          fontSize: 16,
          flexShrink: 0,
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          🔔
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ 
            fontWeight: 700, 
            fontSize: 14,
            color: '#92400e',
            marginBottom: 4
          }}>
            {displayTitle}
          </div>
          {body && (
            <div style={{ 
              color: '#78350f', 
              fontSize: 13,
              lineHeight: 1.5,
              wordBreak: 'break-word'
            }}>
              {body}
            </div>
          )}
        </div>
      </div>
      {formatted && (
        <div style={{ 
          fontSize: 11, 
          color: '#b45309', 
          marginTop: 10,
          paddingTop: 8,
          borderTop: '1px solid rgba(180,83,9,0.2)',
          textAlign: 'right'
        }}>
          {formatted}
        </div>
      )}
    </div>
  );
}