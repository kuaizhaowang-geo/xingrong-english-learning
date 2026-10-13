import React, { useState, useEffect, useCallback } from 'react';
import {
  Check,
  X,
  RotateCcw,
  Trophy,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Star,
  Lightbulb,
} from 'lucide-react';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { getPuzzleList, getPuzzleDetail } from '@client/src/api/math-practice';
import type {
  MathPuzzleListItem,
  ShapePuzzleItem,
  ShapePuzzlePiece,
} from '@shared/api.interface';

// 已知 SVG 图形名（图形组合型拼图）
const KNOWN_SHAPES = new Set(['square', 'triangle', 'circle', 'rectangle']);

// 概念辨析型文字卡片渐变色
const TEXT_CARD_GRADIENTS = [
  'from-orange-400 to-pink-500',
  'from-blue-400 to-indigo-500',
  'from-purple-400 to-violet-500',
  'from-emerald-400 to-teal-500',
  'from-amber-400 to-orange-500',
  'from-rose-400 to-pink-500',
  'from-cyan-400 to-blue-500',
  'from-lime-400 to-green-500',
];

// 内置保底拼图数据
const FALLBACK_PUZZLES: ShapePuzzleItem[] = [
  {
    id: 'puzzle-cube-1',
    topicId: '',
    textbookId: '',
    unitId: '',
    title: '正方体展开图',
    puzzleOrder: 1,
    puzzleType: 'net',
    targetShape: '正方体',
    description: '把下面的 6 个正方形拼起来，组成一个正方体！',
    difficulty: 2,
    pieces: [
      { id: 'p1', shape: 'square', label: '前', correct: true },
      { id: 'p2', shape: 'square', label: '后', correct: true },
      { id: 'p3', shape: 'square', label: '左', correct: true },
      { id: 'p4', shape: 'square', label: '右', correct: true },
      { id: 'p5', shape: 'square', label: '上', correct: true },
      { id: 'p6', shape: 'square', label: '下', correct: true },
      { id: 'p7', shape: 'triangle', label: '三角', correct: false },
      { id: 'p8', shape: 'circle', label: '圆形', correct: false },
    ],
  },
  {
    id: 'puzzle-house-1',
    topicId: '',
    textbookId: '',
    unitId: '',
    title: '搭一座小房子',
    puzzleOrder: 2,
    puzzleType: 'compose',
    targetShape: '房子',
    description: '用三角形和长方形拼出一座漂亮的小房子！',
    difficulty: 1,
    pieces: [
      { id: 'p1', shape: 'triangle', label: '屋顶', correct: true },
      { id: 'p2', shape: 'rectangle', label: '墙身', correct: true },
      { id: 'p3', shape: 'square', label: '窗户', correct: true },
      { id: 'p4', shape: 'rectangle', label: '门', correct: true },
      { id: 'p5', shape: 'circle', label: '太阳', correct: false },
      { id: 'p6', shape: 'square', label: '草地', correct: false },
    ],
  },
  {
    id: 'puzzle-rocket-1',
    topicId: '',
    textbookId: '',
    unitId: '',
    title: '拼一艘小火箭',
    puzzleOrder: 3,
    puzzleType: 'compose',
    targetShape: '火箭',
    description: '用三角形和长方形拼出一艘飞向太空的火箭！',
    difficulty: 3,
    pieces: [
      { id: 'p1', shape: 'triangle', label: '箭头', correct: true },
      { id: 'p2', shape: 'rectangle', label: '箭身', correct: true },
      { id: 'p3', shape: 'triangle', label: '左翼', correct: true },
      { id: 'p4', shape: 'triangle', label: '右翼', correct: true },
      { id: 'p5', shape: 'circle', label: '舷窗', correct: true },
      { id: 'p6', shape: 'square', label: '底座', correct: false },
      { id: 'p7', shape: 'circle', label: '星球', correct: false },
    ],
  },
  {
    id: 'puzzle-cuboid-1',
    topicId: '',
    textbookId: '',
    unitId: '',
    title: '长方体展开图',
    puzzleOrder: 4,
    puzzleType: 'net',
    targetShape: '长方体',
    description: '用 6 个长方形拼出一个长方体的展开图！',
    difficulty: 3,
    pieces: [
      { id: 'p1', shape: 'rectangle', label: '前', correct: true },
      { id: 'p2', shape: 'rectangle', label: '后', correct: true },
      { id: 'p3', shape: 'rectangle', label: '左', correct: true },
      { id: 'p4', shape: 'rectangle', label: '右', correct: true },
      { id: 'p5', shape: 'rectangle', label: '上', correct: true },
      { id: 'p6', shape: 'rectangle', label: '下', correct: true },
      { id: 'p7', shape: 'triangle', label: '三角片', correct: false },
    ],
  },
  {
    id: 'puzzle-tower-1',
    topicId: '',
    textbookId: '',
    unitId: '',
    title: '拼一座高塔',
    puzzleOrder: 5,
    puzzleType: 'compose',
    targetShape: '高塔',
    description: '用长方形和三角形拼出一座高高的塔！',
    difficulty: 2,
    pieces: [
      { id: 'p1', shape: 'rectangle', label: '塔身', correct: true },
      { id: 'p2', shape: 'rectangle', label: '塔基', correct: true },
      { id: 'p3', shape: 'triangle', label: '塔尖', correct: true },
      { id: 'p4', shape: 'square', label: '窗户', correct: true },
      { id: 'p5', shape: 'square', label: '门', correct: true },
      { id: 'p6', shape: 'circle', label: '云朵', correct: false },
      { id: 'p7', shape: 'circle', label: '太阳', correct: false },
    ],
  },
  {
    id: 'puzzle-fish-1',
    topicId: '',
    textbookId: '',
    unitId: '',
    title: '拼一条小鱼',
    puzzleOrder: 6,
    puzzleType: 'compose',
    targetShape: '小鱼',
    description: '用三角形和圆形拼出一条可爱的小鱼！',
    difficulty: 2,
    pieces: [
      { id: 'p1', shape: 'triangle', label: '鱼身', correct: true },
      { id: 'p2', shape: 'triangle', label: '尾巴', correct: true },
      { id: 'p3', shape: 'circle', label: '眼睛', correct: true },
      { id: 'p4', shape: 'triangle', label: '鱼鳍', correct: true },
      { id: 'p5', shape: 'square', label: '方块', correct: false },
      { id: 'p6', shape: 'rectangle', label: '长块', correct: false },
    ],
  },
];

