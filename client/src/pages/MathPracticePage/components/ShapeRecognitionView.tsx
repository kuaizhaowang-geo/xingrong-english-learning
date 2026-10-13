import React, { useState, useEffect } from 'react';
import { Volume2, ChevronDown, ChevronUp, Layers, Box } from 'lucide-react';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { getShapes } from '@client/src/api/math-practice';
import { useSpeech } from '@client/src/hooks/use-speech';
import type { ShapeInfo, MathShapeListResponse } from '@shared/api.interface';

// 前端内置保底数据（保证页面可用）
const FALLBACK_SHAPES: MathShapeListResponse = {
  shapes2d: [
    { id: 'square', name: '正方形', shapeType: '2d',
      properties: { 边数: 4, 顶点数: 4, 内角和: '360°', 对称轴: 4 },
      description: '四条边都相等，四个角都是直角的四边形。正方形是特殊的长方形。' },
    { id: 'rectangle', name: '长方形', shapeType: '2d',
      properties: { 边数: 4, 顶点数: 4, 内角和: '360°', 对称轴: 2 },
      description: '对边相等，四个角都是直角的四边形。又叫矩形。' },
    { id: 'triangle', name: '三角形', shapeType: '2d',
      properties: { 边数: 3, 顶点数: 3, 内角和: '180°', 高: 3 },
      description: '由三条线段首尾相连围成的封闭图形。按角分有锐角三角形、直角三角形、钝角三角形。' },
    { id: 'circle', name: '圆形', shapeType: '2d',
      properties: { 半径: 'r', 直径: '2r', 周长: '2πr', 面积: 'πr²' },
      description: '平面上到定点距离等于定长的所有点组成的图形。圆有无数条对称轴。' },
    { id: 'parallelogram', name: '平行四边形', shapeType: '2d',
      properties: { 边数: 4, 顶点数: 4, 对边: '平行且相等', 对角线: '互相平分' },
      description: '两组对边分别平行的四边形。长方形和正方形都是特殊的平行四边形。' },
    { id: 'trapezoid', name: '梯形', shapeType: '2d',
      properties: { 边数: 4, 顶点数: 4, 平行边数: 2, 高: '两底之间的距离' },
      description: '只有一组对边平行的四边形。平行的两条边叫底，不平行的叫腰。' },
  ],
  shapes3d: [
    { id: 'cube', name: '正方体', shapeType: '3d',
      properties: { 面数: 6, 棱数: 12, 顶点数: 8, 面的形状: '正方形' },
      description: '由六个完全相同的正方形围成的立体图形。所有棱长都相等。' },
    { id: 'cuboid', name: '长方体', shapeType: '3d',
      properties: { 面数: 6, 棱数: 12, 顶点数: 8, 面的形状: '长方形' },
      description: '由六个长方形围成的立体图形，相对的面完全相同。正方体是特殊的长方体。' },
    { id: 'cylinder', name: '圆柱', shapeType: '3d',
      properties: { 面数: 3, 底面形状: '圆形', 侧面展开: '长方形', 高: '两底之间的距离' },
      description: '以矩形的一边为轴旋转一周所得到的立体图形。上下两个底面是完全相同的圆。' },
    { id: 'cone', name: '圆锥', shapeType: '3d',
      properties: { 面数: 2, 底面形状: '圆形', 顶点数: 1, 侧面展开: '扇形' },
      description: '以直角三角形的一条直角边为轴旋转一周所得到的立体图形。' },
    { id: 'sphere', name: '球', shapeType: '3d',
      properties: { 面数: 1, 半径: 'r', 直径: '2r', 表面积: '4πr²' },
      description: '空间中到定点距离等于定长的所有点组成的图形。球只有一个曲面。' },
    { id: 'prism', name: '棱柱', shapeType: '3d',
      properties: { 底面: '多边形', 侧面: '平行四边形', 顶点数: '2n', 棱数: '3n' },
      description: '有两个面互相平行，其余各面都是四边形的多面体。按底面边数分为三棱柱、四棱柱等。' },
  ],
};

