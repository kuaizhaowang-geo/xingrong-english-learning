import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Trophy, Star, RotateCcw, Sparkles, Pause, Play,
  Target, Footprints, Clock, Flame, Volume2, VolumeX, Zap,
} from 'lucide-react';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { generateWordMatch, submitWordMatch } from '@client/src/api/games';
import type { WordMatchPair } from '@shared/api.interface';

interface WordMatchGameProps { onBack: () => void; }
type ViewState = 'intro' | 'play' | 'result';
type CardType = 'word' | 'meaning';
interface GameCard {
  uid: string; pairId: string; type: CardType; content: string;
  status: 'hidden' | 'flipped' | 'matched' | 'miss';
}

const DIFF_LABELS = ['入门', '简单', '中等', '困难', '大师'];
const PAIR_MAP: Record<number, number> = { 1: 4, 2: 6, 3: 8, 4: 10, 5: 12 };
const stepsLimit = (n: number): number => Math.floor(n * 2.8);
const HS_KEY = 'word_match_high_score';

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function buildCards(pairs: WordMatchPair[]): GameCard[] {
  const c: GameCard[] = [];
  for (const p of pairs) {
    c.push({ uid: `${p.id}-w`, pairId: p.id, type: 'word', content: p.word, status: 'hidden' });
    c.push({ uid: `${p.id}-m`, pairId: p.id, type: 'meaning', content: p.meaning, status: 'hidden' });
  }
  return shuffle(c);
}
function gridCols(n: number): string {
  if (n <= 16) return 'grid-cols-4';
  if (n <= 20) return 'grid-cols-4 sm:grid-cols-5';
  return 'grid-cols-5 sm:grid-cols-6';
}

// === 音效 ===
class Sfx {
  private ctx: AudioContext | null = null;
  on = true;
  private ac(): AudioContext | null {
    if (!this.on) return null;
    if (!this.ctx) { try { this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)(); } catch { return null; } }
    return this.ctx;
  }
  private tone(f: number, d: number, t: OscillatorType = 'sine', v = 0.15, dl = 0) {
    const ctx = this.ac(); if (!ctx) return;
    const t0 = ctx.currentTime + dl;
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = t; o.frequency.setValueAtTime(f, t0);
    g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(v, t0 + 0.01);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + d);
    o.connect(g).connect(ctx.destination); o.start(t0); o.stop(t0 + d + 0.02);
  }
  flip() { this.tone(520, 0.08, 'sine', 0.1); }
  match() { this.tone(523, 0.1, 'sine', 0.12); this.tone(659, 0.1, 'sine', 0.12, 0.08); this.tone(784, 0.18, 'sine', 0.14, 0.16); }
  miss() { this.tone(200, 0.15, 'sawtooth', 0.1); }
  combo(l: number) { const b = 600 + l * 80; this.tone(b, 0.08, 'triangle', 0.12); this.tone(b * 1.25, 0.1, 'triangle', 0.12, 0.06); }
  end(win: boolean) {
    if (win) [523, 659, 784, 1047].forEach((f, i) => this.tone(f, 0.2, 'sine', 0.15, i * 0.12));
    else [400, 350, 300].forEach((f, i) => this.tone(f, 0.25, 'sawtooth', 0.1, i * 0.15));
  }
  destroy(): void {
    if (this.ctx) {
      try { if (this.ctx.state !== 'closed') this.ctx.close().catch(() => {}); } catch { /* noop */ }
      this.ctx = null;
    }
  }
}
const sfx = new Sfx();

// === 粒子 ===
const Particles: React.FC<{ active: boolean; color: string }> = ({ active, color }) => {
  const ps = useMemo(() => Array.from({ length: 12 }, (_, i) => ({
    id: i, ang: (i / 12) * Math.PI * 2, dist: 30 + Math.random() * 20,
    size: 4 + Math.random() * 4, dl: Math.random() * 0.05,
  })), []);
  return (
    <AnimatePresence>
      {active && ps.map((p) => (
        <motion.div key={p.id} className="absolute left-1/2 top-1/2 rounded-full pointer-events-none"
          style={{ width: p.size, height: p.size, backgroundColor: color, boxShadow: `0 0 8px ${color}` }}
          initial={{ scale: 0, opacity: 1, x: '-50%', y: '-50%' }}
          animate={{
            scale: [0, 1, 0], opacity: [1, 1, 0],
            x: `calc(-50% + ${Math.cos(p.ang) * p.dist}px)`,
            y: `calc(-50% + ${Math.sin(p.ang) * p.dist}px)`,
          }}
          transition={{ duration: 0.6, delay: p.dl, ease: 'easeOut' }}
        />
      ))}
    </AnimatePresence>
  );
};

