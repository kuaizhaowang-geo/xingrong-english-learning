import React from 'react';

const wrapSvg = (children: React.ReactNode, bgFrom = '#1E3A5F', bgTo = '#2D2850') => (
  <svg
    viewBox="0 0 400 150"
    width="100%"
    height="100%"
    preserveAspectRatio="xMidYMid slice"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={bgFrom} />
        <stop offset="100%" stopColor={bgTo} />
      </linearGradient>
    </defs>
    <rect width="400" height="150" fill="url(#bg)" />
    {children}
  </svg>
);

// 1. 家庭场景
export const SceneFamily: React.FC = () => wrapSvg(
  <>
    {/* 地板 */}
    <rect x="0" y="110" width="400" height="40" fill="#2a2450" />
    {/* 沙发 */}
    <rect x="60" y="80" width="120" height="30" rx="8" fill="#8B5CF6" opacity="0.7" />
    <rect x="55" y="70" width="20" height="40" rx="6" fill="#A78BFA" opacity="0.7" />
    <rect x="165" y="70" width="20" height="40" rx="6" fill="#A78BFA" opacity="0.7" />
    {/* 爸爸 */}
    <circle cx="90" cy="65" r="10" fill="#FCD5B5" />
    <rect x="82" y="75" width="16" height="20" rx="3" fill="#3B82F6" />
    {/* 妈妈 */}
    <circle cx="120" cy="63" r="9" fill="#FCD5B5" />
    <path d="M111 72 Q120 68 129 72 L129 92 L111 92 Z" fill="#EC4899" />
    {/* 孩子 */}
    <circle cx="150" cy="70" r="8" fill="#FCD5B5" />
    <rect x="143" y="78" width="14" height="16" rx="3" fill="#F59E0B" />
    {/* 台灯 */}
    <rect x="280" y="50" width="4" height="55" fill="#6B7280" />
    <ellipse cx="282" cy="48" rx="18" ry="8" fill="#FCD34D" opacity="0.8" />
    <circle cx="282" cy="48" r="14" fill="#FEF3C7" opacity="0.4" />
    {/* 书架 */}
    <rect x="320" y="40" width="50" height="70" fill="#4B5563" rx="3" />
    <rect x="325" y="50" width="12" height="25" fill="#EF4444" rx="1" />
    <rect x="340" y="55" width="12" height="20" fill="#10B981" rx="1" />
    <rect x="355" y="52" width="10" height="23" fill="#F59E0B" rx="1" />
    <rect x="325" y="82" width="14" height="22" fill="#6366F1" rx="1" />
    <rect x="342" y="85" width="10" height="19" fill="#EC4899" rx="1" />
  </>,
  '#2D1B4E', '#1A1635'
);

// 2. 学校场景
export const SceneSchool: React.FC = () => wrapSvg(
  <>
    {/* 地平线 */}
    <rect x="0" y="115" width="400" height="35" fill="#1E3A5F" />
    {/* 教学楼 */}
    <rect x="230" y="35" width="130" height="80" fill="#4B5563" rx="4" />
    <polygon points="225,35 295,10 365,35" fill="#6366F1" opacity="0.7" />
    {/* 窗户 */}
    <rect x="245" y="50" width="20" height="20" fill="#FDE68A" rx="2" />
    <rect x="275" y="50" width="20" height="20" fill="#FDE68A" rx="2" />
    <rect x="305" y="50" width="20" height="20" fill="#FDE68A" rx="2" />
    <rect x="335" y="50" width="15" height="20" fill="#FDE68A" rx="2" />
    {/* 门 */}
    <rect x="285" y="78" width="20" height="37" fill="#92400E" rx="2" />
    <circle cx="301" cy="97" r="1.5" fill="#FCD34D" />
    {/* 树 */}
    <rect x="200" y="80" width="6" height="35" fill="#92400E" />
    <circle cx="203" cy="70" r="22" fill="#10B981" />
    {/* 老师 */}
    <circle cx="80" cy="70" r="10" fill="#FCD5B5" />
    <rect x="72" y="80" width="16" height="25" rx="3" fill="#EF4444" />
    <path d="M75 82 L65 95" stroke="#FCD5B5" strokeWidth="3" strokeLinecap="round" />
    {/* 学生 */}
    <circle cx="130" cy="80" r="8" fill="#FCD5B5" />
    <rect x="122" y="88" width="16" height="22" rx="3" fill="#3B82F6" />
    <circle cx="155" cy="82" r="7" fill="#FCD5B5" />
    <rect x="148" y="89" width="14" height="20" rx="3" fill="#10B981" />
    {/* 太阳 */}
    <circle cx="50" cy="30" r="18" fill="#FCD34D" opacity="0.9" />
  </>,
  '#1E3A5F', '#2D1B4E'
);

// 3. 熊猫场景
export const ScenePanda: React.FC = () => wrapSvg(
  <>
    {/* 地面 */}
    <ellipse cx="200" cy="130" rx="180" ry="20" fill="#1B4332" opacity="0.6" />
    {/* 竹子 */}
    <rect x="60" y="20" width="6" height="110" fill="#22C55E" rx="2" />
    <rect x="60" y="45" width="6" height="3" fill="#166534" />
    <rect x="60" y="75" width="6" height="3" fill="#166534" />
    <rect x="60" y="100" width="6" height="3" fill="#166534" />
    <path d="M58 30 Q30 25 20 40" stroke="#22C55E" strokeWidth="3" fill="none" />
    <ellipse cx="20" cy="40" rx="12" ry="5" fill="#16A34A" />
    <rect x="320" y="30" width="5" height="100" fill="#22C55E" rx="2" />
    <path d="M323 40 Q350 35 370 50" stroke="#22C55E" strokeWidth="3" fill="none" />
    <ellipse cx="370" cy="50" rx="14" ry="6" fill="#16A34A" />
    {/* 熊猫身体 */}
    <ellipse cx="200" cy="95" rx="45" ry="35" fill="#F8FAFC" />
    {/* 熊猫腿 */}
    <ellipse cx="175" cy="120" rx="10" ry="12" fill="#1E293B" />
    <ellipse cx="225" cy="120" rx="10" ry="12" fill="#1E293B" />
    {/* 熊猫头 */}
    <circle cx="200" cy="55" r="30" fill="#F8FAFC" />
    {/* 熊猫耳朵 */}
    <circle cx="178" cy="35" r="10" fill="#1E293B" />
    <circle cx="222" cy="35" r="10" fill="#1E293B" />
    {/* 熊猫黑眼圈 */}
    <ellipse cx="187" cy="55" rx="8" ry="11" fill="#1E293B" transform="rotate(-20 187 55)" />
    <ellipse cx="213" cy="55" rx="8" ry="11" fill="#1E293B" transform="rotate(20 213 55)" />
    {/* 熊猫眼睛 */}
    <circle cx="188" cy="55" r="2.5" fill="white" />
    <circle cx="212" cy="55" r="2.5" fill="white" />
    {/* 熊猫鼻子 */}
    <ellipse cx="200" cy="68" rx="4" ry="3" fill="#1E293B" />
    {/* 熊猫嘴 */}
    <path d="M196 73 Q200 77 204 73" stroke="#1E293B" strokeWidth="1.5" fill="none" strokeLinecap="round" />
    {/* 熊猫手臂抱竹子 */}
    <ellipse cx="158" cy="90" rx="8" ry="14" fill="#1E293B" transform="rotate(-30 158 90)" />
    <ellipse cx="242" cy="90" rx="8" ry="14" fill="#1E293B" transform="rotate(30 242 90)" />
    {/* 嘴里的竹子 */}
    <rect x="196" y="73" width="4" height="15" fill="#22C55E" rx="1" />
  </>,
  '#064E3B', '#022C22'
);