// 2D 图形 SVG 组件
const Shape2DSVG: React.FC<{ shapeId: string; color: string }> = ({ shapeId, color }) => {
  const size = 80;
  const stroke = 'white';
  const strokeWidth = 2;

  switch (shapeId) {
    case 'square':
      return (
        <svg width={size} height={size} viewBox="0 0 100 100">
          <rect x="15" y="15" width="70" height="70" rx="4" fill={color} stroke={stroke} strokeWidth={strokeWidth} />
        </svg>
      );
    case 'rectangle':
      return (
        <svg width={size} height={size} viewBox="0 0 100 100">
          <rect x="10" y="25" width="80" height="50" rx="4" fill={color} stroke={stroke} strokeWidth={strokeWidth} />
        </svg>
      );
    case 'triangle':
      return (
        <svg width={size} height={size} viewBox="0 0 100 100">
          <polygon points="50,15 90,85 10,85" fill={color} stroke={stroke} strokeWidth={strokeWidth} strokeLinejoin="round" />
        </svg>
      );
    case 'circle':
      return (
        <svg width={size} height={size} viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="38" fill={color} stroke={stroke} strokeWidth={strokeWidth} />
        </svg>
      );
    case 'parallelogram':
      return (
        <svg width={size} height={size} viewBox="0 0 100 100">
          <polygon points="25,20 90,20 75,80 10,80" fill={color} stroke={stroke} strokeWidth={strokeWidth} strokeLinejoin="round" />
        </svg>
      );
    case 'trapezoid':
      return (
        <svg width={size} height={size} viewBox="0 0 100 100">
          <polygon points="30,20 70,20 90,80 10,80" fill={color} stroke={stroke} strokeWidth={strokeWidth} strokeLinejoin="round" />
        </svg>
      );
    default:
      return (
        <svg width={size} height={size} viewBox="0 0 100 100">
          <rect x="20" y="20" width="60" height="60" fill={color} />
        </svg>
      );
  }
};

// 3D 图形 SVG 组件（等距视图）
const Shape3DSVG: React.FC<{ shapeId: string; color: string }> = ({ shapeId, color }) => {
  const size = 80;
  const stroke = 'white';
  const strokeWidth = 1.5;

  switch (shapeId) {
    case 'cube':
      return (
        <svg width={size} height={size} viewBox="0 0 100 100">
          <polygon points="50,12 88,32 88,72 50,92 12,72 12,32" fill={color} stroke={stroke} strokeWidth={strokeWidth} strokeLinejoin="round" />
          <polygon points="50,12 88,32 50,52 12,32" fill="white" fillOpacity="0.25" stroke={stroke} strokeWidth={strokeWidth} strokeLinejoin="round" />
          <line x1="50" y1="52" x2="50" y2="92" stroke={stroke} strokeWidth={strokeWidth} />
          <line x1="88" y1="32" x2="50" y2="52" stroke={stroke} strokeWidth={strokeWidth} />
          <line x1="12" y1="32" x2="50" y2="52" stroke={stroke} strokeWidth={strokeWidth} />
        </svg>
      );
    case 'cuboid':
      return (
        <svg width={size} height={size} viewBox="0 0 100 100">
          <polygon points="48,15 92,28 92,78 48,92 8,78 8,28" fill={color} stroke={stroke} strokeWidth={strokeWidth} strokeLinejoin="round" />
          <polygon points="48,15 92,28 48,42 8,28" fill="white" fillOpacity="0.25" stroke={stroke} strokeWidth={strokeWidth} strokeLinejoin="round" />
          <line x1="48" y1="42" x2="48" y2="92" stroke={stroke} strokeWidth={strokeWidth} />
          <line x1="92" y1="28" x2="48" y2="42" stroke={stroke} strokeWidth={strokeWidth} />
          <line x1="8" y1="28" x2="48" y2="42" stroke={stroke} strokeWidth={strokeWidth} />
        </svg>
      );
    case 'cylinder':
      return (
        <svg width={size} height={size} viewBox="0 0 100 100">
          <ellipse cx="50" cy="20" rx="28" ry="10" fill="white" fillOpacity="0.3" stroke={stroke} strokeWidth={strokeWidth} />
          <rect x="22" y="20" width="56" height="60" fill={color} stroke="none" />
          <line x1="22" y1="20" x2="22" y2="80" stroke={stroke} strokeWidth={strokeWidth} />
          <line x1="78" y1="20" x2="78" y2="80" stroke={stroke} strokeWidth={strokeWidth} />
          <ellipse cx="50" cy="80" rx="28" ry="10" fill={color} stroke={stroke} strokeWidth={strokeWidth} />
        </svg>
      );
    case 'cone':
      return (
        <svg width={size} height={size} viewBox="0 0 100 100">
          <polygon points="50,10 82,82 18,82" fill={color} stroke={stroke} strokeWidth={strokeWidth} strokeLinejoin="round" />
          <ellipse cx="50" cy="82" rx="32" ry="10" fill={color} stroke={stroke} strokeWidth={strokeWidth} />
        </svg>
      );
    case 'sphere':
      return (
        <svg width={size} height={size} viewBox="0 0 100 100">
          <defs>
            <radialGradient id="sphereGrad" cx="35%" cy="35%" r="60%">
              <stop offset="0%" stopColor="white" stopOpacity="0.4" />
              <stop offset="100%" stopColor={color} stopOpacity="1" />
            </radialGradient>
          </defs>
          <circle cx="50" cy="50" r="38" fill="url(#sphereGrad)" stroke={stroke} strokeWidth={strokeWidth} />
          <ellipse cx="50" cy="62" rx="28" ry="8" fill="none" stroke={stroke} strokeWidth={strokeWidth} opacity="0.4" />
        </svg>
      );
    case 'prism':
      return (
        <svg width={size} height={size} viewBox="0 0 100 100">
          <polygon points="50,10 88,30 88,80 50,92 12,80 12,30" fill={color} stroke={stroke} strokeWidth={strokeWidth} strokeLinejoin="round" />
          <polygon points="50,10 88,30 50,50 12,30" fill="white" fillOpacity="0.25" stroke={stroke} strokeWidth={strokeWidth} strokeLinejoin="round" />
          <line x1="50" y1="50" x2="50" y2="92" stroke={stroke} strokeWidth={strokeWidth} />
          <line x1="88" y1="30" x2="50" y2="50" stroke={stroke} strokeWidth={strokeWidth} />
          <line x1="12" y1="30" x2="50" y2="50" stroke={stroke} strokeWidth={strokeWidth} />
        </svg>
      );
    default:
      return (
        <svg width={size} height={size} viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="35" fill={color} />
        </svg>
      );
  }
};

