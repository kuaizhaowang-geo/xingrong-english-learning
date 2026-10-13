import React, { useState } from 'react';
import { Circle, Triangle, RectangleHorizontal } from 'lucide-react';

interface SectionViewerProps {
  grade?: number;
}

type SectionShape = 'cylinder' | 'cone';

const SectionViewer: React.FC<SectionViewerProps> = ({ grade = 3 }) => {
  const [shape, setShape] = useState<SectionShape>('cylinder');
  const [cutPosition, setCutPosition] = useState(50); // 0-100 截面高度百分比
  const [cutAngle, setCutAngle] = useState(0); // 截面角度 (-60 到 60 度)

  // 圆柱的截面形状
  const getCylinderSectionType = (): string => {
    if (Math.abs(cutAngle) < 5) return '圆形';
    if (Math.abs(cutAngle) < 30) return '椭圆';
    return '椭圆（更大）';
  };

  // 圆锥的截面形状
  const getConeSectionType = (): string => {
    if (cutPosition < 5) return '点';
    if (Math.abs(cutAngle) < 5) return '圆形';
    if (cutAngle < -30 && cutPosition > 30) return '三角形（纵切）';
    if (Math.abs(cutAngle) < 20) return '椭圆';
    return '不规则';
  };

  const sectionType = shape === 'cylinder' ? getCylinderSectionType() : getConeSectionType();

  return (
    <div className="glass-card space-y-5">
      {/* 标题和切换 */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-white">截面观察</h2>
        <div className="flex gap-1 bg-white/10 rounded-xl p-1">
          <button
            onClick={() => setShape('cylinder')}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              shape === 'cylinder'
                ? 'bg-white/20 text-blue-300'
                : 'text-slate-400'
            }`}
          >
            圆柱
          </button>
          <button
            onClick={() => setShape('cone')}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              shape === 'cone'
                ? 'bg-white/20 text-pink-300'
                : 'text-slate-400'
            }`}
          >
            圆锥
          </button>
        </div>
      </div>

      {/* 截面展示区 */}
      <div className="relative h-72 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl overflow-hidden">
        {/* 网格背景 */}
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              'linear-gradient(rgba(100,116,139,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(100,116,139,0.08) 1px, transparent 1px)',
            backgroundSize: '20px 20px',
          }}
        />

        <svg
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 300 250"
          preserveAspectRatio="xMidYMid meet"
        >
          {shape === 'cylinder' ? (
            <CylinderSection position={cutPosition} angle={cutAngle} />
          ) : (
            <ConeSection position={cutPosition} angle={cutAngle} />
          )}
        </svg>

        {/* 截面类型标签 */}
        <div className="absolute top-3 right-3 bg-white/10 border border-white/20 backdrop-blur-sm rounded-lg px-3 py-2 shadow-sm">
          <div className="text-xs text-slate-400">截面形状</div>
          <div className="text-sm font-bold text-orange-400">{sectionType}</div>
        </div>
      </div>

      {/* 滑块控制 */}
      <div className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-200 flex items-center gap-2">
              <RectangleHorizontal size={16} className="text-blue-400" />
              截面高度
            </span>
            <span className="text-sm text-slate-400">{cutPosition}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            step="1"
            value={cutPosition}
            onChange={(e) => setCutPosition(Number(e.target.value))}
            className="w-full h-2 bg-white/10 rounded-full appearance-none accent-blue-400"
          />
          <div className="flex justify-between text-xs text-slate-500">
            <span>顶部</span>
            <span>中部</span>
            <span>底部</span>
          </div>
        </div>

        {grade && grade >= 4 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-200 flex items-center gap-2">
                <Circle size={16} className="text-purple-400" />
                截面角度
              </span>
              <span className="text-sm text-slate-400">{cutAngle}°</span>
            </div>
            <input
              type="range"
              min="-60"
              max="60"
              step="1"
              value={cutAngle}
              onChange={(e) => setCutAngle(Number(e.target.value))}
              className="w-full h-2 bg-white/10 rounded-full appearance-none accent-purple-400"
            />
            <div className="flex justify-between text-xs text-slate-500">
              <span>向左倾斜</span>
              <span>水平</span>
              <span>向右倾斜</span>
            </div>
          </div>
        )}
      </div>

      {/* 截面形状说明 */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { icon: '○', name: '圆形', desc: '水平切' },
          { icon: '⬭', name: '椭圆', desc: '斜着切' },
          { icon: '△', name: '三角形', desc: '竖切圆锥' },
        ].map((item, idx) => (
          <div
            key={idx}
            className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-3 text-center"
          >
            <div className="text-2xl mb-1">{item.icon}</div>
            <div className="text-xs font-semibold text-slate-200">{item.name}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">{item.desc}</div>
          </div>
        ))}
      </div>

      {/* 知识小卡片 */}
      <div className="bg-gradient-to-r from-blue-500/20 to-indigo-500/20 border border-blue-500/30 rounded-xl p-4">
        <h3 className="text-sm font-semibold text-blue-300 mb-2">
          🔍 观察小提示
        </h3>
        <p className="text-xs text-blue-400 leading-relaxed">
          {shape === 'cylinder'
            ? '圆柱的截面：水平切是圆形，斜着切是椭圆形，竖直切是长方形。生活中切黄瓜片就是圆形截面哦！'
            : '圆锥的截面：水平切是圆形（越往尖越小），斜着切是椭圆形，竖直通过顶点切是三角形。'}
        </p>
      </div>
    </div>
  );
};

