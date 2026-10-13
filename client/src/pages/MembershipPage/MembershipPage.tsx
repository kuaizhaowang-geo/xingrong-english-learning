import React, { useState } from 'react';
import {
  Crown,
  Check,
  Sparkles,
  BookOpen,
  MessageCircle,
  Mic2,
  Download,
  Headphones,
  ShieldCheck,
  Zap,
  CreditCard,
} from 'lucide-react';

// ===== 套餐配置 =====
const plans = [
  {
    id: 'month',
    label: '月卡',
    price: 29,
    originalPrice: 39,
    period: '/月',
    tag: '',
    tagGradient: '',
    savings: '',
    benefits: [
      '全部课程解锁',
      'AI对话无限次',
      '口语评测高级版',
    ],
  },
  {
    id: 'quarter',
    label: '季卡',
    price: 79,
    originalPrice: 117,
    period: '/季',
    tag: '最受欢迎',
    tagGradient: 'linear-gradient(135deg, #818CF8 0%, #F472B6 100%)',
    savings: '省38元',
    benefits: [
      '全部课程解锁',
      'AI对话无限次',
      '口语评测高级版',
      '离线下载',
      '专属客服',
    ],
  },
  {
    id: 'year',
    label: '年卡',
    price: 258,
    originalPrice: 348,
    period: '/年',
    tag: '超值之选',
    tagGradient: 'linear-gradient(135deg, #FCD34D 0%, #F59E0B 100%)',
    savings: '省90元',
    benefits: [
      '全部课程解锁',
      'AI对话无限次',
      '口语评测高级版',
      '离线下载',
      '专属客服',
      '优先体验新功能',
    ],
  },
];

// ===== 权益图标 =====
const benefitIcons = [
  { key: '全部课程解锁', icon: BookOpen, color: '#6366F1' },
  { key: 'AI对话无限次', icon: MessageCircle, color: '#06B6D4' },
  { key: '口语评测高级版', icon: Mic2, color: '#F472B6' },
  { key: '离线下载', icon: Download, color: '#22C55E' },
  { key: '专属客服', icon: Headphones, color: '#2563EB' },
  { key: '优先体验新功能', icon: Sparkles, color: '#F59E0B' },
];

const paymentMethods = [
  { id: 'wechat', label: '微信支付', color: '#22C55E' },
  { id: 'alipay', label: '支付宝', color: '#2563EB' },
];