const COLORS_2D = [
  'from-pink-400 to-rose-500',
  'from-orange-400 to-amber-500',
  'from-blue-400 to-indigo-500',
  'from-green-400 to-emerald-500',
  'from-purple-400 to-violet-500',
  'from-teal-400 to-cyan-500',
];

const COLORS_3D = [
  'from-indigo-500 to-purple-600',
  'from-blue-500 to-cyan-500',
  'from-pink-500 to-rose-600',
  'from-amber-500 to-orange-600',
  'from-emerald-500 to-teal-600',
  'from-violet-500 to-fuchsia-600',
];

const ShapeCard: React.FC<{
  shape: ShapeInfo;
  index: number;
  onSpeak: (name: string) => void;
}> = ({ shape, index, onSpeak }) => {
  const [expanded, setExpanded] = useState(false);
  const [rotateY, setRotateY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartX = React.useRef(0);
  const startRotateY = React.useRef(0);
  const gradient = shape.shapeType === '2d' ? COLORS_2D[index % COLORS_2D.length] : COLORS_3D[index % COLORS_3D.length];

  const handleMouseDown = (e: React.MouseEvent): void => {
    if (shape.shapeType !== '3d') return;
    e.preventDefault();
    setIsDragging(true);
    dragStartX.current = e.clientX;
    startRotateY.current = rotateY;
  };

  const handleMouseMove = (e: React.MouseEvent): void => {
    if (!isDragging) return;
    const dx = e.clientX - dragStartX.current;
    setRotateY(startRotateY.current + dx * 0.8);
  };

  const handleMouseUp = (): void => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent): void => {
    if (shape.shapeType !== '3d') return;
    setIsDragging(true);
    dragStartX.current = e.touches[0].clientX;
    startRotateY.current = rotateY;
  };

  const handleTouchMove = (e: React.TouchEvent): void => {
    if (!isDragging) return;
    const dx = e.touches[0].clientX - dragStartX.current;
    setRotateY(startRotateY.current + dx * 0.8);
  };

  const handleTouchEnd = (): void => {
    setIsDragging(false);
  };

  return (
    <div className={`bg-gradient-to-br ${gradient} rounded-2xl p-5 text-white shadow-md hover:shadow-lg transition-all hover:-translate-y-1`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-bold">{shape.name}</h3>
        <button
          onClick={() => onSpeak(shape.name)}
          className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-all"
          title="朗读名称"
        >
          <Volume2 size={16} />
        </button>
      </div>

      <div
        className="flex justify-center py-4"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          perspective: shape.shapeType === '3d' ? '500px' : 'none',
          cursor: shape.shapeType === '3d' ? 'grab' : 'default',
        }}
      >
        <div
          style={{
            transform: shape.shapeType === '3d' ? `rotateY(${rotateY}deg)` : 'none',
            transition: isDragging ? 'none' : 'transform 0.3s ease-out',
            transformStyle: 'preserve-3d',
          }}
        >
          {shape.shapeType === '2d' ? (
            <Shape2DSVG shapeId={shape.id} color="rgba(255,255,255,0.9)" />
          ) : (
            <Shape3DSVG shapeId={shape.id} color="rgba(255,255,255,0.9)" />
          )}
        </div>
      </div>

      {shape.shapeType === '3d' && (
        <div className="text-center text-xs text-white/70 mb-2">
          ← 拖动旋转 360° →
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 text-xs mb-3">
        {Object.entries(shape.properties).slice(0, 4).map(([key, value]) => (
          <div key={key} className="bg-white/20 rounded-lg p-2">
            <div className="opacity-80">{key}</div>
            <div className="font-semibold text-sm">{String(value)}</div>
          </div>
        ))}
      </div>

      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between text-xs py-2 px-3 bg-white/20 rounded-lg hover:bg-white/30 transition-all"
      >
        <span>{expanded ? '收起介绍' : '了解更多'}</span>
        {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>

      {expanded && (
        <div className="mt-3 p-3 bg-white/15 rounded-lg text-sm leading-relaxed">
          {shape.description}
        </div>
      )}
    </div>
  );
};

const ShapeRecognitionView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'2d' | '3d'>('2d');
  const [shapes, setShapes] = useState<MathShapeListResponse>(FALLBACK_SHAPES);
  const [loading, setLoading] = useState(true);
  const { speak, supported } = useSpeech();

  useEffect(() => {
    let mounted = true;
    const loadShapes = async (): Promise<void> => {
      try {
        const data = await getShapes();
        if (mounted) {
          // 合并：API 数据优先，不足时用保底数据补充
          setShapes({
            shapes2d: data.shapes2d && data.shapes2d.length > 0 ? data.shapes2d : FALLBACK_SHAPES.shapes2d,
            shapes3d: data.shapes3d && data.shapes3d.length > 0 ? data.shapes3d : FALLBACK_SHAPES.shapes3d,
          });
        }
      } catch (err) {
        logger.error('获取图形数据失败，使用内置数据', err as Error);
        if (mounted) setShapes(FALLBACK_SHAPES);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    loadShapes();
    return () => { mounted = false; };
  }, []);

  const handleSpeak = (name: string): void => {
    if (!supported) return;
    speak(name, { lang: 'zh-CN', rate: 0.9 });
  };

  const activeShapes = activeTab === '2d' ? shapes.shapes2d : shapes.shapes3d;

  return (
    <div className="space-y-5">
      {/* 2D/3D 切换 */}
       <div className="glass-card p-2">
        <div className="flex gap-1">
          <button
            onClick={() => setActiveTab('2d')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all ${
                activeTab === '2d'
                  ? 'bg-gradient-to-r from-blue-400 to-indigo-500 text-white shadow-md'
                  : 'text-slate-400 hover:bg-white/10'
            }`}
          >
            <Layers size={16} />
            2D 平面图形
          </button>
          <button
            onClick={() => setActiveTab('3d')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all ${
                activeTab === '3d'
                  ? 'bg-gradient-to-r from-purple-400 to-pink-500 text-white shadow-md'
                  : 'text-slate-400 hover:bg-white/10'
            }`}
          >
            <Box size={16} />
            3D 立体图形
          </button>
        </div>
      </div>

      {/* 图形卡片网格 */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">加载中...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {activeShapes.map((shape: ShapeInfo, idx: number) => (
            <ShapeCard key={shape.id} shape={shape} index={idx} onSpeak={handleSpeak} />
          ))}
        </div>
      )}

      {/* 小提示 */}
       <div className="bg-blue-500/20 border border-blue-500/30 rounded-2xl p-4 text-sm text-blue-300">
        <p className="font-semibold mb-1">💡 学习小提示</p>
        <p>
          点击每个图形右上角的喇叭图标，可以听一听图形的名称。
          点「了解更多」查看图形的详细介绍哦～
        </p>
      </div>
    </div>
  );
};

export default ShapeRecognitionView;
