import React from 'react';
import { Construction, Gift } from 'lucide-react';

const PromotionPage: React.FC = () => {
  return (
    <div className="min-h-screen pb-12">
      {/* 背景光晕 */}
      <div className="fixed top-0 left-1/4 w-96 h-96 rounded-full bg-pink-500/10 blur-3xl pointer-events-none" />
      <div className="fixed top-20 right-1/4 w-96 h-96 rounded-full bg-violet-600/10 blur-3xl pointer-events-none" />

      <div className="relative max-w-4xl mx-auto p-6">
        {/* ===== 顶部标题 ===== */}
        <div className="text-center mb-8">
          <div
            className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-4"
            style={{
              background:
                'linear-gradient(135deg, rgba(236, 72, 153, 0.2) 0%, rgba(99, 102, 241, 0.12) 100%)',
              border: '1px solid rgba(236, 72, 153, 0.3)',
              boxShadow: '0 0 25px rgba(236, 72, 153, 0.2)',
            }}
          >
            <Gift size={28} style={{ color: '#F472B6' }} />
          </div>
          <h1
            className="text-2xl font-bold mb-1"
            style={{
              background: 'linear-gradient(135deg, #F472B6 0%, #818CF8 50%, #06B6D4 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            推广奖励
          </h1>
          <p className="text-sm text-slate-400">邀请好友一起学，双赢奖励拿不停</p>
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
              background: 'rgba(236, 72, 153, 0.15)',
              border: '1px solid rgba(236, 72, 153, 0.3)',
            }}
          >
            <Construction size={40} style={{ color: '#F472B6' }} />
          </div>
          <h2 className="text-lg font-semibold text-slate-100 mb-2">
            功能建设中
          </h2>
           <p className="text-sm text-slate-400 text-center max-w-xs">
            推广返利功能正在开发中，敬请期待！
            <br />
            上线后邀请好友注册学习即可获得阶梯奖励。
          </p>
        </div>
      </div>
    </div>
  );
};

export default PromotionPage;