const MembershipPage: React.FC = () => {
  const [selectedPlan, setSelectedPlan] = useState('year');
  const [payment, setPayment] = useState('wechat');
  const [loading, setLoading] = useState(false);
  const isMember = true;

  const selected = plans.find((p) => p.id === selectedPlan) ?? plans[2];

  const handleActivate = (): void => {
    setLoading(true);
    setTimeout(() => setLoading(false), 1500);
  };

  if (loading) {
    return (
      <div className="min-h-screen p-6">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-6">
             <div className="h-32 glass-card rounded-2xl" />
             <div className="h-64 glass-card rounded-2xl" />
             <div className="h-40 glass-card rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-12">
      {/* 背景光晕 */}
      <div className="fixed top-0 left-1/3 w-96 h-96 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
      <div className="fixed top-32 right-1/4 w-80 h-80 rounded-full bg-violet-600/10 blur-3xl pointer-events-none" />

      <div className="relative max-w-4xl mx-auto p-6">
        {/* ===== 页面标题 ===== */}
        <div className="text-center mb-8">
          <div className="relative inline-block mb-4">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, rgba(252, 211, 77, 0.2) 0%, rgba(245, 158, 11, 0.2) 100%)',
                border: '1px solid rgba(252, 211, 77, 0.3)',
                boxShadow: '0 0 25px rgba(252, 211, 77, 0.2)',
              }}
            >
              <Crown size={28} style={{ color: '#FCD34D' }} />
            </div>
          </div>
          <h1
            className="text-2xl font-bold mb-1"
            style={{
              background: 'linear-gradient(135deg, #FCD34D 0%, #F59E0B 50%, #FB923C 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            开通学习卡
          </h1>
          <p className="text-sm text-slate-500">解锁全部英语学习权益</p>
        </div>

        {/* ===== 当前会员状态 ===== */}
        <div
          className="rounded-2xl p-5 mb-8 overflow-hidden relative"
          style={{
            background: 'rgba(26, 22, 53, 0.8)',
            border: '1px solid rgba(252, 211, 77, 0.2)',
          }}
        >
          <div
            className="absolute top-0 right-0 w-32 h-32 rounded-full blur-2xl opacity-30"
            style={{ background: '#FCD34D' }}
          />
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, #FCD34D 0%, #F59E0B 100%)',
                }}
              >
                <ShieldCheck size={22} style={{ color: '#FFFFFF' }} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-100">
                    {isMember ? '已开通学习卡' : '未开通学习卡'}
                  </span>
                  {isMember && (
                    <span
                      className="px-2 py-0.5 rounded text-xs font-bold"
                      style={{
                        background: 'linear-gradient(135deg, #FCD34D 0%, #F59E0B 100%)',
                        color: '#FFFFFF',
                      }}
                    >
                      VIP
                    </span>
                  )}
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  {isMember ? '到期时间：2027年08月28日' : '开通后立即享受全部会员权益'}
                </div>
              </div>
            </div>
            <button
              className="text-sm font-medium px-4 py-2 rounded-lg"
              style={{ color: '#818CF8' }}
            >
              了解权益
            </button>
          </div>
        </div>

        {/* ===== 套餐卡片 ===== */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Zap size={18} style={{ color: '#FCD34D' }} />
            <h2 className="text-base font-semibold text-white">选择套餐</h2>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {plans.map((plan) => {
              const active = selectedPlan === plan.id;
              return (
                <button
                  key={plan.id}
                  onClick={() => setSelectedPlan(plan.id)}
                  className="relative p-5 rounded-2xl transition-all text-left"
                  style={{
                    background: active
                      ? 'linear-gradient(180deg, rgba(99, 102, 241, 0.08) 0%, rgba(26, 22, 53, 0.9) 100%)'
                      : 'rgba(26, 22, 53, 0.6)',
                    border: active
                      ? '1px solid rgba(99, 102, 241, 0.35)'
                      : '1px solid rgba(99, 102, 241, 0.08)',
                    boxShadow: active ? '0 0 20px rgba(99, 102, 241, 0.12)' : 'none',
                    transform: active ? 'translateY(-2px)' : 'none',
                  }}
                >
                  {/* 推荐标签 */}
                  {plan.tag && (
                    <div
                      className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-xs font-bold whitespace-nowrap"
                      style={{
                        background: plan.tagGradient,
                        color: '#FFFFFF',
                        boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
                      }}
                    >
                      {plan.tag}
                    </div>
                  )}

                  <div className="text-center mb-4">
                    <div
                      className="text-sm font-medium mb-2"
                      style={{ color: active ? '#818CF8' : '#94A3B8' }}
                    >
                      {plan.label}
                    </div>
                    <div className="flex items-baseline justify-center gap-0.5">
                      <span className="text-sm" style={{ color: '#FCD34D' }}>
                        ¥
                      </span>
                      <span
                        className="text-3xl font-bold"
                        style={{
                          background:
                            'linear-gradient(135deg, #FCD34D 0%, #F59E0B 100%)',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                        }}
                      >
                        {plan.price}
                      </span>
                      <span className="text-xs text-slate-500">{plan.period}</span>
                    </div>
                    <div
                      className="text-xs mt-1"
                      style={{ color: '#64748B', textDecoration: 'line-through' }}
                    >
                      原价 ¥{plan.originalPrice}
                    </div>
                    {plan.savings && (
                      <div
                        className="text-xs font-medium mt-1"
                        style={{ color: '#FB923C' }}
                      >
                        {plan.savings}
                      </div>
                    )}
                  </div>

                  {/* 权益列表 */}
                  <div className="space-y-2">
                    {plan.benefits.map((b: string, i: number) => {
                      const iconItem = benefitIcons.find((bi) => bi.key === b);
                      const Icon = iconItem?.icon ?? Check;
                      return (
                        <div key={i} className="flex items-center gap-2">
                          <div
                            className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"
                            style={{
                              background: 'rgba(34, 197, 94, 0.15)',
                            }}
                          >
                            <Check size={10} style={{ color: '#22C55E' }} />
                          </div>
                          <span className="text-xs text-slate-400">{b}</span>
                          {Icon && <div style={{ width: 0 }} />}
                        </div>
                      );
                    })}
                  </div>

                  {/* 选中标记 */}
                  {active && (
                    <div
                      className="absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center"
                      style={{
                        background: 'linear-gradient(135deg, #6366F1 0%, #2563EB 100%)',
                      }}
                    >
                      <Check size={12} className="text-white" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ===== 全部权益展示 ===== */}
        <div
          className="rounded-2xl p-6 mb-8"
          style={{
            background: 'rgba(26, 22, 53, 0.8)',
            border: '1px solid rgba(99, 102, 241, 0.12)',
          }}
        >
          <div className="flex items-center gap-2 mb-5">
            <Sparkles size={18} style={{ color: '#818CF8' }} />
            <h2 className="text-base font-semibold text-slate-100">学习卡权益</h2>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {benefitIcons.map((item, idx: number) => {
              const Icon = item.icon;
              return (
                <div
                  key={idx}
                  className="p-4 rounded-xl text-center"
                  style={{
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid rgba(99, 102, 241, 0.08)',
                  }}
                >
                  <div
                    className="w-10 h-10 mx-auto rounded-xl flex items-center justify-center mb-2"
                    style={{
                      background: `${item.color}15`,
                    }}
                  >
                    <Icon size={20} style={{ color: item.color }} />
                  </div>
                  <div className="text-sm font-medium text-slate-200">{item.key}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ===== 支付方式选择 ===== */}
        <div
          className="rounded-2xl p-6 mb-6"
          style={{
            background: 'rgba(26, 22, 53, 0.8)',
            border: '1px solid rgba(99, 102, 241, 0.12)',
          }}
        >
          <div className="flex items-center gap-2 mb-4">
            <CreditCard size={18} style={{ color: '#06B6D4' }} />
            <h2 className="text-base font-semibold text-slate-100">支付方式</h2>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {paymentMethods.map((method) => {
              const active = payment === method.id;
              return (
                <button
                  key={method.id}
                  onClick={() => setPayment(method.id)}
                  className="flex items-center gap-3 p-4 rounded-xl transition-all"
                  style={{
                    background: active
                      ? `${method.color}10`
                      : 'rgba(255, 255, 255, 0.02)',
                    border: active
                      ? `1px solid ${method.color}60`
                      : '1px solid rgba(99, 102, 241, 0.08)',
                  }}
                >
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center"
                    style={{ background: `${method.color}20` }}
                  >
                    <CreditCard size={18} style={{ color: method.color }} />
                  </div>
                  <span
                    className="text-sm font-medium"
                    style={{ color: active ? method.color : '#CBD5E1' }}
                  >
                    {method.label}
                  </span>
                  {active && (
                    <div
                      className="ml-auto w-5 h-5 rounded-full flex items-center justify-center"
                      style={{ background: method.color }}
                    >
                      <Check size={12} className="text-white" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ===== 立即开通按钮 ===== */}
        <div className="space-y-4">
          <button
            onClick={handleActivate}
            disabled={loading}
            className="w-full py-4 rounded-xl text-base font-bold transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-70"
            style={{
              background:
                'linear-gradient(135deg, #FCD34D 0%, #F59E0B 50%, #F97316 100%)',
              color: '#FFFFFF',
              boxShadow: '0 0 30px rgba(251, 191, 36, 0.35)',
            }}
          >
            立即开通 · {selected.label} ¥{selected.price}
          </button>

          <div className="text-center space-y-1 text-xs text-slate-600">
            <p>学习卡为虚拟商品，一经开通不支持退款</p>
            <p>
              开通即表示同意
              <span style={{ color: '#818CF8' }} className="cursor-pointer mx-1">
                《服务协议》
              </span>
              和
              <span style={{ color: '#818CF8' }} className="cursor-pointer mx-1">
                《自动续费协议》
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MembershipPage;
