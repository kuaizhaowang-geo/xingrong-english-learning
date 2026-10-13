import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  RotateCcw,
  Maximize2,
  Minimize2,
  Layers,
  Box,
  Move,
} from 'lucide-react';
import CubeNetViewer from './CubeNetViewer';
import SectionViewer from './SectionViewer';

type Shape3DType = 'cube' | 'cuboid' | 'cylinder' | 'cone' | 'sphere' | 'prism';
type SubView = 'rotate' | 'net' | 'section';

interface ShapeInfo {
  id: Shape3DType;
  name: string;
  properties: Record<string, string>;
  grades: number[]; // 适用年级
}

const SHAPES_3D: ShapeInfo[] = [
  {
    id: 'cube',
    name: '正方体',
    properties: { 面数: '6', 棱数: '12', 顶点数: '8', 面形状: '正方形' },
    grades: [1, 2, 3, 4, 5, 6],
  },
  {
    id: 'cuboid',
    name: '长方体',
    properties: { 面数: '6', 棱数: '12', 顶点数: '8', 面形状: '长方形' },
    grades: [2, 3, 4, 5, 6],
  },
  {
    id: 'cylinder',
    name: '圆柱',
    properties: { 面数: '3', 底面: '圆形', 侧面: '曲面', 高: '两底距离' },
    grades: [3, 4, 5, 6],
  },
  {
    id: 'cone',
    name: '圆锥',
    properties: { 面数: '2', 底面: '圆形', 顶点: '1个', 侧面: '曲面' },
    grades: [4, 5, 6],
  },
  {
    id: 'sphere',
    name: '球',
    properties: { 面数: '1', 半径: 'r', 直径: '2r', 形状: '完全对称' },
    grades: [1, 2, 3, 4, 5, 6],
  },
  {
    id: 'prism',
    name: '三棱柱',
    properties: { 面数: '5', 棱数: '9', 顶点数: '6', 底面: '三角形' },
    grades: [4, 5, 6],
  },
];

const GRADES = [1, 2, 3, 4, 5, 6];

interface Shape3DViewProps {
  grade?: string;
}

// 纯 CSS 3D 立方体
const Cube3D: React.FC<{ size: number; opacity: number }> = ({ size, opacity }) => {
  const half = size / 2;
  const faceStyle: React.CSSProperties = {
    position: 'absolute',
    width: size,
    height: size,
    border: '2px solid rgba(255,255,255,0.8)',
    borderRadius: 4,
    opacity,
  };

  return (
    <div
      style={{
        position: 'relative',
        width: size,
        height: size,
        transformStyle: 'preserve-3d',
      }}
    >
      {/* 前 */}
      <div
        style={{
          ...faceStyle,
          background: 'linear-gradient(135deg, #FF8A5B, #FF6B35)',
          transform: `translateZ(${half}px)`,
        }}
      />
      {/* 后 */}
      <div
        style={{
          ...faceStyle,
          background: 'linear-gradient(135deg, #FF6B35, #E55A2B)',
          transform: `translateZ(${-half}px) rotateY(180deg)`,
        }}
      />
      {/* 右 */}
      <div
        style={{
          ...faceStyle,
          background: 'linear-gradient(135deg, #FFA07A, #FF8A5B)',
          transform: `rotateY(90deg) translateZ(${half}px)`,
        }}
      />
      {/* 左 */}
      <div
        style={{
          ...faceStyle,
          background: 'linear-gradient(135deg, #E55A2B, #CC4D23)',
          transform: `rotateY(-90deg) translateZ(${half}px)`,
        }}
      />
      {/* 上 */}
      <div
        style={{
          ...faceStyle,
          background: 'linear-gradient(135deg, #FFB899, #FFA07A)',
          transform: `rotateX(90deg) translateZ(${half}px)`,
        }}
      />
      {/* 下 */}
      <div
        style={{
          ...faceStyle,
          background: 'linear-gradient(135deg, #CC4D23, #B3441F)',
          transform: `rotateX(-90deg) translateZ(${half}px)`,
        }}
      />
    </div>
  );
};

