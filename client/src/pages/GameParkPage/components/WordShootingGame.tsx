import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Volume2, Heart, Zap, Trophy, Star, Pause, Play, RotateCcw, Sparkles, Target, Clock } from 'lucide-react';
import { closeAudioContext, cancelRaf, clearTimer } from './game-audio-utils';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { generateWordShooting, submitWordShooting } from '@client/src/api/games';
import type { ShootingBalloon } from '@shared/api.interface';

interface WordShootingGameProps { onBack: () => void }
type ViewState = 'intro' | 'play' | 'result';
type Difficulty = 1 | 2 | 3;

interface BalloonInstance extends ShootingBalloon {
  bx: number; by: number; vx: number; baseY: number;
  phase: number; colorSet: number; exploded: boolean;
}
interface LaserBeam { id: number; startX: number; startY: number; endX: number; endY: number; correct: boolean }
interface Explosion { id: number; x: number; y: number; correct: boolean; color: string }
interface FloatScore { id: number; x: number; y: number; text: string; positive: boolean }

const DIFF_CFG: Record<Difficulty, { balloons: number; speed: number; label: string }> = {
  1: { balloons: 8, speed: 0.3, label: '简单' },
  2: { balloons: 10, speed: 0.5, label: '中等' },
  3: { balloons: 12, speed: 0.7, label: '困难' },
};
const BAL_COLORS = [
  { main: '#6366F1', light: '#A855F7', glow: 'rgba(99, 102, 241, 0.3)' },
  { main: '#2563EB', light: '#60A5FA', glow: 'rgba(59,130,246,0.6)' },
  { main: '#06B6D4', light: '#67E8F9', glow: 'rgba(34,211,238,0.6)' },
  { main: '#EC4899', light: '#F472B6', glow: 'rgba(236,72,153,0.6)' },
  { main: '#FBBF24', light: '#FCD34D', glow: 'rgba(251,191,36,0.6)' },
  { main: '#10B981', light: '#34D399', glow: 'rgba(16,185,129,0.6)' },
];
const GAME_TIME = 60;
const MAX_LIVES = 3;

const getRating = (acc: number, sc: number) => {
  if (acc >= 90 && sc > 300) return { g: 'S', c: '#FBBF24', l: '神枪手' };
  if (acc >= 80) return { g: 'A', c: '#10B981', l: '听力高手' };
  if (acc >= 65) return { g: 'B', c: '#2563EB', l: '表现不错' };
  if (acc >= 45) return { g: 'C', c: '#6366F1', l: '继续加油' };
  return { g: 'D', c: '#EF4444', l: '需要练习' };
};