interface PlacedPiece {
  pieceId: string;
  slotIndex: number;
}

const ShapePieceSVG: React.FC<{
  shape: string;
  color: string;
  label: string;
  size?: number;
  index?: number;
}> = ({ shape, color, label, size = 60, index = 0 }) => {
  // 概念辨析型：shape 不是已知图形名，渲染为文字卡片
  if (!KNOWN_SHAPES.has(shape)) {
    const gradient = TEXT_CARD_GRADIENTS[index % TEXT_CARD_GRADIENTS.length];
    return (
      <div
        className={`flex flex-col items-center justify-center rounded-xl bg-gradient-to-br ${gradient} text-white p-1.5 shadow-md`}
        style={{ width: size, height: size }}
      >
        <span className="text-sm font-bold leading-tight text-center">{label}</span>
        <span className="text-[10px] opacity-80 mt-1 leading-tight text-center line-clamp-2">
          {shape}
        </span>
      </div>
    );
  }

  const stroke = '#fff';
  const sw = 2;

  const renderShape = (): React.ReactNode => {
    switch (shape) {
      case 'square':
        return <rect x="8" y="8" width="44" height="44" rx="4" fill={color} stroke={stroke} strokeWidth={sw} />;
      case 'rectangle':
        return <rect x="4" y="14" width="52" height="32" rx="4" fill={color} stroke={stroke} strokeWidth={sw} />;
      case 'triangle':
        return <polygon points="30,6 56,52 4,52" fill={color} stroke={stroke} strokeWidth={sw} strokeLinejoin="round" />;
      case 'circle':
        return <circle cx="30" cy="30" r="24" fill={color} stroke={stroke} strokeWidth={sw} />;
      default:
        return <rect x="8" y="8" width="44" height="44" fill={color} />;
    }
  };

  return (
    <div className="flex flex-col items-center gap-1" style={{ width: size }}>
      <svg width={size} height={size} viewBox="0 0 60 60">
        {renderShape()}
      </svg>
       <span className="text-xs text-slate-400 font-medium">{label}</span>
    </div>
  );
};

