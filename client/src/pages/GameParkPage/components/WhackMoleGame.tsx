import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Zap, Trophy, Star, RotateCcw, Pause, Play, Target, Sparkles } from 'lucide-react';
import { closeAudioContext, clearTimer, clearTimeoutTimer } from './game-audio-utils';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { generateWhackMole, submitWhackMole } from '@client/src/api/games';
import { useSpeech } from '@client/src/hooks/use-speech';
import type { WhackMoleWord } from '@shared/api.interface';

interface WhackMoleGameProps { onBack: () => void; }
type ViewState = 'intro' | 'play' | 'result';
type HitType = 'correct' | 'wrong' | null;

const DIFF_LABELS = ['小学入门', '小学进阶', '初中', '高中', '高阶'];
const DURATION = 60;
const HOLES = 9;
const BASE_INTERVAL = 1500;
const MIN_INTERVAL = 600;
const PTS = 10;
const PENALTY = 5;
const COMBO_TH = 3;

interface MoleState { holeIndex: number; word: WhackMoleWord; isTarget: boolean; isHit: boolean; hitType: HitType; waveId: number; }
interface FloatScore { id: number; holeIndex: number; text: string; type: 'positive' | 'negative'; }
interface Particle { id: number; holeIndex: number; angle: number; }
function useSoundEffects() {
  const ctxRef = useRef<AudioContext | null>(null);
  const ensure = useCallback((): AudioContext => {
    if (!ctxRef.current) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      ctxRef.current = new AC();
    }
    return ctxRef.current;
  }, []);
  const tone = useCallback((f: number, d: number, t: OscillatorType = 'sine', v = 0.12, f2?: number) => {
    try {
      const ctx = ensure();
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = t; o.frequency.setValueAtTime(f, ctx.currentTime);
      if (f2 !== undefined) o.frequency.exponentialRampToValueAtTime(Math.max(f2, 20), ctx.currentTime + d);
      g.gain.setValueAtTime(v, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + d);
      o.connect(g); g.connect(ctx.destination); o.start(); o.stop(ctx.currentTime + d);
    } catch { /* noop */ }
  }, [ensure]);
  const cleanup = useCallback((): void => {
    closeAudioContext(ctxRef.current);
    ctxRef.current = null;
  }, []);
  return {
    pop: () => tone(400, 0.12, 'sine', 0.08, 700),
    correct: () => { tone(880, 0.08, 'sine', 0.12); setTimeout(() => tone(1320, 0.12, 'sine', 0.12), 60); },
    wrong: () => tone(200, 0.2, 'sawtooth', 0.08, 120),
    tick: () => tone(1000, 0.05, 'square', 0.06),
    combo: () => { tone(600, 0.06); setTimeout(() => tone(900, 0.06), 50); setTimeout(() => tone(1200, 0.1, 'sine', 0.12), 100); },
    gameOver: () => { [523, 440, 349, 262].forEach((f, i) => setTimeout(() => tone(f, 0.2, 'triangle', 0.1), i * 120)); },
    cleanup,
  };
}
const Mole: React.FC<{ hit: HitType }> = ({ hit }) => {
  const body = hit === 'correct' ? '#4ADE80' : hit === 'wrong' ? '#F87171' : '#D4A574';
  const dark = hit === 'correct' ? '#22C55E' : hit === 'wrong' ? '#EF4444' : '#B8860B';
  const belly = hit === 'correct' ? '#BBF7D0' : hit === 'wrong' ? '#FECACA' : '#F5DEB3';
  return (
    <svg viewBox="0 0 100 110" className="w-full h-full drop-shadow-lg">
      <ellipse cx="50" cy="75" rx="35" ry="28" fill={body} />
      <ellipse cx="50" cy="82" rx="22" ry="18" fill={belly} />
      <ellipse cx="50" cy="45" rx="30" ry="28" fill={body} />
      <ellipse cx="25" cy="28" rx="8" ry="10" fill={dark} />
      <ellipse cx="75" cy="28" rx="8" ry="10" fill={dark} />
      <ellipse cx="25" cy="28" rx="4" ry="6" fill="#FFB6C1" />
      <ellipse cx="75" cy="28" rx="4" ry="6" fill="#FFB6C1" />
      <ellipse cx="50" cy="42" rx="20" ry="18" fill={belly} opacity="0.6" />
      {hit === 'correct' ? (
        <>
          <text x="35" y="48" fontSize="14" textAnchor="middle" fill="#FFD700">★</text>
          <text x="65" y="48" fontSize="14" textAnchor="middle" fill="#FFD700">★</text>
        </>
      ) : (
        <>
          <ellipse cx="38" cy="42" rx="5" ry="6" fill="white" />
          <ellipse cx="62" cy="42" rx="5" ry="6" fill="white" />
          <circle cx="39" cy="43" r="3" fill="#1A1A2E" />
          <circle cx="63" cy="43" r="3" fill="#1A1A2E" />
          <circle cx="40" cy="42" r="1" fill="white" />
          <circle cx="64" cy="42" r="1" fill="white" />
        </>
      )}
      <ellipse cx="50" cy="54" rx="4" ry="3" fill="#8B4513" />
      <path d="M 45 60 Q 50 64 55 60" stroke="#8B4513" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <rect x="46" y="60" width="3" height="5" fill="white" rx="1" />
      <rect x="51" y="60" width="3" height="5" fill="white" rx="1" />
      <ellipse cx="22" cy="90" rx="8" ry="6" fill={dark} />
      <ellipse cx="78" cy="90" rx="8" ry="6" fill={dark} />
      {hit === 'correct' && <ellipse cx="50" cy="55" rx="38" ry="50" fill="#4ADE80" opacity="0.4" />}
    </svg>
  );
};
const Hole: React.FC = () => (
  <div className="absolute bottom-0 left-0 w-full h-[40%]">
    <div className="absolute inset-x-0 bottom-0 h-full bg-gradient-to-t from-[#5D3A1A] via-[#8B5A2B] to-[#A0522D] rounded-t-[50%]" />
    <div className="absolute top-2 left-1/2 -translate-x-1/2 w-[70%] h-[20%] bg-gradient-to-b from-[#CD853F]/60 to-transparent rounded-[50%]" />
            <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-[75%] h-[55%] rounded-[50%] bg-[#EEF2FF]" style={{ boxShadow: 'inset 0 8px 20px rgba(0,0,0,0.9), inset 0 -2px 4px rgba(139,90,43,0.5)' }} />
    <div className="absolute bottom-[48%] left-1/2 -translate-x-1/2 w-[78%] h-[15%] bg-gradient-to-b from-[#6B4423] to-[#8B5A2B] rounded-[50%]" />
  </div>
);
const Bg: React.FC = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    <div className="absolute top-20 -left-20 w-60 h-60 bg-purple-600/20 rounded-full blur-3xl" />
    <div className="absolute bottom-20 -right-20 w-80 h-80 bg-cyan-500/20 rounded-full blur-3xl" />
  </div>
);
const WhackMoleGame: React.FC<WhackMoleGameProps> = ({ onBack }) => {
  const { speak } = useSpeech();
  const sfx = useSoundEffects();
  const [view, setView] = useState<ViewState>('intro');
  const [difficulty, setDifficulty] = useState(3);
  const [loading, setLoading] = useState(false);
  const [paused, setPaused] = useState(false);
  const [targetMeaning, setTargetMeaning] = useState('');
  const [gameId, setGameId] = useState('');
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [totalQ, setTotalQ] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [timeLeft, setTimeLeft] = useState(DURATION);
  const [moles, setMoles] = useState<MoleState[]>([]);
  const [floats, setFloats] = useState<FloatScore[]>([]);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [hammer, setHammer] = useState<{ hole: number; id: number } | null>(null);
  const [highScore, setHighScore] = useState(0);
  const [comboFx, setComboFx] = useState(false);
  const [isNewRecord, setIsNewRecord] = useState(false);
  const [waveId, setWaveId] = useState(0);
  const gameTimer = useRef<number | null>(null);
  const waveTimer = useRef<number | null>(null);
  const poolRef = useRef<WhackMoleWord[]>([]);
  const targetRef = useRef<WhackMoleWord | null>(null);
  const floatId = useRef(0);
  const particleId = useRef(0);
  const hammerId = useRef(0);
  const pausedRef = useRef(false);
  const molesRef = useRef<MoleState[]>([]);
  const timeRef = useRef(DURATION);
  const comboRef = useRef(0);

  useEffect(() => {
    return () => {
      sfx.cleanup();
      clearTimer(gameTimer.current);
      gameTimer.current = null;
      clearTimeoutTimer(waveTimer.current);
      waveTimer.current = null;
    };
  }, [sfx]);

  useEffect(() => { molesRef.current = moles; }, [moles]);
  useEffect(() => { timeRef.current = timeLeft; }, [timeLeft]);
  useEffect(() => { comboRef.current = combo; }, [combo]);
  useEffect(() => { pausedRef.current = paused; }, [paused]);
  const generateWave = useCallback(() => {
    const pool = poolRef.current;
    if (pool.length < 3 || !targetRef.current) return;
    const count = Math.min(5, 3 + Math.floor(Math.random() * 3));
    const holes = Array.from({ length: HOLES }, (_, i) => i);
    const selected: number[] = [];
    for (let i = 0; i < count && holes.length > 0; i++) {
      const idx = Math.floor(Math.random() * holes.length);
      selected.push(holes[idx]);
      holes.splice(idx, 1);
    }
    const distractors = pool.filter(w => w.word !== targetRef.current?.word).sort(() => Math.random() - 0.5);
    setWaveId(w => w + 1);
    const wid = waveId + 1;
    const newMoles: MoleState[] = selected.map((h, i) => ({
      holeIndex: h,
      word: i === 0 ? (targetRef.current as WhackMoleWord) : distractors[(i - 1) % distractors.length],
      isTarget: i === 0,
      isHit: false,
      hitType: null,
      waveId: wid,
    })).sort(() => Math.random() - 0.5);
    setMoles(newMoles);
    sfx.pop();
  }, [sfx, waveId]);
  const pickTarget = useCallback(() => {
    const pool = poolRef.current;
    if (!pool.length) return;
    const w = pool[Math.floor(Math.random() * pool.length)];
    targetRef.current = w;
    setTargetMeaning(w.meaning);
  }, []);
  const addFloat = useCallback((h: number, text: string, type: 'positive' | 'negative') => {
    const id = floatId.current++;
    setFloats(prev => [...prev, { id, holeIndex: h, text, type }]);
    setTimeout(() => setFloats(prev => prev.filter(f => f.id !== id)), 1000);
  }, []);
  const spawnStars = useCallback((h: number) => {
    const arr: Particle[] = Array.from({ length: 6 }, (_, i) => ({
      id: particleId.current++, holeIndex: h, angle: (i / 6) * Math.PI * 2 + Math.random() * 0.5,
    }));
    setParticles(prev => [...prev, ...arr]);
    setTimeout(() => {
      const ids = new Set(arr.map(p => p.id));
      setParticles(prev => prev.filter(p => !ids.has(p.id)));
    }, 800);
  }, []);
  const showHammer = useCallback((h: number) => {
    const id = hammerId.current++;
    setHammer({ hole: h, id });
    setTimeout(() => setHammer(hm => (hm && hm.id === id ? null : hm)), 300);
  }, []);
  const handleHit = useCallback((mole: MoleState) => {
    if (mole.isHit || pausedRef.current) return;
    setTotalQ(t => t + 1);
    showHammer(mole.holeIndex);
    if (mole.isTarget) {
      const nc = comboRef.current + 1;
      setCombo(nc); setMaxCombo(m => Math.max(m, nc));
      setCorrectCount(c => c + 1);
      let p = PTS;
      if (nc >= COMBO_TH) {
        p += nc * 2;
        if (nc % COMBO_TH === 0) { setComboFx(true); sfx.combo(); setTimeout(() => setComboFx(false), 800); }
      }
      setScore(s => s + p);
      addFloat(mole.holeIndex, `+${p}`, 'positive');
      spawnStars(mole.holeIndex);
      sfx.correct();
      speak(mole.word.word, { lang: 'en-US' });
      setMoles(prev => prev.map(m => m.holeIndex === mole.holeIndex ? { ...m, isHit: true, hitType: 'correct' } : m));
      setTimeout(() => { pickTarget(); generateWave(); }, 450);
    } else {
      setCombo(0);
      setScore(s => Math.max(0, s - PENALTY));
      addFloat(mole.holeIndex, `-${PENALTY}`, 'negative');
      sfx.wrong();
      setMoles(prev => prev.map(m => m.holeIndex === mole.holeIndex ? { ...m, isHit: true, hitType: 'wrong' } : m));
    }
  }, [addFloat, sfx, speak, pickTarget, generateWave, spawnStars, showHammer]);
  const startGame = useCallback(async () => {
    setLoading(true);
    try {
      const data = await generateWhackMole({ difficulty, count: 15 });
      poolRef.current = data.words;
      setGameId(data.gameId);
      targetRef.current = data.words.find(w => w.isTarget) || data.words[0];
      setTargetMeaning(data.targetMeaning);
      setScore(0); setCorrectCount(0); setTotalQ(0); setCombo(0); setMaxCombo(0);
      setTimeLeft(DURATION); setMoles([]); setFloats([]); setParticles([]);
      setPaused(false); pausedRef.current = false; setIsNewRecord(false);
      setView('play');
      setTimeout(() => generateWave(), 600);
    } catch (err) {
      logger.error('生成打地鼠题目失败', err as Error);
    } finally { setLoading(false); }
  }, [difficulty, generateWave]);
  const finishGame = useCallback(() => {
    if (gameTimer.current) clearInterval(gameTimer.current);
    if (waveTimer.current) clearTimeout(waveTimer.current);
    sfx.gameOver();
    const sc = score, tq = totalQ, cc = correctCount, mc = maxCombo;
    submitWhackMole({ score: sc, totalQuestions: tq, correctCount: cc, durationSec: DURATION, difficulty, details: { maxCombo: mc, gameId } })
      .then(r => { if (r.newBestScore) { setHighScore(sc); setIsNewRecord(true); } })
      .catch((e: Error) => logger.error('提交成绩失败', e));
    setView('result');
  }, [score, totalQ, correctCount, maxCombo, difficulty, gameId, sfx]);
  // 倒计时
  useEffect(() => {
    if (view !== 'play') return;
    gameTimer.current = window.setInterval(() => {
      if (pausedRef.current) return;
      setTimeLeft(t => {
        if (t <= 1) { if (gameTimer.current) clearInterval(gameTimer.current); finishGame(); return 0; }
        const n = t - 1;
        if (n <= 3 && n > 0) sfx.tick();
        return n;
      });
    }, 1000);
    return () => { if (gameTimer.current) clearInterval(gameTimer.current); };
  }, [view, finishGame, sfx]);
  // 波次
  useEffect(() => {
    if (view !== 'play' || paused) return;
    const getInt = () => {
      const p = Math.min(1, (DURATION - timeRef.current) / DURATION);
      return Math.max(MIN_INTERVAL, BASE_INTERVAL - (BASE_INTERVAL - MIN_INTERVAL) * p);
    };
    const schedule = () => {
      waveTimer.current = window.setTimeout(() => {
        if (!pausedRef.current) {
          if (molesRef.current.some((m: MoleState) => m.isTarget && !m.isHit)) {
            setCombo(0); setTotalQ(t => t + 1);
          }
          pickTarget(); generateWave();
        }
        schedule();
      }, getInt());
    };
    schedule();
    return () => { if (waveTimer.current) clearTimeout(waveTimer.current); };
  }, [view, paused, pickTarget, generateWave]);
  const togglePause = useCallback(() => setPaused(p => { pausedRef.current = !p; return !p; }), []);
  const accuracy = useMemo(() => totalQ > 0 ? Math.round((correctCount / totalQ) * 100) : 0, [correctCount, totalQ]);
  const grade = useMemo(() => {
    const s = score;
    if (s >= 500) return { g: 'S', c: 'from-yellow-400 to-orange-500', glow: '#FBBF24', emo: '👑' };
    if (s >= 350) return { g: 'A', c: 'from-green-400 to-emerald-500', glow: '#34D399', emo: '🌟' };
    if (s >= 200) return { g: 'B', c: 'from-blue-400 to-cyan-500', glow: '#38BDF8', emo: '👍' };
    if (s >= 100) return { g: 'C', c: 'from-purple-400 to-violet-500', glow: '#818CF8', emo: '💪' };
    return { g: 'D', c: 'from-gray-400 to-slate-500', glow: '#9CA3AF', emo: '🎯' };
  }, [score]);
  const isLow = timeLeft <= 10;
  const prog = (timeLeft / DURATION) * 100;
  if (view === 'intro') return (
    <div className="min-h-screen bg-[#EEF2FF] p-4 md:p-6 flex flex-col relative overflow-hidden">
      <Bg />
      <button onClick={onBack} className="flex items-center gap-1 text-purple-200 hover:text-white text-sm font-medium self-start relative z-10">
        <ArrowLeft size={18} />返回游戏乐园
      </button>
      <div className="flex-1 flex flex-col items-center justify-center py-6 relative z-10">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring' }} className="text-center mb-4">
          <div className="relative w-28 h-28 mx-auto mb-2">
            <div className="absolute bottom-0 inset-x-0 h-[45%]"><Hole /></div>
            <motion.div
              className="absolute bottom-[25%] left-1/2 -translate-x-1/2 w-16 h-20"
              animate={{ y: [30, -5, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', times: [0, 0.4, 0.6] }}
            >
              <Mole hit={null} />
              <div className="absolute -top-1 left-1/2 -translate-x-1/2 whitespace-nowrap px-2 py-0.5 bg-white rounded-full text-[10px] font-bold text-purple-900 shadow-md">hello</div>
            </motion.div>
          </div>
        </motion.div>
        <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-purple-400 to-cyan-400 mb-1 text-center">
          单词打地鼠
        </motion.h1>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="text-purple-200 text-sm mb-6">眼疾手快，击中目标单词！</motion.p>
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="w-full max-w-md bg-[#FFFFFF]/80 backdrop-blur-md rounded-2xl p-5 border border-purple-500/30 space-y-5">
          <div>
            <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
              <Sparkles size={16} className="text-yellow-400" />游戏玩法
            </h3>
            <ul className="text-sm text-purple-200 space-y-1.5 list-disc pl-5">
              <li>看顶部中文释义，快速找出对应英文地鼠</li>
              <li>点对 +10 分，连击越多奖励越高</li>
              <li>60 秒限时挑战，速度会越来越快！</li>
            </ul>
          </div>
          <div>
            <label className="text-sm font-bold text-white mb-3 block">难度：{DIFF_LABELS[difficulty - 1]}</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map(l => (
                <button key={l} onClick={() => setDifficulty(l)}
                  className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-1 transition-all
                    ${difficulty >= l ? 'text-yellow-400 bg-yellow-400/20 border-2 border-yellow-400/50 shadow-lg shadow-yellow-500/20'
                      : 'text-purple-400 bg-purple-500/10 border-2 border-transparent'}`}>
                  <Star size={18} fill={difficulty >= l ? 'currentColor' : 'none'} />
                </button>
              ))}
            </div>
          </div>
          {highScore > 0 && (
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.5, type: 'spring' }}
              className="flex items-center justify-between p-3 bg-yellow-400/10 rounded-xl border border-yellow-400/30">
              <div className="flex items-center gap-2"><Trophy size={18} className="text-yellow-400" /><span className="text-sm text-yellow-200">历史最高分</span></div>
              <span className="text-lg font-bold text-yellow-400">{highScore}</span>
            </motion.div>
          )}
          <motion.button whileHover={{ scale: 1.03, boxShadow: '0 0 30px rgba(99, 102, 241, 0.3)' }} whileTap={{ scale: 0.97 }}
            onClick={startGame} disabled={loading}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-500 text-white font-bold text-lg shadow-lg shadow-purple-500/40 disabled:opacity-60 disabled:hover:scale-100">
            {loading ? '加载中...' : '🎮 开始游戏'}
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
  // ===== Play =====
  if (view === 'play') return (
    <div className="min-h-screen bg-[#EEF2FF] p-3 md:p-4 flex flex-col relative overflow-hidden">
      <Bg />
      <div className="flex items-center justify-between mb-3 relative z-10">
        <button onClick={onBack} className="flex items-center gap-1 text-purple-200 hover:text-white text-sm font-medium">
          <ArrowLeft size={18} />退出
        </button>
        <div className="relative w-14 h-14">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 44 44">
        <circle cx="22" cy="22" r="18" fill="none" stroke="rgba(99,102,241,0.12)" strokeWidth="4" />
        <motion.circle cx="22" cy="22" r="18" fill="none" stroke={isLow ? '#EF4444' : '#06B6D4'} strokeWidth="4" strokeLinecap="round" strokeDasharray={113.1} animate={{ strokeDashoffset: 113.1 - (113.1 * prog) / 100 }} transition={{ duration: 0.5, ease: 'linear' }} style={{ filter: isLow ? 'drop-shadow(0 0 6px #EF4444)' : 'drop-shadow(0 0 6px #06B6D4)' }} />
      </svg>
          <motion.div className="absolute inset-0 flex items-center justify-center font-bold text-sm"
            animate={isLow ? { scale: [1, 1.15, 1] } : {}}
            transition={isLow ? { duration: 0.8, repeat: Infinity } : {}}>
            <span className={isLow ? 'text-red-400' : 'text-cyan-300'}>{timeLeft}</span>
          </motion.div>
        </div>
        <button onClick={togglePause} className="p-2 rounded-full bg-purple-500/30 text-purple-200 hover:bg-purple-500/50 transition-colors">
          {paused ? <Play size={18} /> : <Pause size={18} />}
        </button>
      </div>

      <div className="flex items-center justify-between mb-3 relative z-10">
        <div className="text-center">
          <motion.div key={score} initial={{ scale: 1 }} animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 0.3 }}
            className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-400">{score}</motion.div>
          <div className="text-xs text-purple-300">得分</div>
        </div>
        <AnimatePresence>
          {combo > 0 && (
            <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-black
                ${combo >= COMBO_TH ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-lg shadow-orange-500/50' : 'bg-purple-500/30 text-purple-200'}`}>
              <Zap size={16} fill="currentColor" />{combo} 连击
            </motion.div>
          )}
        </AnimatePresence>
        <div className="text-center">
          <div className="text-2xl font-bold text-cyan-400">{correctCount}</div>
          <div className="text-xs text-purple-300">击中</div>
        </div>
      </div>
      <motion.div key={targetMeaning} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
        className="bg-gradient-to-r from-purple-600/40 to-pink-600/40 backdrop-blur-sm rounded-2xl p-3 mb-4 text-center border border-purple-400/30 relative z-10"
        style={{ boxShadow: '0 0 20px rgba(99,102,241,0.2)' }}>
        <div className="flex items-center justify-center gap-2 mb-1">
          <Target size={14} className="text-pink-400" />
          <span className="text-xs text-purple-200 font-medium">目标单词</span>
        </div>
        <div className="text-xl font-bold text-white drop-shadow-lg">{targetMeaning}</div>
      </motion.div>

      <div className="flex-1 flex items-center justify-center relative z-10">
        <div className="relative w-full max-w-md">
          <div className="grid grid-cols-3 gap-2 md:gap-3">
            {Array.from({ length: HOLES }, (_, hi) => {
              const mole = moles.find(m => m.holeIndex === hi);
              const fs = floats.filter(f => f.holeIndex === hi);
              const ps = particles.filter(p => p.holeIndex === hi);
              const hm = hammer?.hole === hi;
              return (
                <div key={hi} className="relative aspect-square flex items-end justify-center overflow-hidden">
                  <Hole />
                  <AnimatePresence mode="wait">
                    {mole && !mole.isHit && (
                      <motion.button
                        key={`up-${mole.waveId}-${hi}`}
                        initial={{ y: '100%' }}
                        animate={{ y: '0%' }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', stiffness: 300, damping: 20, delay: (hi % 3) * 0.05 }}
                        onClick={() => handleHit(mole)}
                        className="absolute bottom-[20%] left-1/2 -translate-x-1/2 w-[70%] z-10 focus:outline-none"
                        style={{ touchAction: 'manipulation' }}
                      >
                        <motion.div animate={{ y: [0, -3, 0] }} transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}>
                          <Mole hit={null} />
                          <div className="absolute -top-2 left-1/2 -translate-x-1/2 whitespace-nowrap px-2 py-0.5 bg-white rounded-full text-[10px] md:text-xs font-bold text-purple-900 shadow-md">
                            {mole.word.word}
                          </div>
                        </motion.div>
                      </motion.button>
                    )}
                    {mole && mole.isHit && (
                      <motion.button
                        key={`dn-${mole.waveId}-${hi}`}
                        initial={{ y: '0%', scale: 1 }}
                        animate={{
                          y: '100%',
                          scale: mole.hitType === 'correct' ? 1.2 : 1,
                          rotate: mole.hitType === 'wrong' ? [0, -8, 8, -6, 6, 0] : 0,
                        }}
                        transition={{ duration: 0.35 }}
                        className="absolute bottom-[20%] left-1/2 -translate-x-1/2 w-[70%] z-10 pointer-events-none"
                      >
                        <Mole hit={mole.hitType} />
                        <div className={`absolute -top-2 left-1/2 -translate-x-1/2 whitespace-nowrap px-2 py-0.5 rounded-full text-[10px] md:text-xs font-bold shadow-md text-white
                          ${mole.hitType === 'correct' ? 'bg-green-500' : 'bg-red-500'}`}>
                          {mole.word.word}
                        </div>
                      </motion.button>
                    )}
                  </AnimatePresence>
                  <AnimatePresence>
                    {hm && (
                      <motion.div key={hammer?.id} initial={{ y: -60, rotate: -45, opacity: 0 }}
                        animate={{ y: 0, rotate: 15, opacity: 1 }} exit={{ y: -40, rotate: -30, opacity: 0 }}
                        transition={{ duration: 0.2, ease: 'easeOut' }}
                        className="absolute top-0 left-1/2 -translate-x-1/2 z-20 text-4xl pointer-events-none">🔨</motion.div>
                    )}
                  </AnimatePresence>
                  {ps.map(p => (
                    <motion.div key={p.id} initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
                      animate={{ x: Math.cos(p.angle) * 40, y: Math.sin(p.angle) * 50 - 20, scale: 1, opacity: 0 }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                      className="absolute top-1/2 left-1/2 -translate-x-1/2 text-yellow-400 z-20 pointer-events-none text-lg">✨</motion.div>
                  ))}
                  {fs.map(f => (
                    <motion.div key={f.id} initial={{ y: 0, opacity: 1, scale: 0.8 }}
                      animate={{ y: -60, opacity: 0, scale: 1.2 }} transition={{ duration: 1, ease: 'easeOut' }}
                      className={`absolute top-0 left-1/2 -translate-x-1/2 font-black text-lg z-20 pointer-events-none
                        ${f.type === 'positive' ? 'text-green-400' : 'text-red-400'}`}
                      style={{ textShadow: '0 0 10px currentColor, 0 0 20px currentColor' }}>{f.text}</motion.div>
                  ))}
                </div>
              );
            })}
          </div>
          <AnimatePresence>
            {comboFx && (
              <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1.3 }}
                exit={{ opacity: 0, scale: 1.5 }} transition={{ duration: 0.8, type: 'spring' }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 pointer-events-none">
                <div className="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-orange-400 to-red-500"
                  style={{ textShadow: '0 0 30px rgba(251,191,36,0.8)', WebkitTextStroke: '2px white' }}>
                  COMBO x{combo}!
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <AnimatePresence>
            {paused && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/70 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center z-30">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.1 }} className="text-5xl mb-3">⏸️</motion.div>
                <div className="text-xl font-bold text-white mb-4">游戏暂停</div>
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={togglePause}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-green-400 to-cyan-500 text-white font-bold shadow-lg">▶ 继续游戏</motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      <div className="text-center text-xs text-purple-300/70 mt-3 relative z-10">点击与中文释义匹配的地鼠单词</div>
    </div>
  );
  // ===== Result =====
  return (
    <div className="min-h-screen bg-[#EEF2FF] p-4 md:p-6 flex flex-col relative overflow-hidden">
      <Bg />
      <button onClick={onBack} className="flex items-center gap-1 text-purple-200 hover:text-white text-sm font-medium self-start relative z-10">
        <ArrowLeft size={18} />返回游戏乐园
      </button>
      <div className="flex-1 flex flex-col items-center justify-center py-4 relative z-10">
        <motion.div initial={{ opacity: 0, scale: 0.3, rotate: -20 }} animate={{ opacity: 1, scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }} className="relative mb-6">
          <div className={`w-28 h-28 md:w-32 md:h-32 rounded-full bg-gradient-to-br ${grade.c} flex items-center justify-center`}
            style={{ boxShadow: `0 0 40px ${grade.glow}, 0 0 80px ${grade.glow}40` }}>
            <span className="text-5xl md:text-6xl font-black text-white drop-shadow-lg">{grade.g}</span>
          </div>
          <motion.div initial={{ scale: 0, rotate: -30 }} animate={{ scale: 1, rotate: 15 }} transition={{ type: 'spring', delay: 0.6 }} className="absolute -top-2 -right-2 text-4xl">{grade.emo}</motion.div>
          {grade.g === 'S' && Array.from({ length: 6 }).map((_, i) => (
            <motion.div key={i} initial={{ opacity: 0, scale: 0 }} animate={{ opacity: [0, 1, 1, 0], scale: [0, 1, 1.2, 0.8] }} transition={{ duration: 2, delay: 0.8 + i * 0.2, repeat: Infinity, repeatDelay: 1 }} className="absolute text-yellow-300 text-xl" style={{ top: `${50 + 55 * Math.sin((i / 6) * Math.PI * 2)}%`, left: `${50 + 55 * Math.cos((i / 6) * Math.PI * 2)}%`, transform: 'translate(-50%,-50%)' }}>✨</motion.div>
          ))}
        </motion.div>
        <motion.h2 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-purple-400 to-cyan-400 mb-1">
          游戏结束！
        </motion.h2>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="text-purple-300 text-sm mb-5">
          {score >= 350 ? '太棒了，单词小能手！' : score >= 200 ? '表现不错，继续加油！' : score >= 100 ? '有进步空间，多多练习～' : '别灰心，熟能生巧！'}
        </motion.p>
        <AnimatePresence>
          {isNewRecord && (
            <motion.div initial={{ opacity: 0, y: -10, scale: 0.8 }} animate={{ opacity: 1, y: 0, scale: 1 }}
              className="mb-4 px-4 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full text-white font-bold text-sm shadow-lg shadow-yellow-500/50">
              🎉 新纪录！
            </motion.div>
          )}
        </AnimatePresence>
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="w-full max-w-md bg-[#FFFFFF]/80 backdrop-blur-md rounded-2xl p-5 border border-purple-500/30 space-y-4">
          <div className="text-center pb-4 border-b border-purple-500/20">
            <motion.div initial={{ scale: 0.5 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.5 }}
              className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">{score}</motion.div>
            <div className="text-sm text-purple-300 mt-1">最终得分</div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-green-500/10 rounded-xl p-3 text-center border border-green-500/20">
              <div className="text-2xl font-bold text-green-400">{accuracy}%</div>
              <div className="text-xs text-purple-300 mt-1">正确率</div>
            </div>
            <div className="bg-orange-500/10 rounded-xl p-3 text-center border border-orange-500/20">
              <div className="text-2xl font-bold text-orange-400">{maxCombo}</div>
              <div className="text-xs text-purple-300 mt-1">最高连击</div>
            </div>
            <div className="bg-cyan-500/10 rounded-xl p-3 text-center border border-cyan-500/20">
              <div className="text-2xl font-bold text-cyan-400">{correctCount}</div>
              <div className="text-xs text-purple-300 mt-1">正确数</div>
            </div>
            <div className="bg-pink-500/10 rounded-xl p-3 text-center border border-pink-500/20">
              <div className="text-2xl font-bold text-pink-400">{totalQ}</div>
              <div className="text-xs text-purple-300 mt-1">总题数</div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 pt-2">
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setView('intro')}
              className="py-3 rounded-xl bg-purple-500/20 text-purple-200 font-semibold text-sm flex items-center justify-center gap-2 hover:bg-purple-500/30 border border-purple-500/30">
              <RotateCcw size={16} />重新设置
            </motion.button>
            <motion.button whileHover={{ scale: 1.02, boxShadow: '0 0 20px rgba(99,102,241,0.35)' }} whileTap={{ scale: 0.98 }}
              onClick={startGame} disabled={loading}
              className="py-3 rounded-xl bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-500 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-purple-500/40 disabled:opacity-60">
              🎮 再来一局
            </motion.button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
export default WhackMoleGame;