const WordShootingGame: React.FC<WordShootingGameProps> = ({ onBack }) => {
  const [view, setView] = useState<ViewState>('intro');
  const [diff, setDiff] = useState<Difficulty>(2);
  const [hi, setHi] = useState(0);
  const [score, setScore] = useState(0);
  const [ok, setOk] = useState(0);
  const [ng, setNg] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [lives, setLives] = useState(MAX_LIVES);
  const [timeLeft, setTimeLeft] = useState(GAME_TIME);
  const [paused, setPaused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [balloons, setBalloons] = useState<BalloonInstance[]>([]);
  const [tIdx, setTIdx] = useState(0);
  const [lasers, setLasers] = useState<LaserBeam[]>([]);
  const [exps, setExps] = useState<Explosion[]>([]);
  const [fss, setFss] = useState<FloatScore[]>([]);

  const poolRef = useRef<ShootingBalloon[]>([]);
  const gidRef = useRef('');
  const animRef = useRef<number | null>(null);
  const tsRef = useRef(0);
  const timerRef = useRef<number | null>(null);
  const areaRef = useRef<HTMLDivElement>(null);
  const idRef = useRef(0);
  const startRef = useRef(0);
  const lockRef = useRef(false);
  const audioRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    return () => {
      closeAudioContext(audioRef.current);
      audioRef.current = null;
      cancelRaf(animRef.current);
      animRef.current = null;
      clearTimer(timerRef.current);
      timerRef.current = null;
    };
  }, []);

  const getAudio = useCallback(() => {
    if (!audioRef.current) {
      try { audioRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)(); }
      catch { return null; }
    }
    return audioRef.current;
  }, []);

  const playSfx = useCallback((type: 'shoot' | 'exp' | 'ok' | 'ng' | 'over', correct = true) => {
    const ctx = getAudio();
    if (!ctx) return;
    const tone = (f: number, d: number, t: OscillatorType = 'sine', v = 0.1) => {
      try {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.type = t; o.frequency.setValueAtTime(f, ctx.currentTime);
        g.gain.setValueAtTime(v, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + d);
        o.connect(g); g.connect(ctx.destination);
        o.start(); o.stop(ctx.currentTime + d);
      } catch { /* ignore */ }
    };
    if (type === 'shoot') {
      try {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.type = 'sawtooth';
        o.frequency.setValueAtTime(800, ctx.currentTime);
        o.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.15);
        g.gain.setValueAtTime(0.08, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
        o.connect(g); g.connect(ctx.destination);
        o.start(); o.stop(ctx.currentTime + 0.15);
      } catch { /* ignore */ }
    } else if (type === 'exp') {
      try {
        const sz = ctx.sampleRate * 0.3;
        const buf = ctx.createBuffer(1, sz, ctx.sampleRate);
        const d = buf.getChannelData(0);
        for (let i = 0; i < sz; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / sz, 2);
        const n = ctx.createBufferSource(); n.buffer = buf;
        const g = ctx.createGain();
        g.gain.setValueAtTime(correct ? 0.15 : 0.2, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
        const f = ctx.createBiquadFilter();
        f.type = 'lowpass'; f.frequency.value = correct ? 1500 : 800;
        n.connect(f); f.connect(g); g.connect(ctx.destination); n.start();
      } catch { /* ignore */ }
    } else if (type === 'ok') {
      tone(523, 0.1, 'sine', 0.12);
      setTimeout(() => tone(659, 0.1, 'sine', 0.12), 80);
      setTimeout(() => tone(784, 0.15, 'sine', 0.12), 160);
    } else if (type === 'ng') {
      tone(200, 0.15, 'square', 0.08);
      setTimeout(() => tone(150, 0.2, 'square', 0.08), 100);
    } else if (type === 'over') {
      tone(392, 0.15, 'sine', 0.1);
      setTimeout(() => tone(330, 0.15, 'sine', 0.1), 150);
      setTimeout(() => tone(262, 0.3, 'sine', 0.1), 300);
    }
  }, [getAudio]);

  const speak = useCallback((w: string) => {
    if (!('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(w);
      u.lang = 'en-US'; u.rate = 0.9;
      window.speechSynthesis.speak(u);
    } catch { /* ignore */ }
  }, []);

  const targetWord = poolRef.current[tIdx]?.word || '';
  const targetMeaning = poolRef.current[tIdx]?.meaning || '';

  const makeBalloon = useCallback((exclude: string[]): BalloonInstance | null => {
    const pool = poolRef.current;
    if (pool.length === 0) return null;
    let tries = 0, item: ShootingBalloon;
    do { item = pool[Math.floor(Math.random() * pool.length)]; tries++; }
    while (exclude.includes(item.word) && tries < 10);
    const cfg = DIFF_CFG[diff];
    return {
      ...item, id: item.id + '-' + Math.random(),
      bx: 8 + Math.random() * 84, by: 115,
      vx: (Math.random() - 0.5) * cfg.speed,
      baseY: 30 + Math.random() * 40,
      phase: Math.random() * Math.PI * 2,
      colorSet: Math.floor(Math.random() * BAL_COLORS.length),
      exploded: false,
    };
  }, [diff]);

  const initRound = useCallback(() => {
    const cfg = DIFF_CFG[diff];
    const pool = poolRef.current;
    if (pool.length === 0) return;
    const target = pool[tIdx];
    const used = [target.word];
    const arr: BalloonInstance[] = [];
    arr.push({
      ...target, id: target.id + '-t-' + idRef.current++,
      bx: 20 + Math.random() * 60, by: 30 + Math.random() * 40,
      vx: (Math.random() - 0.5) * cfg.speed,
      baseY: 0, phase: Math.random() * Math.PI * 2,
      colorSet: Math.floor(Math.random() * BAL_COLORS.length), exploded: false,
    });
    arr[0].baseY = arr[0].by;
    for (let i = 1; i < cfg.balloons; i++) {
      const b = makeBalloon(used);
      if (b) { b.by = 20 + Math.random() * 60; b.baseY = b.by; used.push(b.word); arr.push(b); }
    }
    setBalloons(arr);
    lockRef.current = false;
    setTimeout(() => speak(target.word), 400);
  }, [diff, tIdx, makeBalloon, speak]);

  // 主循环
  useEffect(() => {
    if (view !== 'play' || paused) return;
    const loop = (t: number) => {
      if (!tsRef.current) tsRef.current = t;
      const dt = (t - tsRef.current) / 16.67;
      tsRef.current = t;
      setBalloons(prev => prev.map(b => {
        if (b.exploded) return b;
        const cfg = DIFF_CFG[diff];
        let nx = b.bx + b.vx * dt, nvx = b.vx;
        if (nx < 5 || nx > 95) { nvx = -b.vx; nx = Math.max(5, Math.min(95, nx)); }
        const fy = Math.sin(t / 1000 + b.phase) * 3 * cfg.speed;
        return { ...b, bx: nx, vx: nvx, by: b.baseY + fy };
      }));
      animRef.current = requestAnimationFrame(loop);
    };
    animRef.current = requestAnimationFrame(loop);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); tsRef.current = 0; };
  }, [view, paused, diff]);

  // 倒计时
  useEffect(() => {
    if (view !== 'play' || paused) return;
    timerRef.current = window.setInterval(() => {
      setTimeLeft(t => { if (t <= 1) { if (timerRef.current) clearInterval(timerRef.current); endGame(); return 0; } return t - 1; });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, paused]);

  const endGame = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    playSfx('over');
    const dur = Math.floor((Date.now() - startRef.current) / 1000);
    submitWordShooting({ score, totalQuestions: ok + ng, correctCount: ok, durationSec: dur, difficulty: diff, details: { maxCombo } })
      .then(() => setHi(h => Math.max(h, score)))
      .catch((e: Error) => logger.error('提交失败', e));
    setView('result');
  }, [score, ok, ng, diff, maxCombo, playSfx]);

  // 点击气球
  const onHit = useCallback((b: BalloonInstance, e: React.MouseEvent) => {
    if (paused || b.exploded || lockRef.current) return;
    const rect = areaRef.current?.getBoundingClientRect();
    if (!rect) return;
    const cx = ((e.clientX - rect.left) / rect.width) * 100;
    const cy = ((e.clientY - rect.top) / rect.height) * 100;
    const correct = b.word.toLowerCase() === targetWord.toLowerCase();
    const lid = ++idRef.current;
    setLasers(ls => [...ls, { id: lid, startX: 50, startY: 98, endX: cx, endY: cy, correct }]);
    playSfx('shoot');
    setTimeout(() => {
      setLasers(ls => ls.filter(l => l.id !== lid));
      const eid = ++idRef.current;
      const col = BAL_COLORS[b.colorSet].main;
      setExps(es => [...es, { id: eid, x: cx, y: cy, correct, color: col }]);
      playSfx('exp', correct);
      setTimeout(() => setExps(es => es.filter(x => x.id !== eid)), 600);
      setBalloons(prev => prev.map(x => x.id === b.id ? { ...x, exploded: true } : x));
      const fid = ++idRef.current;
      if (correct) {
        playSfx('ok');
        const nc = combo + 1;
        setCombo(nc); setMaxCombo(m => Math.max(m, nc)); setOk(c => c + 1);
        const pts = 20 + Math.min(nc - 1, 10) * 2;
        setScore(s => s + pts);
        setFss(fs => [...fs, { id: fid, x: cx, y: cy, text: `+${pts}`, positive: true }]);
        lockRef.current = true;
        setTimeout(() => { setTIdx(p => (p + 1) % poolRef.current.length); }, 200);
        setTimeout(() => {
          setBalloons(prev2 => {
            const existWords = prev2.filter(x => !x.exploded).map(x => x.word);
            const nb = makeBalloon([...existWords, targetWord]);
            if (!nb) return prev2;
            const res = prev2.filter(x => !x.exploded);
            res.push(nb);
            return res;
          });
          lockRef.current = false;
        }, 500);
      } else {
        playSfx('ng');
        setCombo(0); setNg(w => w + 1); setScore(s => Math.max(0, s - 10));
        setFss(fs => [...fs, { id: fid, x: cx, y: cy, text: '-10', positive: false }]);
        setLives(l => { const nl = l - 1; if (nl <= 0) setTimeout(() => endGame(), 300); return nl; });
      }
      setTimeout(() => setFss(fs => fs.filter(f => f.id !== fid)), 1000);
    }, 200);
  }, [paused, targetWord, combo, playSfx, makeBalloon, endGame]);

  // 目标变化时发音
  useEffect(() => { if (view === 'play' && !paused && targetWord) speak(targetWord); },
    [tIdx, view, paused, targetWord, speak]);

  const startGame = useCallback(async () => {
    setLoading(true);
    try {
      const d = await generateWordShooting({ difficulty: diff, count: 15 });
      poolRef.current = d.balloons; gidRef.current = d.gameId;
      setScore(0); setOk(0); setNg(0); setCombo(0); setMaxCombo(0);
      setLives(MAX_LIVES); setTimeLeft(GAME_TIME); setPaused(false);
      setBalloons([]); setLasers([]); setExps([]); setFss([]); setTIdx(0);
      startRef.current = Date.now();
      setView('play');
      setTimeout(() => initRound(), 200);
    } catch (err) { logger.error('生成失败', err as Error); }
    finally { setLoading(false); }
  }, [diff, initRound]);

  const acc = ok + ng > 0 ? Math.round((ok / (ok + ng)) * 100) : 0;
  const rating = useMemo(() => getRating(acc, score), [acc, score]);

  // 气球组件
  const Balloon = ({ b, onClick }: { b: BalloonInstance; onClick: (e: React.MouseEvent) => void }) => {
    const c = BAL_COLORS[b.colorSet];
    return (
      <motion.button
        key={b.id} initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0, opacity: 0 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        onClick={onClick} disabled={paused} className="absolute focus:outline-none"
        style={{ left: `${b.bx}%`, top: `${b.by}%`, transform: 'translate(-50%, -50%)' }}
      >
        <div className="relative flex flex-col items-center">
          <div className="w-14 h-16 md:w-16 md:h-[72px] rounded-full relative flex items-center justify-center"
            style={{ background: `radial-gradient(ellipse at 30% 25%, rgba(255,255,255,0.9), ${c.light} 25%, ${c.main} 60%)`,
              boxShadow: `0 0 20px ${c.glow}, inset -8px -12px 20px rgba(0,0,0,0.25)` }}>
            <div className="absolute rounded-full bg-white/60"
              style={{ width: 14, height: 10, top: 10, left: 12, transform: 'rotate(-30deg)', filter: 'blur(1px)' }} />
            <span className="text-white font-black text-xs md:text-sm px-1 text-center z-10"
              style={{ textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>{b.word}</span>
          </div>
          <div className="w-0 h-0 border-l-[4px] border-r-[4px] border-t-[6px] border-l-transparent border-r-transparent -mt-0.5"
            style={{ borderTopColor: c.main }} />
          <div className="w-px h-7" style={{ background: 'linear-gradient(to bottom, rgba(255,255,255,0.5), rgba(255,255,255,0.1))' }} />
        </div>
      </motion.button>
    );
  };

  // ==== 介绍页 ====
  if (view === 'intro') return (
    <div className="min-h-screen bg-[#EEF2FF] p-4 md:p-6 text-white">
      <button onClick={onBack} className="flex items-center gap-2 text-white/70 hover:text-white text-sm mb-6 transition-colors">
        <ArrowLeft size={18} />返回游戏乐园
      </button>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-6">
        <div className="text-5xl mb-3">🎯</div>
        <h1 className="text-3xl md:text-4xl font-black mb-2 bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent"
          style={{ textShadow: '0 0 40px rgba(99,102,241,0.35)' }}>听力射击</h1>
        <p className="text-white/60 text-sm">听音辨词 · 一枪爆头 · 听力急速提升</p>
      </motion.div>
      {/* 预览气球 */}
      <div className="relative h-28 mb-5 overflow-hidden">
        {[0, 1, 2, 3, 4].map(i => (
          <motion.div key={i} className="absolute" style={{ left: `${15 + i * 18}%`, bottom: 0 }}
            animate={{ y: [-10, -30, -10], x: [0, 5, 0] }}
            transition={{ duration: 3 + i * 0.5, repeat: Infinity, ease: 'easeInOut', delay: i * 0.3 }}>
            <div className="w-10 h-12 rounded-full relative"
              style={{ background: `radial-gradient(circle at 30% 25%, rgba(255,255,255,0.8), ${BAL_COLORS[i].main} 60%)`,
                boxShadow: `0 0 20px ${BAL_COLORS[i].glow}` }}>
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[4px] border-r-[4px] border-t-[6px] border-l-transparent border-r-transparent"
                style={{ borderTopColor: BAL_COLORS[i].main }} />
            </div>
            <div className="w-px h-6 bg-white/30 mx-auto" />
          </motion.div>
        ))}
      </div>
      <div className="bg-[#FFFFFF] border border-purple-500/30 rounded-2xl p-5 mb-4" style={{ boxShadow: '0 0 30px rgba(99,102,241,0.12)' }}>
        <h3 className="text-sm font-bold text-purple-300 mb-3 flex items-center gap-2"><Sparkles size={16} />玩法说明</h3>
        <ul className="text-sm text-white/70 space-y-1.5">
          <li className="flex items-start gap-2"><span className="text-cyan-400">▸</span>听单词发音，找到对应单词的气球</li>
          <li className="flex items-start gap-2"><span className="text-green-400">▸</span>射中正确 +20分，连击有加成</li>
          <li className="flex items-start gap-2"><span className="text-red-400">▸</span>射错 -10分，损失一颗心（共3颗）</li>
          <li className="flex items-start gap-2"><span className="text-yellow-400">▸</span>60秒限时挑战，尽可能多得分！</li>
        </ul>
      </div>
      <div className="bg-[#FFFFFF] border border-purple-500/30 rounded-2xl p-5 mb-4">
        <label className="text-sm font-bold text-purple-300 mb-3 block">选择难度</label>
        <div className="grid grid-cols-3 gap-2">
          {([1, 2, 3] as Difficulty[]).map(lv => (
            <button key={lv} onClick={() => setDiff(lv)}
              className={`py-3 rounded-xl font-bold text-sm transition-all ${
                diff === lv ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' : 'bg-[#E0E7FF] text-white/60 hover:bg-[#3D3860]'
              }`}
              style={diff === lv ? { boxShadow: '0 0 20px rgba(99,102,241,0.35)' } : {}}>
              {DIFF_CFG[lv].label}
              <div className="flex justify-center mt-1 gap-0.5">
                {Array.from({ length: lv }).map((_, i) => <Star key={i} size={10} fill="currentColor" />)}
              </div>
            </button>
          ))}
        </div>
      </div>
      {hi > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="flex items-center justify-between p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-xl mb-4">
          <div className="flex items-center gap-2"><Trophy size={20} className="text-yellow-400" /><span className="text-sm text-white/80">历史最高分</span></div>
          <span className="text-xl font-black text-yellow-400">{hi}</span>
        </motion.div>
      )}
      <button onClick={startGame} disabled={loading}
        className="w-full py-4 rounded-2xl font-black text-lg bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-400 text-white shadow-2xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
        style={{ boxShadow: '0 0 30px rgba(99,102,241,0.35)' }}>
        {loading ? '加载中...' : '🚀 开始挑战'}
      </button>
    </div>
  );

  // ==== 游戏页 ====
  if (view === 'play') return (
    <div className="min-h-screen bg-[#EEF2FF] p-3 md:p-4 text-white">
      {/* 状态栏 */}
      <div className="flex items-center justify-between bg-[#FFFFFF]/80 backdrop-blur border border-purple-500/30 rounded-2xl px-4 py-3 mb-3">
        <div className="flex items-center gap-1">
          {Array.from({ length: MAX_LIVES }).map((_, i) => (
            <motion.div key={i} initial={{ scale: 1 }} animate={{ scale: i < lives ? 1 : 0 }} transition={{ type: 'spring', stiffness: 500 }}>
              <Heart size={20} fill={i < lives ? '#EF4444' : 'none'} stroke={i < lives ? '#EF4444' : '#475569'}
                style={i < lives ? { filter: 'drop-shadow(0 0 6px rgba(239,68,68,0.6))' } : {}} />
            </motion.div>
          ))}
        </div>
        <div className="text-center">
          <div className="text-xs text-white/50">分数</div>
          <div className="text-xl font-black text-yellow-400" style={{ textShadow: '0 0 10px rgba(251,191,36,0.5)' }}>{score}</div>
        </div>
        <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-bold ${
          timeLeft <= 10 ? 'bg-red-500/20 text-red-400' : 'bg-cyan-500/20 text-cyan-400'}`}>
          <Clock size={14} />{timeLeft}s
        </div>
        <button onClick={() => setPaused(p => !p)} className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors">
          {paused ? <Play size={16} /> : <Pause size={16} />}
        </button>
      </div>
      {/* 目标 */}
      <motion.div key={tIdx} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-center gap-3 bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-cyan-500/20 border border-purple-500/30 rounded-2xl px-4 py-3 mb-3">
        <Target size={18} className="text-cyan-400" />
        <span className="text-lg font-bold text-white">{targetMeaning}</span>
        <button onClick={() => speak(targetWord)}
          className="p-2 rounded-full bg-cyan-500/20 hover:bg-cyan-500/40 text-cyan-400 transition-colors"
          style={{ filter: 'drop-shadow(0 0 8px rgba(34,211,238,0.5))' }}>
          <Volume2 size={18} fill="currentColor" />
        </button>
      </motion.div>
      <AnimatePresence>{combo > 1 && (
        <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.5 }}
          className="flex items-center justify-center gap-1 mb-2">
          <Zap size={16} className="text-yellow-400" fill="currentColor" />
          <span className="text-yellow-400 font-black text-lg" style={{ textShadow: '0 0 10px rgba(251,191,36,0.7)' }}>{combo} COMBO!</span>
        </motion.div>
      )}</AnimatePresence>
      {/* 游戏区 */}
      <div ref={areaRef} className="relative w-full rounded-2xl overflow-hidden border border-purple-500/20"
        style={{ height: 460, background: 'linear-gradient(180deg, #EEF2FF 0%, #FFFFFF 50%, #2D1B4E 100%)', boxShadow: 'inset 0 0 60px rgba(99,102,241,0.12)' }}>
        {Array.from({ length: 30 }).map((_, i) => (
          <div key={i} className="absolute rounded-full bg-white"
            style={{ width: 1 + (i % 3), height: 1 + (i % 3), left: `${(i * 37) % 100}%`, top: `${(i * 23) % 70}%`, opacity: 0.2 + (i % 5) * 0.1 }} />
        ))}
        <AnimatePresence>
          {balloons.filter(x => !x.exploded).map(b => <Balloon key={b.id} b={b} onClick={e => onHit(b, e)} />)}
        </AnimatePresence>
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          {lasers.map(l => {
            const c = l.correct ? '#06B6D4' : '#EF4444';
            return <g key={l.id}>
              <motion.line initial={{ pathLength: 0, opacity: 1 }} animate={{ pathLength: 1, opacity: [1, 1, 0] }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                x1={`${l.startX}%`} y1={`${l.startY}%`} x2={`${l.endX}%`} y2={`${l.endY}%`}
                stroke={c} strokeWidth={4} strokeLinecap="round" style={{ filter: `drop-shadow(0 0 8px ${c})` }} />
              <motion.line initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.2, ease: 'easeOut' }}
                x1={`${l.startX}%`} y1={`${l.startY}%`} x2={`${l.endX}%`} y2={`${l.endY}%`}
                stroke="white" strokeWidth={2} strokeLinecap="round" />
            </g>;
          })}
        </svg>
        {exps.map(exp => {
          const c = exp.correct ? '#06B6D4' : '#EF4444';
          return (
            <div key={exp.id} className="absolute pointer-events-none" style={{ left: `${exp.x}%`, top: `${exp.y}%`, transform: 'translate(-50%,-50%)' }}>
              <motion.div initial={{ scale: 0, opacity: 1 }} animate={{ scale: 3, opacity: 0 }}
                transition={{ duration: 0.5, ease: 'easeOut' }} className="absolute rounded-full border-4"
                style={{ width: 60, height: 60, left: -30, top: -30, borderColor: c, boxShadow: `0 0 30px ${c}` }} />
              {Array.from({ length: 12 }).map((_, i) => {
                const a = (i / 12) * Math.PI * 2, d = 50 + Math.random() * 30;
                return <motion.div key={i} initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
                  animate={{ x: Math.cos(a) * d, y: Math.sin(a) * d, scale: 0, opacity: 0 }}
                  transition={{ duration: 0.6, ease: 'easeOut' }} className="absolute rounded-full"
                  style={{ width: 8, height: 8, backgroundColor: i % 2 === 0 ? c : exp.color, boxShadow: `0 0 8px ${c}`, left: -4, top: -4 }} />;
              })}
              {Array.from({ length: 6 }).map((_, i) => {
                const a = (i / 6) * Math.PI * 2 + 0.3, d = 40 + Math.random() * 20;
                return <motion.div key={`s${i}`} initial={{ x: 0, y: 0, rotate: 0, opacity: 1 }}
                  animate={{ x: Math.cos(a) * d, y: Math.sin(a) * d + 20, rotate: 360, opacity: 0 }}
                  transition={{ duration: 0.7, ease: 'easeOut' }} className="absolute"
                  style={{ width: 12, height: 8, backgroundColor: exp.color, borderRadius: 2, left: -6, top: -4 }} />;
              })}
            </div>
          );
        })}
        {fss.map(f => (
          <motion.div key={f.id} initial={{ opacity: 0, y: 0, scale: 0.5 }}
            animate={{ opacity: [0, 1, 1, 0], y: -60, scale: 1.2 }} transition={{ duration: 1, ease: 'easeOut' }}
            className="absolute pointer-events-none font-black text-2xl"
            style={{ left: `${f.x}%`, top: `${f.y}%`, transform: 'translate(-50%,-50%)',
              color: f.positive ? '#06B6D4' : '#EF4444', textShadow: `0 0 15px ${f.positive ? '#06B6D4' : '#EF4444'}` }}>
            {f.text}
          </motion.div>
        ))}
        {/* 炮台 */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none">
          <div className="w-3 h-8 rounded-t-lg" style={{ background: 'linear-gradient(to top, #6366F1, #EC4899)', boxShadow: '0 0 15px rgba(99, 102, 241, 0.3)' }} />
          <div className="w-10 h-4 rounded-t-lg" style={{ background: '#FFFFFF', border: '2px solid #6366F1' }} />
        </div>
        <AnimatePresence>{paused && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-20">
            <div className="text-center">
              <Pause size={48} className="mx-auto mb-3 text-purple-400" />
              <div className="text-xl font-bold mb-4 text-white">游戏暂停</div>
              <button onClick={() => setPaused(false)}
                className="px-8 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold hover:scale-105 transition-transform"
                style={{ boxShadow: '0 0 20px rgba(99,102,241,0.35)' }}>继续游戏</button>
            </div>
          </motion.div>
        )}</AnimatePresence>
      </div>
    </div>
  );

  // ==== 结果页 ====
  return (
    <div className="min-h-screen bg-[#EEF2FF] p-4 md:p-6 text-white flex flex-col items-center justify-center">
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring' }} className="w-full max-w-md">
        <div className="text-center mb-6">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, delay: 0.2 }} className="text-8xl font-black mb-2 mx-auto"
            style={{ color: rating.c, textShadow: `0 0 40px ${rating.c}, 0 0 80px ${rating.c}` }}>{rating.g}</motion.div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">{rating.l}</h2>
        </div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-2xl p-6 text-center mb-5"
          style={{ boxShadow: '0 0 30px rgba(99,102,241,0.12)' }}>
          <div className="text-sm text-white/60 mb-1">最终得分</div>
          <div className="text-5xl font-black text-yellow-400" style={{ textShadow: '0 0 20px rgba(251,191,36,0.5)' }}>{score}</div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="bg-[#FFFFFF] border border-purple-500/30 rounded-2xl p-5 mb-5">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-3 text-center">
              <div className="text-2xl font-black text-green-400">{ok}</div><div className="text-xs text-white/60 mt-1">击中次数</div>
            </div>
            <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-xl p-3 text-center">
              <div className="text-2xl font-black text-cyan-400">{acc}%</div><div className="text-xs text-white/60 mt-1">正确率</div>
            </div>
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-3 text-center">
              <div className="text-2xl font-black text-yellow-400">{maxCombo}</div><div className="text-xs text-white/60 mt-1">最高连击</div>
            </div>
            <div className="bg-pink-500/10 border border-pink-500/30 rounded-xl p-3 text-center">
              <div className="text-2xl font-black text-pink-400">{ok + ng}</div><div className="text-xs text-white/60 mt-1">总射击</div>
            </div>
          </div>
          {hi > 0 && (
            <div className="flex items-center justify-between p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-xl mt-4">
              <div className="flex items-center gap-2"><Trophy size={18} className="text-yellow-400" /><span className="text-sm text-white/80">历史最高分</span></div>
              <span className="text-lg font-black text-yellow-400">{Math.max(hi, score)}</span>
            </div>
          )}
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="grid grid-cols-2 gap-3">
          <button onClick={onBack} className="py-3 rounded-xl bg-[#E0E7FF] text-white/80 font-semibold text-sm flex items-center justify-center gap-2 hover:bg-[#3D3860] transition-all">
            <ArrowLeft size={16} />返回
          </button>
          <button onClick={startGame}
            className="py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold text-sm flex items-center justify-center gap-2 hover:scale-105 active:scale-95 transition-all"
            style={{ boxShadow: '0 0 20px rgba(99,102,241,0.25)' }}>
            <RotateCcw size={16} />再来一局
          </button>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default WordShootingGame;