// 圆柱截面 SVG 组件
const CylinderSection: React.FC<{ position: number; angle: number }> = ({
  position,
  angle,
}) => {
  const cx = 150;
  const topY = 40;
  const bottomY = 210;
  const height = bottomY - topY;
  const rx = 55;
  const ry = 15;

  // 截面的 Y 位置
  const cutY = topY + (height * position) / 100;

  // 截面椭圆的变形（基于角度）
  const angleRad = (angle * Math.PI) / 180;
  const sectionRy = ry * Math.max(0.5, Math.cos(angleRad) + 0.3);
  const skew = Math.sin(angleRad) * 15;

  return (
    <>
      {/* 圆柱主体 - 渐变填充 */}
      <defs>
        <linearGradient id="cylGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#60A5FA" />
          <stop offset="50%" stopColor="#2563EB" />
          <stop offset="100%" stopColor="#2563EB" />
        </linearGradient>
        <linearGradient id="cylTopGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#93C5FD" />
          <stop offset="100%" stopColor="#60A5FA" />
        </linearGradient>
        <clipPath id="cylClip">
          <rect
            x={cx - rx}
            y={topY}
            width={rx * 2}
            height={cutY - topY}
          />
        </clipPath>
      </defs>

      {/* 底部椭圆 */}
      <ellipse
        cx={cx}
        cy={bottomY}
        rx={rx}
        ry={ry}
        fill="#1D4ED8"
        stroke="#1E40AF"
        strokeWidth="2"
      />

      {/* 圆柱侧面 */}
      <rect
        x={cx - rx}
        y={topY}
        width={rx * 2}
        height={height}
        fill="url(#cylGrad)"
      />
      <line
        x1={cx - rx}
        y1={topY}
        x2={cx - rx}
        y2={bottomY}
        stroke="#1E40AF"
        strokeWidth="2"
      />
      <line
        x1={cx + rx}
        y1={topY}
        x2={cx + rx}
        y2={bottomY}
        stroke="#1E40AF"
        strokeWidth="2"
      />

      {/* 截面（椭圆） */}
      <g transform={`translate(${skew}, 0)`}>
        <ellipse
          cx={cx}
          cy={cutY}
          rx={rx}
          ry={sectionRy}
          fill="#FBBF24"
          fillOpacity="0.8"
          stroke="#F59E0B"
          strokeWidth="2.5"
          strokeDasharray="4,3"
        />
        {/* 截面高光 */}
        <ellipse
          cx={cx - 10}
          cy={cutY - sectionRy * 0.3}
          rx={rx * 0.4}
          ry={sectionRy * 0.3}
          fill="white"
          fillOpacity="0.4"
        />
      </g>

      {/* 顶部椭圆 */}
      <ellipse
        cx={cx}
        cy={topY}
        rx={rx}
        ry={ry}
        fill="url(#cylTopGrad)"
        stroke="#1E40AF"
        strokeWidth="2"
      />

      {/* 截面位置指示线 */}
      <line
        x1={cx + rx + 20}
        y1={cutY}
        x2={cx + rx + 40}
        y2={cutY}
        stroke="#F59E0B"
        strokeWidth="2"
        strokeDasharray="3,2"
      />
    </>
  );
};