// 4. 小狗场景
export const SceneDog: React.FC = () => wrapSvg(
  <>
    {/* 草地 */}
    <ellipse cx="200" cy="135" rx="200" ry="25" fill="#166534" opacity="0.5" />
    {/* 云 */}
    <ellipse cx="80" cy="35" rx="30" ry="12" fill="white" opacity="0.2" />
    <ellipse cx="100" cy="30" rx="20" ry="10" fill="white" opacity="0.2" />
    <ellipse cx="300" cy="25" rx="25" ry="10" fill="white" opacity="0.2" />
    {/* 狗身体 */}
    <ellipse cx="200" cy="95" rx="50" ry="28" fill="#F59E0B" />
    {/* 狗腿 */}
    <rect x="165" y="110" width="10" height="25" rx="4" fill="#D97706" />
    <rect x="185" y="112" width="10" height="23" rx="4" fill="#D97706" />
    <rect x="215" y="112" width="10" height="23" rx="4" fill="#D97706" />
    <rect x="235" y="110" width="10" height="25" rx="4" fill="#D97706" />
    {/* 狗尾巴 */}
    <path d="M248 85 Q270 70 265 50" stroke="#F59E0B" strokeWidth="10" fill="none" strokeLinecap="round" />
    {/* 狗头 */}
    <circle cx="155" cy="80" r="25" fill="#F59E0B" />
    {/* 狗耳朵 */}
    <ellipse cx="135" cy="65" rx="8" ry="15" fill="#92400E" transform="rotate(-20 135 65)" />
    <ellipse cx="175" cy="68" rx="7" ry="13" fill="#D97706" transform="rotate(15 175 68)" />
    {/* 狗脸 */}
    <ellipse cx="148" cy="90" rx="12" ry="10" fill="#FDE68A" />
    {/* 狗眼睛 */}
    <circle cx="150" cy="78" r="3" fill="#1E293B" />
    <circle cx="151" cy="77" r="1" fill="white" />
    {/* 狗鼻子 */}
    <ellipse cx="140" cy="88" rx="4" ry="3" fill="#1E293B" />
    {/* 狗嘴 */}
    <path d="M138 92 Q142 96 146 93" stroke="#1E293B" strokeWidth="1.5" fill="none" />
    {/* 舌头 */}
    <ellipse cx="142" cy="98" rx="3" ry="5" fill="#EF4444" opacity="0.8" />
    {/* 骨头 */}
    <ellipse cx="290" cy="128" rx="15" ry="5" fill="#E5E7EB" />
    <circle cx="278" cy="125" r="5" fill="#F3F4F6" />
    <circle cx="278" cy="131" r="5" fill="#F3F4F6" />
    <circle cx="302" cy="125" r="5" fill="#F3F4F6" />
    <circle cx="302" cy="131" r="5" fill="#F3F4F6" />
  </>,
  '#0EA5E9', '#2D1B4E'
);

// 5. 小猫场景
export const SceneCat: React.FC = () => wrapSvg(
  <>
    {/* 沙发底 */}
    <rect x="40" y="105" width="320" height="25" fill="#7C3AED" rx="6" />
    <rect x="50" y="90" width="300" height="18" fill="#8B5CF6" rx="6" />
    {/* 靠垫 */}
    <ellipse cx="120" cy="85" rx="25" ry="8" fill="#A78BFA" opacity="0.7" />
    <ellipse cx="280" cy="85" rx="25" ry="8" fill="#A78BFA" opacity="0.7" />
    {/* 猫身体 */}
    <ellipse cx="200" cy="95" rx="40" ry="20" fill="#9CA3AF" />
    {/* 猫尾巴 */}
    <path d="M235 90 Q260 70 250 45" stroke="#9CA3AF" strokeWidth="8" fill="none" strokeLinecap="round" />
    {/* 猫头 */}
    <circle cx="160" cy="78" r="20" fill="#9CA3AF" />
    {/* 猫耳朵 */}
    <polygon points="145,65 148,50 158,62" fill="#6B7280" />
    <polygon points="175,65 172,50 162,62" fill="#6B7280" />
    <polygon points="148,62 150,55 156,62" fill="#F9A8D4" />
    <polygon points="172,62 170,55 164,62" fill="#F9A8D4" />
    {/* 猫眼 */}
    <ellipse cx="152" cy="78" rx="3.5" ry="4.5" fill="#22C55E" />
    <ellipse cx="168" cy="78" rx="3.5" ry="4.5" fill="#22C55E" />
    <ellipse cx="153" cy="79" rx="1" ry="3" fill="#1E293B" />
    <ellipse cx="169" cy="79" rx="1" ry="3" fill="#1E293B" />
    {/* 猫鼻子 */}
    <polygon points="158,85 162,85 160,88" fill="#F9A8D4" />
    {/* 猫嘴 */}
    <path d="M156 90 Q160 93 164 90" stroke="#4B5563" strokeWidth="1.2" fill="none" />
    {/* 胡须 */}
    <line x1="145" y1="87" x2="135" y2="85" stroke="#D1D5DB" strokeWidth="0.8" />
    <line x1="145" y1="89" x2="135" y2="89" stroke="#D1D5DB" strokeWidth="0.8" />
    <line x1="175" y1="87" x2="185" y2="85" stroke="#D1D5DB" strokeWidth="0.8" />
    <line x1="175" y1="89" x2="185" y2="89" stroke="#D1D5DB" strokeWidth="0.8" />
    {/* 猫爪 */}
    <ellipse cx="175" cy="105" rx="8" ry="5" fill="#D1D5DB" />
    <ellipse cx="225" cy="105" rx="8" ry="5" fill="#D1D5DB" />
    {/* 毛线球 */}
    <circle cx="80" cy="115" r="10" fill="#EF4444" />
    <path d="M75 110 Q85 108 88 115 Q85 122 78 120" stroke="#991B1B" strokeWidth="0.8" fill="none" />
    <path d="M72 115 Q78 112 82 118" stroke="#DC2626" strokeWidth="0.8" fill="none" />
  </>,
  '#2D1B4E', '#1E1B4B'
);

// 6. 苹果场景
export const SceneApple: React.FC = () => wrapSvg(
  <>
    {/* 山 */}
    <polygon points="0,130 80,70 160,130" fill="#134E4A" opacity="0.6" />
    <polygon points="100,130 200,50 300,130" fill="#0F766E" opacity="0.5" />
    <polygon points="250,130 340,80 400,130" fill="#134E4A" opacity="0.6" />
    {/* 草地 */}
    <rect x="0" y="125" width="400" height="25" fill="#166534" />
    {/* 树干 */}
    <rect x="190" y="70" width="20" height="55" fill="#92400E" rx="2" />
    {/* 树冠 */}
    <circle cx="170" cy="60" r="25" fill="#16A34A" />
    <circle cx="200" cy="45" r="30" fill="#22C55E" />
    <circle cx="230" cy="55" r="25" fill="#16A34A" />
    <circle cx="185" cy="75" r="20" fill="#15803D" />
    <circle cx="215" cy="70" r="22" fill="#15803D" />
    {/* 苹果 */}
    <circle cx="180" cy="65" r="8" fill="#EF4444" />
    <rect x="179" y="57" width="2" height="5" fill="#92400E" />
    <ellipse cx="182" cy="58" rx="4" ry="2" fill="#22C55E" />
    <circle cx="210" cy="50" r="10" fill="#DC2626" />
    <rect x="209" y="40" width="2" height="6" fill="#92400E" />
    <ellipse cx="213" cy="42" rx="5" ry="2.5" fill="#22C55E" />
    <circle cx="225" cy="72" r="7" fill="#EF4444" />
    {/* 掉下的苹果 */}
    <circle cx="90" cy="132" r="9" fill="#DC2626" />
    <rect x="89" y="123" width="2" height="5" fill="#92400E" />
    <ellipse cx="92" cy="124" rx="4" ry="2" fill="#22C55E" />
    <circle cx="320" cy="135" r="7" fill="#EF4444" />
    {/* 太阳 */}
    <circle cx="340" cy="25" r="15" fill="#FCD34D" opacity="0.9" />
  </>,
  '#0369A1', '#0C4A6E'
);

// 7. 香蕉场景
export const SceneBanana: React.FC = () => wrapSvg(
  <>
    {/* 背景叶片 */}
    <ellipse cx="60" cy="40" rx="45" ry="15" fill="#166534" transform="rotate(-20 60 40)" opacity="0.6" />
    <ellipse cx="340" cy="30" rx="50" ry="12" fill="#15803D" transform="rotate(15 340 30)" opacity="0.6" />
    <ellipse cx="320" cy="120" rx="60" ry="15" fill="#14532D" transform="rotate(-10 320 120)" opacity="0.5" />
    {/* 香蕉串 - 主串 */}
    <g transform="translate(170, 35)">
      {/* 连接头 */}
      <ellipse cx="30" cy="8" rx="18" ry="8" fill="#78350F" />
      {/* 香蕉1（中间） */}
      <path d="M15 12 Q0 50 20 85 Q25 90 32 88 Q15 55 25 15 Z" fill="#FDE047" stroke="#CA8A04" strokeWidth="1" />
      <path d="M18 15 Q6 50 22 82" stroke="#FBBF24" strokeWidth="1.5" fill="none" />
      {/* 香蕉2 */}
      <path d="M30 14 Q20 55 40 90 Q48 92 55 88 Q38 52 42 17 Z" fill="#FACC15" stroke="#CA8A04" strokeWidth="1" />
      <path d="M34 17 Q26 55 45 87" stroke="#FDE047" strokeWidth="1.5" fill="none" />
      {/* 香蕉3 */}
      <path d="M48 13 Q55 50 70 82 Q78 85 82 80 Q62 48 58 16 Z" fill="#FDE047" stroke="#CA8A04" strokeWidth="1" />
      <path d="M52 15 Q60 50 73 80" stroke="#FBBF24" strokeWidth="1.5" fill="none" />
      {/* 香蕉柄 */}
      <rect x="20" y="5" width="5" height="8" fill="#78350F" rx="1" />
      <rect x="36" y="4" width="5" height="9" fill="#78350F" rx="1" />
      <rect x="55" y="5" width="5" height="8" fill="#78350F" rx="1" />
    </g>
    {/* 散落香蕉 */}
    <g transform="translate(70, 95) rotate(-15)">
      <path d="M0 0 Q-5 35 20 55 Q30 58 38 52 Q18 28 12 2 Z" fill="#FACC15" stroke="#CA8A04" strokeWidth="1" />
      <rect x="8" y="-4" width="4" height="6" fill="#78350F" rx="1" />
    </g>
    <g transform="translate(290, 100) rotate(10)">
      <path d="M0 0 Q-5 30 18 48 Q26 50 33 45 Q15 25 10 2 Z" fill="#FDE047" stroke="#CA8A04" strokeWidth="1" />
      <rect x="6" y="-4" width="4" height="5" fill="#78350F" rx="1" />
    </g>
    {/* 叶子装饰 */}
    <ellipse cx="250" cy="115" rx="18" ry="5" fill="#22C55E" transform="rotate(20 250 115)" />
  </>,
  '#166534', '#14532D'
);

