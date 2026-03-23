import React, { useEffect } from 'react';

/**
 * Beautiful toast notification for Kanban board activity
 * @param {Object} props
 * @param {string} props.message - Notification message
 * @param {string} props.type - Type: 'task-created' | 'task-updated' | 'task-deleted' | 'task-moved' | 'priority-changed' | 'attachment-added' | 'attachment-deleted' | 'label-added' | 'label-removed'
 * @param {Object} props.data - Additional data (taskName, userName, etc.)
 * @param {Function} props.onClose - Close callback
 */
export default function KanbanActivityToast({ message, type = 'info', data = {}, onClose, duration = 4000 }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      if (onClose) onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const getConfig = () => {
    switch (type) {
      case 'task-created':
        return {
          icon: '✨',
          gradient: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
          bgGradient: 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)',
          borderColor: '#22c55e',
          color: '#166534',
          shadow: '0 4px 16px rgba(34,197,94,0.3)'
        };
      case 'task-updated':
      case 'task-moved':
        return {
          icon: '🔄',
          gradient: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
          bgGradient: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
          borderColor: '#3b82f6',
          color: '#1e40af',
          shadow: '0 4px 16px rgba(59,130,246,0.3)'
        };
      case 'task-deleted':
        return {
          icon: '🗑️',
          gradient: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
          bgGradient: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
          borderColor: '#ef4444',
          color: '#991b1b',
          shadow: '0 4px 16px rgba(239,68,68,0.3)'
        };
      case 'priority-changed':
        return {
          icon: '📊',
          gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
          bgGradient: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
          borderColor: '#f59e0b',
          color: '#92400e',
          shadow: '0 4px 16px rgba(245,158,11,0.3)'
        };
      case 'attachment-added':
        return {
          icon: '📎',
          gradient: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
          bgGradient: 'linear-gradient(135deg, #cffafe 0%, #a5f3fc 100%)',
          borderColor: '#06b6d4',
          color: '#164e63',
          shadow: '0 4px 16px rgba(6,182,212,0.3)'
        };
      case 'attachment-deleted':
        return {
          icon: '📎',
          gradient: 'linear-gradient(135deg, #64748b 0%, #475569 100%)',
          bgGradient: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
          borderColor: '#64748b',
          color: '#334155',
          shadow: '0 4px 16px rgba(100,116,139,0.3)'
        };
      case 'label-added':
        return {
          icon: '🏷️',
          gradient: 'linear-gradient(135deg, #a855f7 0%, #9333ea 100%)',
          bgGradient: 'linear-gradient(135deg, #fae8ff 0%, #f0d4ff 100%)',
          borderColor: '#a855f7',
          color: '#6b21a8',
          shadow: '0 4px 16px rgba(168,85,247,0.3)'
        };
      case 'label-removed':
        return {
          icon: '🏷️',
          gradient: 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
          bgGradient: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)',
          borderColor: '#6b7280',
          color: '#374151',
          shadow: '0 4px 16px rgba(107,114,128,0.3)'
        };
      default:
        return {
          icon: '🔔',
          gradient: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
          bgGradient: 'linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)',
          borderColor: '#6366f1',
          color: '#3730a3',
          shadow: '0 4px 16px rgba(99,102,241,0.3)'
        };
    }
  };

  const config = getConfig();

  return (
    <div style={{
      position: 'fixed',
      bottom: '24px',
      right: '24px',
      minWidth: '320px',
      maxWidth: '480px',
      background: '#fff',
      borderRadius: '14px',
      padding: '0',
      boxShadow: config.shadow,
      border: `2px solid ${config.borderColor}`,
      zIndex: 9999,
      animation: 'slideInRight 0.4s cubic-bezier(0.4,0,0.2,1)',
      overflow: 'hidden'
    }}>
      {/* Animated top bar */}
      <div style={{
        height: '4px',
        background: config.gradient,
        backgroundSize: '200% 100%',
        animation: 'shimmer 2s infinite linear'
      }} />

      <div style={{
        padding: '14px 18px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '14px'
      }}>
        {/* Icon */}
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 40,
          height: 40,
          borderRadius: '12px',
          background: config.gradient,
          color: '#fff',
          fontSize: 20,
          flexShrink: 0,
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
        }}>
          {config.icon}
        </span>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontWeight: 700,
            fontSize: '14px',
            color: config.color,
            marginBottom: '4px'
          }}>
            {getActivityTitle(type)}
          </div>
          <div style={{
            fontSize: '13px',
            color: config.color,
            opacity: 0.9,
            lineHeight: 1.4
          }}>
            {message}
          </div>
          {data.userName && (
            <div style={{
              fontSize: '11px',
              color: config.color,
              opacity: 0.7,
              marginTop: '6px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <span>👤</span>
              {data.userName}
            </div>
          )}
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            padding: '6px',
            background: 'transparent',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            color: config.color,
            opacity: 0.6,
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '18px'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(0,0,0,0.05)';
            e.currentTarget.style.opacity = '1';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.opacity = '0.6';
          }}
        >
          ✕
        </button>
      </div>

      {/* Progress bar */}
      <div style={{
        position: 'relative',
        height: '3px',
        background: 'rgba(0,0,0,0.05)',
        marginTop: '12px',
        marginLeft: '18px',
        marginRight: '18px',
        borderRadius: '2px',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          left: 0,
          top: 0,
          height: '100%',
          width: '100%',
          background: config.gradient,
          animation: `progress ${duration}ms linear forwards`,
          borderRadius: '2px'
        }} />
      </div>

      <style>{`
        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(100%) translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateX(0) translateY(0);
          }
        }
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        @keyframes progress {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  );
}

function getActivityTitle(type) {
  const titles = {
    'task-created': 'Task Created',
    'task-updated': 'Task Updated',
    'task-deleted': 'Task Deleted',
    'task-moved': 'Task Moved',
    'priority-changed': 'Priority Changed',
    'attachment-added': 'Attachment Added',
    'attachment-deleted': 'Attachment Removed',
    'label-added': 'Label Added',
    'label-removed': 'Label Removed'
  };
  return titles[type] || 'Activity Update';
}