// 长方体 3D
const Cuboid3D: React.FC<{ size: number; opacity: number }> = ({ size, opacity }) => {
  const w = size;
  const h = size * 0.7;
  const d = size * 0.5;

  const baseFace: React.CSSProperties = {
    position: 'absolute',
    border: '2px solid rgba(255,255,255,0.8)',
    borderRadius: 4,
    opacity,
  };

  return (
    <div
      style={{
        position: 'relative',
        width: w,
        height: h,
        transformStyle: 'preserve-3d',
      }}
    >
      <div
        style={{
          ...baseFace,
          width: w,
          height: h,
          background: 'linear-gradient(135deg, #667EEA, #4361EE)',
          transform: `translateZ(${d / 2}px)`,
        }}
      />
      <div
        style={{
          ...baseFace,
          width: w,
          height: h,
          background: 'linear-gradient(135deg, #4361EE, #3A56D4)',
          transform: `translateZ(${-d / 2}px) rotateY(180deg)`,
        }}
      />
      <div
        style={{
          ...baseFace,
          width: d,
          height: h,
          left: (w - d) / 2,
          background: 'linear-gradient(135deg, #8B9FF0, #667EEA)',
          transform: `rotateY(90deg) translateZ(${w / 2}px)`,
        }}
      />
      <div
        style={{
          ...baseFace,
          width: d,
          height: h,
          left: (w - d) / 2,
          background: 'linear-gradient(135deg, #3A56D4, #2F48B8)',
          transform: `rotateY(-90deg) translateZ(${w / 2}px)`,
        }}
      />
      <div
        style={{
          ...baseFace,
          width: w,
          height: d,
          top: (h - d) / 2,
          background: 'linear-gradient(135deg, #A5B4F4, #8B9FF0)',
          transform: `rotateX(90deg) translateZ(${h / 2}px)`,
        }}
      />
      <div
        style={{
          ...baseFace,
          width: w,
          height: d,
          top: (h - d) / 2,
          background: 'linear-gradient(135deg, #2F48B8, #263C9A)',
          transform: `rotateX(-90deg) translateZ(${h / 2}px)`,
        }}
      />
    </div>
  );
};

// 圆柱 3D
const Cylinder3D: React.FC<{ size: number; opacity: number }> = ({ size, opacity }) => {
  const w = size;
  const h = size * 1.1;
  const rx = w / 2;
  const ry = w * 0.18;

  return (
    <div
      style={{
        position: 'relative',
        width: w,
        height: h,
        transformStyle: 'preserve-3d',
        opacity,
      }}
    >
      {/* 侧面 - 用多个小矩形模拟曲面 */}
      {Array.from({ length: 16 }).map((_, i) => {
        const angle = (i / 16) * 360;
        const rad = (angle * Math.PI) / 180;
        const x = Math.sin(rad) * rx;
        const z = Math.cos(rad) * rx;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: '50%',
              top: ry,
              width: (2 * Math.PI * rx) / 16 + 1,
              height: h - ry * 2,
              background: `linear-gradient(180deg, #4CC9F0, #4361EE)`,
              opacity: 0.85,
              transform: `translateX(-50%) rotateY(${angle}deg) translateZ(${z}px) translateX(${x - rx}px)`,
              transformOrigin: 'center',
            }}
          />
        );
      })}
      {/* 顶椭圆 */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: w,
          height: ry * 2,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #7DD3FC, #4CC9F0)',
          border: '2px solid rgba(255,255,255,0.6)',
          transform: `rotateX(90deg) translateZ(${h / 2 - ry}px)`,
          transformOrigin: 'center',
        }}
      />
      {/* 底椭圆 */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          width: w,
          height: ry * 2,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #3A56D4, #2F48B8)',
          border: '2px solid rgba(255,255,255,0.6)',
          transform: `rotateX(-90deg) translateZ(${h / 2 - ry}px)`,
          transformOrigin: 'center',
        }}
      />
    </div>
  );
};

// 圆锥 3D
const Cone3D: React.FC<{ size: number; opacity: number }> = ({ size, opacity }) => {
  const w = size;
  const h = size * 1.2;
  const rx = w / 2;
  const ry = w * 0.18;

  return (
    <div
      style={{
        position: 'relative',
        width: w,
        height: h,
        transformStyle: 'preserve-3d',
        opacity,
      }}
    >
      {/* 侧面 - 多个三角形片 */}
      {Array.from({ length: 16 }).map((_, i) => {
        const angle = (i / 16) * 360;
        const rad = (angle * Math.PI) / 180;
        const x = Math.sin(rad) * rx;
        const z = Math.cos(rad) * rx;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: '50%',
              bottom: ry,
              width: 0,
              height: 0,
              borderLeft: `${(2 * Math.PI * rx) / 32 + 2}px solid transparent`,
              borderRight: `${(2 * Math.PI * rx) / 32 + 2}px solid transparent`,
              borderBottom: `${h - ry * 2}px solid`,
              borderBottomColor: '#F472B6',
              opacity: 0.85,
              transform: `translateX(-50%) rotateY(${angle}deg) translateZ(${z}px) translateX(${x - rx}px)`,
              transformOrigin: 'bottom center',
            }}
          />
        );
      })}
      {/* 底椭圆 */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          width: w,
          height: ry * 2,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #EC4899, #DB2777)',
          border: '2px solid rgba(255,255,255,0.6)',
          transform: `rotateX(-90deg) translateZ(${h / 2 - ry}px)`,
          transformOrigin: 'center',
        }}
      />
    </div>
  );
};

