import React, { useState, useEffect, useRef } from 'react';
import { AlertCircle, ChevronRight } from 'lucide-react';
import { logger } from '@lark-apaas/client-toolkit/logger';
import * as aiChatApi from '@client/src/api/ai-chat';
import type { AiChatSession, AiChatMessage } from '@shared/api.interface';
import SessionSidebar from './SessionSidebar';
import ChatRightPanel from './ChatRightPanel';
import WelcomeScreen from './WelcomeScreen';
import MessageList from './MessageList';
import ChatInputBar from './ChatInputBar';
import { assistants, type AssistantInfo } from './ai-chat-constants';

const AIChatPage: React.FC = () => {
  // 会话数据
  const [sessions, setSessions] = useState<AiChatSession[]>([]);
  const [currentSession, setCurrentSession] = useState<AiChatSession | null>(null);
  const [messages, setMessages] = useState<AiChatMessage[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);

  // 输入
  const [inputValue, setInputValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 右侧栏折叠
  const [rightPanelCollapsed, setRightPanelCollapsed] = useState(false);

  // 当前选中的助教
  const [selectedAssistant, setSelectedAssistant] = useState<AssistantInfo>(assistants[0]);

  // 删除确认弹窗
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // 折叠面板状态
  const [expandedCorrection, setExpandedCorrection] = useState<Record<string, boolean>>({});
  const [expandedSuggestion, setExpandedSuggestion] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async (): Promise<void> => {
    try {
      setLoadingSessions(true);
      const list = await aiChatApi.getSessions();
      setSessions(list);
      if (list.length > 0) {
        await selectSession(list[0].id);
      }
    } catch (err) {
      logger.error('加载会话列表失败', err as Error);
    } finally {
      setLoadingSessions(false);
    }
  };

  const selectSession = async (id: string): Promise<void> => {
    try {
      setLoadingMessages(true);
      const data = await aiChatApi.getSessionDetail(id);
      setCurrentSession(data.session);
      setMessages(data.messages);
      const matched = assistants.find((a) => a.name === data.session.assistantName);
      if (matched) setSelectedAssistant(matched);
    } catch (err) {
      logger.error('加载会话详情失败', err as Error);
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleNewChat = async (): Promise<void> => {
    try {
      const newSession = await aiChatApi.createSession({
        title: '新对话',
        topic: '自由对话',
        assistantName: selectedAssistant.name,
        assistantAccent: selectedAssistant.accent,
      });
      setSessions((prev) => [newSession, ...prev]);
      setCurrentSession(newSession);
      setMessages([]);
      setExpandedCorrection({});
      setExpandedSuggestion({});
    } catch (err) {
      logger.error('创建会话失败', err as Error);
    }
  };

  const handleTopicClick = async (topic: string): Promise<void> => {
    try {
      const newSession = await aiChatApi.createSession({
        title: topic,
        topic,
        assistantName: selectedAssistant.name,
        assistantAccent: selectedAssistant.accent,
      });
      setSessions((prev) => [newSession, ...prev]);
      setCurrentSession(newSession);
      setMessages([]);
      setExpandedCorrection({});
      setExpandedSuggestion({});
    } catch (err) {
      logger.error('创建话题会话失败', err as Error);
    }
  };

  const handleDeleteClick = (id: string): void => {
    setDeleteConfirmId(id);
  };

  const handleConfirmDelete = async (): Promise<void> => {
    if (!deleteConfirmId) return;
    try {
      await aiChatApi.deleteSession(deleteConfirmId);
      setSessions((prev) => prev.filter((s) => s.id !== deleteConfirmId));
      if (currentSession?.id === deleteConfirmId) {
        setCurrentSession(null);
        setMessages([]);
      }
    } catch (err) {
      logger.error('删除会话失败', err as Error);
    } finally {
      setDeleteConfirmId(null);
    }
  };

  const handleSendMessage = async (): Promise<void> => {
    if (!inputValue.trim() || sending || !currentSession) return;
    const content = inputValue.trim();
    setInputValue('');

    const tempUserMsg: AiChatMessage = {
      id: `temp-${Date.now()}`,
      sessionId: currentSession.id,
      role: 'user',
      content,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);
    setSending(true);

    try {
      const res = await aiChatApi.sendMessage(currentSession.id, { content });
      setMessages((prev) => {
        const filtered = prev.filter((m) => m.id !== tempUserMsg.id);
        return [...filtered, res.userMessage, res.assistantMessage];
      });
      if (res.assistantMessage.correction) {
        setExpandedCorrection((prev) => ({
          ...prev,
          [res.assistantMessage.id]: true,
        }));
      }
      const list = await aiChatApi.getSessions();
      setSessions(list);
    } catch (err) {
      logger.error('发送消息失败', err as Error);
      setMessages((prev) => prev.filter((m) => m.id !== tempUserMsg.id));
    } finally {
      setSending(false);
    }
  };

  const formatTime = (dateStr: string): string => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24),
    );
    if (diffDays === 0) {
      return date.toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit',
      });
    }
    if (diffDays === 1) return '昨天';
    if (diffDays < 7) return `${diffDays}天前`;
    return date.toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric',
    });
  };

  const getAssistantAvatarColor = (name: string): string => {
    const colors: Record<string, string> = {
      Lisa: 'from-pink-400 to-rose-500',
      Jack: 'from-blue-400 to-indigo-500',
      Emma: 'from-purple-400 to-violet-500',
      William: 'from-teal-400 to-cyan-500',
    };
    return colors[name] || 'from-violet-400 to-indigo-500';
  };

  const toggleCorrection = (id: string): void => {
    setExpandedCorrection((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleSuggestion = (id: string): void => {
    setExpandedSuggestion((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div
      className="flex h-[calc(100vh-8rem)] -mx-6 -my-6 relative overflow-hidden"
      style={{ background: 'linear-gradient(180deg, #EEF2FF 0%, #1a1a3a 100%)' }}
    >
      {/* 装饰光晕 */}
      <div
        className="fixed top-0 left-1/4 w-96 h-96 rounded-full pointer-events-none"
        style={{ background: 'rgba(99, 102, 241, 0.06)', filter: 'blur(80px)' }}
      />
      <div
        className="fixed top-0 right-1/4 w-96 h-96 rounded-full pointer-events-none"
        style={{ background: 'rgba(34, 211, 238, 0.06)', filter: 'blur(80px)' }}
      />

      {/* 左侧栏 */}
      <div className="relative z-10">
        <SessionSidebar
          sessions={sessions}
          currentId={currentSession?.id || null}
          loading={loadingSessions}
          onNewChat={handleNewChat}
          onSelect={selectSession}
          onDelete={handleDeleteClick}
          formatTime={formatTime}
        />
      </div>

      {/* 中间主内容区 */}
      <div className="flex-1 flex flex-col min-w-0 relative z-10">
        {!currentSession ? (
          <WelcomeScreen onTopicClick={handleTopicClick} />
        ) : (
          <>
            {/* 顶部栏 */}
            <div
              className="h-14 px-6 flex items-center justify-between flex-shrink-0"
              style={{
                background: 'rgba(26, 22, 53, 0.9)',
                borderBottom: '1px solid rgba(99, 102, 241, 0.12)',
                backdropFilter: 'blur(8px)',
              }}
            >
              <div className="flex items-center gap-3 min-w-0">
                <h2 className="font-semibold truncate" style={{ color: '#F1F5F9' }}>
                  {currentSession.title}
                </h2>
                <span
                  className="px-2 py-0.5 text-xs rounded-full flex-shrink-0"
                  style={{
                    background: 'rgba(99, 102, 241, 0.12)',
                    color: '#818CF8',
                    border: '1px solid rgba(99, 102, 241, 0.2)',
                  }}
                >
                  {currentSession.topic}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-full bg-gradient-to-br ${getAssistantAvatarColor(
                    currentSession.assistantName,
                  )} flex items-center justify-center text-white text-xs font-medium relative`}
                  style={{ boxShadow: '0 0 10px rgba(99, 102, 241, 0.2)' }}
                >
                  {currentSession.assistantName.charAt(0)}
                  <span
                    className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2"
                    style={{
                      background: '#22C55E',
                      borderColor: '#FFFFFF',
                      boxShadow: '0 0 6px rgba(34, 197, 94, 0.6)',
                    }}
                  />
                </div>
                <div className="text-sm">
                  <div className="font-medium" style={{ color: '#F1F5F9' }}>
                    {currentSession.assistantName}
                  </div>
                  <div className="text-xs flex items-center gap-1" style={{ color: '#22C55E' }}>
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                    在线
                  </div>
                </div>
              </div>
            </div>

            {/* 消息列表 */}
            <MessageList
              messages={messages}
              loading={loadingMessages}
              sending={sending}
              assistantName={currentSession.assistantName}
              messagesEndRef={messagesEndRef}
              expandedCorrection={expandedCorrection}
              expandedSuggestion={expandedSuggestion}
              onToggleCorrection={toggleCorrection}
              onToggleSuggestion={toggleSuggestion}
              getAssistantAvatarColor={getAssistantAvatarColor}
              formatTime={formatTime}
            />

            {/* 底部输入区 */}
            <ChatInputBar
              value={inputValue}
              onChange={setInputValue}
              onSend={handleSendMessage}
              sending={sending}
              textareaRef={textareaRef}
            />
          </>
        )}
      </div>

      {/* 右侧栏折叠展开按钮 */}
      {rightPanelCollapsed && (
        <button
          onClick={() => setRightPanelCollapsed(false)}
          className="absolute right-0 top-1/2 -translate-y-1/2 w-6 h-14 rounded-l-xl flex items-center justify-center transition-colors z-20"
          style={{
            background: '#FFFFFF',
            border: '1px solid rgba(99, 102, 241, 0.2)',
            borderRight: 'none',
            color: '#94A3B8',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = '#818CF8'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = '#94A3B8'; }}
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      )}

      {/* 右侧栏 */}
      <div className="relative z-10">
        <ChatRightPanel
          collapsed={rightPanelCollapsed}
          onToggle={() => setRightPanelCollapsed(!rightPanelCollapsed)}
          currentSession={currentSession}
          selectedAssistant={selectedAssistant}
          onSelectAssistant={setSelectedAssistant}
          onTopicClick={handleTopicClick}
          getAssistantAvatarColor={getAssistantAvatarColor}
        />
      </div>

      {/* 删除确认弹窗 */}
      {deleteConfirmId && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50"
          style={{ background: 'rgba(0, 0, 0, 0.6)' }}
        >
          <div
            className="rounded-2xl p-6 w-80"
            style={{
              background: '#FFFFFF',
              border: '1px solid rgba(99, 102, 241, 0.2)',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
            }}
          >
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ background: 'rgba(239, 68, 68, 0.15)' }}
            >
              <AlertCircle className="w-6 h-6" style={{ color: '#EF4444' }} />
            </div>
            <h3 className="text-lg font-semibold text-center mb-2" style={{ color: '#F1F5F9' }}>
              确认删除？
            </h3>
            <p className="text-sm text-center mb-6" style={{ color: '#94A3B8' }}>
              删除后会话记录将无法恢复
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors"
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  color: '#94A3B8',
                  border: '1px solid rgba(99, 102, 241, 0.08)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                  e.currentTarget.style.color = '#F1F5F9';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                  e.currentTarget.style.color = '#94A3B8';
                }}
              >
                取消
              </button>
              <button
                onClick={handleConfirmDelete}
                className="flex-1 py-2.5 text-white rounded-xl text-sm font-medium"
                style={{
                  background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
                  boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)',
                }}
              >
                删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIChatPage;
