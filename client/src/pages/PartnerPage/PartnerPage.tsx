import React from 'react';
import { Construction, Crown } from 'lucide-react';

const PartnerPage: React.FC = () => {
  return (
    <div className="min-h-screen pb-12">
      {/* 背景光晕 */}
      <div className="fixed top-0 left-1/4 w-96 h-96 rounded-full bg-violet-600/10 blur-3xl pointer-events-none" />
      <div className="fixed top-20 right-1/4 w-96 h-96 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />

      <div className="relative max-w-4xl mx-auto p-6">
        {/* ===== 顶部：等级徽章 + 标题 ===== */}
        <div className="text-center mb-8">
          <div className="relative inline-block mb-4">
            <div
              className="w-24 h-24 rounded-full flex items-center justify-center"
              style={{
                background:
                  'conic-gradient(from 0deg, #FCD34D, #F59E0B, #FCD34D, #B45309, #FCD34D)',
                boxShadow: '0 0 30px rgba(251, 191, 36, 0.3)',
              }}
            >
              <div
                className="w-[84px] h-[84px] rounded-full flex items-center justify-center"
                style={{ background: '#FFFFFF' }}
              >
                <Crown size={36} style={{ color: '#FCD34D' }} />
              </div>
            </div>
          </div>
          <h1
            className="text-2xl font-bold mb-1"
            style={{
              background: 'linear-gradient(135deg, #818CF8 0%, #06B6D4 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            合伙人中心
          </h1>
          <p className="text-sm text-slate-400">共享英语学习生态红利</p>
        </div>

        {/* ===== 功能建设中 ===== */}
        <div
          className="rounded-2xl p-6 min-h-[400px] flex flex-col items-center justify-center"
          style={{
            background: 'rgba(26, 22, 53, 0.8)',
            border: '1px solid rgba(99, 102, 241, 0.12)',
          }}
        >
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center mb-5"
            style={{
              background: 'rgba(252, 211, 77, 0.15)',
              border: '1px solid rgba(252, 211, 77, 0.3)',
            }}
          >
            <Construction size={40} style={{ color: '#FCD34D' }} />
          </div>
          <h2 className="text-lg font-semibold text-slate-100 mb-2">
            功能建设中
          </h2>
           <p className="text-sm text-slate-400 text-center max-w-xs">
            合伙人计划功能正在开发中，敬请期待！
            <br />
            上线后可推广课程获取收益分成，等级越高分成越高。
          </p>
        </div>
      </div>
    </div>
  );
};

export default PartnerPage;