// 球 3D (用 radial-gradient 模拟，CSS 3D 做真正的球太复杂)
const Sphere3D: React.FC<{ size: number; opacity: number; rotateY: number }> = ({
  size,
  opacity,
  rotateY,
}) => {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: `radial-gradient(circle at 35% 30%, rgba(255,255,255,0.8) 0%, #22C55E 30%, #16A34A 60%, #15803D 100%)`,
        boxShadow: 'inset -10px -10px 30px rgba(0,0,0,0.3), 0 10px 30px rgba(0,0,0,0.2)',
        opacity,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* 纬度线效果 */}
      {[-2, -1, 0, 1, 2].map((i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: '50%',
            height: 1,
            background: 'rgba(255,255,255,0.2)',
            transform: `translateY(calc(${i * 15}%)) scaleY(${1 / Math.cos((i * 15 * Math.PI) / 180)})`,
            transformOrigin: 'center',
          }}
        />
      ))}
      {/* 经度线 - 跟随 rotateY */}
      {[0, 1, 2, 3].map((i) => {
        const angle = rotateY + i * 45;
        const normalized = ((angle % 360) + 360) % 360;
        const offset = Math.sin((normalized * Math.PI) / 180) * 50;
        const visibility = Math.abs(Math.cos((normalized * Math.PI) / 180));
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              width: 2,
              left: `${50 + offset}%`,
              background: 'rgba(255,255,255,0.2)',
              opacity: visibility * 0.6 + 0.2,
              transform: 'translateX(-50%)',
            }}
          />
        );
      })}
    </div>
  );
};