// 8. 颜色场景
export const SceneColors: React.FC = () => wrapSvg(
  <>
    {/* 天空渐变 */}
    <rect x="0" y="0" width="400" height="100" fill="url(#bg)" />
    {/* 草地 */}
    <rect x="0" y="95" width="400" height="55" fill="#14532D" />
    {/* 气球 */}
    <g>
      {/* 红 */}
      <ellipse cx="80" cy="50" rx="18" ry="22" fill="#EF4444" />
      <polygon points="80,72 75,78 85,78" fill="#EF4444" />
      <line x1="80" y1="78" x2="75" y2="130" stroke="#D1D5DB" strokeWidth="1" />
      <ellipse cx="73" cy="42" rx="5" ry="8" fill="white" opacity="0.3" />
    </g>
    <g>
      {/* 蓝 */}
      <ellipse cx="130" cy="40" rx="20" ry="24" fill="#3B82F6" />
      <polygon points="130,64 124,71 136,71" fill="#3B82F6" />
      <line x1="130" y1="71" x2="125" y2="125" stroke="#D1D5DB" strokeWidth="1" />
      <ellipse cx="122" cy="32" rx="6" ry="9" fill="white" opacity="0.3" />
    </g>
    <g>
      {/* 黄 */}
      <ellipse cx="190" cy="55" rx="19" ry="23" fill="#FBBF24" />
      <polygon points="190,78 184,85 196,85" fill="#FBBF24" />
      <line x1="190" y1="85" x2="188" y2="135" stroke="#D1D5DB" strokeWidth="1" />
      <ellipse cx="182" cy="47" rx="5" ry="8" fill="white" opacity="0.3" />
    </g>
    <g>
      {/* 绿 */}
      <ellipse cx="250" cy="45" rx="18" ry="22" fill="#22C55E" />
      <polygon points="250,67 244,74 256,74" fill="#22C55E" />
      <line x1="250" y1="74" x2="246" y2="128" stroke="#D1D5DB" strokeWidth="1" />
      <ellipse cx="242" cy="37" rx="5" ry="8" fill="white" opacity="0.3" />
    </g>
    <g>
      {/* 紫 */}
      <ellipse cx="310" cy="50" rx="17" ry="21" fill="#A855F7" />
      <polygon points="310,71 304,77 316,77" fill="#A855F7" />
      <line x1="310" y1="77" x2="308" y2="132" stroke="#D1D5DB" strokeWidth="1" />
      <ellipse cx="303" cy="42" rx="5" ry="8" fill="white" opacity="0.3" />
    </g>
    <g>
      {/* 粉 */}
      <ellipse cx="355" cy="60" rx="15" ry="19" fill="#EC4899" />
      <polygon points="355,79 350,85 360,85" fill="#EC4899" />
      <line x1="355" y1="85" x2="354" y2="135" stroke="#D1D5DB" strokeWidth="1" />
      <ellipse cx="349" cy="53" rx="4" ry="7" fill="white" opacity="0.3" />
    </g>
    {/* 小花 */}
    <g transform="translate(50, 130)">
      <circle cx="0" cy="0" r="4" fill="#FDE047" />
      <circle cx="-5" cy="-3" r="3" fill="#F472B6" />
      <circle cx="5" cy="-3" r="3" fill="#F472B6" />
      <circle cx="-3" cy="4" r="3" fill="#F472B6" />
      <circle cx="3" cy="4" r="3" fill="#F472B6" />
    </g>
    <g transform="translate(160, 135)">
      <circle cx="0" cy="0" r="3" fill="#FCD34D" />
      <circle cx="-4" cy="-2" r="2.5" fill="#C084FC" />
      <circle cx="4" cy="-2" r="2.5" fill="#C084FC" />
      <circle cx="-2" cy="3" r="2.5" fill="#C084FC" />
      <circle cx="2" cy="3" r="2.5" fill="#C084FC" />
    </g>
  </>,
  '#0EA5E9', '#7DD3FC'
);

// 9. 数字场景
export const SceneNumbers: React.FC = () => wrapSvg(
  <>
    {/* 地板 */}
    <rect x="0" y="120" width="400" height="30" fill="#312E81" />
    {/* 积木 */}
    <g transform="translate(60, 70)">
      <rect x="0" y="0" width="40" height="40" rx="4" fill="#EF4444" />
      <text x="20" y="28" textAnchor="middle" fill="white" fontSize="24" fontWeight="bold" fontFamily="Arial">1</text>
    </g>
    <g transform="translate(110, 55)">
      <rect x="0" y="0" width="42" height="42" rx="4" fill="#3B82F6" />
      <text x="21" y="29" textAnchor="middle" fill="white" fontSize="26" fontWeight="bold" fontFamily="Arial">2</text>
    </g>
    <g transform="translate(165, 40)">
      <rect x="0" y="0" width="44" height="44" rx="4" fill="#22C55E" />
      <text x="22" y="30" textAnchor="middle" fill="white" fontSize="28" fontWeight="bold" fontFamily="Arial">3</text>
    </g>
    <g transform="translate(220, 55)">
      <rect x="0" y="0" width="42" height="42" rx="4" fill="#F59E0B" />
      <text x="21" y="29" textAnchor="middle" fill="white" fontSize="26" fontWeight="bold" fontFamily="Arial">4</text>
    </g>
    <g transform="translate(275, 70)">
      <rect x="0" y="0" width="40" height="40" rx="4" fill="#A855F7" />
      <text x="20" y="28" textAnchor="middle" fill="white" fontSize="24" fontWeight="bold" fontFamily="Arial">5</text>
    </g>
    {/* 散落积木 */}
    <g transform="translate(330, 95)">
      <rect x="0" y="0" width="32" height="32" rx="3" fill="#EC4899" />
      <text x="16" y="22" textAnchor="middle" fill="white" fontSize="18" fontWeight="bold" fontFamily="Arial">6</text>
    </g>
    <g transform="translate(20, 100)">
      <rect x="0" y="0" width="30" height="30" rx="3" fill="#06B6D4" />
      <text x="15" y="20" textAnchor="middle" fill="white" fontSize="16" fontWeight="bold" fontFamily="Arial">7</text>
    </g>
    {/* 星星 */}
    <polygon points="50,30 52,36 58,36 53,40 55,46 50,42 45,46 47,40 42,36 48,36" fill="#FDE047" />
    <polygon points="350,25 352,31 358,31 353,35 355,41 350,37 345,41 347,35 342,31 348,31" fill="#FDE047" />
    <polygon points="380,60 381.5,64.5 386,64.5 382.5,67.5 384,72 380,69 376,72 377.5,67.5 374,64.5 378.5,64.5" fill="#FDE047" />
  </>,
  '#1E1B4B', '#312E81'
);

// 10. 身体部位场景
export const SceneBody: React.FC = () => wrapSvg(
  <>
    {/* 背景装饰 */}
    <circle cx="80" cy="75" r="50" fill="#1E293B" opacity="0.5" />
    {/* 小朋友头 */}
    <circle cx="200" cy="65" r="40" fill="#FCD5B5" />
    {/* 头发 */}
    <path d="M165 45 Q170 20 200 22 Q230 20 235 45" fill="#451A03" />
    <path d="M162 55 Q158 35 170 28 Q165 40 168 55" fill="#451A03" />
    <path d="M238 55 Q242 35 230 28 Q235 40 232 55" fill="#451A03" />
    {/* 眼睛 */}
    <ellipse cx="185" cy="65" rx="4" ry="5" fill="white" />
    <circle cx="185" cy="66" r="2.5" fill="#1E293B" />
    <circle cx="185.5" cy="65" r="0.8" fill="white" />
    <ellipse cx="215" cy="65" rx="4" ry="5" fill="white" />
    <circle cx="215" cy="66" r="2.5" fill="#1E293B" />
    <circle cx="215.5" cy="65" r="0.8" fill="white" />
    {/* 眉毛 */}
    <path d="M179 56 Q185 53 191 56" stroke="#451A03" strokeWidth="2" fill="none" strokeLinecap="round" />
    <path d="M209 56 Q215 53 221 56" stroke="#451A03" strokeWidth="2" fill="none" strokeLinecap="round" />
    {/* 鼻子 */}
    <ellipse cx="200" cy="78" rx="3" ry="4" fill="#E0B080" />
    {/* 嘴巴 */}
    <path d="M192 90 Q200 97 208 90" stroke="#B91C1C" strokeWidth="2" fill="#FCA5A5" strokeLinecap="round" />
    {/* 耳朵 */}
    <ellipse cx="162" cy="70" rx="7" ry="10" fill="#FCD5B5" />
    <ellipse cx="238" cy="70" rx="7" ry="10" fill="#FCD5B5" />
    {/* 手指指向眼睛（左手指） */}
    <g transform="translate(130, 55)">
      <ellipse cx="0" cy="0" rx="15" ry="10" fill="#FCD5B5" />
      <rect x="-2" y="-15" width="5" height="12" rx="2" fill="#FCD5B5" />
    </g>
    {/* 右手指向嘴 */}
    <g transform="translate(270, 75)">
      <ellipse cx="0" cy="0" rx="15" ry="10" fill="#FCD5B5" />
      <rect x="-2" y="-12" width="5" height="10" rx="2" fill="#FCD5B5" />
    </g>
    {/* 标签指示 */}
    <line x1="100" y1="50" x2="140" y2="55" stroke="#22D3EE" strokeWidth="1.5" strokeDasharray="3,2" />
    <text x="55" y="42" fill="#22D3EE" fontSize="11" fontWeight="bold">eye</text>
    <line x1="100" y1="85" x2="158" y2="72" stroke="#A855F7" strokeWidth="1.5" strokeDasharray="3,2" />
    <text x="45" y="92" fill="#A855F7" fontSize="11" fontWeight="bold">ear</text>
  </>,
  '#0F172A', '#1E293B'
);

