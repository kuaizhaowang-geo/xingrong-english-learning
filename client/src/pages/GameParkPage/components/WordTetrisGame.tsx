import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { closeAudioContext, clearTimer } from './game-audio-utils';
import {
  ArrowLeft, Play, Pause, Trophy, Star, Zap, RotateCcw,
  ChevronLeft, ChevronRight, ChevronDown, ChevronsDown,
  Sparkles, Target, Volume2, VolumeX,
} from 'lucide-react';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { generateWordTetris, submitWordTetris } from '@client/src/api/games';
import type { TetrisWord } from '@shared/api.interface';

interface WordTetrisGameProps { onBack: () => void; }
type ViewState = 'intro' | 'play' | 'result';

const COLS = 8; const ROWS = 12;
const DIFF_LABELS = ['小学入门', '小学进阶', '初中', '高中', '高阶'];
const NEON = { background: 'linear-gradient(135deg, #6366F1 0%, #2563EB 100%)' };
const CARD = 'bg-[#FFFFFF] rounded-xl border border-purple-500/20';

interface FL { letter: string; row: number; col: number; }
interface Particle { id: number; x: number; y: number; vx: number; vy: number; color: string; }
interface SP { id: number; value: number; x: number; y: number; }

const WordTetrisGame: React.FC<WordTetrisGameProps> = ({ onBack }) => {
  const [view, setView] = useState<ViewState>('intro');
  const [difficulty, setDifficulty] = useState(3);
  const [highScore, setHighScore] = useState(0);
  const [words, setWords] = useState<TetrisWord[]>([]);
  const [wordIndex, setWordIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [wordsDone, setWordsDone] = useState(0);
  const [falling, setFalling] = useState<FL | null>(null);
  const [stack, setStack] = useState<Map<string, string>>(new Map());
  const [isPaused, setIsPaused] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [loading, setLoading] = useState(false);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [scorePopups, setScorePopups] = useState<SP[]>([]);
  const [clearing, setClearing] = useState(false);
  const [soundOn, setSoundOn] = useState(true);

  const startTimeRef = useRef(0);
  const durationRef = useRef(0);
  const fallTimerRef = useRef<number | null>(null);
  const particleIdRef = useRef(0);
  const popupIdRef = useRef(0);
  const audioCtxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    return () => {
      closeAudioContext(audioCtxRef.current);
      audioCtxRef.current = null;
      clearTimer(fallTimerRef.current);
      fallTimerRef.current = null;
    };
  }, []);

  const currentWord = words[wordIndex];
  const targetWord = currentWord?.word?.toUpperCase() || '';
  const targetLetters = targetWord.split('');

  // --- Sound ---
  const playSound = useCallback((type: 'move' | 'land' | 'clear' | 'gameover' | 'combo') => {
    if (!soundOn) return;
    try {
      if (!audioCtxRef.current) audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      const ctx = audioCtxRef.current; const now = ctx.currentTime;
      const mk = (f: number, d: number, v: number, w: OscillatorType = 'sine', dl = 0) => {
        const o = ctx.createOscillator(); const g = ctx.createGain();
        o.connect(g); g.connect(ctx.destination); o.type = w;
        o.frequency.setValueAtTime(f, now + dl);
        g.gain.setValueAtTime(v, now + dl);
        g.gain.exponentialRampToValueAtTime(0.001, now + dl + d);
        o.start(now + dl); o.stop(now + dl + d);
      };
      if (type === 'move') mk(440, .05, .08);
      else if (type === 'land') {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.connect(g); g.connect(ctx.destination); o.type = 'triangle';
        o.frequency.setValueAtTime(200, now); o.frequency.exponentialRampToValueAtTime(100, now + .1);
        g.gain.setValueAtTime(.15, now); g.gain.exponentialRampToValueAtTime(.001, now + .12);
        o.start(now); o.stop(now + .12);
      } else if (type === 'clear') [523, 659, 784, 1047].forEach((f, i) => mk(f, .15, .12, 'sine', i * .06));
      else if (type === 'combo') {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.connect(g); g.connect(ctx.destination); o.type = 'sawtooth';
        o.frequency.setValueAtTime(600, now); o.frequency.exponentialRampToValueAtTime(1200, now + .15);
        g.gain.setValueAtTime(.1, now); g.gain.exponentialRampToValueAtTime(.001, now + .18);
        o.start(now); o.stop(now + .18);
      } else if (type === 'gameover') {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.connect(g); g.connect(ctx.destination); o.type = 'sawtooth';
        o.frequency.setValueAtTime(300, now); o.frequency.exponentialRampToValueAtTime(80, now + .6);
        g.gain.setValueAtTime(.15, now); g.gain.exponentialRampToValueAtTime(.001, now + .6);
        o.start(now); o.stop(now + .6);
      }
    } catch { /* noop */ }
  }, [soundOn]);

  const getFallInterval = useCallback(() => Math.max(250, 900 - (level - 1) * 60 - (difficulty - 1) * 50), [level, difficulty]);

  const getRemainingLetters = useCallback((): string[] => {
    if (!currentWord) return [];
    const cnt: Record<string, number> = {};
    stack.forEach(l => { cnt[l] = (cnt[l] || 0) + 1; });
    if (falling) cnt[falling.letter] = (cnt[falling.letter] || 0) + 1;
    const rem: string[] = [];
    for (const l of targetLetters) {
      const need = targetLetters.filter(x => x === l).length;
      if ((cnt[l] || 0) < need && !rem.includes(l)) rem.push(l);
    }
    return rem.length ? rem : ['?'];
  }, [currentWord, stack, falling, targetLetters]);

  const spawnLetter = useCallback(() => {
    if (!currentWord) return;
    const pool = getRemainingLetters();
    const letter = pool[Math.floor(Math.random() * pool.length)];
    const col = Math.floor(COLS / 2);
    if (stack.has(`0-${col}`)) { setGameOver(true); return; }
    setFalling({ letter, row: 0, col });
  }, [currentWord, getRemainingLetters, stack]);

  const checkMatch = useCallback((s: Map<string, string>): boolean => {
    if (!targetWord) return false;
    let row = '';
    for (let c = 0; c < COLS; c++) row += s.get(`${ROWS - 1}-${c}`) || '';
    return row.includes(targetWord);
  }, [targetWord]);

  const clearWord = useCallback(() => {
    setClearing(true); playSound('clear');
    const target = targetWord; const wl = target.length;
    setStack(prev => {
      const next = new Map<string, string>();
      const br: (string | null)[] = [];
      for (let c = 0; c < COLS; c++) br.push(prev.get(`${ROWS - 1}-${c}`) || null);
      let ms = -1;
      for (let c = 0; c <= COLS - wl; c++) {
        if (br.slice(c, c + wl).join('') === target) { ms = c; break; }
      }
      if (ms === -1) { setClearing(false); return prev; }

      const colors = ['#6366F1', '#2563EB', '#06B6D4', '#A855F7', '#EC4899'];
      const np: Particle[] = [];
      for (let i = 0; i < wl; i++) {
        const px = ((ms + i + .5) / COLS) * 100;
        const py = ((ROWS - .5) / ROWS) * 100;
        for (let j = 0; j < 12; j++) {
          const a = (Math.PI * 2 * j) / 12; const sp = 30 + Math.random() * 40;
          np.push({ id: particleIdRef.current++, x: px, y: py, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 20, color: colors[(i + j) % colors.length] });
        }
      }
      setParticles(p => [...p, ...np]);
      setTimeout(() => setParticles([]), 1000);

      const total = 100 + combo * 20;
      const pid = popupIdRef.current++;
      setScorePopups(p => [...p, { id: pid, value: total, x: 50, y: 50 }]);
      setTimeout(() => setScorePopups(p => p.filter(x => x.id !== pid)), 1000);

      setScore(s => s + total);
      setCombo(c => { const nc = c + 1; setMaxCombo(m => Math.max(m, nc)); return nc; });
      setWordsDone(w => { const nw = w + 1; if (nw % 5 === 0) setLevel(l => l + 1); return nw; });
      if (combo >= 2) setTimeout(() => playSound('combo'), 150);

      const tr = new Set<number>();
      for (let i = 0; i < wl; i++) tr.add(ms + i);
      for (let c = 0; c < COLS; c++) {
        const cl: string[] = [];
        for (let r = ROWS - 1; r >= 0; r--) { const l = prev.get(`${r}-${c}`); if (l) cl.push(l); }
        if (tr.has(c)) cl.shift();
        for (let i = 0; i < cl.length; i++) next.set(`${ROWS - 1 - i}-${c}`, cl[i]);
      }
      setTimeout(() => { setWordIndex(wi => { if (wi >= words.length - 1) { setGameOver(true); return wi; } return wi + 1; }); }, 400);
      setTimeout(() => setClearing(false), 500);
      return next;
    });
  }, [targetWord, combo, words.length, playSound]);

  const landLetter = useCallback((letter: string, col: number) => {
    playSound('land');
    setStack(prev => {
      const next = new Map(prev); let tr = ROWS - 1;
      for (let r = ROWS - 1; r >= 0; r--) { if (!next.has(`${r}-${col}`)) { tr = r; break; } }
      next.set(`${tr}-${col}`, letter);
      if (tr <= 0) setTimeout(() => setGameOver(true), 100);
      setTimeout(() => { setStack(s => { if (checkMatch(s)) setTimeout(() => clearWord(), 100); else setCombo(0); return s; }); }, 50);
      return next;
    });
  }, [playSound, checkMatch, clearWord]);

  const moveH = useCallback((dir: -1 | 1) => {
    if (view !== 'play' || isPaused || gameOver || !falling || clearing) return;
    const nc = falling.col + dir;
    if (nc < 0 || nc >= COLS) return;
    if (stack.has(`${falling.row}-${nc}`)) return;
    playSound('move');
    setFalling(p => p ? { ...p, col: nc } : null);
  }, [view, isPaused, gameOver, falling, stack, clearing, playSound]);

  const softDrop = useCallback(() => {
    if (view !== 'play' || isPaused || gameOver || !falling || clearing) return;
    setFalling(prev => {
      if (!prev) return null;
      const nr = prev.row + 1;
      if (nr >= ROWS || stack.has(`${nr}-${prev.col}`)) { landLetter(prev.letter, prev.col); return null; }
      setScore(s => s + 1);
      return { ...prev, row: nr };
    });
  }, [view, isPaused, gameOver, falling, stack, clearing, landLetter]);

  const hardDrop = useCallback(() => {
    if (view !== 'play' || isPaused || gameOver || !falling || clearing) return;
    let dr = falling.row;
    for (let r = falling.row; r < ROWS; r++) { if (r + 1 >= ROWS || stack.has(`${r + 1}-${falling.col}`)) { dr = r; break; } }
    setScore(s => s + (dr - falling.row) * 2);
    landLetter(falling.letter, falling.col);
    setFalling(null);
  }, [view, isPaused, gameOver, falling, stack, clearing, landLetter]);

  // Keyboard
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (view !== 'play') return;
      if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') { setIsPaused(p => !p); return; }
      if (isPaused || gameOver || clearing) return;
      if (e.key === 'ArrowLeft') moveH(-1);
      else if (e.key === 'ArrowRight') moveH(1);
      else if (e.key === 'ArrowDown') softDrop();
      else if (e.key === ' ') { e.preventDefault(); hardDrop(); }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [view, isPaused, gameOver, clearing, moveH, softDrop, hardDrop]);

  // Gravity
  useEffect(() => {
    if (view !== 'play' || isPaused || gameOver || !falling || clearing) return;
    const iv = getFallInterval();
    fallTimerRef.current = window.setInterval(() => {
      setFalling(prev => {
        if (!prev) return null;
        const nr = prev.row + 1;
        if (nr >= ROWS || stack.has(`${nr}-${prev.col}`)) { landLetter(prev.letter, prev.col); return null; }
        return { ...prev, row: nr };
      });
    }, iv);
    return () => { if (fallTimerRef.current) clearInterval(fallTimerRef.current); };
  }, [view, isPaused, gameOver, falling?.letter, falling?.col, getFallInterval, stack, landLetter, clearing]);

  // Spawn
  useEffect(() => {
    if (view !== 'play' || isPaused || gameOver || falling || clearing || !currentWord) return;
    const cnt: Record<string, number> = {};
    stack.forEach(l => { cnt[l] = (cnt[l] || 0) + 1; });
    const tc: Record<string, number> = {};
    for (const l of targetLetters) tc[l] = (tc[l] || 0) + 1;
    let all = true;
    for (const [l, c] of Object.entries(tc)) { if ((cnt[l] || 0) < c) { all = false; break; } }
    if (all) {
      const t = setTimeout(() => {
        setCombo(0);
        if (wordIndex >= words.length - 1) setGameOver(true); else setWordIndex(w => w + 1);
      }, 800);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => spawnLetter(), 250);
    return () => clearTimeout(t);
  }, [view, isPaused, gameOver, falling, currentWord, spawnLetter, clearing, stack, targetLetters, wordIndex, words.length]);

  // Game over
  useEffect(() => {
    if (gameOver && view === 'play') {
      durationRef.current = Math.floor((Date.now() - startTimeRef.current) / 1000);
      playSound('gameover');
      submitWordTetris({
        score, totalQuestions: words.length, correctCount: wordsDone,
        durationSec: durationRef.current, difficulty,
        details: { level, wordsCompleted: wordsDone, maxCombo },
      }).catch((err: Error) => logger.error('提交成绩失败', err));
      if (score > highScore) setHighScore(score);
      setTimeout(() => setView('result'), 1200);
    }
  }, [gameOver, view, score, words.length, wordsDone, difficulty, level, maxCombo, highScore, playSound]);

  const startGame = useCallback(async () => {
    setLoading(true);
    try {
      const data = await generateWordTetris({ difficulty, count: 15 });
      setWords(data.words); setWordIndex(0); setScore(0); setLevel(1);
      setCombo(0); setMaxCombo(0); setWordsDone(0); setStack(new Map());
      setFalling(null); setIsPaused(false); setGameOver(false); setParticles([]);
      setScorePopups([]); setClearing(false);
      startTimeRef.current = Date.now(); setView('play');
    } catch (err) { logger.error('生成失败', err as Error); }
    finally { setLoading(false); }
  }, [difficulty]);

  const getRank = () => {
    if (score >= 800) return { r: 'S', d: '方块之神', c: 'from-yellow-400 to-orange-500', icon: '🏆' };
    if (score >= 500) return { r: 'A', d: '单词达人', c: 'from-purple-500 to-pink-500', icon: '🎉' };
    if (score >= 300) return { r: 'B', d: '熟练玩家', c: 'from-blue-500 to-cyan-500', icon: '⭐' };
    if (score >= 150) return { r: 'C', d: '初级学徒', c: 'from-green-500 to-emerald-500', icon: '💪' };
    return { r: 'D', d: '再接再厉', c: 'from-gray-500 to-slate-500', icon: '📖' };
  };

  const getMatchedPrefix = (): number => {
    let row = '';
    for (let c = 0; c < COLS; c++) row += stack.get(`${ROWS - 1}-${c}`) || '';
    let m = 0;
    for (let i = 1; i <= Math.min(targetWord.length, row.length); i++) {
      if (row.endsWith(targetWord.substring(0, i))) m = i;
    }
    return m;
  };

  const matchedPrefix = gameOver ? 0 : getMatchedPrefix();

  const renderGrid = () => {
    const cells = []; const ms = COLS - matchedPrefix;
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const key = `${r}-${c}`;
        const sl = stack.get(key);
        const isF = falling && falling.row === r && falling.col === c;
        const isBot = r === ROWS - 1;
        const isM = isBot && matchedPrefix > 0 && c >= ms;
        let cls = 'bg-white/5', content = '';
        if (isF) { content = falling.letter; cls = 'bg-gradient-to-br from-cyan-400 to-blue-500 text-white shadow-[0_0_15px_rgba(34_211_238_0.8)]'; }
        else if (sl) {
          content = sl;
          if (isM) cls = 'bg-gradient-to-br from-emerald-400 to-cyan-400 text-white shadow-[0_0_12px_rgba(52_211_153_0.8)]';
          else if (isBot) cls = 'bg-gradient-to-br from-purple-500 to-violet-600 text-white shadow-[0_0_10px_rgba(124_58_237_0.6)]';
          else cls = 'bg-gradient-to-br from-purple-600/80 to-violet-700/80 text-white/90';
        }
        cells.push(<div key={key} className={`aspect-square rounded-md flex items-center justify-center text-xs sm:text-sm font-bold transition-all duration-75 ${cls}`}>{content}</div>);
      }
    }
    return cells;
  };

  const Wrap = ({ children }: { children: React.ReactNode }) => (
    <div className="min-h-screen bg-gradient-to-b from-[#EEF2FF] via-[#FFFFFF] to-[#EEF2FF] p-3 sm:p-6">
      <div className="max-w-md mx-auto space-y-4">{children}</div>
    </div>
  );

  const Btn = ({ label }: { label: string }) => (
    <button onClick={onBack} className="flex items-center gap-1 text-purple-300 hover:text-purple-100 text-sm font-medium">
      <ArrowLeft size={18} />{label}
    </button>
  );

  // --- INTRO ---
  if (view === 'intro') return (
    <Wrap>
      <Btn label="返回游戏乐园" />
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="relative rounded-2xl p-6 text-center overflow-hidden border border-purple-500/30" style={NEON}>
        <div className="absolute inset-0 opacity-20">
          {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].map((l, i) => (
            <motion.div key={l} className="absolute text-white font-bold text-2xl" style={{ left: `${10 + i * 12}%` }}
              animate={{ y: [-20, 120], opacity: [0.6, 0], rotate: [0, 15] }}
              transition={{ duration: 3 + i * 0.3, repeat: Infinity, delay: i * 0.4, ease: 'linear' }}>{l}</motion.div>
          ))}
        </div>
        <div className="relative">
          <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity }} className="text-5xl mb-3">🧱</motion.div>
          <h1 className="text-3xl font-bold text-white mb-1" style={{ textShadow: '0 0 20px rgba(255,255,255,0.5)' }}>单词方块</h1>
          <p className="text-sm text-white/80">字母从天降，拼词消方块！</p>
        </div>
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className={`${CARD} p-5 space-y-5`}>
        <div>
          <h3 className="text-sm font-bold text-purple-200 mb-3 flex items-center gap-2">
            <Sparkles size={16} className="text-cyan-400" />游戏玩法
          </h3>
          <ul className="text-sm text-gray-300 space-y-1.5">
            <li>▸ 字母方块从顶部下落，左右移动选择位置</li>
            <li>▸ 在底部堆积出目标单词即可消除得分</li>
            <li>▸ 连续消除获得 combo 加成分</li>
            <li>▸ 方块堆到顶溢出即游戏结束</li>
          </ul>
        </div>
        <div>
          <label className="text-sm font-bold text-purple-200 mb-3 block flex items-center gap-2">
            <Star size={16} className="text-yellow-400" />难度：{DIFF_LABELS[difficulty - 1]}
          </label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map(lv => (
              <button key={lv} onClick={() => setDifficulty(lv)}
                className={`flex-1 py-3 rounded-xl flex items-center justify-center transition-all ${
                  difficulty >= lv ? 'bg-gradient-to-b from-purple-500 to-violet-600 text-white shadow-[0_0_15px_rgba(124_58_237_0.5)]' : 'bg-white/5 text-gray-500'
                }`}>
                <Star size={16} fill={difficulty >= lv ? 'currentColor' : 'none'} />
              </button>
            ))}
          </div>
        </div>
        {highScore > 0 && (
          <div className="flex items-center justify-center gap-2 text-yellow-400 text-sm">
            <Trophy size={16} />最高分：<span className="font-bold">{highScore}</span>
          </div>
        )}
        <button onClick={startGame} disabled={loading}
          className="w-full py-4 rounded-xl text-white font-bold text-lg transition-all disabled:opacity-60 active:scale-95"
          style={{ ...NEON, boxShadow: '0 0 25px rgba(99, 102, 241, 0.35)' }}>
          {loading ? '加载中...' : '🚀 开始挑战'}
        </button>
      </motion.div>
    </Wrap>
  );

  // --- PLAY ---
  if (view === 'play') return (
    <Wrap>
      <div className="flex items-center justify-between">
        <Btn label="退出" />
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold" style={{
            background: 'linear-gradient(135deg, #06B6D4, #6366F1)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>{score} 分</span>
          <button onClick={() => setSoundOn(s => !s)} className="p-2 rounded-lg bg-white/5 text-purple-300 hover:bg-white/10">
            {soundOn ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>
          <button onClick={() => setIsPaused(p => !p)} className="p-2 rounded-lg bg-purple-500/20 text-purple-200 hover:bg-purple-500/30">
            {isPaused ? <Play size={16} /> : <Pause size={16} />}
          </button>
        </div>
      </div>
      <div className={`${CARD} p-3`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1 text-xs text-purple-300"><Target size={12} />目标单词</div>
          <div className="text-xs text-gray-400">{wordIndex + 1} / {words.length}</div>
        </div>
        <div className="text-center text-sm text-cyan-300 mb-2">{currentWord?.meaning}</div>
        <div className="flex justify-center gap-1.5">
          {targetLetters.map((l, i) => (
            <motion.div key={i} animate={i < matchedPrefix ? { scale: [1, 1.2, 1] } : {}} transition={{ duration: 0.3 }}
              className={`w-7 h-9 sm:w-8 sm:h-10 rounded-lg flex items-center justify-center text-base sm:text-lg font-bold transition-all ${
                i < matchedPrefix
                  ? 'bg-gradient-to-b from-emerald-400 to-cyan-400 text-white shadow-[0_0_12px_rgba(52_211_153_0.7)]'
                  : 'bg-white/10 text-gray-500 border border-purple-500/20'
              }`}>
              {i < matchedPrefix ? l : '·'}
            </motion.div>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {[
          { icon: Zap, label: '等级', val: `Lv.${level}`, color: 'text-yellow-400', bc: 'border-yellow-500/20' },
          { icon: Sparkles, label: '连击', val: `x${combo}`, color: 'text-pink-400', bc: 'border-pink-500/20' },
          { icon: Star, label: '已完成', val: wordsDone, color: 'text-green-400', bc: 'border-green-500/20' },
        ].map(({ icon: Icon, label, val, color, bc }) => (
          <div key={label} className={`${CARD} ${bc} p-2 text-center`}>
            <div className={`text-xs flex items-center justify-center gap-1 ${color}`}><Icon size={10} />{label}</div>
            <div className="text-base font-bold text-white">{val}</div>
          </div>
        ))}
      </div>
      <div className="relative flex justify-center">
        <div className="relative p-2 bg-black/40 rounded-xl border border-purple-500/30">
          <div className="grid gap-0.5" style={{
            gridTemplateColumns: `repeat(${COLS}, minmax(24px, 32px))`,
            gridTemplateRows: `repeat(${ROWS}, minmax(24px, 32px))`,
          }}>{renderGrid()}</div>
          <AnimatePresence>
            {particles.map(p => (
              <motion.div key={p.id} initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                animate={{ x: p.vx, y: p.vy, opacity: 0, scale: 0 }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className="absolute w-2 h-2 rounded-full pointer-events-none"
                style={{ left: `${p.x}%`, top: `${p.y}%`, backgroundColor: p.color, boxShadow: `0 0 8px ${p.color}` }} />
            ))}
          </AnimatePresence>
          {scorePopups.map(p => (
            <motion.div key={p.id} initial={{ opacity: 1, y: 0, scale: 1 }}
              animate={{ opacity: 0, y: -40, scale: 1.3 }} transition={{ duration: 0.8 }}
              className="absolute left-1/2 top-1/2 -translate-x-1/2 text-yellow-300 font-bold text-xl pointer-events-none"
              style={{ textShadow: '0 0 15px rgba(253,224,71,0.9)' }}>+{p.value}</motion.div>
          ))}
          <AnimatePresence>
            {isPaused && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/80 rounded-xl flex flex-col items-center justify-center gap-4 z-10">
                <div className="text-white text-xl font-bold">已暂停</div>
                <button onClick={() => setIsPaused(false)}
                  className="px-6 py-2 rounded-lg text-white font-semibold" style={NEON}>继续游戏</button>
              </motion.div>
            )}
          </AnimatePresence>
          <AnimatePresence>
            {gameOver && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="absolute inset-0 bg-red-900/50 rounded-xl flex items-center justify-center z-10">
                <div className="text-white text-xl font-bold" style={{ textShadow: '0 0 15px rgba(239,68,68,0.8)' }}>游戏结束</div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      <div className={`${CARD} p-3`}>
        <div className="flex items-center justify-center gap-3">
          <button onTouchStart={e => { e.preventDefault(); moveH(-1); }} onMouseDown={() => moveH(-1)}
            disabled={isPaused || gameOver}
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-white active:scale-90 disabled:opacity-40"
            style={{ background: 'linear-gradient(135deg, #E0E7FF, #F8FAFC)', boxShadow: '0 0 15px rgba(99, 102, 241, 0.2)' }}>
            <ChevronLeft size={28} strokeWidth={2.5} />
          </button>
          <div className="flex flex-col gap-2">
            <button onTouchStart={e => { e.preventDefault(); hardDrop(); }} onMouseDown={() => hardDrop()}
              disabled={isPaused || gameOver}
              className="w-14 h-12 rounded-xl flex items-center justify-center text-cyan-300 active:scale-90 disabled:opacity-40"
              style={{ background: 'linear-gradient(135deg, rgba(34,211,238,0.2), rgba(59,130,246,0.2))', border: '1px solid rgba(34,211,238,0.4)' }}>
              <ChevronsDown size={24} />
            </button>
            <button onTouchStart={e => { e.preventDefault(); softDrop(); }} onMouseDown={() => softDrop()}
              disabled={isPaused || gameOver}
              className="w-14 h-12 rounded-xl flex items-center justify-center text-white active:scale-90 disabled:opacity-40"
              style={{ background: 'linear-gradient(135deg, #E0E7FF, #F8FAFC)', boxShadow: '0 0 15px rgba(99, 102, 241, 0.2)' }}>
              <ChevronDown size={24} strokeWidth={2.5} />
            </button>
          </div>
          <button onTouchStart={e => { e.preventDefault(); moveH(1); }} onMouseDown={() => moveH(1)}
            disabled={isPaused || gameOver}
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-white active:scale-90 disabled:opacity-40"
            style={{ background: 'linear-gradient(135deg, #E0E7FF, #F8FAFC)', boxShadow: '0 0 15px rgba(99, 102, 241, 0.2)' }}>
            <ChevronRight size={28} strokeWidth={2.5} />
          </button>
        </div>
        <div className="text-center text-xs text-gray-500 mt-2">键盘：← → 移动 | ↓ 加速 | 空格 落底</div>
      </div>
    </Wrap>
  );

  // --- RESULT ---
  const rank = getRank();
  const fmt = () => `${Math.floor(durationRef.current / 60)}:${(durationRef.current % 60).toString().padStart(2, '0')}`;
  return (
    <Wrap>
      <Btn label="返回游戏乐园" />
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="relative rounded-2xl p-6 text-center overflow-hidden border border-purple-500/30" style={NEON}>
        <motion.div animate={{ rotate: [0, 5, -5, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 1 }} className="text-6xl mb-3">{rank.icon}</motion.div>
        <h2 className="text-2xl font-bold text-white mb-1">
          {rank.r === 'S' ? '方块之神！' : rank.r === 'A' ? '表现出色！' : rank.r === 'B' ? '做得不错！' : '继续加油！'}
        </h2>
        <p className="text-sm text-white/80 mb-4">单词方块挑战结束</p>
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
          transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
          className={`inline-block px-8 py-3 rounded-2xl text-5xl font-black text-white bg-gradient-to-br ${rank.c}`}
          style={{ textShadow: '0 0 20px rgba(255,255,255,0.5)' }}>{rank.r}</motion.div>
        <div className="text-sm text-white/80 mt-2">{rank.d}</div>
        <div className="text-4xl font-bold text-white mt-4" style={{ textShadow: '0 0 20px rgba(255,255,255,0.5)' }}>{score}</div>
        <div className="text-xs text-white/70">最终得分</div>
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className={`${CARD} p-5`}>
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-purple-500/10 rounded-xl p-3 text-center border border-purple-500/20">
            <div className="text-2xl font-bold text-purple-300">{wordsDone}</div>
            <div className="text-xs text-gray-400 mt-1">完成单词数</div>
          </div>
          <div className="bg-cyan-500/10 rounded-xl p-3 text-center border border-cyan-500/20">
            <div className="text-2xl font-bold text-cyan-300">x{maxCombo}</div>
            <div className="text-xs text-gray-400 mt-1">最高连击</div>
          </div>
          <div className="bg-yellow-500/10 rounded-xl p-3 text-center border border-yellow-500/20">
            <div className="text-2xl font-bold text-yellow-300">Lv.{level}</div>
            <div className="text-xs text-gray-400 mt-1">最高等级</div>
          </div>
          <div className="bg-green-500/10 rounded-xl p-3 text-center border border-green-500/20">
            <div className="text-2xl font-bold text-green-300">{fmt()}</div>
            <div className="text-xs text-gray-400 mt-1">游戏时长</div>
          </div>
        </div>
        <div className="flex items-center justify-between p-3 bg-purple-500/10 rounded-xl mb-5 border border-purple-500/20">
          <div className="flex items-center gap-2"><Trophy size={18} className="text-yellow-400" /><span className="text-sm text-gray-300">难度</span></div>
          <span className="text-base font-bold text-purple-300">{DIFF_LABELS[difficulty - 1]}</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => setView('intro')}
            className="py-3 rounded-xl text-gray-300 font-semibold text-sm flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10">
            <ArrowLeft size={16} />返回设置
          </button>
          <button onClick={startGame} disabled={loading}
            className="py-3 rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-2 active:scale-95 disabled:opacity-60"
            style={{ ...NEON, boxShadow: '0 0 20px rgba(99, 102, 241, 0.25)' }}>
            <RotateCcw size={16} />再来一局
          </button>
        </div>
      </motion.div>
    </Wrap>
  );
};

export default WordTetrisGame;
