import React from 'react';

export default function NotificationCard({ title, body, createdAt }) {
  const dt = createdAt ? new Date(createdAt) : null;
  const formatted = dt ? dt.toLocaleString() : '';
  return (
    <div style={{
      background: '#ffffff',
      border: '1px solid #e2e8f0',
      borderRadius: 12,
      padding: 12,
      boxShadow: '0 2px 6px rgba(0,0,0,0.06)'
    }}>
      <div style={{ fontWeight: 700, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 22, height: 22,
          borderRadius: 6,
          background: '#fef3c7',
          color: '#b45309',
          fontSize: 13
        }}>🔔</span>
        <span>{title}</span>
      </div>
      {body && (
        <div style={{ color: '#1f2937', fontSize: 13 }}>{body}</div>
      )}
      {formatted && (
        <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 10 }}>{formatted}</div>
      )}
    </div>
  );
}