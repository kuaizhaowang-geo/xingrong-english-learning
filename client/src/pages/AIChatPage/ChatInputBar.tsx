import React, { useRef, useEffect } from 'react';
import { Send, Loader2, Mic } from 'lucide-react';

interface ChatInputBarProps {
  value: string;
  onChange: (val: string) => void;
  onSend: () => void;
  sending: boolean;
  textareaRef: React.RefObject<HTMLTextAreaElement>;
}

const ChatInputBar: React.FC<ChatInputBarProps> = ({
  value,
  onChange,
  onSend,
  sending,
  textareaRef,
}) => {
  // 自动调整 textarea 高度
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 160)}px`;
  }, [value, textareaRef]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>): void => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  const inputWrapperRef = useRef<HTMLDivElement>(null);

  return (
    <div
      className="border-t p-4 flex-shrink-0"
      style={{
        background: 'rgba(26, 22, 53, 0.9)',
        borderTopColor: 'rgba(99, 102, 241, 0.12)',
        backdropFilter: 'blur(8px)',
      }}
    >
      <div
        ref={inputWrapperRef}
        className="flex items-end gap-3 rounded-2xl p-3 transition-all"
        style={{
          background: 'rgba(30, 30, 58, 0.8)',
          border: '1px solid rgba(99, 102, 241, 0.12)',
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.3)';
          e.currentTarget.style.boxShadow = '0 0 15px rgba(99, 102, 241, 0.12)';
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.12)';
          e.currentTarget.style.boxShadow = 'none';
        }}
      >
        {/* 语音输入按钮 */}
        <button
          className="p-2 rounded-xl transition-all flex-shrink-0"
          style={{ color: '#818CF8' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(99, 102, 241, 0.12)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
          }}
          title="语音输入"
        >
          <Mic className="w-5 h-5" />
        </button>

        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="输入消息，Enter 发送，Shift+Enter 换行..."
          rows={1}
          className="flex-1 bg-transparent resize-none text-sm focus:outline-none min-h-[24px] max-h-40"
          style={{ color: '#F1F5F9' }}
        />
        <button
          onClick={onSend}
          disabled={!value.trim() || sending}
          className="w-10 h-10 text-white rounded-full flex items-center justify-center transition-all flex-shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            background: 'linear-gradient(135deg, #6366F1 0%, #06B6D4 100%)',
            boxShadow: value.trim() && !sending
              ? '0 4px 15px rgba(99, 102, 241, 0.25)'
              : 'none',
          }}
        >
          {sending ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
        </button>
      </div>
      <p className="text-xs text-center mt-2" style={{ color: '#64748B' }}>
        AI 回复仅供参考，请结合实际情况使用
      </p>
    </div>
  );
};

export default ChatInputBar;
