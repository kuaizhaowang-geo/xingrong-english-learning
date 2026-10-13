import React from 'react';
import { Sparkles } from 'lucide-react';
import { quickQuestions } from './ai-chat-constants';

interface WelcomeScreenProps {
  onTopicClick: (topic: string) => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onTopicClick }) => {
  return (
    <div
      className="flex-1 flex items-center justify-center p-8 overflow-y-auto"
      style={{ background: 'linear-gradient(180deg, #EEF2FF 0%, #1a1a3a 100%)' }}
    >
      <div className="max-w-3xl w-full text-center">
        {/* Hero Icon */}
        <div className="mb-8">
          <div
            className="inline-flex items-center justify-center w-20 h-20 rounded-2xl text-white mb-6"
            style={{
              background: 'linear-gradient(135deg, #6366F1 0%, #06B6D4 100%)',
              boxShadow: '0 0 40px rgba(99, 102, 241, 0.25)',
            }}
          >
            <Sparkles className="w-10 h-10" />
          </div>
          <h1
            className="text-3xl font-bold mb-3"
            style={{
              background: 'linear-gradient(135deg, #818CF8 0%, #06B6D4 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            AI 英语对话陪练
          </h1>
          <p style={{ color: '#94A3B8' }} className="text-lg">
            选择一个话题，开始你的口语练习之旅
          </p>
        </div>

        {/* 快捷问题卡片 */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          {quickQuestions.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.title}
                onClick={() => onTopicClick(item.title)}
                className="group p-5 rounded-2xl transition-all text-left"
                style={{
                  background: 'rgba(26, 22, 53, 0.8)',
                  border: '1px solid rgba(99, 102, 241, 0.12)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.3)';
                  e.currentTarget.style.boxShadow = '0 0 20px rgba(99, 102, 241, 0.12)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.12)';
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div
                  className={`w-10 h-10 rounded-xl bg-gradient-to-br ${item.gradient} flex items-center justify-center text-white mb-3 group-hover:scale-110 transition-transform`}
                  style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-semibold mb-1" style={{ color: '#F1F5F9' }}>
                  {item.title}
                </h3>
                <p className="text-xs" style={{ color: '#64748B' }}>
                  {item.desc}
                </p>
              </button>
            );
          })}
        </div>

        <p className="text-sm" style={{ color: '#64748B' }}>
          💡 点击右侧话题分类，发现更多练习场景
        </p>
      </div>
    </div>
  );
};

export default WelcomeScreen;
