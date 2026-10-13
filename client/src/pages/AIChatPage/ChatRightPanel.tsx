import React from 'react';
import {
  Sparkles,
  Bot,
  Volume2,
  Settings,
  X,
} from 'lucide-react';
import {
  topicCategories,
  aiCapabilities,
  assistants,
} from './ai-chat-constants';
import type { AiChatSession } from '@shared/api.interface';
import type { AssistantInfo } from './ai-chat-constants';

interface ChatRightPanelProps {
  collapsed: boolean;
  onToggle: () => void;
  currentSession: AiChatSession | null;
  selectedAssistant: AssistantInfo;
  onSelectAssistant: (asst: AssistantInfo) => void;
  onTopicClick: (topic: string) => void;
  getAssistantAvatarColor: (name: string) => string;
}

const ChatRightPanel: React.FC<ChatRightPanelProps> = ({
  collapsed,
  onToggle,
  currentSession,
  selectedAssistant,
  onSelectAssistant,
  onTopicClick,
  getAssistantAvatarColor,
}) => {
  if (collapsed) return null;

  return (
    <div
      className="w-72 flex flex-col overflow-hidden flex-shrink-0"
      style={{
        background: '#FFFFFF',
        borderLeft: '1px solid rgba(99, 102, 241, 0.2)',
      }}
    >
      {/* 头部 */}
      <div
        className="h-14 px-4 flex items-center justify-between"
        style={{ borderBottom: '1px solid rgba(99, 102, 241, 0.12)' }}
      >
        <h3 className="font-semibold flex items-center gap-2" style={{ color: '#1E293B' }}>
          <Settings className="w-4 h-4" style={{ color: '#818CF8' }} />
          会话设置
        </h3>
        <button
          onClick={onToggle}
          className="p-1.5 rounded-lg transition-colors"
          style={{ color: '#64748B' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(99, 102, 241, 0.08)';
                           e.currentTarget.style.color = '#1E293B';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = '#64748B';
          }}
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-6 p-4">
        {/* 话题选择 */}
        <div>
          <h4 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: '#1E293B' }}>
            <Sparkles className="w-4 h-4" style={{ color: '#6366F1' }} />
            话题选择
          </h4>
          <div className="space-y-3">
            {topicCategories.map((cat) => {
              const CatIcon = cat.icon;
              return (
                <div key={cat.key} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-6 h-6 rounded-md ${cat.bgColor} ${cat.borderColor} border flex items-center justify-center`}
                    >
                      <CatIcon className={`w-3.5 h-3.5 ${cat.color}`} />
                    </div>
                    <span className="text-xs font-medium" style={{ color: '#64748B' }}>
                      {cat.label}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 pl-8">
                    {cat.topics.map((topic) => (
                      <button
                        key={topic}
                        onClick={() => onTopicClick(topic)}
                        className="px-2.5 py-1 text-xs rounded-lg transition-all"
                        style={{
                          background: 'rgba(99, 102, 241, 0.04)',
                          border: '1px solid rgba(99, 102, 241, 0.12)',
                          color: '#475569',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.35)';
                         e.currentTarget.style.color = '#1E293B';
                          e.currentTarget.style.background = 'rgba(99, 102, 241, 0.08)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.12)';
                          e.currentTarget.style.color = '#475569';
                          e.currentTarget.style.background = 'rgba(99, 102, 241, 0.04)';
                        }}
                      >
                        {topic}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* AI 能力展示 */}
        <div>
          <h4 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: '#1E293B' }}>
            <Bot className="w-4 h-4" style={{ color: '#06B6D4' }} />
            AI 能力
          </h4>
          <div className="grid grid-cols-2 gap-2">
            {aiCapabilities.map((cap) => {
              const CapIcon = cap.icon;
              return (
                <div
                  key={cap.label}
                  className="p-3 rounded-xl"
                  style={{
                    background: 'rgba(99, 102, 241, 0.04)',
                    border: '1px solid rgba(99, 102, 241, 0.12)',
                  }}
                >
                  <div
                    className={`w-8 h-8 rounded-lg ${cap.bg} flex items-center justify-center mb-2`}
                  >
                    <CapIcon className={`w-4 h-4 ${cap.color}`} />
                  </div>
                  <div className="text-xs font-semibold" style={{ color: '#1E293B' }}>
                    {cap.label}
                  </div>
                  <div className="text-[10px] mt-0.5 leading-tight" style={{ color: '#64748B' }}>
                    {cap.desc}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 助教选择 */}
        <div>
          <h4 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: '#1E293B' }}>
            <Volume2 className="w-4 h-4" style={{ color: '#6366F1' }} />
            选择助教
          </h4>
          <div className="grid grid-cols-2 gap-2">
            {assistants.map((asst) => {
              const isSelected = selectedAssistant.name === asst.name;
              return (
                <button
                  key={asst.name}
                  onClick={() => onSelectAssistant(asst)}
                  className="p-3 rounded-xl transition-all text-left"
                  style={{
                    background: isSelected
                      ? 'rgba(99, 102, 241, 0.1)'
                      : 'rgba(99, 102, 241, 0.04)',
                    border: isSelected
                      ? '2px solid rgba(99, 102, 241, 0.3)'
                      : '2px solid rgba(99, 102, 241, 0.08)',
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.2)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.08)';
                    }
                  }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div
                      className={`w-8 h-8 rounded-full bg-gradient-to-br ${getAssistantAvatarColor(
                        asst.name,
                      )} flex items-center justify-center text-white text-xs font-medium`}
                    >
                      {asst.name.charAt(0)}
                    </div>
                    <span className="text-lg">{asst.flag}</span>
                  </div>
                  <div className="text-sm font-semibold" style={{ color: '#1E293B' }}>
                    {asst.name}
                  </div>
                  <div className="text-[10px]" style={{ color: '#64748B' }}>{asst.accent}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 当前话题 */}
        {currentSession && (
          <div>
            <h4 className="text-sm font-semibold mb-3" style={{ color: '#1E293B' }}>
              当前话题
            </h4>
            <div
              className="p-3 rounded-xl"
              style={{
                background: 'rgba(99, 102, 241, 0.04)',
                border: '1px solid rgba(99, 102, 241, 0.12)',
              }}
            >
              <div className="text-sm font-medium" style={{ color: '#1E293B' }}>
                {currentSession.title}
              </div>
              <div className="text-xs mt-1" style={{ color: '#64748B' }}>
                助教：{currentSession.assistantName} ·{' '}
                {currentSession.assistantAccent}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatRightPanel;