// 三棱柱 3D
const Prism3D: React.FC<{ size: number; opacity: number }> = ({ size, opacity }) => {
  const w = size;
  const h = size * 0.9;
  const d = size * 0.5;
  const triH = size * 0.7;

  const baseStyle: React.CSSProperties = {
    position: 'absolute',
    border: '2px solid rgba(255,255,255,0.8)',
    opacity,
  };

  return (
    <div
      style={{
        position: 'relative',
        width: w,
        height: h,
        transformStyle: 'preserve-3d',
      }}
    >
      {/* 前面 - 三角形 */}
      <div
        style={{
          ...baseStyle,
          width: 0,
          height: 0,
          left: '50%',
          bottom: 0,
          borderLeft: `${w / 2}px solid transparent`,
          borderRight: `${w / 2}px solid transparent`,
          borderBottom: `${triH}px solid #6366F1`,
          transform: `translateX(-50%) translateZ(${d / 2}px)`,
        }}
      />
      {/* 后面 - 三角形 */}
      <div
        style={{
          ...baseStyle,
          width: 0,
          height: 0,
          left: '50%',
          bottom: 0,
          borderLeft: `${w / 2}px solid transparent`,
          borderRight: `${w / 2}px solid transparent`,
          borderBottom: `${triH}px solid #6D28D9`,
          transform: `translateX(-50%) translateZ(${-d / 2}px) rotateY(180deg)`,
        }}
      />
      {/* 左面 */}
      <div
        style={{
          ...baseStyle,
          width: d,
          height: triH,
          left: 0,
          bottom: 0,
          background: 'linear-gradient(180deg, #818CF8, #6366F1)',
          transformOrigin: 'left bottom',
          transform: `rotateY(90deg) translateZ(0px)`,
        }}
      />
      {/* 右面 */}
      <div
        style={{
          ...baseStyle,
          width: d,
          height: triH,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(180deg, #6366F1, #5B21B6)',
          transformOrigin: 'right bottom',
          transform: `rotateY(-90deg) translateZ(0px)`,
        }}
      />
      {/* 底面 */}
      <div
        style={{
          ...baseStyle,
          width: w,
          height: d,
          bottom: 0,
          left: 0,
          background: 'linear-gradient(90deg, #6D28D9, #5B21B6)',
          transform: `rotateX(-90deg) translateZ(0px)`,
        }}
      />
    </div>
  );
};

const Shape3DView: React.FC<Shape3DViewProps> = ({ grade: externalGrade }) => {
  const [selectedGrade, setSelectedGrade] = useState<number>(
    externalGrade ? Number(externalGrade.replace('grade', '')) : 3,
  );
  const [selectedShape, setSelectedShape] = useState<Shape3DType>('cube');
  const [subView, setSubView] = useState<SubView>('rotate');
  const [rotateX, setRotateX] = useState(-20);
  const [rotateY, setRotateY] = useState(30);
  const [scale, setScale] = useState(1);
  const [opacity, setOpacity] = useState(0.9);
  const [viewMode, setViewMode] = useState<'3d' | '2d'>('3d');

  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });

  const availableShapes = SHAPES_3D.filter((s) =>
    s.grades.includes(selectedGrade),
  );

  const currentShape =
    SHAPES_3D.find((s) => s.id === selectedShape) ?? SHAPES_3D[0];

  useEffect(() => {
    if (!availableShapes.find((s) => s.id === selectedShape)) {
      setSelectedShape(availableShapes[0]?.id ?? 'cube');
    }
  }, [selectedGrade]);

  // 拖拽旋转
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (subView !== 'rotate' || viewMode !== '3d') return;
      isDragging.current = true;
      lastPos.current = { x: e.clientX, y: e.clientY };
    },
    [subView, viewMode],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging.current) return;
      const dx = e.clientX - lastPos.current.x;
      const dy = e.clientY - lastPos.current.y;
      setRotateY((prev) => prev + dx * 0.5);
      setRotateX((prev) => {
        const next = prev - dy * 0.5;
        return Math.max(-90, Math.min(90, next));
      });
      lastPos.current = { x: e.clientX, y: e.clientY };
    },
    [],
  );

  const handleMouseUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  // 触摸支持
  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (subView !== 'rotate' || viewMode !== '3d') return;
      const touch = e.touches[0];
      isDragging.current = true;
      lastPos.current = { x: touch.clientX, y: touch.clientY };
    },
    [subView, viewMode],
  );

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging.current) return;
    const touch = e.touches[0];
    const dx = touch.clientX - lastPos.current.x;
    const dy = touch.clientY - lastPos.current.y;
    setRotateY((prev) => prev + dx * 0.5);
    setRotateX((prev) => {
      const next = prev - dy * 0.5;
      return Math.max(-90, Math.min(90, next));
    });
    lastPos.current = { x: touch.clientX, y: touch.clientY };
  }, []);

  const handleTouchEnd = useCallback(() => {
    isDragging.current = false;
  }, []);

  const resetRotation = (): void => {
    setRotateX(-20);
    setRotateY(30);
    setScale(1);
  };

  const renderShape3D = (): React.ReactNode => {
    const size = 140 * scale;
    if (viewMode === '2d') {
      // 2D 正面视图
      return (
        <div
          style={{
            width: size,
            height: size,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {selectedShape === 'cube' && (
            <div
              style={{
                width: size * 0.7,
                height: size * 0.7,
                background: 'linear-gradient(135deg, #FF8A5B, #FF6B35)',
                borderRadius: 8,
                border: '3px solid #fff',
              }}
            />
          )}
          {selectedShape === 'cuboid' && (
            <div
              style={{
                width: size * 0.8,
                height: size * 0.5,
                background: 'linear-gradient(135deg, #667EEA, #4361EE)',
                borderRadius: 8,
                border: '3px solid #fff',
              }}
            />
          )}
          {selectedShape === 'cylinder' && (
            <div
              style={{
                width: size * 0.6,
                height: size * 0.8,
                background: 'linear-gradient(180deg, #4CC9F0, #4361EE)',
                borderRadius: size * 0.12,
                border: '3px solid #fff',
              }}
            />
          )}
          {selectedShape === 'cone' && (
            <div
              style={{
                width: 0,
                height: 0,
                borderLeft: `${size * 0.35}px solid transparent`,
                borderRight: `${size * 0.35}px solid transparent`,
                borderBottom: `${size * 0.8}px solid #F472B6`,
              }}
            />
          )}
          {selectedShape === 'sphere' && (
            <div
              style={{
                width: size * 0.8,
                height: size * 0.8,
                borderRadius: '50%',
                background:
                  'radial-gradient(circle at 35% 30%, rgba(255,255,255,0.8) 0%, #22C55E 30%, #16A34A 100%)',
              }}
            />
          )}
          {selectedShape === 'prism' && (
            <div
              style={{
                width: 0,
                height: 0,
                borderLeft: `${size * 0.4}px solid transparent`,
                borderRight: `${size * 0.4}px solid transparent`,
                borderBottom: `${size * 0.7}px solid #6366F1`,
              }}
            />
          )}
        </div>
      );
    }

    // 3D 视图
    switch (selectedShape) {
      case 'cube':
        return <Cube3D size={size} opacity={opacity} />;
      case 'cuboid':
        return <Cuboid3D size={size} opacity={opacity} />;
      case 'cylinder':
        return <Cylinder3D size={size} opacity={opacity} />;
      case 'cone':
        return <Cone3D size={size} opacity={opacity} />;
      case 'sphere':
        return <Sphere3D size={size} opacity={opacity} rotateY={rotateY} />;
      case 'prism':
        return <Prism3D size={size} opacity={opacity} />;
      default:
        return <Cube3D size={size} opacity={opacity} />;
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[180px_1fr] gap-4">
      {/* 左侧年级选择 */}
       <div className="glass-card p-4 space-y-3">
         <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
           <Layers size={16} className="text-orange-400" />
          选择年级
        </h3>
        <div className="space-y-1">
          {GRADES.map((g) => (
            <button
              key={g}
              onClick={() => setSelectedGrade(g)}
              className={`w-full py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                    selectedGrade === g
                      ? 'bg-gradient-to-r from-orange-400 to-pink-500 text-white shadow-sm'
                      : 'bg-white/10 text-slate-300 hover:bg-white/20'
              }`}
            >
              {g} 年级
            </button>
          ))}
        </div>
         <div className="pt-3 border-t border-white/10">
           <h3 className="text-sm font-semibold text-slate-200 mb-2 flex items-center gap-2">
             <Box size={16} className="text-blue-400" />
            图形列表
          </h3>
          <div className="space-y-1">
            {availableShapes.map((shape) => (
              <button
                key={shape.id}
                onClick={() => setSelectedShape(shape.id)}
                className={`w-full py-2 px-3 rounded-lg text-sm font-medium transition-all text-left ${
                    selectedShape === shape.id
                      ? 'bg-blue-500/30 text-blue-300 border border-blue-500/30'
                      : 'text-slate-300 hover:bg-white/10'
                }`}
              >
                {shape.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 右侧主内容 */}
      <div className="space-y-4">
        {/* 子视图切换 */}
         <div className="glass-card p-2">
          <div className="flex gap-1 flex-wrap">
            {[
              { value: 'rotate', label: '旋转观察', icon: <Move size={16} /> },
              { value: 'net', label: '展开图', icon: <Layers size={16} /> },
              { value: 'section', label: '截面观察', icon: <Box size={16} /> },
            ].map((tab) => (
              <button
                key={tab.value}
                onClick={() => setSubView(tab.value as SubView)}
                className={`flex-1 min-w-[100px] flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  subView === tab.value
                    ? 'bg-gradient-to-r from-purple-400 to-pink-500 text-white shadow-md'
                    : 'text-slate-400 hover:bg-white/10'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* 旋转观察视图 */}
        {subView === 'rotate' && (
           <div className="glass-card space-y-5">
             {/* 2D/3D 切换 */}
             <div className="flex items-center justify-between">
               <h2 className="text-lg font-bold text-white">
                {currentShape.name}
              </h2>
               <div className="flex gap-1 bg-white/10 rounded-xl p-1">
                <button
                  onClick={() => setViewMode('3d')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                       viewMode === '3d'
                         ? 'bg-white/20 text-orange-400'
                         : 'text-slate-400'
                  }`}
                >
                  3D 立体
                </button>
                <button
                  onClick={() => setViewMode('2d')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                       viewMode === '2d'
                         ? 'bg-white/20 text-blue-400'
                         : 'text-slate-400'
                  }`}
                >
                  2D 平面
                </button>
              </div>
            </div>

            {/* 3D 舞台 */}
            <div
              ref={containerRef}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              className="relative h-72 flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl overflow-hidden select-none"
              style={{
                perspective: '800px',
                cursor:
                  subView === 'rotate' && viewMode === '3d' ? 'grab' : 'default',
              }}
            >
              {/* 网格背景 */}
              <div
                className="absolute inset-0 opacity-30"
                style={{
                  backgroundImage:
                    'linear-gradient(rgba(100,116,139,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(100,116,139,0.1) 1px, transparent 1px)',
                  backgroundSize: '30px 30px',
                }}
              />

              {/* 3D 图形 */}
              <div
                style={{
                  transform:
                    viewMode === '3d'
                      ? `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`
                      : 'none',
                  transformStyle: 'preserve-3d',
                  transition: isDragging.current ? 'none' : 'transform 0.3s ease-out',
                }}
              >
                {renderShape3D()}
              </div>

              {/* 提示文字 */}
              {viewMode === '3d' && (
                 <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-xs text-slate-400 bg-white/10 border border-white/20 px-3 py-1 rounded-full">
                  拖拽旋转 · 观察不同角度
                </div>
              )}
            </div>

            {/* 属性展示 */}
            <div className="grid grid-cols-4 gap-2">
              {Object.entries(currentShape.properties).map(([key, value]) => (
                <div
                  key={key}
                  className="bg-gradient-to-br from-orange-50 to-pink-50 rounded-xl p-3 text-center"
                >
                   <div className="text-xs text-slate-400">{key}</div>
                   <div className="text-sm font-bold text-white mt-1">
                    {value}
                  </div>
                </div>
              ))}
            </div>

            {/* 控制滑块 */}
             <div className="space-y-3 pt-2 border-t border-white/10">
              <div className="flex items-center gap-3">
                 <span className="text-xs text-slate-400 w-16">大小</span>
                <input
                  type="range"
                  min="0.6"
                  max="1.6"
                  step="0.1"
                  value={scale}
                  onChange={(e) => setScale(Number(e.target.value))}
                   className="flex-1 h-2 bg-white/10 rounded-full appearance-none accent-orange-400"
                />
                <span className="text-xs text-slate-400 w-10 text-right">
                  {Math.round(scale * 100)}%
                </span>
              </div>

              {viewMode === '3d' && (
                <>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-400 w-16">水平旋转</span>
                    <input
                      type="range"
                      min="-180"
                      max="180"
                      step="1"
                      value={rotateY}
                      onChange={(e) => setRotateY(Number(e.target.value))}
                      className="flex-1 h-2 bg-white/10 rounded-full appearance-none accent-blue-400"
                    />
                    <span className="text-xs text-gray-500 w-10 text-right">
                      {Math.round(rotateY)}°
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-400 w-16">垂直旋转</span>
                    <input
                      type="range"
                      min="-90"
                      max="90"
                      step="1"
                      value={rotateX}
                      onChange={(e) => setRotateX(Number(e.target.value))}
                       className="flex-1 h-2 bg-white/10 rounded-full appearance-none accent-purple-400"
                    />
                    <span className="text-xs text-gray-500 w-10 text-right">
                      {Math.round(rotateX)}°
                    </span>
                  </div>
                </>
              )}

              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-400 w-16">透明度</span>
                <input
                  type="range"
                  min="0.3"
                  max="1"
                  step="0.1"
                  value={opacity}
                  onChange={(e) => setOpacity(Number(e.target.value))}
                  className="flex-1 h-2 bg-white/10 rounded-full appearance-none accent-pink-400"
                />
                <span className="text-xs text-gray-500 w-10 text-right">
                  {Math.round(opacity * 100)}%
                </span>
              </div>
            </div>

            {/* 操作按钮 */}
            <div className="flex gap-2">
              <button
                onClick={resetRotation}
                 className="flex-1 py-2.5 bg-white/10 text-slate-200 rounded-xl text-sm font-medium hover:bg-white/20 transition-all flex items-center justify-center gap-2"
              >
                <RotateCcw size={16} />
                重置视角
              </button>
              <button
                onClick={() => setScale((s) => (s > 1 ? 1 : 1.3))}
                 className="flex-1 py-2.5 bg-blue-500/20 text-blue-300 rounded-xl text-sm font-medium hover:bg-blue-500/30 transition-all flex items-center justify-center gap-2"
              >
                {scale > 1 ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                {scale > 1 ? '缩小' : '放大'}
              </button>
            </div>
          </div>
        )}

        {/* 展开图视图 */}
        {subView === 'net' && (
          <CubeNetViewer grade={selectedGrade} />
        )}

        {/* 截面观察视图 */}
        {subView === 'section' && (
          <SectionViewer grade={selectedGrade} />
        )}
      </div>
    </div>
  );
};

export default Shape3DView;
