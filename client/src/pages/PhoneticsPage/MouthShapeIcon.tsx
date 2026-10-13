import React from 'react';

interface MouthShapeIconProps {
  type: string;
  size?: number;
  color?: string;
}

/**
 * 口型SVG图标组件
 * 根据类型渲染不同形状的嘴型简笔画
 * - wide: 嘴角向两侧伸展（扁唇宽开口）
 * - narrow: 双唇收圆前突（窄圆唇）
 * - round: 双唇收圆（中圆唇）
 * - flat: 双唇扁平（扁唇中开口）
 * - mid: 自然中开口
 * - open: 大开口
 * - closed: 闭唇
 */
const MouthShapeIcon: React.FC<MouthShapeIconProps> = ({
  type,
  size = 48,
  color = '#6366F1',
}) => {
  const strokeWidth = 2;
  const center = size / 2;

  const renderMouth = (): React.ReactNode => {
    switch (type) {
      case 'wide':
        // 扁唇宽开口 - 横向椭圆，嘴角向两侧
        return (
          <>
            <ellipse
              cx={center}
              cy={center}
              rx={size * 0.32}
              ry={size * 0.14}
              fill="none"
              stroke={color}
              strokeWidth={strokeWidth}
            />
            {/* 嘴角线条 */}
            <line
              x1={center - size * 0.38}
              y1={center - size * 0.02}
              x2={center - size * 0.28}
              y2={center - size * 0.08}
              stroke={color}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
            />
            <line
              x1={center + size * 0.28}
              y1={center - size * 0.08}
              x2={center + size * 0.38}
              y2={center - size * 0.02}
              stroke={color}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
            />
            {/* 舌位指示（前高） */}
            <ellipse
              cx={center - size * 0.05}
              cy={center + size * 0.05}
              rx={size * 0.1}
              ry={size * 0.04}
              fill={color}
              opacity={0.3}
            />
          </>
        );

      case 'narrow':
        // 窄圆唇 - 小圆，双唇前突
        return (
          <>
            <ellipse
              cx={center}
              cy={center}
              rx={size * 0.14}
              ry={size * 0.18}
              fill="none"
              stroke={color}
              strokeWidth={strokeWidth}
            />
            {/* 外唇轮廓 */}
            <ellipse
              cx={center}
              cy={center}
              rx={size * 0.22}
              ry={size * 0.2}
              fill="none"
              stroke={color}
              strokeWidth={strokeWidth * 0.6}
              strokeDasharray="2 3"
            />
            {/* 舌位指示（后高） */}
            <ellipse
              cx={center + size * 0.12}
              cy={center - size * 0.02}
              rx={size * 0.08}
              ry={size * 0.05}
              fill={color}
              opacity={0.3}
            />
          </>
        );

      case 'round':
        // 中圆唇 - 中等圆开口
        return (
          <>
            <ellipse
              cx={center}
              cy={center}
              rx={size * 0.22}
              ry={size * 0.24}
              fill="none"
              stroke={color}
              strokeWidth={strokeWidth}
            />
            {/* 唇线 */}
            <path
              d={`M ${center - size * 0.18} ${center - size * 0.04}
                 Q ${center} ${center + size * 0.02}
                 ${center + size * 0.18} ${center - size * 0.04}`}
              fill="none"
              stroke={color}
              strokeWidth={strokeWidth * 0.6}
              strokeLinecap="round"
            />
            {/* 舌位指示（后中） */}
            <ellipse
              cx={center + size * 0.1}
              cy={center + size * 0.02}
              rx={size * 0.09}
              ry={size * 0.05}
              fill={color}
              opacity={0.3}
            />
          </>
        );

      case 'flat':
        // 扁唇中开口 - 横向稍扁
        return (
          <>
            <ellipse
              cx={center}
              cy={center}
              rx={size * 0.26}
              ry={size * 0.18}
              fill="none"
              stroke={color}
              strokeWidth={strokeWidth}
            />
            {/* 舌位指示（前中） */}
            <ellipse
              cx={center - size * 0.08}
              cy={center + size * 0.04}
              rx={size * 0.1}
              ry={size * 0.05}
              fill={color}
              opacity={0.3}
            />
          </>
        );

      case 'mid':
        // 自然中开口 - 偏圆中等开口
        return (
          <>
            <ellipse
              cx={center}
              cy={center}
              rx={size * 0.22}
              ry={size * 0.2}
              fill="none"
              stroke={color}
              strokeWidth={strokeWidth}
            />
            {/* 舌位指示（中） */}
            <ellipse
              cx={center}
              cy={center + size * 0.03}
              rx={size * 0.09}
              ry={size * 0.05}
              fill={color}
              opacity={0.3}
            />
          </>
        );

      case 'open':
        // 大开口 - 大椭圆
        return (
          <>
            <ellipse
              cx={center}
              cy={center}
              rx={size * 0.28}
              ry={size * 0.3}
              fill="none"
              stroke={color}
              strokeWidth={strokeWidth}
            />
            {/* 上唇线 */}
            <path
              d={`M ${center - size * 0.15} ${center - size * 0.18}
                 Q ${center} ${center - size * 0.12}
                 ${center + size * 0.15} ${center - size * 0.18}`}
              fill="none"
              stroke={color}
              strokeWidth={strokeWidth * 0.6}
              strokeLinecap="round"
            />
            {/* 舌位指示（低） */}
            <ellipse
              cx={center}
              cy={center + size * 0.12}
              rx={size * 0.12}
              ry={size * 0.05}
              fill={color}
              opacity={0.3}
            />
          </>
        );

      case 'closed':
        // 闭唇 - 一条横线
        return (
          <>
            {/* 上唇轮廓 */}
            <path
              d={`M ${center - size * 0.22} ${center - size * 0.05}
                 Q ${center - size * 0.1} ${center - size * 0.12}
                 ${center} ${center - size * 0.06}
                 Q ${center + size * 0.1} ${center - size * 0.12}
                 ${center + size * 0.22} ${center - size * 0.05}`}
              fill="none"
              stroke={color}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
            />
            {/* 闭合线 */}
            <line
              x1={center - size * 0.24}
              y1={center}
              x2={center + size * 0.24}
              y2={center}
              stroke={color}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
            />
            {/* 下唇轮廓 */}
            <path
              d={`M ${center - size * 0.2} ${center + size * 0.02}
                 Q ${center} ${center + size * 0.1}
                 ${center + size * 0.2} ${center + size * 0.02}`}
              fill="none"
              stroke={color}
              strokeWidth={strokeWidth * 0.7}
              strokeLinecap="round"
            />
          </>
        );

      default:
        return (
          <ellipse
            cx={center}
            cy={center}
            rx={size * 0.2}
            ry={size * 0.2}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
          />
        );
    }
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      {renderMouth()}
    </svg>
  );
};

export default MouthShapeIcon;
