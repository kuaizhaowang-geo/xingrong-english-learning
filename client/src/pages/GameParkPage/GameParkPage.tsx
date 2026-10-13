import React, { useState } from 'react';
import { Trophy, History, Gamepad2, Sparkles, ArrowRight, Star, Zap } from 'lucide-react';

import MathBattleGame from './components/MathBattleGame';
import WordPKGame from './components/WordPKGame';
import PoetryChainGame from './components/PoetryChainGame';
import WhackMoleGame from './components/WhackMoleGame';
import WordMatchGame from './components/WordMatchGame';
import WordRunnerGame from './components/WordRunnerGame';
import WordTetrisGame from './components/WordTetrisGame';
import WordShootingGame from './components/WordShootingGame';
import GameRecordList from './components/GameRecordList';
import GameRanking from './components/GameRanking';

type GameId =
  | 'math_battle'
  | 'word_pk'
  | 'poetry_chain'
  | 'whack_mole'
  | 'word_match'
  | 'word_runner'
  | 'word_tetris'
  | 'word_shooting'
  | null;
type TabId = 'records' | 'ranking';

interface GameCard {
  id: Exclude<GameId, null>;
  title: string;
  description: string;
  icon: string;
  gradient: string;
  bgGradient: string;
  borderColor: string;
  textColor: string;
  tag: string;
}

const ENGLISH_GAMES: GameCard[] = [
  {
    id: 'whack_mole' as const,
    title: '单词打地鼠',
    description: '快速击中目标单词，锻炼反应力！',
    icon: '🐹',
    gradient: 'from-yellow-400 to-orange-500',
    bgGradient: 'bg-gradient-to-br from-yellow-50 to-orange-50',
    borderColor: 'border-yellow-200',
    textColor: 'text-yellow-600',
    tag: '反应力',
  },
  {
    id: 'word_match' as const,
    title: '单词消消乐',
    description: '翻牌配对，记忆单词释义！',
    icon: '🃏',
    gradient: 'from-pink-400 to-purple-500',
    bgGradient: 'bg-gradient-to-br from-pink-50 to-purple-50',
    borderColor: 'border-pink-200',
    textColor: 'text-pink-600',
    tag: '记忆力',
  },
  {
    id: 'word_runner' as const,
    title: '单词跑酷',
    description: '奔跑中挑战单词，速度与激情！',
    icon: '🏃',
    gradient: 'from-cyan-400 to-blue-500',
    bgGradient: 'bg-gradient-to-br from-cyan-50 to-blue-50',
    borderColor: 'border-cyan-200',
    textColor: 'text-cyan-600',
    tag: '速度挑战',
  },
  {
    id: 'word_tetris' as const,
    title: '单词方块',
    description: '字母下落拼单词，消除大作战！',
    icon: '🧱',
    gradient: 'from-violet-400 to-purple-600',
    bgGradient: 'bg-gradient-to-br from-violet-50 to-purple-50',
    borderColor: 'border-violet-200',
    textColor: 'text-violet-600',
    tag: '拼词挑战',
  },
  {
    id: 'word_shooting' as const,
    title: '听力射击',
    description: '听音辨词，精准射击目标气球！',
    icon: '🎯',
    gradient: 'from-rose-400 to-red-500',
    bgGradient: 'bg-gradient-to-br from-rose-50 to-red-50',
    borderColor: 'border-rose-200',
    textColor: 'text-rose-600',
    tag: '听力训练',
  },
];

const OTHER_GAMES: GameCard[] = [
  {
    id: 'math_battle' as const,
    title: '口算比拼',
    description: '限时速算挑战，越玩越聪明！',
    icon: '🧮',
    gradient: 'from-blue-500 to-indigo-600',
    bgGradient: 'bg-gradient-to-br from-blue-50 to-indigo-50',
    borderColor: 'border-blue-200',
    textColor: 'text-blue-600',
    tag: '思维训练',
  },
  {
    id: 'word_pk' as const,
    title: '单词PK',
    description: '英文单词大作战，词汇量UP！',
    icon: '📝',
    gradient: 'from-orange-400 to-red-500',
    bgGradient: 'bg-gradient-to-br from-orange-50 to-red-50',
    borderColor: 'border-orange-200',
    textColor: 'text-orange-600',
    tag: '英语学习',
  },
  {
    id: 'poetry_chain' as const,
    title: '古诗接龙',
    description: '上下句古诗接龙，领略诗词之美！',
    icon: '🏮',
    gradient: 'from-red-500 to-pink-600',
    bgGradient: 'bg-gradient-to-br from-red-50 to-pink-50',
    borderColor: 'border-red-200',
    textColor: 'text-red-600',
    tag: '语文积累',
  },
];