// 圆锥截面 SVG 组件
const ConeSection: React.FC<{ position: number; angle: number }> = ({
  position,
  angle,
}) => {
  const cx = 150;
  const topY = 30;
  const bottomY = 220;
  const height = bottomY - topY;
  const baseRx = 60;
  const baseRy = 16;

  // 截面位置的半径
  const t = position / 100;
  const sectionRx = baseRx * t;
  const sectionRy = baseRy * t;
  const cutY = topY + height * t;

  const angleRad = (angle * Math.PI) / 180;
  const skew = Math.sin(angleRad) * 10 * t;

  // 纵切模式（大角度 + 足够高度）
  const isVerticalCut = Math.abs(angle) > 40 && position > 30;

  return (
    <>
      <defs>
        <linearGradient id="coneGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#F9A8D4" />
          <stop offset="50%" stopColor="#EC4899" />
          <stop offset="100%" stopColor="#DB2777" />
        </linearGradient>
        <linearGradient id="coneBaseGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#BE185D" />
          <stop offset="100%" stopColor="#9D174D" />
        </linearGradient>
      </defs>

      {/* 底部椭圆 */}
      <ellipse
        cx={cx}
        cy={bottomY}
        rx={baseRx}
        ry={baseRy}
        fill="url(#coneBaseGrad)"
        stroke="#9D174D"
        strokeWidth="2"
      />

      {/* 圆锥侧面 */}
      <polygon
        points={`${cx},${topY} ${cx - baseRx},${bottomY} ${cx + baseRx},${bottomY}`}
        fill="url(#coneGrad)"
      />
      <line
        x1={cx}
        y1={topY}
        x2={cx - baseRx}
        y2={bottomY}
        stroke="#9D174D"
        strokeWidth="2"
      />
      <line
        x1={cx}
        y1={topY}
        x2={cx + baseRx}
        y2={bottomY}
        stroke="#9D174D"
        strokeWidth="2"
      />

      {/* 截面 */}
      {isVerticalCut ? (
        // 纵切：三角形截面
        <g transform={`translate(${skew}, 0)`}>
          <polygon
            points={`${cx},${topY + 5} ${cx - sectionRx * 0.7},${cutY} ${cx + sectionRx * 0.7},${cutY}`}
            fill="#FBBF24"
            fillOpacity="0.7"
            stroke="#F59E0B"
            strokeWidth="2.5"
            strokeDasharray="4,3"
          />
        </g>
      ) : (
        // 横切/斜切：椭圆截面
        <g transform={`translate(${skew}, 0)`}>
          <ellipse
            cx={cx}
            cy={cutY}
            rx={sectionRx}
            ry={sectionRy * Math.max(0.6, 1 - Math.abs(angle) / 80)}
            fill="#FBBF24"
            fillOpacity="0.8"
            stroke="#F59E0B"
            strokeWidth="2.5"
            strokeDasharray="4,3"
          />
        </g>
      )}

      {/* 顶点 */}
      <circle cx={cx} cy={topY} r="4" fill="#9D174D" />

      {/* 截面指示 */}
      {!isVerticalCut && sectionRx > 5 && (
        <line
          x1={cx + sectionRx + 20}
          y1={cutY}
          x2={cx + sectionRx + 40}
          y2={cutY}
          stroke="#F59E0B"
          strokeWidth="2"
          strokeDasharray="3,2"
        />
      )}
    </>
  );
};

export default SectionViewer;