// === 卡背图案 ===
const CardBack: React.FC = () => (
  <div className="absolute inset-0 flex items-center justify-center overflow-hidden rounded-xl"
    style={{ background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 50%, #2563EB 100%)' }}>
    <div className="absolute inset-0 opacity-30">
      <div className="absolute top-2 left-2 w-6 h-6 border-2 border-white/40 rounded-full" />
      <div className="absolute bottom-2 right-2 w-4 h-4 border-2 border-white/40 rotate-45" />
      <div className="absolute top-1/2 left-1 w-2 h-2 bg-white/30 rounded-full" />
      <div className="absolute top-1 right-1/3 w-1.5 h-1.5 bg-white/30 rounded-full" />
      <div className="absolute bottom-1/3 left-1/4 w-1 h-1 bg-white/40 rounded-full" />
    </div>
    <div className="relative z-10 text-white font-black text-4xl sm:text-5xl" style={{ textShadow: '0 0 20px rgba(255,255,255,0.6), 0 0 40px rgba(99, 102, 241, 0.5)', lineHeight: 1 }}>?</div>
    <div className="absolute inset-0 rounded-xl" style={{ boxShadow: 'inset 0 0 20px rgba(255,255,255,0.15)' }} />
  </div>
);

// === 单卡 ===
const CardItem: React.FC<{
  card: GameCard; idx: number; onClick: () => void; showPs: boolean;
}> = ({ card, idx, onClick, showPs }) => {
  const flipped = card.status === 'flipped' || card.status === 'matched' || card.status === 'miss';
  const matched = card.status === 'matched';
  const miss = card.status === 'miss';
  const isWord = card.type === 'word';
  const border = isWord ? '#06B6D4' : '#6366F1';
  const tcolor = isWord ? '#06B6D4' : '#818CF8';
  const glow = isWord ? 'rgba(34,211,238,0.4)' : 'rgba(99,102,241,0.25)';
  const fs = card.content.length > 10 ? '0.7rem' : card.content.length > 6 ? '0.8rem' : '0.95rem';

  return (
    <motion.div className="relative aspect-[3/4] cursor-pointer select-none" style={{ perspective: '1000px' }}
      initial={{ opacity: 0, rotateY: -180, scale: 0.8 }}
      animate={{
        opacity: matched ? 0 : 1, rotateY: flipped ? 180 : 0,
        scale: matched ? 0 : 1, x: miss ? [0, -6, 6, -4, 4, 0] : 0,
      }}
      transition={{
        opacity: { delay: idx * 0.04, duration: 0.3 },
        rotateY: { delay: idx * 0.04, duration: 0.5, ease: [0.4, 0, 0.2, 1] },
        scale: { delay: idx * 0.04 + (matched ? 0.3 : 0), duration: matched ? 0.4 : 0.3 },
        x: { duration: 0.4 },
      }}
      onClick={onClick}
    >
      <div className="relative w-full h-full" style={{ transformStyle: 'preserve-3d' }}>
        <div className="absolute inset-0" style={{ backfaceVisibility: 'hidden' }}><CardBack /></div>
        <div className="absolute inset-0 rounded-xl flex items-center justify-center p-1"
          style={{
            backfaceVisibility: 'hidden', transform: 'rotateY(180deg)',
            background: 'linear-gradient(135deg, #FFFFFF 0%, #EEF2FF 100%)',
            border: `2px solid ${border}`,
            boxShadow: matched ? `0 0 30px ${glow}, 0 0 60px ${glow}` : `0 0 15px ${glow}`,
          }}>
          <div className="text-center font-bold break-words w-full"
            style={{ color: tcolor, fontSize: fs, textShadow: `0 0 10px ${glow}`, lineHeight: 1.2, padding: 2 }}>
            {card.content}
          </div>
        </div>
      </div>
      <Particles active={showPs} color={border} />
      <AnimatePresence>
        {miss && (
          <motion.div className="absolute inset-0 rounded-xl pointer-events-none" initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.6, 0, 0.6, 0] }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }}
            style={{ border: '3px solid #EF476F', boxShadow: '0 0 20px rgba(239,71,111,0.6)' }} />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const WordMatchGame: React.FC<WordMatchGameProps> = ({ onBack }) => {
  const [view, setView] = useState<ViewState>('intro');
  const [diff, setDiff] = useState(2);
  const [pairs, setPairs] = useState(6);
  const [hs, setHs] = useState(0);
  const [sfxOn, setSfxOn] = useState(true);
  const [cards, setCards] = useState<GameCard[]>([]);
  const [sel, setSel] = useState<string[]>([]);
  const [score, setScore] = useState(0);
  const [mc, setMc] = useState(0);
  const [sl, setSl] = useState(30);
  const [paused, setPaused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [ps, setPs] = useState<Set<string>>(new Set());
  const [comboPop, setComboPop] = useState<{ id: number; v: number } | null>(null);
  const cidRef = useRef(0);
  const gameIdRef = useRef('');
  const startRef = useRef(0);
  const durRef = useRef(0);
  const lockRef = useRef(false);
  const timerRef = useRef<number | null>(null);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    return () => { sfx.destroy(); };
  }, []);

  useEffect(() => { try { const v = localStorage.getItem(HS_KEY); if (v) setHs(parseInt(v, 10) || 0); } catch { /* no */ } }, []);
  useEffect(() => { sfx.on = sfxOn; }, [sfxOn]);

  useEffect(() => {
    if (view !== 'play' || paused) { if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; } return; }
    timerRef.current = window.setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [view, paused]);

  const triggerPs = useCallback((uid: string) => {
    setPs((p) => new Set(p).add(uid));
    setTimeout(() => setPs((p) => { const n = new Set(p); n.delete(uid); return n; }), 700);
  }, []);

  const start = useCallback(async () => {
    setLoading(true);
    try {
      const d = await generateWordMatch({ difficulty: diff, pairCount: pairs });
      gameIdRef.current = d.gameId;
      setCards(buildCards(d.pairs));
      setSel([]); setScore(0); setMc(0); setSl(stepsLimit(pairs));
      setPaused(false); setElapsed(0); setCombo(0); setMaxCombo(0); setPs(new Set());
      startRef.current = Date.now(); lockRef.current = false;
      setTimeout(() => setView('play'), 100);
    } catch (e) { logger.error('生成失败', e as Error); }
    finally { setLoading(false); }
  }, [diff, pairs]);

  const finish = useCallback(() => {
    durRef.current = Math.floor((Date.now() - startRef.current) / 1000);
    const su = stepsLimit(pairs) - sl;
    submitWordMatch({
      score, totalQuestions: pairs, correctCount: mc,
      durationSec: durRef.current, difficulty: diff,
      details: { pairCount: pairs, stepsUsed: su, gameId: gameIdRef.current, maxCombo },
    }).catch((e: Error) => logger.error('提交失败', e));
    if (score > hs) { setHs(score); try { localStorage.setItem(HS_KEY, String(score)); } catch { /* no */ } }
    sfx.end(mc >= pairs);
    setView('result');
  }, [score, mc, pairs, diff, sl, hs, maxCombo]);

  useEffect(() => {
    if (view !== 'play') return;
    if (mc >= pairs || sl <= 0) { const t = setTimeout(finish, 800); return () => clearTimeout(t); }
  }, [mc, sl, pairs, view, finish]);

  const click = useCallback((uid: string) => {
    if (paused || lockRef.current) return;
    const card = cards.find((c) => c.uid === uid);
    if (!card || card.status !== 'hidden' || sel.length >= 2) return;
    sfx.flip();
    setCards((cv) => cv.map((c) => (c.uid === uid ? { ...c, status: 'flipped' } : c)));
    const ns = [...sel, uid]; setSel(ns);
    if (ns.length === 2) {
      setSl((s) => s - 1); lockRef.current = true;
      const [a, b] = ns;
      const fc = cards.find((c) => c.uid === a)!;
      const sc = cards.find((c) => c.uid === b)!;
      const match = fc.pairId === sc.pairId && fc.type !== sc.type;
      if (match) {
        const nc = combo + 1; setCombo(nc); setMaxCombo((m) => Math.max(m, nc));
        const pts = 10 + diff * 3 + (nc > 1 ? (nc - 1) * 5 : 0);
        setScore((s) => s + pts); setMc((m) => m + 1);
        if (nc > 1) { const id = cidRef.current++; setComboPop({ id, v: nc }); sfx.combo(nc); setTimeout(() => setComboPop((p) => (p?.id === id ? null : p)), 1000); }
        else sfx.match();
        triggerPs(a); triggerPs(b);
        setTimeout(() => {
          setCards((cv) => cv.map((c) => (c.uid === a || c.uid === b ? { ...c, status: 'matched' } : c)));
          setSel([]); lockRef.current = false;
        }, 600);
      } else {
        setCombo(0); setScore((s) => Math.max(0, s - 3)); sfx.miss();
        setTimeout(() => setCards((cv) => cv.map((c) => (c.uid === a || c.uid === b ? { ...c, status: 'miss' } : c))), 200);
        setTimeout(() => {
          setCards((cv) => cv.map((c) => (c.uid === a || c.uid === b ? { ...c, status: 'hidden' } : c)));
          setSel([]); lockRef.current = false;
        }, 1100);
      }
    }
  }, [cards, sel, paused, diff, combo, triggerPs]);

  const acc = pairs > 0 ? Math.round((mc / Math.max(1, pairs)) * 100) : 0;
  const gc = gridCols(pairs * 2);
  const sl0 = stepsLimit(pairs);
  const su = sl0 - sl;
  const sp = Math.max(0, Math.min(100, (sl / sl0) * 100));

  const getRating = (): { g: string; c: string; gw: string } => {
    const eff = mc / Math.max(1, pairs);
    const se = pairs / Math.max(1, su || pairs);
    const sr = score / Math.max(1, pairs * (10 + diff * 3) + 30);
    const ts = eff * 0.5 + se * 0.3 + Math.min(1, sr) * 0.2;
    if (ts >= 0.9) return { g: 'S', c: '#FBBF24', gw: 'rgba(251,191,36,0.6)' };
    if (ts >= 0.75) return { g: 'A', c: '#06B6D4', gw: 'rgba(34,211,238,0.6)' };
    if (ts >= 0.6) return { g: 'B', c: '#34D399', gw: 'rgba(52,211,153,0.6)' };
    if (ts >= 0.4) return { g: 'C', c: '#818CF8', gw: 'rgba(167,139,250,0.6)' };
    return { g: 'D', c: '#F87171', gw: 'rgba(248,113,113,0.6)' };
  };
  const getStars = (): number => { const r = su / Math.max(1, pairs); if (r <= 1.2) return 3; if (r <= 2) return 2; return 1; };
  const newRec = score > 0 && score >= hs && view === 'result';

  const neonCard = 'rounded-2xl p-5';
  const neonBg = { background: 'rgba(26,22,53,0.8)', border: '1px solid rgba(99,102,241,0.2)' };
  const btnGrad = { background: 'linear-gradient(135deg, #6366F1 0%, #2563EB 100%)', boxShadow: '0 0 20px rgba(99,102,241,0.35)' };

  // === Intro ===
  if (view === 'intro') return (
    <div className="min-h-screen p-4 sm:p-6" style={{ background: '#EEF2FF' }}>
      <div className="max-w-lg mx-auto space-y-5">
        <button onClick={onBack} className="flex items-center gap-1 text-slate-400 hover:text-slate-200 text-sm">
          <ArrowLeft size={18} /> 返回游戏乐园
        </button>

        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="text-center py-6">
          <h1 className="text-4xl sm:text-5xl font-black mb-2" style={{
            background: 'linear-gradient(135deg, #6366F1 0%, #06B6D4 50%, #2563EB 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            filter: 'drop-shadow(0 0 20px rgba(99,102,241,0.35))',
          }}>单词消消乐</h1>
          <p className="text-slate-400 text-sm mb-6">翻牌配对 · 英文 × 中文大挑战</p>

          <div className="flex justify-center gap-3 mb-4" style={{ perspective: '1000px' }}>
            {[0, 1, 2].map((i) => (
              <motion.div key={i} className="w-14 h-20 sm:w-16 sm:h-24" style={{ transformStyle: 'preserve-3d' }}
                animate={{ rotateY: [0, 180, 360] }} transition={{ duration: 3, delay: i * 0.3, repeat: Infinity, ease: 'linear' }}>
                <div className="relative w-full h-full">
                  <div className="absolute inset-0" style={{ backfaceVisibility: 'hidden' }}><CardBack /></div>
                  <div className="absolute inset-0 rounded-xl flex items-center justify-center text-xs font-bold"
                    style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)', background: '#FFFFFF', border: '2px solid #06B6D4', color: '#06B6D4', boxShadow: '0 0 15px rgba(34,211,238,0.4)' }}>
                    {['Hello', '你好', '?'][i]}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className={neonCard} style={neonBg}>
          <h3 className="text-sm font-bold text-purple-300 flex items-center gap-2 mb-3"><Sparkles size={16} /> 游戏规则</h3>
          <ul className="text-xs text-slate-400 space-y-1.5 list-disc pl-4">
            <li>每次翻开两张卡片，英文单词 + 中文释义配对</li>
            <li>配对成功：卡片消除，得分（基础10分 + 难度加成）</li>
            <li>连续配对成功有 Combo 连击加分</li>
            <li>配对失败：卡片翻回，扣 3 分，连击中断</li>
            <li>步数用完或全部配对完成，游戏结束</li>
          </ul>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className={neonCard} style={neonBg}>
          <label className="text-sm font-bold text-purple-300 mb-3 block">难度等级</label>
          <div className="flex gap-2 mb-2">
            {[1, 2, 3, 4, 5].map((l) => (
              <button key={l} onClick={() => { setDiff(l); setPairs(PAIR_MAP[l]); }}
                className="flex-1 py-3 rounded-xl flex items-center justify-center transition-all"
                style={{
                  background: diff >= l ? 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(59,130,246,0.3))' : 'rgba(255,255,255,0.05)',
                  border: diff >= l ? '2px solid #6366F1' : '2px solid transparent',
                  color: diff >= l ? '#818CF8' : '#475569',
                  boxShadow: diff >= l ? '0 0 15px rgba(99,102,241,0.25)' : 'none',
                }}>
                <Star size={18} fill={diff >= l ? 'currentColor' : 'none'} />
              </button>
            ))}
          </div>
          <p className="text-xs text-center text-slate-400">{DIFF_LABELS[diff - 1]} · {pairs} 对 · {stepsLimit(pairs)} 步</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="flex gap-3">
          <div className="flex-1 rounded-xl p-4 flex items-center gap-3" style={{ background: 'rgba(26,22,53,0.8)', border: '1px solid rgba(251,191,36,0.3)' }}>
            <Trophy size={22} style={{ color: '#FBBF24' }} />
            <div><div className="text-xs text-slate-400">历史最高</div><div className="text-lg font-bold text-yellow-400">{hs}</div></div>
          </div>
          <button onClick={() => setSfxOn((s) => !s)} className="rounded-xl p-4 flex items-center justify-center" style={neonBg}>
            {sfxOn ? <Volume2 size={22} className="text-purple-400" /> : <VolumeX size={22} className="text-slate-600" />}
          </button>
        </motion.div>

        <motion.button initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
          onClick={start} disabled={loading}
          className="w-full py-4 rounded-xl text-white font-bold text-lg disabled:opacity-60" style={btnGrad}>
          {loading ? '加载中...' : '🚀 开始挑战'}
        </motion.button>
      </div>
    </div>
  );

  // === Play ===
  if (view === 'play') {
    const stepsColor = sl <= 5 ? '#EF476F' : sl <= 10 ? '#FBBF24' : '#06B6D4';
    return (
      <div className="min-h-screen p-3 sm:p-5" style={{ background: '#EEF2FF' }}>
        <div className="max-w-2xl mx-auto space-y-3">
          <div className="flex items-center justify-between">
            <button onClick={onBack} className="flex items-center gap-1 text-slate-400 hover:text-slate-200 text-sm">
              <ArrowLeft size={18} /> 退出
            </button>
            <div className="flex items-center gap-2">
              <button onClick={() => setSfxOn((s) => !s)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200">
                {sfxOn ? <Volume2 size={16} /> : <VolumeX size={16} />}
              </button>
              <button onClick={() => setPaused((p) => !p)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm text-slate-300" style={neonBg}>
                {paused ? <Play size={16} /> : <Pause size={16} />} {paused ? '继续' : '暂停'}
              </button>
            </div>
          </div>

          <div className="rounded-2xl p-4" style={{ background: 'rgba(26,22,53,0.8)', border: '1px solid rgba(99,102,241,0.2)' }}>
            <div className="flex items-center justify-around mb-3">
              <div className="text-center"><div className="text-xs text-slate-500 mb-0.5 flex items-center justify-center gap-1"><Sparkles size={12} style={{ color: '#FBBF24' }} /> 得分</div><div className="text-xl sm:text-2xl font-bold text-purple-400">{score}</div></div>
              <div className="w-px h-10" style={{ background: 'rgba(99,102,241,0.2)' }} />
              <div className="text-center"><div className="text-xs text-slate-500 mb-0.5 flex items-center justify-center gap-1"><Footprints size={12} style={{ color: '#06B6D4' }} /> 步数</div><div className="text-xl sm:text-2xl font-bold" style={{ color: stepsColor }}>{sl}</div></div>
              <div className="w-px h-10" style={{ background: 'rgba(99,102,241,0.2)' }} />
              <div className="text-center"><div className="text-xs text-slate-500 mb-0.5 flex items-center justify-center gap-1"><Target size={12} style={{ color: '#34D399' }} /> 配对</div><div className="text-xl sm:text-2xl font-bold text-green-400">{mc}/{pairs}</div></div>
              <div className="w-px h-10" style={{ background: 'rgba(99,102,241,0.2)' }} />
              <div className="text-center"><div className="text-xs text-slate-500 mb-0.5"><Clock size={12} className="inline" /></div><div className="text-xl sm:text-2xl font-bold text-slate-400">{Math.floor(elapsed / 60)}:{(elapsed % 60).toString().padStart(2, '0')}</div></div>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
              <motion.div className="h-full rounded-full" initial={{ width: '100%' }} animate={{ width: `${sp}%` }} transition={{ duration: 0.3 }}
                style={{ background: `linear-gradient(90deg, ${stepsColor}, #2563EB)`, boxShadow: `0 0 10px ${stepsColor}` }} />
            </div>
            <AnimatePresence>
              {combo > 1 && (
                <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.5 }}
                  className="flex items-center justify-center gap-1 mt-2">
                  <Flame size={16} style={{ color: '#FB923C' }} />
                  <span className="text-sm font-bold" style={{ color: '#FB923C' }}>{combo}x 连击！</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="relative">
            <AnimatePresence>
              {paused && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="absolute inset-0 z-20 flex items-center justify-center rounded-2xl backdrop-blur-md" style={{ background: 'rgba(13,11,31,0.85)' }}>
                  <div className="text-center">
                    <div className="text-5xl mb-3">⏸️</div>
                    <p className="text-slate-300 font-medium mb-4">游戏暂停中</p>
                    <button onClick={() => setPaused(false)} className="px-6 py-2 rounded-xl text-white font-semibold text-sm" style={btnGrad}>继续游戏</button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            <div className={`grid ${gc} gap-2 sm:gap-3`}>
              {cards.map((c, i) => <CardItem key={c.uid} card={c} idx={i} onClick={() => click(c.uid)} showPs={ps.has(c.uid)} />)}
            </div>
          </div>

          <AnimatePresence>
            {comboPop && (
              <motion.div key={comboPop.id} initial={{ opacity: 0, scale: 0.5, y: 0 }}
                animate={{ opacity: 1, scale: 1.2, y: -40 }} exit={{ opacity: 0, scale: 1, y: -60 }}
                transition={{ duration: 0.8 }} className="fixed left-1/2 top-1/2 pointer-events-none z-50 -translate-x-1/2">
                <div className="flex items-center gap-2 px-5 py-2 rounded-full font-black text-xl"
                  style={{ background: 'linear-gradient(135deg, #FB923C, #EF4444)', color: 'white', boxShadow: '0 0 30px rgba(251,146,60,0.7)' }}>
                  <Zap size={20} fill="white" /> {comboPop.v}x COMBO!
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="text-center text-xs text-slate-500 pt-2">已配对 {mc} / {pairs} 对 · 剩余 {sl} 步</div>
        </div>
      </div>
    );
  }

  // === Result ===
  const rt = getRating();
  const stars = mc >= pairs ? getStars() : 0;
  return (
    <div className="min-h-screen p-4 sm:p-6" style={{ background: '#EEF2FF' }}>
      <div className="max-w-lg mx-auto space-y-5">
        <button onClick={onBack} className="flex items-center gap-1 text-slate-400 hover:text-slate-200 text-sm">
          <ArrowLeft size={18} /> 返回游戏乐园
        </button>

        <motion.div initial={{ opacity: 0, scale: 0.8, y: -20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.6, type: 'spring' }} className="text-center py-6 rounded-2xl"
          style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(59,130,246,0.2) 100%)', border: `1px solid ${rt.gw}`, boxShadow: `0 0 40px ${rt.gw}` }}>
          <motion.div className="text-8xl sm:text-9xl font-black mb-2" initial={{ rotateY: -180 }} animate={{ rotateY: 0 }}
            transition={{ delay: 0.3, duration: 0.8, ease: 'easeOut' }}
            style={{ color: rt.c, textShadow: `0 0 30px ${rt.gw}, 0 0 60px ${rt.gw}` }}>{rt.g}</motion.div>
          <div className="flex items-center justify-center gap-1 mb-2">
            {[1, 2, 3].map((s) => (
              <motion.div key={s} initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.8 + s * 0.15, type: 'spring' }}>
                <Star size={28} fill={s <= stars ? rt.c : 'transparent'} color={s <= stars ? rt.c : '#475569'}
                  style={{ filter: s <= stars ? `drop-shadow(0 0 8px ${rt.gw})` : 'none' }} />
              </motion.div>
            ))}
          </div>
          <p className="text-slate-400 text-sm">单词消消乐挑战完成</p>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="text-5xl font-black mt-3"
            style={{ background: 'linear-gradient(135deg, #6366F1, #06B6D4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{score}</motion.div>
          <div className="text-sm text-slate-500">最终得分</div>
          {newRec && (
            <motion.div initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 1, type: 'spring' }}
              className="inline-flex items-center gap-1 px-4 py-1.5 rounded-full mt-3 text-sm font-bold"
              style={{ background: 'linear-gradient(135deg, #FBBF24, #F59E0B)', color: '#EEF2FF', boxShadow: '0 0 20px rgba(251,191,36,0.6)' }}>
              <Trophy size={16} /> 新纪录！
            </motion.div>
          )}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="rounded-2xl p-5 space-y-4" style={{ background: 'rgba(26,22,53,0.8)', border: '1px solid rgba(99,102,241,0.2)' }}>
          <div className="grid grid-cols-2 gap-3">
            {[
              { l: '配对数', v: `${mc}/${pairs}`, c: '#34D399', i: Target },
              { l: '正确率', v: `${acc}%`, c: '#06B6D4', i: Sparkles },
              { l: '使用步数', v: String(su), c: '#818CF8', i: Footprints },
              { l: '最高连击', v: `${maxCombo}x`, c: '#FB923C', i: Flame },
            ].map((it) => (
              <div key={it.l} className="rounded-xl p-4 text-center" style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${it.c}33` }}>
                <it.i size={18} className="mx-auto mb-1" style={{ color: it.c }} />
                <div className="text-2xl font-bold" style={{ color: it.c }}>{it.v}</div>
                <div className="text-xs text-slate-500 mt-0.5">{it.l}</div>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)' }}>
            <div className="flex items-center gap-2"><Clock size={18} className="text-slate-500" /><span className="text-sm text-slate-400">总用时</span></div>
            <span className="text-base font-semibold text-slate-300">{Math.floor(durRef.current / 60)}:{(durRef.current % 60).toString().padStart(2, '0')}</span>
          </div>
          <div className="flex items-center justify-between p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)' }}>
            <div className="flex items-center gap-2"><Sparkles size={18} className="text-purple-400" /><span className="text-sm text-slate-400">难度 / 对数</span></div>
            <span className="text-base font-semibold text-purple-300">{DIFF_LABELS[diff - 1]} · {pairs} 对</span>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="grid grid-cols-2 gap-3">
          <button onClick={() => setView('intro')} className="py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2"
            style={{ background: 'rgba(255,255,255,0.08)', color: '#94A3B8', border: '1px solid rgba(255,255,255,0.1)' }}>
            <ArrowLeft size={16} /> 返回设置
          </button>
          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={start}
            className="py-3.5 rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-2" style={btnGrad}>
            <RotateCcw size={16} /> 再来一局
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
};

export default WordMatchGame;