interface ShapePuzzleViewProps {
  textbookId: string;
  unitId: string;
  difficulty: number;
  grade: string;
}

const ShapePuzzleView: React.FC<ShapePuzzleViewProps> = ({
  textbookId,
  unitId,
  difficulty,
}) => {
  const [puzzleList, setPuzzleList] = useState<MathPuzzleListItem[]>([]);
  const [currentPuzzle, setCurrentPuzzle] = useState<ShapePuzzleItem | null>(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [placedPieces, setPlacedPieces] = useState<PlacedPiece[]>([]);
  const [availablePieces, setAvailablePieces] = useState<ShapePuzzlePiece[]>([]);
  const [result, setResult] = useState<'correct' | 'wrong' | null>(null);
  const [score, setScore] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [celebrate, setCelebrate] = useState(false);
  const [listPage, setListPage] = useState(0);
  const PUZZLES_PER_PAGE = 10;

  // 加载拼图列表
  useEffect(() => {
    let mounted = true;
    const loadList = async (): Promise<void> => {
      setLoading(true);
      try {
        const data = await getPuzzleList({ textbookId, unitId, difficulty });
        if (mounted) {
          if (data && data.length > 0) {
            setPuzzleList(data);
          } else {
            // 使用内置数据
            setPuzzleList(FALLBACK_PUZZLES.map((p) => ({
              id: p.id,
              title: p.title,
              targetShape: p.targetShape,
              difficulty: p.difficulty,
              description: p.description,
            })));
          }
          setListPage(0);
          setCurrentIdx(0);
          setCurrentPuzzle(null);
        }
      } catch (err) {
        logger.error('获取拼图列表失败', err as Error);
        if (mounted) {
          setPuzzleList(FALLBACK_PUZZLES.map((p) => ({
            id: p.id,
            title: p.title,
            targetShape: p.targetShape,
            difficulty: p.difficulty,
            description: p.description,
          })));
          setListPage(0);
          setCurrentIdx(0);
          setCurrentPuzzle(null);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };
    loadList();
  }, [textbookId, unitId, difficulty]);

  // 加载当前拼图详情
  const loadPuzzle = useCallback(async (puzzleId: string) => {
    setLoading(true);
    setPlacedPieces([]);
    setResult(null);
    setShowHint(false);
    setCelebrate(false);

    try {
      const detail = await getPuzzleDetail(puzzleId);
      setCurrentPuzzle(detail);
      setAvailablePieces([...detail.pieces].sort(() => Math.random() - 0.5));
    } catch (err) {
      logger.error('获取拼图详情失败，使用内置数据', err as Error);
      const fallback = FALLBACK_PUZZLES.find((p) => p.id === puzzleId);
      if (fallback) {
        setCurrentPuzzle(fallback);
        setAvailablePieces([...fallback.pieces].sort(() => Math.random() - 0.5));
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // 当列表加载完成后，默认加载第一题
  useEffect(() => {
    if (puzzleList.length > 0 && !currentPuzzle) {
      loadPuzzle(puzzleList[0].id);
    }
  }, [puzzleList, currentPuzzle, loadPuzzle]);

  // 正确答案的数量（correct=true 的块数）
  const correctPieceCount = currentPuzzle?.pieces.filter((p) => p.correct).length ?? 0;

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, piece: ShapePuzzlePiece): void => {
    e.dataTransfer.setData('pieceId', piece.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, slotIndex: number): void => {
    e.preventDefault();
    const pieceId = e.dataTransfer.getData('pieceId');
    if (!pieceId || result) return;

    // 如果该 slot 已经有块，把原来的放回可用区
    setPlacedPieces((prev) => {
      const filtered = prev.filter((p) => p.slotIndex !== slotIndex);
      return [...filtered, { pieceId, slotIndex }];
    });

    // 从可用区移除
    setAvailablePieces((prev) => prev.filter((p) => p.id !== pieceId));
  };

  // 把拼图块从目标区拖回可用区
  const handleReturnPiece = (pieceId: string): void => {
    if (result) return;
    const piece = currentPuzzle?.pieces.find((p) => p.id === pieceId);
    if (!piece) return;
    setPlacedPieces((prev) => prev.filter((p) => p.pieceId !== pieceId));
    setAvailablePieces((prev) => [...prev, piece]);
  };

  const checkAnswer = (): void => {
    if (!currentPuzzle || result) return;

    const placedIds = placedPieces.map((p) => p.pieceId);
    const placedCorrect = placedIds.filter((id) => {
      const piece = currentPuzzle.pieces.find((p) => p.id === id);
      return piece?.correct;
    }).length;

    // 所有 correct 的块都被放置，且没有放置错误的块
    const allCorrectPlaced = placedCorrect === correctPieceCount;
    const noWrong = placedIds.length === placedCorrect;

    const isCorrect = allCorrectPlaced && noWrong && placedIds.length === correctPieceCount;

    setResult(isCorrect ? 'correct' : 'wrong');

    if (isCorrect) {
      const earnedScore = currentPuzzle.difficulty * 50 + 50;
      setScore((s) => s + earnedScore);
      setCelebrate(true);
      setTimeout(() => setCelebrate(false), 800);
    }
  };

  const resetPuzzle = (): void => {
    if (!currentPuzzle) return;
    setPlacedPieces([]);
    setAvailablePieces([...currentPuzzle.pieces].sort(() => Math.random() - 0.5));
    setResult(null);
    setShowHint(false);
  };

  const goToPuzzle = (index: number): void => {
    if (index < 0 || index >= puzzleList.length) return;
    setCurrentIdx(index);
    loadPuzzle(puzzleList[index].id);
  };

  const PIECE_COLORS: Record<string, string> = {
    square: '#FF6B35',
    rectangle: '#4361EE',
    triangle: '#2EC4B6',
    circle: '#F72585',
  };

  const getPieceColor = (shape: string): string => {
    return PIECE_COLORS[shape] || '#9B59B6';
  };

  const getPlacedPiece = (slotIndex: number): ShapePuzzlePiece | undefined => {
    const placed = placedPieces.find((p) => p.slotIndex === slotIndex);
    if (!placed) return undefined;
    return currentPuzzle?.pieces.find((p) => p.id === placed.pieceId);
  };

  if (loading && puzzleList.length === 0) {
    return (
      <div className="glass-card p-12 text-center text-slate-400">
        加载中...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 顶部：题目切换器 */}
      <div className="glass-card p-4">
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={() => goToPuzzle(currentIdx - 1)}
            disabled={currentIdx === 0}
             className="p-2 rounded-lg bg-white/10 text-slate-300 hover:bg-white/20 disabled:opacity-30 transition-all"
          >
            <ChevronLeft size={18} />
          </button>
          <div className="text-center">
            <div className="text-sm text-slate-400">第 {currentIdx + 1} / {puzzleList.length} 题</div>
            <h3 className="text-lg font-bold text-white">
              {currentPuzzle?.title || puzzleList[currentIdx]?.title}
            </h3>
            <div className="flex items-center justify-center gap-1 mt-1">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star
                  key={i}
                  size={14}
                  className={(currentPuzzle?.difficulty ?? 1) >= i ? 'text-yellow-400' : 'text-gray-200'}
                  fill={(currentPuzzle?.difficulty ?? 1) >= i ? 'currentColor' : 'none'}
                />
              ))}
            </div>
          </div>
          <button
            onClick={() => goToPuzzle(currentIdx + 1)}
            disabled={currentIdx >= puzzleList.length - 1}
             className="p-2 rounded-lg bg-white/10 text-slate-300 hover:bg-white/20 disabled:opacity-30 transition-all"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm">
             <Trophy size={16} className="text-yellow-400" />
             <span className="font-semibold text-yellow-400">{score} 分</span>
          </div>
           <div className="text-sm text-slate-400">
             目标：拼出 <span className="font-semibold text-blue-400">{currentPuzzle?.targetShape}</span>
          </div>
        </div>
      </div>

      {/* 题目说明 */}
       <div className="bg-gradient-to-r from-blue-500/20 to-indigo-500/20 rounded-2xl p-4 border border-blue-500/30">
         <p className="text-sm text-blue-300">
          👆 <span className="font-semibold">任务：</span>
          {currentPuzzle?.description || puzzleList[currentIdx]?.description}
        </p>
        <button
           onClick={() => setShowHint(!showHint)}
           className="mt-2 text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
        >
          <Lightbulb size={12} />
          {showHint ? '收起提示' : '需要提示？'}
        </button>
        {showHint && (
           <p className="mt-2 text-xs text-blue-300 bg-white/10 border border-white/10 rounded-lg p-2">
            💡 提示：你只需要放 <span className="font-bold">{correctPieceCount}</span> 块正确的拼图块，
            多余的图形块是干扰项哦～
          </p>
        )}
      </div>

      {/* 主游戏区：左侧可用块 + 右侧目标区 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* 左侧：可用拼图块 */}
        <div className="glass-card p-4">
           <h4 className="text-sm font-semibold text-slate-200 mb-3">🧩 可用拼图块</h4>
          <div className="grid grid-cols-3 gap-3 min-h-[200px]">
            {availablePieces.map((piece, idx) => (
              <div
                key={piece.id}
                draggable={!result}
                onDragStart={(e) => handleDragStart(e, piece)}
                 className={`p-2 bg-white/5 rounded-xl border-2 border-dashed border-white/20 cursor-grab active:cursor-grabbing hover:border-blue-400/60 hover:bg-blue-500/20 transition-all ${
                  result ? 'opacity-50 cursor-default' : ''
                }`}
              >
                <ShapePieceSVG
                  shape={piece.shape}
                  color={getPieceColor(piece.shape)}
                  label={piece.label}
                  size={60}
                  index={idx}
                />
              </div>
            ))}
            {availablePieces.length === 0 && (
               <div className="col-span-3 flex items-center justify-center text-slate-500 text-sm">
                已全部拖出
              </div>
            )}
          </div>
        </div>

        {/* 右侧：目标区 */}
         <div className="lg:col-span-2 glass-card p-4">
           <h4 className="text-sm font-semibold text-slate-200 mb-3">🎯 拼图目标区</h4>

          {/* 虚线目标框 + 插槽 */}
          <div
             className={`relative border-4 border-dashed rounded-2xl p-6 min-h-[280px] transition-all ${
               result === 'correct'
                 ? 'border-green-500/40 bg-green-500/15'
                 : result === 'wrong'
                   ? 'border-red-500/40 bg-red-500/15'
                   : 'border-blue-500/30 bg-blue-500/10'
             }`}
            onDragOver={handleDragOver}
          >
            {/* 目标形状轮廓（虚线提示） */}
            <div className="absolute inset-6 flex items-center justify-center opacity-10 pointer-events-none">
              <div className="text-9xl font-black text-blue-300">
                {currentPuzzle?.targetShape?.charAt(0) || '?'}
              </div>
            </div>

            {/* 插槽网格 */}
            <div className="relative z-10 grid grid-cols-4 gap-3">
              {Array.from({ length: Math.max(correctPieceCount, 6) }).map((_, idx) => {
                const piece = getPlacedPiece(idx);
                return (
                  <div
                    key={idx}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, idx)}
                    className={`aspect-square rounded-xl border-2 border-dashed flex items-center justify-center transition-all ${
                       piece
                         ? 'border-transparent bg-white/10 shadow-md'
                         : 'border-white/20 hover:border-blue-400 hover:bg-blue-500/10'
                    }`}
                  >
                    {piece ? (
                      <div
                        onClick={() => handleReturnPiece(piece.id)}
                        className="cursor-pointer hover:scale-110 transition-transform"
                        title="点击移回可用区"
                      >
                        <ShapePieceSVG
                          shape={piece.shape}
                          color={getPieceColor(piece.shape)}
                          label={piece.label}
                          size={56}
                          index={idx}
                        />
                      </div>
                    ) : (
                      <span className="text-xs text-slate-500">拖到这里</span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* 庆祝动画 */}
            {celebrate && (
              <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
                {Array.from({ length: 20 }).map((_, i) => (
                  <div
                    key={i}
                    className="absolute text-2xl animate-bounce"
                    style={{
                      left: `${Math.random() * 100}%`,
                      top: `${Math.random() * 100}%`,
                      animationDelay: `${Math.random() * 0.5}s`,
                      animationDuration: `${0.8 + Math.random() * 0.5}s`,
                    }}
                  >
                    {['⭐', '🌟', '✨', '🎉', '🎊'][i % 5]}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 结果反馈 */}
          {result && (
             <div className={`mt-4 p-4 rounded-xl flex items-center gap-3 border ${
               result === 'correct' ? 'bg-green-500/20 border-green-500/30 text-green-300' : 'bg-red-500/20 border-red-500/30 text-red-300'
             }`}>
              {result === 'correct' ? (
                <>
                   <Sparkles size={24} className="text-green-400" />
                  <div>
                    <div className="font-bold">太棒了！拼对了！</div>
                    <div className="text-sm opacity-80">
                      获得 {currentPuzzle ? currentPuzzle.difficulty * 50 + 50 : 0} 分
                    </div>
                  </div>
                </>
              ) : (
                <>
                   <X size={24} className="text-red-400" />
                  <div>
                    <div className="font-bold">还差一点哦～</div>
                    <div className="text-sm opacity-80">
                      再试试调整一下拼图块的组合吧！
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* 操作按钮 */}
          <div className="flex gap-3 mt-4">
            <button
              onClick={resetPuzzle}
               className="flex-1 py-3 bg-white/10 text-slate-200 rounded-xl font-semibold hover:bg-white/20 transition-all flex items-center justify-center gap-2"
            >
              <RotateCcw size={18} />
              重置
            </button>
            <button
              onClick={checkAnswer}
              disabled={result !== null || placedPieces.length === 0}
              className="flex-1 py-3 bg-gradient-to-r from-green-400 to-emerald-500 text-white rounded-xl font-semibold shadow-md hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Check size={18} />
              检验拼合
            </button>
          </div>
        </div>
      </div>

      {/* 底部：题目标签栏（快速切换 + 分页） */}
       <div className="glass-card p-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setListPage((p) => Math.max(0, p - 1))}
            disabled={listPage === 0}
             className="flex-shrink-0 p-2 rounded-lg bg-white/10 text-slate-300 hover:bg-white/20 disabled:opacity-30 transition-all"
          >
            <ChevronLeft size={18} />
          </button>
          <div className="flex-1 flex gap-2 overflow-x-auto">
            {puzzleList
              .slice(listPage * PUZZLES_PER_PAGE, (listPage + 1) * PUZZLES_PER_PAGE)
              .map((puzzle, idx) => {
                const globalIdx = listPage * PUZZLES_PER_PAGE + idx;
                return (
                  <button
                    key={puzzle.id}
                    onClick={() => goToPuzzle(globalIdx)}
                    className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                      globalIdx === currentIdx
                         ? 'bg-gradient-to-r from-emerald-400 to-teal-500 text-white shadow-md'
                         : 'bg-white/10 text-slate-300 hover:bg-white/20'
                    }`}
                  >
                    {globalIdx + 1}. {puzzle.title}
                  </button>
                );
              })}
          </div>
          <button
            onClick={() => setListPage((p) => Math.min(Math.ceil(puzzleList.length / PUZZLES_PER_PAGE) - 1, p + 1))}
            disabled={listPage >= Math.ceil(puzzleList.length / PUZZLES_PER_PAGE) - 1}
             className="flex-shrink-0 p-2 rounded-lg bg-white/10 text-slate-300 hover:bg-white/20 disabled:opacity-30 transition-all"
          >
            <ChevronRight size={18} />
          </button>
        </div>
         <div className="text-center text-xs text-slate-500 mt-2">
          第 {listPage + 1} / {Math.max(1, Math.ceil(puzzleList.length / PUZZLES_PER_PAGE))} 页 · 共 {puzzleList.length} 题
        </div>
      </div>
    </div>
  );
};

export default ShapePuzzleView;