const GameParkPage: React.FC = () => {
  const [activeGame, setActiveGame] = useState<GameId>(null);
  const [activeTab, setActiveTab] = useState<TabId>('records');

  const handleStartGame = (gameId: GameId): void => {
    setActiveGame(gameId);
  };

  const handleBack = (): void => {
    setActiveGame(null);
  };

  if (activeGame === 'math_battle') {
    return <MathBattleGame onBack={handleBack} />;
  }
  if (activeGame === 'word_pk') {
    return <WordPKGame onBack={handleBack} />;
  }
  if (activeGame === 'poetry_chain') {
    return <PoetryChainGame onBack={handleBack} />;
  }
  if (activeGame === 'whack_mole') {
    return <WhackMoleGame onBack={handleBack} />;
  }
  if (activeGame === 'word_match') {
    return <WordMatchGame onBack={handleBack} />;
  }
  if (activeGame === 'word_runner') {
    return <WordRunnerGame onBack={handleBack} />;
  }
  if (activeGame === 'word_tetris') {
    return <WordTetrisGame onBack={handleBack} />;
  }
  if (activeGame === 'word_shooting') {
    return <WordShootingGame onBack={handleBack} />;
  }

  const renderGameCard = (card: GameCard) => (
    <div
      key={card.id}
      className={`${card.bgGradient} border ${card.borderColor} rounded-2xl p-5 shadow-md hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer group`}
      onClick={() => handleStartGame(card.id)}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="text-5xl group-hover:scale-110 transition-transform">{card.icon}</div>
        <div className={`${card.textColor} text-xs font-semibold bg-white/80 px-2 py-1 rounded-full flex items-center gap-1`}>
          <Zap size={12} />
          {card.tag}
        </div>
      </div>
      <h3 className={`text-xl font-bold ${card.textColor} mb-1`}>{card.title}</h3>
       <p className="text-sm text-gray-600 mb-4">{card.description}</p>
      <button
        className={`w-full py-2.5 rounded-xl bg-gradient-to-r ${card.gradient} text-white font-semibold text-sm flex items-center justify-center gap-2 hover:shadow-md transition-all`}
      >
        开始游戏
        <ArrowRight size={16} />
      </button>
      <div className="mt-3 text-xs text-gray-500 flex items-center gap-1">
        <Trophy size={12} />
        <span>我的最高分：--</span>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-orange-500 via-pink-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-1/3 w-32 h-32 bg-white/10 rounded-full translate-y-1/2" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
              <Gamepad2 size={28} />
            </div>
            <div>
              <h1 className="text-2xl font-bold">游戏乐园</h1>
              <p className="text-sm opacity-90">边玩边学，让学习像游戏一样上瘾！</p>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1.5">
              <Star size={16} className="text-yellow-300" />
              <span>8 款趣味游戏</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Sparkles size={16} className="text-cyan-300" />
              <span>闯关赢积分</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Trophy size={16} className="text-amber-300" />
              <span>冲榜拿荣誉</span>
            </div>
          </div>
        </div>
      </div>

      <div className="glass-card rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-1 h-5 bg-gradient-to-b from-orange-500 to-pink-500 rounded-full" />
          <h2 className="text-lg font-bold text-white">英语游戏专区</h2>
          <span className="text-xs bg-orange-500/20 text-orange-300 px-2 py-0.5 rounded-full font-medium">
            5款
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {ENGLISH_GAMES.map(renderGameCard)}
        </div>
      </div>

      <div className="glass-card rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-1 h-5 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full" />
          <h2 className="text-lg font-bold text-white">更多游戏</h2>
          <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full font-medium">
            3款
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {OTHER_GAMES.map(renderGameCard)}
        </div>
      </div>

      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="flex border-b border-white/10">
          <button
            onClick={() => setActiveTab('records')}
            className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm font-semibold transition-colors ${
               activeTab === 'records'
                 ? 'text-orange-400 border-b-2 border-orange-500 bg-orange-500/10'
                 : 'text-slate-400 hover:text-white'
            }`}
          >
            <History size={18} />
            我的记录
          </button>
          <button
            onClick={() => setActiveTab('ranking')}
            className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm font-semibold transition-colors ${
                 activeTab === 'ranking'
                 ? 'text-orange-400 border-b-2 border-orange-500 bg-orange-500/10'
                 : 'text-slate-400 hover:text-white'
            }`}
          >
            <Trophy size={18} />
            排行榜
          </button>
        </div>
        <div className="p-5">
          {activeTab === 'records' && <GameRecordList />}
          {activeTab === 'ranking' && <GameRanking />}
        </div>
      </div>
    </div>
  );
};

export default GameParkPage;
