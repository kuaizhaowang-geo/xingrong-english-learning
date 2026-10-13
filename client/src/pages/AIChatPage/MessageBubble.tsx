import React from 'react';
import {
  User,
  AlertCircle,
  Lightbulb,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import type { AiChatMessage } from '@shared/api.interface';

interface MessageBubbleProps {
  msg: AiChatMessage;
  assistantName: string;
  displayContent: string;
  isTyping: boolean;
  expandedCorrection: boolean;
  expandedSuggestion: boolean;
  onToggleCorrection: () => void;
  onToggleSuggestion: () => void;
  getAssistantAvatarColor: (name: string) => string;
  formatTime: (dateStr: string) => string;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({
  msg,
  assistantName,
  displayContent,
  isTyping,
  expandedCorrection,
  expandedSuggestion,
  onToggleCorrection,
  onToggleSuggestion,
  getAssistantAvatarColor,
  formatTime,
}) => {
  const isUser = msg.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div
          className={`w-8 h-8 rounded-full bg-gradient-to-br ${getAssistantAvatarColor(
            assistantName,
          )} flex items-center justify-center text-white text-xs font-medium mr-2 mt-1 flex-shrink-0`}
          style={{ boxShadow: '0 0 10px rgba(99, 102, 241, 0.2)' }}
        >
          {assistantName.charAt(0)}
        </div>
      )}

      <div
        className={`max-w-[70%] ${isUser ? 'items-end' : 'items-start'} flex flex-col`}
      >
        <div
          className="px-4 py-3 rounded-2xl"
          style={
            isUser
              ? {
                  background: 'linear-gradient(135deg, #6366F1 0%, #06B6D4 100%)',
                  color: '#fff',
                  borderBottomRightRadius: '6px',
                  boxShadow: '0 4px 15px rgba(99, 102, 241, 0.2)',
                }
              : {
                  background: '#1e1e3a',
                  color: '#F1F5F9',
                  borderBottomLeftRadius: '6px',
                  borderLeft: '3px solid #06B6D4',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
                }
          }
        >
          <p className="text-sm whitespace-pre-wrap leading-relaxed">
            {displayContent}
            {!isUser && isTyping && (
              <span
                className="inline-block w-1.5 h-4 ml-0.5 align-middle rounded-sm"
                style={{ background: '#06B6D4', animation: 'pulse 1s infinite' }}
              />
            )}
          </p>
        </div>

        {/* AI 消息的纠错和建议 */}
        {!isUser && (msg.correction || msg.suggestion) && !isTyping && (
          <div className="mt-2 space-y-2 w-full">
            {msg.correction && (
              <div
                className="rounded-lg overflow-hidden"
                style={{
                  background: 'rgba(244, 63, 94, 0.1)',
                  border: '1px solid rgba(244, 63, 94, 0.3)',
                }}
              >
                <button
                  onClick={onToggleCorrection}
                  className="w-full px-3 py-2 flex items-center justify-between text-left"
                >
                  <span className="flex items-center gap-2 text-xs font-semibold" style={{ color: '#FB7185' }}>
                    <AlertCircle className="w-3.5 h-3.5" />
                    语法纠错
                  </span>
                  {expandedCorrection ? (
                    <ChevronUp className="w-4 h-4" style={{ color: '#FB7185' }} />
                  ) : (
                    <ChevronDown className="w-4 h-4" style={{ color: '#FB7185' }} />
                  )}
                </button>
                {expandedCorrection && (
                  <div
                    className="px-3 pb-3 text-sm border-t pt-2"
                    style={{ color: '#FECDD3', borderTopColor: 'rgba(244, 63, 94, 0.2)' }}
                  >
                    {msg.correction}
                  </div>
                )}
              </div>
            )}

            {msg.suggestion && (
              <div
                className="rounded-lg overflow-hidden"
                style={{
                  background: 'rgba(59, 130, 246, 0.1)',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                }}
              >
                <button
                  onClick={onToggleSuggestion}
                  className="w-full px-3 py-2 flex items-center justify-between text-left"
                >
                  <span className="flex items-center gap-2 text-xs font-semibold" style={{ color: '#60A5FA' }}>
                    <Lightbulb className="w-3.5 h-3.5" />
                    地道表达建议
                  </span>
                  {expandedSuggestion ? (
                    <ChevronUp className="w-4 h-4" style={{ color: '#60A5FA' }} />
                  ) : (
                    <ChevronDown className="w-4 h-4" style={{ color: '#60A5FA' }} />
                  )}
                </button>
                {expandedSuggestion && (
                  <div
                    className="px-3 pb-3 text-sm border-t pt-2"
                    style={{ color: '#BFDBFE', borderTopColor: 'rgba(59, 130, 246, 0.2)' }}
                  >
                    {msg.suggestion}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <span
          className={`text-xs mt-1 ${isUser ? 'text-right' : 'text-left'}`}
          style={{ color: '#64748B' }}
        >
          {formatTime(msg.createdAt)}
        </span>
      </div>

      {isUser && (
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-medium ml-2 mt-1 flex-shrink-0"
          style={{
            background: 'linear-gradient(135deg, #6366F1 0%, #2563EB 100%)',
            boxShadow: '0 0 10px rgba(99, 102, 241, 0.2)',
          }}
        >
          <User className="w-4 h-4" />
        </div>
      )}
    </div>
  );
};

export default MessageBubble;
