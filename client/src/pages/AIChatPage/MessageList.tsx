import React, { useState, useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import type { AiChatMessage } from '@shared/api.interface';
import MessageBubble from './MessageBubble';

interface MessageListProps {
  messages: AiChatMessage[];
  loading: boolean;
  sending: boolean;
  assistantName: string;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  expandedCorrection: Record<string, boolean>;
  expandedSuggestion: Record<string, boolean>;
  onToggleCorrection: (id: string) => void;
  onToggleSuggestion: (id: string) => void;
  getAssistantAvatarColor: (name: string) => string;
  formatTime: (dateStr: string) => string;
}

const MessageList: React.FC<MessageListProps> = ({
  messages,
  loading,
  sending,
  assistantName,
  messagesEndRef,
  expandedCorrection,
  expandedSuggestion,
  onToggleCorrection,
  onToggleSuggestion,
  getAssistantAvatarColor,
  formatTime,
}) => {
  // 打字动画状态
  const [typedId, setTypedId] = useState<string | null>(null);
  const [typedContent, setTypedContent] = useState('');
  const typingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 找到最新的 AI 消息
  const latestAiMsg = [...messages].reverse().find((m) => m.role === 'assistant');

  // 打字动画效果
  useEffect(() => {
    if (typingRef.current) {
      clearInterval(typingRef.current);
      typingRef.current = null;
    }

    if (!latestAiMsg || sending) return;

    if (typedId !== latestAiMsg.id) {
      setTypedId(latestAiMsg.id);
      setTypedContent('');

      let index = 0;
      const text = latestAiMsg.content;
      const speed = Math.max(15, Math.min(40, Math.floor(600 / text.length)));

      typingRef.current = setInterval(() => {
        index += 1;
        setTypedContent(text.slice(0, index));
        if (index >= text.length) {
          if (typingRef.current) {
            clearInterval(typingRef.current);
            typingRef.current = null;
          }
        }
      }, speed);
    }

    return () => {
      if (typingRef.current) {
        clearInterval(typingRef.current);
        typingRef.current = null;
      }
    };
  }, [latestAiMsg?.id, sending]);

  // 发送中重置打字状态
  useEffect(() => {
    if (sending) {
      setTypedId(null);
      setTypedContent('');
    }
  }, [sending]);

  const isTyping = (msgId: string): boolean => {
    return typedId === msgId && typedContent.length < (latestAiMsg?.content.length || 0);
  };

  const getDisplayContent = (msg: AiChatMessage): string => {
    if (msg.role === 'assistant' && typedId === msg.id) {
      return typedContent;
    }
    return msg.content;
  };

  if (loading) {
    return (
      <div
        className="flex-1 flex items-center justify-center"
        style={{ background: 'linear-gradient(180deg, #EEF2FF 0%, #1a1a3a 100%)', color: '#64748B' }}
      >
        <Loader2 className="w-6 h-6 animate-spin mr-2" style={{ color: '#6366F1' }} />
        加载消息...
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div
        className="flex-1 flex items-center justify-center"
        style={{ background: 'linear-gradient(180deg, #EEF2FF 0%, #1a1a3a 100%)' }}
      >
        <div className="text-center" style={{ color: '#64748B' }}>
          <div
            className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center"
            style={{
              background: 'rgba(99, 102, 241, 0.08)',
              border: '1px solid rgba(99, 102, 241, 0.12)',
            }}
          >
            <svg
              className="w-8 h-8"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              style={{ color: '#6366F1' }}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
              />
            </svg>
          </div>
          <p className="text-sm" style={{ color: '#94A3B8' }}>开始和 AI 对话吧</p>
          <p className="text-xs mt-1" style={{ color: '#64748B' }}>
            试试说 &quot;Hello, let&apos;s have a conversation!&quot;
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex-1 overflow-y-auto px-6 py-4 space-y-4"
      style={{ background: 'linear-gradient(180deg, #EEF2FF 0%, #1a1a3a 100%)' }}
    >
      {messages.map((msg) => (
        <MessageBubble
          key={msg.id}
          msg={msg}
          assistantName={assistantName}
          displayContent={getDisplayContent(msg)}
          isTyping={isTyping(msg.id)}
          expandedCorrection={!!expandedCorrection[msg.id]}
          expandedSuggestion={!!expandedSuggestion[msg.id]}
          onToggleCorrection={() => onToggleCorrection(msg.id)}
          onToggleSuggestion={() => onToggleSuggestion(msg.id)}
          getAssistantAvatarColor={getAssistantAvatarColor}
          formatTime={formatTime}
        />
      ))}

      {/* AI "正在输入" loading 态 */}
      {sending && (
        <div className="flex justify-start">
          <div
            className={`w-8 h-8 rounded-full bg-gradient-to-br ${getAssistantAvatarColor(
              assistantName,
            )} flex items-center justify-center text-white text-xs font-medium mr-2 mt-1 flex-shrink-0`}
            style={{ boxShadow: '0 0 10px rgba(99, 102, 241, 0.2)' }}
          >
            {assistantName.charAt(0)}
          </div>
          <div
            className="px-4 py-3 rounded-2xl"
            style={{
              background: '#1e1e3a',
              borderBottomLeftRadius: '6px',
              borderLeft: '3px solid #06B6D4',
            }}
          >
            <div className="flex items-center gap-1">
              <div
                className="w-2 h-2 rounded-full animate-bounce"
                style={{ background: '#6366F1', animationDelay: '0ms' }}
              />
              <div
                className="w-2 h-2 rounded-full animate-bounce"
                style={{ background: '#6366F1', animationDelay: '150ms' }}
              />
              <div
                className="w-2 h-2 rounded-full animate-bounce"
                style={{ background: '#6366F1', animationDelay: '300ms' }}
              />
            </div>
          </div>
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageList;
