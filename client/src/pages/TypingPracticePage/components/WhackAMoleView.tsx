import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Volume2, VolumeX, Trophy, Play, Pause, Zap } from 'lucide-react';
import { soundManager } from '@client/src/utils/soundManager';
import { VirtualKeyboard } from '@client/src/components/virtual-keyboard';
import GameOverlays, { LeaderboardModal } from './WhackAMoleOverlays';
import GameHUD from './WhackAMoleHUD';
import GameGrid from './GameGrid';
import { LEVELS, getLevelChars, type LevelConfig } from '../data/whackAMoleLevels';
import type { MoleHole, ScorePopup } from './GameGrid';

export interface WhackAMoleViewProps {
  onBack: () => void;
}

type GameState = 'idle' | 'playing' | 'paused' | 'levelComplete' | 'gameOver';

const STORAGE_KEY = 'typing_whackamole_best';
const HOLE_COUNT = 9;

const WhackAMoleView: React.FC<WhackAMoleViewProps> = ({ onBack }) => {
  const [gameState, setGameState] = useState<GameState>('idle');
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(0);
  const [lives, setLives] = useState(3);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [moles, setMoles] = useState<MoleHole[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [pressedKey, setPressedKey] = useState<string | null>(null);
  const [wrongKey, setWrongKey] = useState<string | null>(null);
  const [scorePopups, setScorePopups] = useState<ScorePopup[]>([]);
  const [shake, setShake] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [bestScore, setBestScore] = useState(0);
  const [endlessSpeedTier, setEndlessSpeedTier] = useState(0);
  const [hitCount, setHitCount] = useState(0);

  // refs to avoid stale closures in game loop
  const molesRef = useRef<MoleHole[]>([]);
  const gameStateRef = useRef<GameState>('idle');
  const spawnTimerRef = useRef<number | null>(null);
  const tickTimerRef = useRef<number | null>(null);
  const levelRef = useRef(0);
  const scoreRef = useRef(0);
  const livesRef = useRef(3);
  const comboRef = useRef(0);
  const hitCountRef = useRef(0);
  const endlessSpeedTierRef = useRef(0);

  useEffect(() => { molesRef.current = moles; }, [moles]);
  useEffect(() => { gameStateRef.current = gameState; }, [gameState]);
  useEffect(() => { levelRef.current = level; }, [level]);
  useEffect(() => { scoreRef.current = score; }, [score]);
  useEffect(() => { livesRef.current = lives; }, [lives]);
  useEffect(() => { comboRef.current = combo; }, [combo]);
  useEffect(() => { hitCountRef.current = hitCount; }, [hitCount]);
  useEffect(() => { endlessSpeedTierRef.current = endlessSpeedTier; }, [endlessSpeedTier]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setBestScore(parseInt(saved, 10) || 0);
    } catch { /* ignore */ }
  }, []);

  const playSound = useCallback((fn: () => void) => {
    if (!soundEnabled) return;
    soundManager.ensureContext();
    fn();
  }, [soundEnabled]);

  const isEndless = level === LEVELS.length - 1;

  const getDifficulty = useCallback((): LevelConfig => {
    const base = LEVELS[levelRef.current];
    if (levelRef.current !== LEVELS.length - 1) return base;
    const tier = endlessSpeedTierRef.current;
    return {
      ...base,
      stayDuration: Math.round(base.stayDuration * Math.max(0.45, 1 - tier * 0.07)),
      spawnInterval: Math.round(base.spawnInterval * Math.max(0.4, 1 - tier * 0.08)),
    };
  }, []);

  const addScorePopup = useCallback((holeIndex: number, text: string, color: string) => {
    const id = `popup-${Date.now()}-${Math.random()}`;
    setScorePopups(prev => [...prev, { id, holeIndex, text, color }]);
    setTimeout(() => {
      setScorePopups(prev => prev.filter(p => p.id !== id));
    }, 800);
  }, []);

  const clearTimers = useCallback(() => {
    if (spawnTimerRef.current) {
      window.clearTimeout(spawnTimerRef.current);
      spawnTimerRef.current = null;
    }
    if (tickTimerRef.current) {
      window.clearInterval(tickTimerRef.current);
      tickTimerRef.current = null;
    }
  }, []);

  const handleGameOver = useCallback(() => {
    clearTimers();
    setGameState('gameOver');
    gameStateRef.current = 'gameOver';
    playSound(() => soundManager.playComplete());
    const finalScore = scoreRef.current;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      const prev = saved ? parseInt(saved, 10) || 0 : 0;
      if (finalScore > prev) {
        localStorage.setItem(STORAGE_KEY, String(finalScore));
        setBestScore(finalScore);
      }
    } catch { /* ignore */ }
  }, [clearTimers, playSound]);

  const checkLevelComplete = useCallback(() => {
    if (levelRef.current >= LEVELS.length - 1) return;
    if (scoreRef.current >= LEVELS[levelRef.current].passScore) {
      setGameState('levelComplete');
      gameStateRef.current = 'levelComplete';
      playSound(() => soundManager.playVictory());
      clearTimers();
    }
  }, [clearTimers, playSound]);

  const spawnMole = useCallback(() => {
    if (gameStateRef.current !== 'playing') return;
    const diff = getDifficulty();
    const occupied = new Set(molesRef.current.map(m => m.holeIndex));
    if (occupied.size >= diff.maxMoles) {
      spawnTimerRef.current = window.setTimeout(spawnMole, diff.spawnInterval / 2);
      return;
    }
    const available: number[] = [];
    for (let i = 0; i < HOLE_COUNT; i++) {
      if (!occupied.has(i)) available.push(i);
    }
    const holeIndex = available[Math.floor(Math.random() * available.length)];
    const chars = getLevelChars(levelRef.current, endlessSpeedTierRef.current);
    const key = chars[Math.floor(Math.random() * chars.length)];
    const isGolden = Math.random() < 0.05;
    const mole: MoleHole = {
      id: `mole-${Date.now()}-${Math.random()}`,
      key,
      holeIndex,
      state: 'rising',
      createdAt: Date.now(),
      isGolden,
    };
    setMoles(prev => [...prev, mole]);
    setTimeout(() => {
      setMoles(prev => prev.map(m =>
        m.id === mole.id && m.state === 'rising' ? { ...m, state: 'up' } : m
      ));
    }, 200);
    spawnTimerRef.current = window.setTimeout(spawnMole, diff.spawnInterval);
  }, [getDifficulty]);

  const gameTick = useCallback(() => {
    if (gameStateRef.current !== 'playing') return;
    const now = Date.now();
    const diff = getDifficulty();
    let escapedCount = 0;
    setMoles(prev => {
      const next: MoleHole[] = [];
      for (const m of prev) {
        if (m.state === 'up' && now - m.createdAt > diff.stayDuration) {
          escapedCount += 1;
          next.push({ ...m, state: 'escaping' });
        } else if (m.state === 'escaping' && now - m.createdAt > diff.stayDuration + 300) {
          continue;
        } else {
          next.push(m);
        }
      }
      return next;
    });
    if (escapedCount > 0) {
      setScore(prev => Math.max(0, prev - escapedCount * 3));
      setCombo(0);
      if (levelRef.current === LEVELS.length - 1) {
        setLives(prev => {
          const newLives = prev - escapedCount;
          if (newLives <= 0) handleGameOver();
          return Math.max(0, newLives);
        });
      }
      playSound(() => soundManager.playWrong());
    }
  }, [getDifficulty, handleGameOver, playSound]);

  const handleKeyPress = useCallback((e: KeyboardEvent) => {
    if (gameStateRef.current !== 'playing' || e.repeat) return;
    const lowerKey = e.key.toLowerCase();
    setPressedKey(lowerKey);
    setTimeout(() => setPressedKey(null), 100);

    const hitable = molesRef.current
      .filter(m => (m.state === 'rising' || m.state === 'up') && m.key.toLowerCase() === lowerKey)
      .sort((a, b) => a.createdAt - b.createdAt);

    if (hitable.length > 0) {
      const mole = hitable[0];
      setMoles(prev => prev.map(m => m.id === mole.id ? { ...m, state: 'hit' } : m));
      setTimeout(() => {
        setMoles(prev => prev.filter(m => m.id !== mole.id));
      }, 400);

      const baseScore = mole.isGolden ? 20 : 10;
      let bonus = 0;
      const newCombo = comboRef.current + 1;
      if (newCombo === 5) bonus = 20;
      else if (newCombo === 10) bonus = 50;
      else if (newCombo === 20) bonus = 100;

      setScore(prev => prev + baseScore + bonus);
      setCombo(newCombo);
      setMaxCombo(prev => Math.max(prev, newCombo));

      if (levelRef.current === LEVELS.length - 1) {
        const newHitCount = hitCountRef.current + 1;
        setHitCount(newHitCount);
        if (newHitCount % 10 === 0) setEndlessSpeedTier(prev => prev + 1);
      }

      addScorePopup(
        mole.holeIndex,
        `+${baseScore + bonus}${bonus > 0 ? ' 连击!' : ''}`,
        mole.isGolden ? '#FFD700' : bonus > 0 ? '#06B6D4' : '#22C55E'
      );
      playSound(() => soundManager.playKeystroke());
      if (bonus > 0) playSound(() => soundManager.playWordComplete());
      setTimeout(() => checkLevelComplete(), 0);
    } else {
      setWrongKey(lowerKey);
      setTimeout(() => setWrongKey(null), 200);
      setScore(prev => Math.max(0, prev - 5));
      setCombo(0);
      setShake(true);
      setTimeout(() => setShake(false), 200);
      playSound(() => soundManager.playWrong());
    }
  }, [addScorePopup, checkLevelComplete, playSound]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      handleKeyPress(e);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleKeyPress]);

  const startGameLoop = useCallback(() => {
    spawnTimerRef.current = window.setTimeout(spawnMole, 500);
    tickTimerRef.current = window.setInterval(gameTick, 100);
  }, [spawnMole, gameTick]);

  const startGame = useCallback(() => {
    setScore(0); setLevel(0); setLives(3); setCombo(0); setMaxCombo(0);
    setMoles([]); setHitCount(0); setEndlessSpeedTier(0);
    scoreRef.current = 0; levelRef.current = 0; livesRef.current = 3;
    comboRef.current = 0; hitCountRef.current = 0; endlessSpeedTierRef.current = 0;
    setGameState('playing');
    gameStateRef.current = 'playing';
    startGameLoop();
  }, [startGameLoop]);

  const nextLevel = useCallback(() => {
    const next = level + 1;
    if (next >= LEVELS.length) { handleGameOver(); return; }
    setLevel(next); levelRef.current = next;
    setMoles([]); setCombo(0); comboRef.current = 0;
    if (next === LEVELS.length - 1) {
      setLives(3); livesRef.current = 3;
      setHitCount(0); hitCountRef.current = 0;
      setEndlessSpeedTier(0); endlessSpeedTierRef.current = 0;
    }
    setGameState('playing'); gameStateRef.current = 'playing';
    startGameLoop();
  }, [level, handleGameOver, startGameLoop]);

  const pauseGame = useCallback(() => {
    clearTimers();
    setGameState('paused');
    gameStateRef.current = 'paused';
  }, [clearTimers]);

  const resumeGame = useCallback(() => {
    setGameState('playing');
    gameStateRef.current = 'playing';
    startGameLoop();
  }, [startGameLoop]);

  const restartLevel = useCallback(() => {
    setScore(0); setLives(3); setCombo(0); setMoles([]);
    scoreRef.current = 0; livesRef.current = 3; comboRef.current = 0;
    setGameState('playing'); gameStateRef.current = 'playing';
    startGameLoop();
  }, [startGameLoop]);

  useEffect(() => () => { clearTimers(); }, [clearTimers]);

  const targetKey = moles
    .filter(m => m.state === 'rising' || m.state === 'up')
    .sort((a, b) => a.createdAt - b.createdAt)[0]?.key ?? '';

  const toggleSound = () => {
    setSoundEnabled(prev => {
      const next = !prev;
      if (next) soundManager.ensureContext();
      return next;
    });
    soundManager.playClick('soft');
  };

  const getLeaderboard = (): number[] => {
    try {
      const data = localStorage.getItem(`${STORAGE_KEY}_board`);
      if (data) return JSON.parse(data);
    } catch { /* ignore */ }
    return [];
  };

  const saveLeaderboard = (newScore: number) => {
    const board = getLeaderboard();
    board.push(newScore);
    board.sort((a, b) => b - a);
    try {
      localStorage.setItem(`${STORAGE_KEY}_board`, JSON.stringify(board.slice(0, 5)));
    } catch { /* ignore */ }
  };

  useEffect(() => {
    if (gameState === 'gameOver' && score > 0) saveLeaderboard(score);
  }, [gameState, score]);

  return (
    <div
      className="min-h-screen tech-bg text-slate-100 flex flex-col overflow-hidden"
      style={shake ? { animation: 'shake 0.2s ease-in-out' } : undefined}
    >
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-8px); }
          75% { transform: translateX(8px); }
        }
      `}</style>

      {/* Top bar */}
      <div className="flex items-center justify-between px-4 md:px-6 py-4 max-w-5xl mx-auto w-full">
        <div className="flex items-center gap-3">
          <motion.button
            onClick={() => {
              soundManager.ensureContext();
              soundManager.playClick('soft');
              onBack();
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
             className="neon-btn w-10 h-10 rounded-xl flex items-center justify-center transition-all"
          >
            <ArrowLeft size={18} />
          </motion.button>
          <div>
            <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-[#EF4444] to-[#F97316] bg-clip-text text-transparent">
              打地鼠闯关
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-2 md:gap-3">
          <button
            onClick={toggleSound}
             className="neon-btn w-9 h-9 md:w-10 md:h-10 rounded-lg flex items-center justify-center transition-all"
          >
            {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
          </button>
          <button
            onClick={() => { soundManager.playClick('soft'); setShowLeaderboard(true); }}
             className="neon-btn w-9 h-9 md:w-10 md:h-10 rounded-lg flex items-center justify-center text-[#FFD166] hover:scale-105 transition-all border-amber-400/40"
          >
            <Trophy size={18} />
          </button>
        </div>
      </div>

      <GameHUD
        score={score}
        level={level}
        lives={lives}
        combo={combo}
        bestScore={bestScore}
        endlessSpeedTier={endlessSpeedTier}
        gameState={gameState}
      />

      {/* Game area */}
      <div className="flex-1 flex items-center justify-center px-4 py-2">
        <div className="relative w-full max-w-md md:max-w-lg aspect-square">
          <GameGrid moles={moles} scorePopups={scorePopups} />
          <GameOverlays
            gameState={gameState}
            score={score}
            level={level}
            maxCombo={maxCombo}
            bestScore={bestScore}
            endlessSpeedTier={endlessSpeedTier}
            onStart={startGame}
            onResume={resumeGame}
            onRestartLevel={restartLevel}
            onNextLevel={nextLevel}
          />
        </div>
      </div>

      {/* Bottom bar */}
      <div className="px-4 pb-3 md:pb-4">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-center gap-3 mb-2">
            {gameState === 'playing' && (
              <motion.button
                onClick={pauseGame}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                 className="neon-btn px-4 py-2 rounded-lg text-sm flex items-center gap-1.5"
              >
                <Pause size={16} />
                暂停
              </motion.button>
            )}
            {(gameState === 'idle' || gameState === 'gameOver') && (
              <motion.button
                onClick={startGame}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#EF4444] to-[#F97316] text-white text-sm flex items-center gap-1.5 shadow-[0_0_15px_rgba(239_68_68_0.4)]"
              >
                <Play size={16} />
                {gameState === 'idle' ? '开始游戏' : '重新开始'}
              </motion.button>
            )}
            {gameState === 'levelComplete' && (
              <motion.button
                onClick={nextLevel}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#22C55E] to-[#06B6D4] text-[#EEF2FF] text-sm font-medium flex items-center gap-1.5 shadow-[0_0_15px_rgba(34_211_238_0.4)]"
              >
                <Zap size={16} />
                下一关
              </motion.button>
            )}
            {gameState === 'paused' && (
              <motion.button
                onClick={resumeGame}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#6366F1] to-[#2563EB] text-white text-sm flex items-center gap-1.5"
              >
                <Play size={16} />
                继续游戏
              </motion.button>
            )}
          </div>
          <VirtualKeyboard
            layout="qwerty"
            value=""
            onChange={() => {}}
            highlightKey={targetKey}
            wrongKey={wrongKey}
            theme="neon"
            disabled
            showNextGuide={false}
            showTypedHighlight={false}
          />
        </div>
      </div>

      <LeaderboardModal
        open={showLeaderboard}
        onClose={() => setShowLeaderboard(false)}
        getScores={getLeaderboard}
      />
    </div>
  );
};

export default WhackAMoleView;
