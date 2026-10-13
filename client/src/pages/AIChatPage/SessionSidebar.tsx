import React from 'react';
import { MessageSquare, Plus, Trash2, Loader2 } from 'lucide-react';
import type { AiChatSession } from '@shared/api.interface';

interface SessionSidebarProps {
  sessions: AiChatSession[];
  currentId: string | null;
  loading: boolean;
  onNewChat: () => void;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  formatTime: (dateStr: string) => string;
}

const SessionSidebar: React.FC<SessionSidebarProps> = ({
  sessions,
  currentId,
  loading,
  onNewChat,
  onSelect,
  onDelete,
  formatTime,
}) => {
  return (
    <div
      className="w-64 flex flex-col flex-shrink-0"
      style={{
        background: '#FFFFFF',
        borderRight: '1px solid rgba(99, 102, 241, 0.2)',
      }}
    >
      <div className="p-4">
        <button
          onClick={onNewChat}
          className="w-full py-2.5 text-white rounded-xl font-medium
            transition-all flex items-center justify-center gap-2
            hover:shadow-lg hover:shadow-violet-500/30"
          style={{
            background: 'linear-gradient(135deg, #6366F1 0%, #2563EB 100%)',
            boxShadow: '0 4px 15px rgba(99, 102, 241, 0.2)',
          }}
        >
          <Plus className="w-5 h-5" />
          新建对话
        </button>
      </div>

      <div className="px-4 py-2">
        <h3
          className="text-xs font-semibold uppercase tracking-wider"
          style={{ color: '#64748B' }}
        >
          最近会话
        </h3>
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-1">
        {loading ? (
          <div className="px-3 py-8 text-center text-sm" style={{ color: '#64748B' }}>
            <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" style={{ color: '#6366F1' }} />
            加载中...
          </div>
        ) : sessions.length === 0 ? (
          <div className="px-3 py-8 text-center text-sm" style={{ color: '#64748B' }}>
            暂无会话
          </div>
        ) : (
          sessions.map((session) => {
            const isActive = currentId === session.id;
            return (
              <div
                key={session.id}
                onClick={() => onSelect(session.id)}
                className="group relative px-3 py-2.5 rounded-lg cursor-pointer transition-all"
                style={{
                  background: isActive
                    ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(59, 130, 246, 0.2) 100%)'
                    : 'transparent',
                  border: isActive
                    ? '1px solid rgba(99, 102, 241, 0.35)'
                    : '1px solid transparent',
                  color: isActive ? '#1E293B' : '#64748B',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'rgba(99, 102, 241, 0.08)';
                    e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.12)';
                    e.currentTarget.style.color = '#1E293B';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.borderColor = 'transparent';
                    e.currentTarget.style.color = '#64748B';
                  }
                }}
              >
                <div className="flex items-start gap-2">
                  <MessageSquare
                    className="w-4 h-4 mt-0.5 flex-shrink-0"
                    style={{ color: isActive ? '#818CF8' : '#64748B' }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">
                      {session.title}
                    </div>
                    <div className="text-xs mt-0.5" style={{ color: '#64748B' }}>
                      {formatTime(session.updatedAt)}
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(session.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded transition-all"
                    style={{ color: '#64748B' }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = '#F43F5E';
                      e.currentTarget.style.background = 'rgba(244, 63, 94, 0.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = '#64748B';
                      e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default SessionSidebar;