// 11. 问候场景
export const SceneHello: React.FC = () => wrapSvg(
  <>
    {/* 地面 */}
    <rect x="0" y="120" width="400" height="30" fill="#312E81" />
    {/* 云 */}
    <ellipse cx="70" cy="30" rx="25" ry="10" fill="white" opacity="0.15" />
    <ellipse cx="320" cy="25" rx="30" ry="12" fill="white" opacity="0.15" />
    {/* 左边人物 */}
    <g transform="translate(100, 40)">
      {/* 头 */}
      <circle cx="0" cy="15" r="15" fill="#FCD5B5" />
      {/* 头发 */}
      <path d="M-15 10 Q-12 -5 0 -5 Q12 -5 15 10" fill="#451A03" />
      {/* 身体 */}
      <rect x="-14" y="30" width="28" height="40" rx="6" fill="#3B82F6" />
      {/* 腿 */}
      <rect x="-10" y="70" width="8" height="22" rx="3" fill="#1E3A8A" />
      <rect x="2" y="70" width="8" height="22" rx="3" fill="#1E3A8A" />
      {/* 挥手的胳膊 */}
      <g transform="translate(10, 32) rotate(-30)">
        <rect x="0" y="0" width="8" height="30" rx="4" fill="#3B82F6" />
        <ellipse cx="4" cy="-5" rx="7" ry="6" fill="#FCD5B5" />
      </g>
      {/* 另一只胳膊 */}
      <rect x="-22" y="35" width="8" height="25" rx="4" fill="#3B82F6" />
    </g>
    {/* 右边人物 */}
    <g transform="translate(300, 42)">
      {/* 头 */}
      <circle cx="0" cy="15" r="14" fill="#FCD5B5" />
      {/* 头发 */}
      <path d="M-14 10 Q-10 -3 0 -3 Q10 -3 14 10" fill="#92400E" />
      {/* 身体（裙子） */}
      <path d="M-13 30 L-20 70 L20 70 L13 30 Z" fill="#EC4899" />
      {/* 腿 */}
      <rect x="-10" y="70" width="7" height="20" rx="3" fill="#FCD5B5" />
      <rect x="3" y="70" width="7" height="20" rx="3" fill="#FCD5B5" />
      {/* 挥手的胳膊 */}
      <g transform="translate(-12, 32) rotate(30)">
        <rect x="-8" y="0" width="8" height="28" rx="4" fill="#EC4899" />
        <ellipse cx="-4" cy="-5" rx="6" ry="5.5" fill="#FCD5B5" />
      </g>
      {/* 另一只胳膊 */}
      <rect x="14" y="35" width="7" height="22" rx="3.5" fill="#EC4899" />
    </g>
    {/* Hello气泡 */}
    <g transform="translate(140, 15)">
      <rect x="0" y="0" width="45" height="22" rx="11" fill="white" opacity="0.95" />
      <text x="22" y="15" textAnchor="middle" fill="#7C3AED" fontSize="13" fontWeight="bold">Hello!</text>
    </g>
    <g transform="translate(220, 20)">
      <rect x="0" y="0" width="40" height="22" rx="11" fill="#FDE047" opacity="0.95" />
      <text x="20" y="15" textAnchor="middle" fill="#92400E" fontSize="13" fontWeight="bold">Hi!</text>
    </g>
    {/* 心 */}
    <path d="M195 60 Q200 55 205 60 Q210 55 210 65 Q205 72 200 75 Q195 72 190 65 Q190 55 195 60" fill="#EF4444" opacity="0.8" />
  </>,
  '#6366F1', '#4338CA'
);

// 12. 食物场景
export const SceneFood: React.FC = () => wrapSvg(
  <>
    {/* 桌面 */}
    <rect x="0" y="115" width="400" height="35" fill="#78350F" />
    <rect x="0" y="110" width="400" height="8" fill="#92400E" rx="2" />
    {/* 盘子 */}
    <ellipse cx="120" cy="105" rx="45" ry="10" fill="#E5E7EB" />
    <ellipse cx="120" cy="102" rx="42" ry="8" fill="#F3F4F6" />
    {/* 汉堡 */}
    <g transform="translate(120, 80)">
      {/* 上面包 */}
      <path d="M-25 0 Q-25 -18 0 -20 Q25 -18 25 0 Z" fill="#FBBF24" />
      <ellipse cx="0" cy="-18" rx="20" ry="4" fill="#FDE047" />
      {/* 芝麻 */}
      <ellipse cx="-10" cy="-15" rx="2" ry="1" fill="#FEF3C7" />
      <ellipse cx="8" cy="-16" rx="2" ry="1" fill="#FEF3C7" />
      <ellipse cx="-3" cy="-18" rx="2" ry="1" fill="#FEF3C7" />
      {/* 生菜 */}
      <path d="M-25 2 Q-20 6 -15 3 Q-10 7 -5 3 Q0 7 5 3 Q10 7 15 3 Q20 6 25 2 L25 5 L-25 5 Z" fill="#22C55E" />
      {/* 番茄 */}
      <rect x="-20" y="6" width="40" height="5" rx="2" fill="#EF4444" />
      {/* 芝士 */}
      <path d="M-22 11 L22 11 L25 16 L-19 16 Z" fill="#FDE047" />
      {/* 肉饼 */}
      <rect x="-23" y="16" width="46" height="7" rx="3" fill="#78350F" />
      {/* 下面包 */}
      <path d="M-25 23 Q-25 28 0 28 Q25 28 25 23 Z" fill="#FBBF24" />
    </g>
    {/* 第二个盘子 */}
    <ellipse cx="290" cy="105" rx="40" ry="9" fill="#E5E7EB" />
    <ellipse cx="290" cy="102" rx="37" ry="7" fill="#F3F4F6" />
    {/* 披萨 */}
    <g transform="translate(290, 75)">
      <polygon points="0,0 -30,40 30,40" fill="#FBBF24" />
      <polygon points="0,5 -25,38 25,38" fill="#EF4444" opacity="0.8" />
      <circle cx="-10" cy="25" r="4" fill="#FEF3C7" />
      <circle cx="12" cy="30" r="4" fill="#FEF3C7" />
      <circle cx="0" cy="18" r="3.5" fill="#16A34A" />
      <circle cx="8" cy="22" r="3" fill="#16A34A" />
    </g>
    {/* 饮料 */}
    <g transform="translate(50, 70)">
      <rect x="0" y="0" width="18" height="35" rx="3" fill="#DC2626" />
      <rect x="3" y="3" width="12" height="8" rx="2" fill="#FCA5A5" opacity="0.5" />
      {/* 吸管 */}
      <rect x="6" y="-8" width="3" height="15" rx="1" fill="white" transform="rotate(15 7.5 0)" />
    </g>
    <g transform="translate(350, 75)">
      <rect x="0" y="0" width="16" height="30" rx="3" fill="#F59E0B" />
      <rect x="2" y="2" width="10" height="7" rx="2" fill="#FDE047" opacity="0.5" />
    </g>
  </>,
  '#1E1B4B', '#312E81'
);

