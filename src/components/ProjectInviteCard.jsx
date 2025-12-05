import React from 'react';

export default function ProjectInviteCard({ data, createdAt }) {
  const { sender_id, project_id, project_name, invitation_id } = data || {};
  const dt = createdAt ? new Date(createdAt) : null;
  const formatted = dt ? dt.toLocaleString() : '';

  return (
    <div style={{
      flex: '1 1 0%',
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
          background: '#eef2ff',
          color: '#4f46e5',
          fontSize: 13
        }}>🔗</span>
        <span>project_invite</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 4 }}>
        <div style={{ color: '#1f2937', fontSize: 13 }}>
          <strong style={{ color: '#475569' }}>Sender:</strong> #{sender_id}
        </div>
        <div style={{ color: '#1f2937', fontSize: 13 }}>
          <strong style={{ color: '#475569' }}>Invite ID:</strong> #{invitation_id}
        </div>
        <div style={{ color: '#1f2937', fontSize: 13 }}>
          <strong style={{ color: '#475569' }}>Project:</strong> #{project_id}
        </div>
        <div style={{ color: '#1f2937', fontSize: 13 }}>
          <strong style={{ color: '#475569' }}>Name:</strong> {project_name}
        </div>
      </div>

      {formatted && (
        <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 10 }}>
          {formatted}
        </div>
      )}
    </div>
  );
}
