import React from 'react';

// 掌握等级颜色映射
export const MASTERY_COLORS: Record<string, { fill: string; stroke: string; label: string }> = {
  unknown: { fill: '#475569', stroke: '#64748B', label: '陌生' },
  learning: { fill: '#6366F1', stroke: '#818CF8', label: '熟悉中' },
  familiar: { fill: '#2563EB', stroke: '#60A5FA', label: '熟悉' },
  mastered: { fill: '#06B6D4', stroke: '#67E8F9', label: '掌握' },
};

// ===== SVG 饼图（环形图） =====
export interface DonutChartProps {
  data: Array<{ level: string; count: number; percentage: number }>;
  total: number;
  size?: number;
  thickness?: number;
}

export const DonutChart: React.FC<DonutChartProps> = ({
  data,
  total,
  size = 180,
  thickness = 24,
}) => {
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  let offset = 0;
  const segments = data.map((item) => {
    const color = MASTERY_COLORS[item.level] ?? MASTERY_COLORS.unknown;
    const dashLength = (item.percentage / 100) * circumference;
    const dashOffset = -offset;
    offset += dashLength;
    return (
      <circle
        key={item.level}
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke={color.fill}
        strokeWidth={thickness}
        strokeDasharray={`${dashLength} ${circumference - dashLength}`}
        strokeDashoffset={dashOffset}
        strokeLinecap="butt"
        transform={`rotate(-90 ${center} ${center})`}
        style={{ filter: `drop-shadow(0 0 4px ${color.stroke}40)` }}
      />
    );
  });

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* 底圈 */}
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke="rgba(71, 85, 105, 0.2)"
        strokeWidth={thickness}
      />
      {segments}
      {/* 中心文字 */}
      <text
        x={center}
        y={center - 6}
        textAnchor="middle"
        className="fill-white"
        style={{ fontSize: '24px', fontWeight: 700 }}
      >
        {total}
      </text>
      <text
        x={center}
        y={center + 14}
        textAnchor="middle"
        className="fill-slate-400"
        style={{ fontSize: '11px' }}
      >
        总单词数
      </text>
    </svg>
  );
};

// ===== SVG 柱状+折线趋势图 =====
export interface TrendChartProps {
  data: Array<{ date: string; learned: number; reviewed: number }>;
}

export const TrendChart: React.FC<TrendChartProps> = ({ data }) => {
  const width = 480;
  const height = 200;
  const paddingLeft = 32;
  const paddingRight = 12;
  const paddingTop = 16;
  const paddingBottom = 28;
  const chartW = width - paddingLeft - paddingRight;
  const chartH = height - paddingTop - paddingBottom;

  const maxVal = Math.max(1, ...data.map((d) => Math.max(d.learned, d.reviewed)));
  const yMax = Math.ceil(maxVal / 10) * 10 || 10;
  const barWidth = data.length > 0 ? (chartW / data.length) * 0.45 : 20;
  const gap = data.length > 0 ? chartW / data.length : 40;

  const yTicks = 4;

  const barX = (i: number): number =>
    paddingLeft + gap * i + (gap - barWidth * 2) / 2;
  const lineX = (i: number): number => paddingLeft + gap * i + gap / 2;
  const barY = (val: number): number =>
    paddingTop + chartH - (val / yMax) * chartH;

  // 折线点路径
  const linePoints = data
    .map((d, i) => `${lineX(i)},${barY(d.reviewed)}`)
    .join(' ');

  // 格式化日期
  const fmtDate = (dateStr: string): string => {
    const d = new Date(dateStr);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  };

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
      <defs>
        <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#6366F1" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#4C1D95" stopOpacity="0.6" />
        </linearGradient>
        <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#06B6D4" />
          <stop offset="100%" stopColor="#06B6D4" />
        </linearGradient>
      </defs>

      {/* Y 轴网格线 */}
      {Array.from({ length: yTicks + 1 }).map((_, i) => {
        const y = paddingTop + (chartH / yTicks) * i;
        const val = Math.round(yMax - (yMax / yTicks) * i);
        return (
          <g key={i}>
            <line
              x1={paddingLeft}
              y1={y}
              x2={width - paddingRight}
              y2={y}
              stroke="rgba(100, 116, 139, 0.15)"
              strokeDasharray="3 3"
            />
            <text
              x={paddingLeft - 6}
              y={y + 4}
              textAnchor="end"
              className="fill-slate-500"
              style={{ fontSize: '10px' }}
            >
              {val}
            </text>
          </g>
        );
      })}

      {/* 柱状图 */}
      {data.map((d, i) => {
        const x = barX(i);
        const y = barY(d.learned);
        const h = paddingTop + chartH - y;
        return (
          <rect
            key={`bar-${i}`}
            x={x}
            y={y}
            width={barWidth}
            height={Math.max(h, 1)}
            fill="url(#barGradient)"
            rx={3}
            style={{ filter: 'drop-shadow(0 0 3px rgba(99, 102, 241, 0.35))' }}
          />
        );
      })}

      {/* 折线图 */}
      {data.length > 1 && (
        <polyline
          points={linePoints}
          fill="none"
          stroke="url(#lineGradient)"
          strokeWidth={2}
          strokeDasharray="4 3"
          style={{ filter: 'drop-shadow(0 0 4px rgba(34, 211, 238, 0.5))' }}
        />
      )}

      {/* 折线圆点 */}
      {data.map((d, i) => (
        <circle
          key={`dot-${i}`}
          cx={lineX(i)}
          cy={barY(d.reviewed)}
          r={4}
          fill="#EEF2FF"
          stroke="#06B6D4"
          strokeWidth={2}
          style={{ filter: 'drop-shadow(0 0 3px rgba(34, 211, 238, 0.7))' }}
        />
      ))}

      {/* X 轴标签 */}
      {data.map((d, i) => (
        <text
          key={`x-${i}`}
          x={lineX(i)}
          y={height - 8}
          textAnchor="middle"
          className="fill-slate-500"
          style={{ fontSize: '10px' }}
        >
          {fmtDate(d.date)}
        </text>
      ))}
    </svg>
  );
};