// 13. 生日场景
export const SceneBirthday: React.FC = () => wrapSvg(
  <>
    {/* 桌面 */}
    <rect x="0" y="120" width="400" height="30" fill="#7C3AED" opacity="0.4" />
    {/* 彩旗 */}
    <line x1="0" y1="20" x2="400" y2="20" stroke="#FDE047" strokeWidth="1" />
    <polygon points="40,20 55,40 70,20" fill="#EF4444" />
    <polygon points="90,20 105,42 120,20" fill="#3B82F6" />
    <polygon points="140,20 155,38 170,20" fill="#22C55E" />
    <polygon points="190,20 205,42 220,20" fill="#F59E0B" />
    <polygon points="240,20 255,38 270,20" fill="#EC4899" />
    <polygon points="290,20 305,42 320,20" fill="#8B5CF6" />
    <polygon points="340,20 355,38 370,20" fill="#06B6D4" />
    {/* 蛋糕 */}
    <g transform="translate(200, 65)">
      {/* 底层 */}
      <rect x="-60" y="35" width="120" height="30" rx="4" fill="#F472B6" />
      <rect x="-62" y="32" width="124" height="8" rx="3" fill="#FBCFE8" />
      {/* 奶油装饰 */}
      {[-55, -35, -15, 5, 25, 45].map((x: number) => (
        <ellipse key={x} cx={x} cy="32" rx="8" ry="4" fill="white" />
      ))}
      {/* 中层 */}
      <rect x="-40" y="10" width="80" height="25" rx="4" fill="#FBBF24" />
      <rect x="-42" y="7" width="84" height="7" rx="3" fill="#FEF3C7" />
      {[-30, -10, 10, 30].map((x: number) => (
        <ellipse key={x} cx={x} cy="7" rx="7" ry="3.5" fill="white" />
      ))}
      {/* 顶层 */}
      <rect x="-20" y="-10" width="40" height="20" rx="3" fill="#C084FC" />
      <rect x="-22" y="-13" width="44" height="5" rx="2" fill="#E9D5FF" />
      {/* 蜡烛 */}
      <rect x="-3" y="-25" width="6" height="15" rx="1" fill="#3B82F6" />
      {/* 火焰 */}
      <path d="M0 -35 Q-5 -28 0 -25 Q5 -28 0 -35" fill="#FCD34D" />
      <path d="M0 -33 Q-2 -28 0 -26 Q2 -28 0 -33" fill="#F97316" />
    </g>
    {/* 礼物盒 */}
    <g transform="translate(70, 95)">
      <rect x="0" y="0" width="30" height="25" rx="2" fill="#EF4444" />
      <rect x="12" y="0" width="6" height="25" fill="#FDE047" />
      <rect x="0" y="10" width="30" height="5" fill="#FDE047" />
      {/* 蝴蝶结 */}
      <ellipse cx="10" cy="-2" rx="6" ry="4" fill="#FDE047" />
      <ellipse cx="20" cy="-2" rx="6" ry="4" fill="#FDE047" />
      <circle cx="15" cy="0" r="3" fill="#FDE047" />
    </g>
    <g transform="translate(310, 100)">
      <rect x="0" y="0" width="25" height="20" rx="2" fill="#3B82F6" />
      <rect x="10" y="0" width="5" height="20" fill="#22C55E" />
      <rect x="0" y="8" width="25" height="4" fill="#22C55E" />
      <ellipse cx="8" cy="-2" rx="5" ry="3.5" fill="#22C55E" />
      <ellipse cx="17" cy="-2" rx="5" ry="3.5" fill="#22C55E" />
      <circle cx="12.5" cy="0" r="2.5" fill="#22C55E" />
    </g>
    {/* 气球 */}
    <ellipse cx="40" cy="60" rx="10" ry="12" fill="#A855F7" />
    <line x1="40" y1="72" x2="38" y2="120" stroke="#D1D5DB" strokeWidth="1" />
    <ellipse cx="360" cy="50" rx="11" ry="13" fill="#06B6D4" />
    <line x1="360" y1="63" x2="358" y2="120" stroke="#D1D5DB" strokeWidth="1" />
  </>,
  '#581C87', '#3B0764'
);

// 14. 公园场景
export const ScenePark: React.FC = () => wrapSvg(
  <>
    {/* 天空 */}
    <rect x="0" y="0" width="400" height="90" fill="url(#bg)" />
    {/* 草地 */}
    <ellipse cx="200" cy="130" rx="220" ry="30" fill="#166534" />
    {/* 太阳 */}
    <circle cx="340" cy="30" r="20" fill="#FCD34D" />
    <circle cx="340" cy="30" r="28" fill="#FCD34D" opacity="0.3" />
    {/* 云 */}
    <ellipse cx="80" cy="25" rx="28" ry="10" fill="white" opacity="0.6" />
    <ellipse cx="100" cy="20" rx="18" ry="8" fill="white" opacity="0.6" />
    {/* 树 */}
    <rect x="45" y="60" width="8" height="45" fill="#78350F" />
    <circle cx="49" cy="50" r="25" fill="#16A34A" />
    <circle cx="35" cy="55" r="15" fill="#15803D" />
    <circle cx="63" cy="55" r="15" fill="#15803D" />
    <rect x="350" y="65" width="7" height="40" fill="#78350F" />
    <circle cx="354" cy="55" r="20" fill="#22C55E" />
    {/* 滑梯 */}
    <g transform="translate(140, 70)">
      {/* 梯子 */}
      <rect x="0" y="0" width="6" height="50" fill="#4B5563" />
      <rect x="35" y="0" width="6" height="50" fill="#4B5563" />
      <rect x="6" y="10" width="29" height="4" fill="#6B7280" />
      <rect x="6" y="22" width="29" height="4" fill="#6B7280" />
      <rect x="6" y="34" width="29" height="4" fill="#6B7280" />
      {/* 平台 */}
      <rect x="-5" y="-5" width="55" height="8" fill="#EF4444" rx="2" />
      {/* 滑梯面 */}
      <path d="M45 3 L80 50 L75 53 L42 6 Z" fill="#3B82F6" />
    </g>
    {/* 小朋友跑 */}
    <g transform="translate(230, 80)">
      <circle cx="0" cy="10" r="10" fill="#FCD5B5" />
      <path d="M-10 5 Q-5 -8 0 -8 Q8 -8 10 5" fill="#92400E" />
      <rect x="-8" y="20" width="16" height="18" rx="3" fill="#F59E0B" />
      {/* 跑步腿 */}
      <path d="M-5 38 L-12 55" stroke="#FCD5B5" strokeWidth="5" strokeLinecap="round" />
      <path d="M5 38 L15 52" stroke="#FCD5B5" strokeWidth="5" strokeLinecap="round" />
      {/* 跑步胳膊 */}
      <path d="M-8 25 L-18 20" stroke="#FCD5B5" strokeWidth="4" strokeLinecap="round" />
      <path d="M8 25 L18 30" stroke="#FCD5B5" strokeWidth="4" strokeLinecap="round" />
    </g>
    {/* 风筝 */}
    <g transform="translate(280, 25)">
      <polygon points="0,0 -15,15 0,25 15,15" fill="#EC4899" />
      <polygon points="0,0 -10,12 0,20 10,12" fill="#F472B6" />
      <line x1="0" y1="25" x2="10" y2="65" stroke="#D1D5DB" strokeWidth="1" />
    </g>
    {/* 小花 */}
    <g transform="translate(100, 125)">
      <circle cx="0" cy="0" r="3" fill="#FDE047" />
      <circle cx="-4" cy="-2" r="2.5" fill="#F472B6" />
      <circle cx="4" cy="-2" r="2.5" fill="#F472B6" />
      <circle cx="0" cy="3" r="2.5" fill="#F472B6" />
    </g>
    <g transform="translate(300, 128)">
      <circle cx="0" cy="0" r="2.5" fill="#FCD34D" />
      <circle cx="-3" cy="-2" r="2" fill="#C084FC" />
      <circle cx="3" cy="-2" r="2" fill="#C084FC" />
      <circle cx="0" cy="2.5" r="2" fill="#C084FC" />
    </g>
  </>,
  '#38BDF8', '#0EA5E9'
);

// 15. 图书馆/阅读场景
export const SceneLibrary: React.FC = () => wrapSvg(
  <>
    {/* 书架背景 */}
    <rect x="0" y="0" width="400" height="130" fill="#1E1B4B" />
    {/* 书架层 */}
    {[20, 60, 100].map((y: number) => (
      <g key={y}>
        <rect x="20" y={y} width="360" height="4" fill="#78350F" />
        {/* 书 */}
        {[40, 55, 72, 90, 110, 128, 145, 165, 185, 210, 235, 258, 280, 305, 330, 355].map((x: number, i: number) => {
          const colors = ['#EF4444', '#3B82F6', '#22C55E', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#F97316'];
          const h = 20 + (i % 3) * 4;
          return (
            <rect
              key={x}
              x={x}
              y={y + 4}
              width="12"
              height={h}
              fill={colors[i % colors.length]}
              rx="1"
            />
          );
        })}
      </g>
    ))}
    {/* 地板 */}
    <rect x="0" y="135" width="400" height="15" fill="#312E81" />
    {/* 小朋友坐着看书 */}
    <g transform="translate(180, 85)">
      {/* 身体 */}
      <path d="M-15 15 Q-20 45 0 48 Q20 45 15 15 Z" fill="#3B82F6" />
      {/* 头 */}
      <circle cx="0" cy="5" r="14" fill="#FCD5B5" />
      {/* 头发 */}
      <path d="M-14 0 Q-12 -12 0 -12 Q12 -12 14 0" fill="#451A03" />
      {/* 眼睛 */}
      <circle cx="-4" cy="5" r="1.5" fill="#1E293B" />
      <circle cx="4" cy="5" r="1.5" fill="#1E293B" />
      {/* 书 */}
      <rect x="-18" y="20" width="36" height="12" rx="2" fill="#FEF3C7" />
      <line x1="0" y1="20" x2="0" y2="32" stroke="#D97706" strokeWidth="1" />
      {/* 文字行 */}
      <line x1="-15" y1="24" x2="-3" y2="24" stroke="#78350F" strokeWidth="0.8" />
      <line x1="-15" y1="27" x2="-5" y2="27" stroke="#78350F" strokeWidth="0.8" />
      <line x1="3" y1="24" x2="15" y2="24" stroke="#78350F" strokeWidth="0.8" />
      <line x1="3" y1="27" x2="13" y2="27" stroke="#78350F" strokeWidth="0.8" />
    </g>
    {/* 落地灯 */}
    <g transform="translate(50, 50)">
      <rect x="14" y="40" width="4" height="45" fill="#6B7280" />
      <path d="M5 0 L27 0 L22 40 L10 40 Z" fill="#FDE047" opacity="0.8" />
      <ellipse cx="16" cy="50" rx="15" ry="8" fill="#FCD34D" opacity="0.3" />
    </g>
  </>,
  '#1E1B4B', '#312E81'
);

// 16. 音乐/唱歌场景
export const SceneMusic: React.FC = () => wrapSvg(
  <>
    {/* 舞台 */}
    <rect x="0" y="120" width="400" height="30" fill="#4B5563" />
    <rect x="0" y="115" width="400" height="6" fill="#6B7280" />
    {/* 聚光灯 */}
    <polygon points="100,0 50,120 150,120" fill="#FDE047" opacity="0.15" />
    <polygon points="300,0 240,120 360,120" fill="#A855F7" opacity="0.15" />
    {/* 唱歌的小朋友 */}
    <g transform="translate(200, 50)">
      {/* 头 */}
      <circle cx="0" cy="15" r="18" fill="#FCD5B5" />
      {/* 头发 */}
      <path d="M-18 10 Q-15 -8 0 -8 Q15 -8 18 10" fill="#92400E" />
      {/* 眼睛闭着唱歌 */}
      <path d="M-9 15 Q-6 12 -3 15" stroke="#1E293B" strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M3 15 Q6 12 9 15" stroke="#1E293B" strokeWidth="2" fill="none" strokeLinecap="round" />
      {/* 嘴张开 */}
      <ellipse cx="0" cy="26" rx="5" ry="6" fill="#991B1B" />
      <ellipse cx="0" cy="28" rx="3" ry="3" fill="#FCA5A5" />
      {/* 身体 */}
      <rect x="-18" y="33" width="36" height="40" rx="8" fill="#EF4444" />
      {/* 腿 */}
      <rect x="-13" y="73" width="10" height="25" rx="4" fill="#1E3A8A" />
      <rect x="3" y="73" width="10" height="25" rx="4" fill="#1E3A8A" />
      {/* 胳膊抬起 */}
      <path d="M-18 40 L-35 30" stroke="#FCD5B5" strokeWidth="7" strokeLinecap="round" />
      <path d="M18 40 L35 30" stroke="#FCD5B5" strokeWidth="7" strokeLinecap="round" />
      {/* 麦克风 */}
      <g transform="translate(35, 28)">
        <ellipse cx="0" cy="0" rx="6" ry="8" fill="#1E293B" />
        <ellipse cx="0" cy="0" rx="4" ry="5" fill="#4B5563" />
        <rect x="-1.5" y="7" width="3" height="15" rx="1" fill="#6B7280" />
      </g>
    </g>
    {/* 音符 */}
    <g fill="#FDE047">
      <ellipse cx="100" cy="60" rx="6" ry="5" />
      <rect x="104" y="35" width="2" height="25" />
      <ellipse cx="130" cy="85" rx="5" ry="4" />
      <rect x="134" y="65" width="2" height="20" />
      <path d="M134 65 Q142 62 145 68" stroke="#FDE047" strokeWidth="2" fill="none" />
      <ellipse cx="280" cy="50" rx="7" ry="5.5" />
      <rect x="286" y="25" width="2.5" height="25" />
      <ellipse cx="320" cy="70" rx="5" ry="4" />
      <rect x="324" y="50" width="2" height="20" />
      <ellipse cx="340" cy="75" rx="5" ry="4" />
      <rect x="344" y="55" width="2" height="20" />
    </g>
  </>,
  '#1E1B4B', '#312E81'
);

// 17. 运动场景
export const SceneSports: React.FC = () => wrapSvg(
  <>
    {/* 跑道 */}
    <rect x="0" y="110" width="400" height="40" fill="#B45309" />
    <line x1="0" y1="115" x2="400" y2="115" stroke="white" strokeWidth="1" strokeDasharray="8,6" />
    <line x1="0" y1="130" x2="400" y2="130" stroke="white" strokeWidth="1" strokeDasharray="8,6" />
    {/* 终点线 */}
    <g transform="translate(340, 110)">
      <rect x="0" y="0" width="5" height="40" fill="white" />
      {/* 旗子 */}
      <rect x="3" y="0" width="2" height="50" fill="#92400E" />
      <polygon points="5,0 25,8 5,16" fill="#EF4444" />
    </g>
    {/* 跑步者1 */}
    <g transform="translate(100, 50)">
      <circle cx="0" cy="10" r="11" fill="#FCD5B5" />
      <path d="M-11 5 Q-8 -6 0 -6 Q8 -6 11 5" fill="#1E293B" />
      <rect x="-8" y="21" width="16" height="18" rx="3" fill="#3B82F6" />
      {/* 前腿 */}
      <path d="M-3 39 L8 58" stroke="#FCD5B5" strokeWidth="6" strokeLinecap="round" />
      {/* 后腿 */}
      <path d="M3 39 L-15 55" stroke="#FCD5B5" strokeWidth="6" strokeLinecap="round" />
      {/* 胳膊 */}
      <path d="M-8 25 L-20 18" stroke="#FCD5B5" strokeWidth="5" strokeLinecap="round" />
      <path d="M8 25 L18 15" stroke="#FCD5B5" strokeWidth="5" strokeLinecap="round" />
    </g>
    {/* 跑步者2 */}
    <g transform="translate(180, 45)">
      <circle cx="0" cy="12" r="10" fill="#FCD5B5" />
      <path d="M-10 7 Q-7 -4 0 -4 Q7 -4 10 7" fill="#F59E0B" />
      <rect x="-7" y="22" width="14" height="16" rx="3" fill="#EF4444" />
      <path d="M-2 38 L10 55" stroke="#FCD5B5" strokeWidth="5.5" strokeLinecap="round" />
      <path d="M2 38 L-12 52" stroke="#FCD5B5" strokeWidth="5.5" strokeLinecap="round" />
      <path d="M-7 26 L-17 20" stroke="#FCD5B5" strokeWidth="4.5" strokeLinecap="round" />
      <path d="M7 26 L15 14" stroke="#FCD5B5" strokeWidth="4.5" strokeLinecap="round" />
    </g>
    {/* 足球 */}
    <g transform="translate(260, 115)">
      <circle cx="0" cy="5" r="12" fill="white" />
      <polygon points="0,-7 6,-2 4,5 -4,5 -6,-2" fill="#1E293B" />
      <circle cx="-10" cy="2" r="2" fill="#1E293B" opacity="0.5" />
      <circle cx="9" cy="8" r="2" fill="#1E293B" opacity="0.5" />
    </g>
    {/* 太阳 */}
    <circle cx="60" cy="25" r="15" fill="#FCD34D" opacity="0.9" />
    {/* 云 */}
    <ellipse cx="300" cy="20" rx="25" ry="8" fill="white" opacity="0.3" />
  </>,
  '#38BDF8', '#0284C7'
);

// 18. 天气/太阳场景
export const SceneWeather: React.FC = () => wrapSvg(
  <>
    {/* 天空渐变 */}
    <rect x="0" y="0" width="400" height="150" fill="url(#bg)" />
    {/* 大太阳 */}
    <g transform="translate(100, 50)">
      <circle cx="0" cy="0" r="30" fill="#FCD34D" />
      <circle cx="0" cy="0" r="40" fill="#FCD34D" opacity="0.3" />
      <circle cx="0" cy="0" r="50" fill="#FCD34D" opacity="0.15" />
      {/* 太阳光线 */}
      {[0, 45, 90, 135, 180, 225, 270, 315].map((deg: number) => (
        <rect
          key={deg}
          x="-2"
          y="-50"
          width="4"
          height="12"
          rx="2"
          fill="#FBBF24"
          transform={`rotate(${deg})`}
        />
      ))}
      {/* 笑脸 */}
      <circle cx="-10" cy="-5" r="3" fill="#B45309" />
      <circle cx="10" cy="-5" r="3" fill="#B45309" />
      <path d="M-10 8 Q0 18 10 8" stroke="#B45309" strokeWidth="2.5" fill="none" strokeLinecap="round" />
    </g>
    {/* 云1 */}
    <g transform="translate(260, 35)">
      <ellipse cx="0" cy="0" rx="30" ry="14" fill="white" opacity="0.9" />
      <ellipse cx="-20" cy="5" rx="18" ry="10" fill="white" opacity="0.9" />
      <ellipse cx="22" cy="3" rx="20" ry="12" fill="white" opacity="0.9" />
      <ellipse cx="5" cy="-8" rx="15" ry="10" fill="white" opacity="0.9" />
    </g>
    {/* 云2 */}
    <g transform="translate(330, 70)">
      <ellipse cx="0" cy="0" rx="25" ry="12" fill="white" opacity="0.7" />
      <ellipse cx="-18" cy="3" rx="14" ry="9" fill="white" opacity="0.7" />
      <ellipse cx="18" cy="2" rx="16" ry="10" fill="white" opacity="0.7" />
    </g>
    {/* 草地 */}
    <ellipse cx="200" cy="140" rx="250" ry="25" fill="#166534" />
    {/* 小山 */}
    <polygon points="0,130 80,90 160,130" fill="#15803D" opacity="0.6" />
    <polygon points="200,130 300,80 400,130" fill="#166534" opacity="0.5" />
    {/* 小花 */}
    <g transform="translate(60, 130)">
      <circle cx="0" cy="0" r="4" fill="#FDE047" />
      <circle cx="-5" cy="-3" r="3" fill="#EC4899" />
      <circle cx="5" cy="-3" r="3" fill="#EC4899" />
      <circle cx="-3" cy="4" r="3" fill="#EC4899" />
      <circle cx="3" cy="4" r="3" fill="#EC4899" />
    </g>
    <g transform="translate(280, 135)">
      <circle cx="0" cy="0" r="3" fill="#FCD34D" />
      <circle cx="-3.5" cy="-2" r="2.5" fill="#A855F7" />
      <circle cx="3.5" cy="-2" r="2.5" fill="#A855F7" />
      <circle cx="0" cy="3" r="2.5" fill="#A855F7" />
    </g>
    {/* 树 */}
    <g transform="translate(350, 105)">
      <rect x="0" y="0" width="6" height="25" fill="#78350F" />
      <circle cx="3" cy="-8" r="18" fill="#22C55E" />
    </g>
  </>,
  '#38BDF8', '#0EA5E9'
);

// 19. 学校教室场景
export const SceneClassroom: React.FC = () => wrapSvg(
  <>
    {/* 墙 */}
    <rect x="0" y="0" width="400" height="100" fill="#1E293B" />
    {/* 地板 */}
    <rect x="0" y="100" width="400" height="50" fill="#78350F" />
    {/* 黑板 */}
    <rect x="120" y="15" width="160" height="55" rx="3" fill="#0F5132" />
    <rect x="117" y="12" width="166" height="61" rx="4" fill="#78350F" />
    <rect x="122" y="17" width="156" height="51" rx="2" fill="#14532D" />
    {/* 粉笔字 A B C */}
    <text x="160" y="48" fill="white" fontSize="20" fontFamily="Arial" opacity="0.9">A B C</text>
    <text x="180" y="62" fill="white" fontSize="12" fontFamily="Arial" opacity="0.7">1 2 3</text>
    {/* 课桌1 */}
    <g transform="translate(50, 90)">
      <rect x="0" y="0" width="50" height="5" rx="1" fill="#A16207" />
      <rect x="5" y="5" width="3" height="20" fill="#854D0E" />
      <rect x="42" y="5" width="3" height="20" fill="#854D0E" />
    </g>
    {/* 课桌2 */}
    <g transform="translate(300, 90)">
      <rect x="0" y="0" width="50" height="5" rx="1" fill="#A16207" />
      <rect x="5" y="5" width="3" height="20" fill="#854D0E" />
      <rect x="42" y="5" width="3" height="20" fill="#854D0E" />
    </g>
    {/* 老师 */}
    <g transform="translate(200, 55)">
      <circle cx="0" cy="12" r="10" fill="#FCD5B5" />
      <path d="M-10 8 Q-8 -2 0 -2 Q8 -2 10 8" fill="#451A03" />
      <circle cx="-3" cy="12" r="1.5" fill="#1E293B" />
      <circle cx="3" cy="12" r="1.5" fill="#1E293B" />
      <path d="M-3 17 Q0 20 3 17" stroke="#1E293B" strokeWidth="1.2" fill="none" />
      {/* 身体 */}
      <rect x="-13" y="22" width="26" height="28" rx="5" fill="#7C3AED" />
      {/* 拿教鞭的手 */}
      <path d="M13 28 L30 20" stroke="#FCD5B5" strokeWidth="4" strokeLinecap="round" />
      <rect x="28" y="15" width="2" height="15" rx="1" fill="#78350F" transform="rotate(-20 29 22)" />
    </g>
    {/* 学生1 */}
    <g transform="translate(75, 80)">
      <circle cx="0" cy="8" r="8" fill="#FCD5B5" />
      <path d="M-8 5 Q-6 -2 0 -2 Q6 -2 8 5" fill="#92400E" />
      <rect x="-7" y="16" width="14" height="14" rx="2" fill="#22C55E" />
    </g>
    {/* 学生2 */}
    <g transform="translate(325, 80)">
      <circle cx="0" cy="8" r="8" fill="#FCD5B5" />
      <path d="M-8 5 Q-6 -3 0 -3 Q6 -3 8 5" fill="#1E293B" />
      <rect x="-7" y="16" width="14" height="14" rx="2" fill="#3B82F6" />
    </g>
    {/* 时钟 */}
    <g transform="translate(50, 30)">
      <circle cx="0" cy="0" r="12" fill="#1E293B" stroke="#6B7280" strokeWidth="2" />
      <line x1="0" y1="0" x2="0" y2="-6" stroke="white" strokeWidth="1.5" />
      <line x1="0" y1="0" x2="4" y2="2" stroke="white" strokeWidth="1.5" />
      <circle cx="0" cy="0" r="1.5" fill="white" />
    </g>
  </>,
  '#0F172A', '#1E293B'
);

// 20. 学习/书桌默认场景
export const SceneStudy: React.FC = () => wrapSvg(
  <>
    {/* 墙 */}
    <rect x="0" y="0" width="400" height="90" fill="#1E1B4B" />
    {/* 地板 */}
    <rect x="0" y="90" width="400" height="60" fill="#312E81" />
    {/* 书桌 */}
    <rect x="50" y="80" width="300" height="8" rx="2" fill="#92400E" />
    <rect x="60" y="88" width="6" height="25" fill="#78350F" />
    <rect x="334" y="88" width="6" height="25" fill="#78350F" />
    {/* 台灯 */}
    <g transform="translate(90, 30)">
      <rect x="10" y="30" width="3" height="40" fill="#4B5563" />
      <path d="M-5 25 L25 25 L20 35 L0 35 Z" fill="#EF4444" />
      <ellipse cx="12" cy="50" rx="20" ry="10" fill="#FCD34D" opacity="0.3" />
    </g>
    {/* 书本堆 */}
    <g transform="translate(270, 55)">
      <rect x="0" y="20" width="40" height="8" rx="1" fill="#EF4444" />
      <rect x="5" y="12" width="35" height="8" rx="1" fill="#22C55E" />
      <rect x="0" y="4" width="38" height="8" rx="1" fill="#3B82F6" />
      <rect x="8" y="-2" width="28" height="6" rx="1" fill="#F59E0B" />
    </g>
    {/* 打开的书（在桌上） */}
    <g transform="translate(170, 75)">
      <path d="M-30 0 L0 -4 L30 0 L30 12 Q30 16 26 16 L0 12 L-26 16 Q-30 16 -30 12 Z" fill="#FEF3C7" />
      <path d="M0 -4 L0 12" stroke="#D97706" strokeWidth="1" />
      {/* 文字行 */}
      <line x1="-25" y1="2" x2="-8" y2="2" stroke="#78350F" strokeWidth="0.8" />
      <line x1="-25" y1="6" x2="-10" y2="6" stroke="#78350F" strokeWidth="0.8" />
      <line x1="-25" y1="10" x2="-12" y2="10" stroke="#78350F" strokeWidth="0.8" />
      <line x1="5" y1="2" x2="22" y2="2" stroke="#78350F" strokeWidth="0.8" />
      <line x1="5" y1="6" x2="20" y2="6" stroke="#78350F" strokeWidth="0.8" />
      <line x1="5" y1="10" x2="18" y2="10" stroke="#78350F" strokeWidth="0.8" />
    </g>
    {/* 铅笔 */}
    <g transform="translate(230, 70) rotate(-20)">
      <rect x="0" y="0" width="30" height="5" rx="1" fill="#FBBF24" />
      <polygon points="30,0 38,2.5 30,5" fill="#FCD5B5" />
      <polygon points="35,1.5 38,2.5 35,3.5" fill="#1E293B" />
      <rect x="0" y="0" width="5" height="5" fill="#EF4444" />
    </g>
    {/* 星星装饰 */}
    <polygon points="350,20 352,25 357,25 353,28 355,33 350,30 345,33 347,28 343,25 348,25" fill="#FDE047" />
    <polygon points="30,15 31.5,19 36,19 32.5,21.5 34,26 30,23 26,26 27.5,21.5 24,19 28.5,19" fill="#A855F7" />
  </>,
  '#1E1B4B', '#312E81'
);

// 21. 小鸟场景
export const SceneBird: React.FC = () => wrapSvg(
  <>
    {/* 天空 */}
    <rect x="0" y="0" width="400" height="150" fill="url(#bg)" />
    {/* 云 */}
    <ellipse cx="70" cy="30" rx="30" ry="12" fill="white" opacity="0.5" />
    <ellipse cx="300" cy="25" rx="28" ry="10" fill="white" opacity="0.5" />
    {/* 树 */}
    <g transform="translate(320, 50)">
      <rect x="0" y="50" width="10" height="50" fill="#78350F" />
      <circle cx="5" cy="40" r="30" fill="#16A34A" />
      <circle cx="-15" cy="50" r="18" fill="#15803D" />
      <circle cx="25" cy="48" r="20" fill="#15803D" />
    </g>
    {/* 大鸟 */}
    <g transform="translate(150, 70)">
      {/* 身体 */}
      <ellipse cx="0" cy="0" rx="25" ry="18" fill="#3B82F6" />
      {/* 翅膀 */}
      <path d="M-5 -5 Q-25 -25 -35 -10 Q-25 0 -5 -2" fill="#1D4ED8" />
      {/* 头 */}
      <circle cx="20" cy="-8" r="13" fill="#60A5FA" />
      {/* 眼睛 */}
      <circle cx="25" cy="-10" r="3" fill="white" />
      <circle cx="26" cy="-10" r="1.5" fill="#1E293B" />
      {/* 嘴 */}
      <polygon points="33,-8 45,-5 33,-2" fill="#F59E0B" />
      {/* 尾巴 */}
      <polygon points="-25,0 -40,-10 -38,8" fill="#1D4ED8" />
      {/* 腿 */}
      <line x1="-5" y1="18" x2="-8" y2="28" stroke="#F59E0B" strokeWidth="2" />
      <line x1="5" y1="18" x2="8" y2="28" stroke="#F59E0B" strokeWidth="2" />
    </g>
    {/* 小鸟 */}
    <g transform="translate(80, 50)">
      <ellipse cx="0" cy="0" rx="15" ry="12" fill="#EF4444" />
      <path d="M0 -2 Q-15 -15 -22 -5 Q-15 2 0 0" fill="#DC2626" />
      <circle cx="12" cy="-5" r="8" fill="#F87171" />
      <circle cx="15" cy="-6" r="2" fill="white" />
      <circle cx="15.5" cy="-6" r="1" fill="#1E293B" />
      <polygon points="20,-5 28,-3 20,-1" fill="#F59E0B" />
      <polygon points="-15,0 -25,-6 -23,5" fill="#DC2626" />
    </g>
    {/* 小鸟2 */}
    <g transform="translate(240, 35)">
      <ellipse cx="0" cy="0" rx="12" ry="10" fill="#A855F7" />
      <path d="M-2 -1 Q-12 -12 -18 -4 Q-12 2 -2 0" fill="#7C3AED" />
      <circle cx="10" cy="-4" r="7" fill="#C084FC" />
      <circle cx="12" cy="-5" r="1.8" fill="white" />
      <circle cx="12.5" cy="-5" r="0.9" fill="#1E293B" />
      <polygon points="16,-4 22,-2 16,0" fill="#F59E0B" />
    </g>
    {/* 草地 */}
    <ellipse cx="200" cy="145" rx="250" ry="20" fill="#166534" />
    {/* 小花 */}
    <g transform="translate(50, 138)">
      <circle cx="0" cy="0" r="3" fill="#FDE047" />
      <circle cx="-3.5" cy="-2" r="2.5" fill="#F472B6" />
      <circle cx="3.5" cy="-2" r="2.5" fill="#F472B6" />
      <circle cx="0" cy="3" r="2.5" fill="#F472B6" />
    </g>
  </>,
  '#7DD3FC', '#38BDF8'
);

// 22. 鱼/水场景
export const SceneFish: React.FC = () => wrapSvg(
  <>
    {/* 水 */}
    <rect x="0" y="0" width="400" height="150" fill="url(#bg)" />
    {/* 水波纹 */}
    <path d="M0 20 Q50 15 100 20 T200 20 T300 20 T400 20" stroke="white" strokeWidth="1" fill="none" opacity="0.2" />
    <path d="M0 35 Q60 30 120 35 T240 35 T400 35" stroke="white" strokeWidth="0.8" fill="none" opacity="0.15" />
    {/* 海草 */}
    <path d="M30 150 Q25 120 35 100 Q30 80 40 60" stroke="#22C55E" strokeWidth="5" fill="none" strokeLinecap="round" />
    <path d="M55 150 Q60 125 50 105 Q55 85 48 70" stroke="#16A34A" strokeWidth="4" fill="none" strokeLinecap="round" />
    <path d="M370 150 Q375 130 368 110 Q375 95 365 75" stroke="#22C55E" strokeWidth="5" fill="none" strokeLinecap="round" />
    <path d="M350 150 Q345 125 355 105 Q348 88 358 70" stroke="#16A34A" strokeWidth="4" fill="none" strokeLinecap="round" />
    {/* 石头 */}
    <ellipse cx="60" cy="140" rx="25" ry="12" fill="#475569" />
    <ellipse cx="340" cy="138" rx="30" ry="14" fill="#334155" />
    {/* 大鱼 */}
    <g transform="translate(200, 70)">
      {/* 身体 */}
      <ellipse cx="0" cy="0" rx="35" ry="20" fill="#F97316" />
      {/* 尾巴 */}
      <polygon points="-35,0 -55,-18 -50,0 -55,18" fill="#EA580C" />
      {/* 鳍 */}
      <polygon points="5,-20 15,-32 18,-18" fill="#FB923C" />
      <polygon points="-10,15 -5,28 5,18" fill="#FB923C" />
      {/* 眼睛 */}
      <circle cx="22" cy="-3" r="5" fill="white" />
      <circle cx="23" cy="-3" r="2.5" fill="#1E293B" />
      <circle cx="24" cy="-4" r="1" fill="white" />
      {/* 鳃 */}
      <path d="M10 -8 Q13 0 10 8" stroke="#EA580C" strokeWidth="1.5" fill="none" />
      {/* 条纹 */}
      <path d="M0 -18 Q-3 0 0 18" stroke="#FED7AA" strokeWidth="1.5" fill="none" opacity="0.6" />
      <path d="M-10 -15 Q-13 0 -10 15" stroke="#FED7AA" strokeWidth="1.5" fill="none" opacity="0.6" />
    </g>
    {/* 小鱼群 */}
    <g transform="translate(100, 45)">
      <ellipse cx="0" cy="0" rx="12" ry="7" fill="#06B6D4" />
      <polygon points="-12,0 -20,-6 -18,0 -20,6" fill="#0891B2" />
      <circle cx="7" cy="-1" r="1.8" fill="white" />
    </g>
    <g transform="translate(130, 35)">
      <ellipse cx="0" cy="0" rx="10" ry="6" fill="#A855F7" />
      <polygon points="-10,0 -17,-5 -15,0 -17,5" fill="#7C3AED" />
      <circle cx="6" cy="-1" r="1.5" fill="white" />
    </g>
    <g transform="translate(290, 100)">
      <ellipse cx="0" cy="0" rx="11" ry="6" fill="#EC4899" />
      <polygon points="-11,0 -18,-5 -16,0 -18,5" fill="#DB2777" />
      <circle cx="6" cy="-1" r="1.6" fill="white" />
    </g>
    {/* 气泡 */}
    <circle cx="320" cy="50" r="4" fill="white" opacity="0.4" />
    <circle cx="330" cy="35" r="3" fill="white" opacity="0.3" />
    <circle cx="315" cy="25" r="2" fill="white" opacity="0.25" />
    <circle cx="80" cy="80" r="3" fill="white" opacity="0.35" />
    <circle cx="72" cy="65" r="2.5" fill="white" opacity="0.3" />
  </>,
  '#0369A1', '#082F49'
);

export const SCENE_MAP: Record<string, React.FC> = {
  family: SceneFamily,
  school: SceneSchool,
  classroom: SceneClassroom,
  panda: ScenePanda,
  dog: SceneDog,
  cat: SceneCat,
  bird: SceneBird,
  apple: SceneApple,
  banana: SceneBanana,
  food: SceneFood,
  colors: SceneColors,
  numbers: SceneNumbers,
  body: SceneBody,
  hello: SceneHello,
  birthday: SceneBirthday,
  park: ScenePark,
  library: SceneLibrary,
  music: SceneMusic,
  sports: SceneSports,
  weather: SceneWeather,
  fish: SceneFish,
  study: SceneStudy,
};
