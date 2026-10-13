import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Heart, Trophy, Play, Pause, RotateCcw, Zap, Sparkles, Flag } from 'lucide-react';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { generateWordRunner, submitWordRunner } from '@client/src/api/games';
import type { RunnerObstacle } from '@shared/api.interface';

interface Props { onBack: () => void; }
type View = 'intro' | 'play' | 'result';
type CharState = 'run' | 'jump' | 'hit' | 'idle';
type ObsType = 'wall' | 'spike' | 'gap';

const DIF_LABELS = ['小学入门', '小学进阶', '初中', '高中', '高阶'];
const GY = 280, CX = 90, CW = 44, CH = 58;
const INIT_SPEED = 200, MAX_SPEED = 480, SPEED_INC = 1.5;
const JUMP_MS = 650, JUMP_H = 110, WPL = 5;

const gradeOf = (a: number): [string, string, string] =>
  a >= 90 ? ['S 完美', 'text-yellow-400', '#facc15'] : a >= 75 ? ['A 优秀', 'text-purple-400', '#c084fc'] :
  a >= 60 ? ['B 良好', 'text-blue-400', '#60a5fa'] : a >= 40 ? ['C 及格', 'text-green-400', '#4ade80'] :
  ['D 加油', 'text-gray-400', '#9ca3af'];

interface ObsEntity {
  id: number; type: ObsType; x: number; w: number; h: number;
  meaning: string; opts: [string, string]; cIdx: 0 | 1;
  answered: boolean; passed: boolean; isCorrect?: boolean; shown: boolean;
}
interface Particle { id: number; x: number; y: number; vx: number; vy: number; life: number; max: number; color: string; }

// ===== 音效 =====
let actx: AudioContext | null = null;
const getCtx = (): AudioContext | null => {
  if (typeof window === 'undefined') return null;
  if (!actx) try { actx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)(); } catch { return null; }
  return actx;
};
const tone = (f: number, d: number, t: OscillatorType = 'sine', v = 0.15): void => {
  const ctx = getCtx(); if (!ctx) return;
  try {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = t; o.frequency.setValueAtTime(f, ctx.currentTime);
    g.gain.setValueAtTime(v, ctx.currentTime); g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + d);
    o.connect(g).connect(ctx.destination); o.start(); o.stop(ctx.currentTime + d);
  } catch { /* noop */ }
};
const sfx = {
  jump: () => { tone(523, .08, 'sine', .12); setTimeout(() => tone(784, .1, 'sine', .1), 50); setTimeout(() => tone(1047, .12, 'sine', .08), 110); },
  score: () => { tone(880, .06, 'square', .08); setTimeout(() => tone(1318, .08, 'square', .07), 50); setTimeout(() => tone(1760, .1, 'square', .06), 100); },
  hit: () => { tone(140, .22, 'sawtooth', .18); setTimeout(() => tone(90, .25, 'square', .12), 30); },
  over: () => { [440, 349, 277, 196].forEach((f, i) => setTimeout(() => tone(f, .25, 'triangle', .12), i * 170)); },
  levelUp: () => { [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => tone(f, .14, 'sine', .1), i * 75)); },
  heartbeat: () => { tone(75, .08, 'sine', .22); setTimeout(() => tone(55, .12, 'sine', .16), 90); },
};
function cleanupAudio(): void {
  if (actx) {
    try { if (actx.state !== 'closed') actx.close().catch(() => {}); } catch { /* noop */ }
    actx = null;
  }
}

// ===== SVG 奔跑小人 =====
const Runner: React.FC<{ state: CharState; inv?: boolean }> = ({ state, inv }) => {
  const run = state === 'run', jump = state === 'jump';
  return (
    <svg width={CW} height={CH} viewBox="0 0 44 58" style={{ filter: 'drop-shadow(0 0 8px rgba(99, 102, 241, 0.7))', opacity: inv ? 0.4 : 1 }}>
      <g style={{ transformOrigin: '22px 10px', animation: jump ? 'rj 0.6s ease-out forwards' : 'none' }}>
        <circle cx="26" cy="9" r="7" fill="#6366F1" stroke="#c4b5fd" strokeWidth="1.5" />
        <circle cx="28.5" cy="8" r="1.5" fill="#fff" />
        <g style={{ transformOrigin: '22px 16px', animation: run ? 'rbody 0.26s ease-in-out infinite alternate' : 'none' }}>
          <rect x="18" y="16" width="12" height="16" rx="3" fill="#6366F1" />
          <rect x="11" y="18" width="5" height="11" rx="2" fill="#818CF8" style={{ transformOrigin: '13px 20px', animation: run ? 'rar 0.26s ease-in-out infinite alternate' : 'none' }} />
          <rect x="32" y="18" width="5" height="11" rx="2" fill="#818CF8" style={{ transformOrigin: '34px 20px', animation: run ? 'rar 0.26s ease-in-out infinite alternate-reverse' : 'none' }} />
          <rect x="18" y="32" width="5" height="16" rx="2" fill="#6d28d9" style={{ transformOrigin: '20px 34px', animation: run ? 'rleg 0.26s ease-in-out infinite alternate' : jump ? 'rlegj 0.6s ease-out' : 'none' }} />
          <rect x="26" y="32" width="5" height="16" rx="2" fill="#6d28d9" style={{ transformOrigin: '28px 34px', animation: run ? 'rleg 0.26s ease-in-out infinite alternate-reverse' : jump ? 'rlegj2 0.6s ease-out' : 'none' }} />
        </g>
      </g>
    </svg>
  );
};

const KF = `<style>@keyframes rleg{0%{transform:rotate(-28deg)}100%{transform:rotate(28deg)}}@keyframes rar{0%{transform:rotate(22deg)}100%{transform:rotate(-22deg)}}@keyframes rbody{0%{transform:translateY(0)}100%{transform:translateY(-2px)}}@keyframes rj{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}@keyframes rlegj{0%{transform:rotate(-10deg)}50%{transform:rotate(-40deg)}100%{transform:rotate(-10deg)}}@keyframes rlegj2{0%{transform:rotate(10deg)}50%{transform:rotate(40deg)}100%{transform:rotate(10deg)}}</style>`;

const STAR_BG = `radial-gradient(2px 2px at 20px 30px, white, transparent),radial-gradient(1px 1px at 40px 70px, white, transparent),radial-gradient(1.5px 1.5px at 50px 160px, #818CF8, transparent),radial-gradient(1px 1px at 90px 40px, white, transparent),radial-gradient(2px 2px at 130px 80px, #c4b5fd, transparent),radial-gradient(1px 1px at 160px 120px, white, transparent)`;
const CITY_CLIP = `polygon(0% 100%,0% 70%,4% 70%,4% 40%,8% 40%,8% 60%,12% 60%,12% 25%,16% 25%,16% 55%,20% 55%,20% 15%,24% 15%,24% 50%,28% 50%,28% 35%,32% 35%,32% 60%,36% 60%,36% 20%,40% 20%,40% 65%,44% 65%,44% 30%,48% 30%,48% 55%,52% 55%,52% 10%,56% 10%,56% 45%,60% 45%,60% 40%,64% 40%,64% 60%,68% 60%,68% 25%,72% 25%,72% 50%,76% 50%,76% 35%,80% 35%,80% 60%,84% 60%,84% 45%,88% 45%,88% 65%,92% 65%,92% 30%,96% 30%,96% 55%,100% 55%,100% 100%)`;

const G: React.FC<Props> = ({ onBack }) => {
  const [view, setView] = useState<View>('intro');
  const [dif, setDif] = useState(3);
  const [load, setLoad] = useState(false);
  const [paused, setPaused] = useState(false);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [dist, setDist] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [total, setTotal] = useState(0);
  const [best, setBest] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [cs, setCs] = useState<CharState>('idle');
  const [inv, setInv] = useState(false);
  const [levelBanner, setLevelBanner] = useState<string | null>(null);
  const [, tick] = useState(0);
  const fr = useCallback(() => tick((t) => t + 1), []);

  const wordsRef = useRef<RunnerObstacle[]>([]);
  const wIdxRef = useRef(0);
  const obsRef = useRef<ObsEntity[]>([]);
  const obsIdRef = useRef(0);
  const ptcRef = useRef<Particle[]>([]);
  const ptcIdRef = useRef(0);
  const gidRef = useRef('');
  const lastFRef = useRef(0);
  const spdRef = useRef(INIT_SPEED);
  const wRef = useRef(800);
  const jumpStartRef = useRef(0);
  const jumpingRef = useRef(false);
  const shakeRef = useRef(0);
  const flashRef = useRef(false);
  const spawnRef = useRef(0);
  const distRef = useRef(0);
  const livesRef = useRef(3);
  const comboRef = useRef(0);
  const slowRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const pauRef = useRef(false);
  const overRef = useRef(false);
  const csRef = useRef<CharState>('idle');
  const invRef = useRef(false);
  const sceneRef = useRef<HTMLDivElement | null>(null);
  const hbRef = useRef(0);
  const levelRef = useRef(1);
  const lcRef = useRef(0);
  const bgRef = useRef({ stars: 0, city: 0, ground: 0 });

  useEffect(() => {
    return () => {
      cleanupAudio();
      if (rafRef.current) {
        try { cancelAnimationFrame(rafRef.current); } catch { /* noop */ }
        rafRef.current = null;
      }
    };
  }, []);

  useEffect(() => { try { const s = localStorage.getItem('word_runner_best'); if (s) setBest(parseInt(s, 10) || 0); } catch { /* noop */ } }, []);
  const saveBest = useCallback((s: number): void => { if (s > best) { setBest(s); try { localStorage.setItem('word_runner_best', String(s)); } catch { /* noop */ } } }, [best]);

  useEffect(() => {
    if (view !== 'play') return;
    const up = (): void => { if (sceneRef.current) wRef.current = sceneRef.current.clientWidth; };
    up(); window.addEventListener('resize', up);
    return () => window.removeEventListener('resize', up);
  }, [view]);

  const spawnObs = useCallback((): void => {
    const list = wordsRef.current, idx = wIdxRef.current;
    if (idx >= list.length) return;
    const word = list[idx]; wIdxRef.current = idx + 1;
    const wi = (idx + 1 + Math.floor(Math.random() * Math.max(1, list.length - 1))) % list.length;
    const wrong = list[wi]?.word || word.word + 'e';
    const cIdx: 0 | 1 = Math.random() > 0.5 ? 0 : 1;
    const opts: [string, string] = cIdx === 0 ? [word.word, wrong] : [wrong, word.word];
    const types: ObsType[] = ['wall', 'spike', 'gap'];
    const type = types[Math.floor(Math.random() * types.length)];
    let w = 40, h = 50;
    if (type === 'spike') { w = 50; h = 36; }
    if (type === 'gap') { w = 90; h = 0; }
    obsRef.current = [...obsRef.current, { id: obsIdRef.current++, type, x: wRef.current + 80, w, h, meaning: word.correctMeaning, opts, cIdx, answered: false, passed: false, shown: false }];
  }, []);

  const addPtc = useCallback((x: number, y: number, count: number, color: string): void => {
    const arr: Particle[] = [];
    for (let i = 0; i < count; i++) arr.push({ id: ptcIdRef.current++, x, y, vx: (Math.random() - 0.3) * 200, vy: -Math.random() * 200 - 50, life: 1, max: 0.8 + Math.random() * 0.4, color });
    ptcRef.current = [...ptcRef.current, ...arr];
  }, []);

  const doJump = useCallback((): void => {
    jumpingRef.current = true; jumpStartRef.current = performance.now();
    csRef.current = 'jump'; setCs('jump'); sfx.jump();
    setTimeout(() => { if (!overRef.current) { csRef.current = 'run'; setCs('run'); } jumpingRef.current = false; }, JUMP_MS);
  }, []);

  const doHit = useCallback((): void => {
    csRef.current = 'hit'; setCs('hit'); sfx.hit();
    slowRef.current = 800; invRef.current = true; setInv(true);
    shakeRef.current = 20; flashRef.current = true;
    setTimeout(() => { flashRef.current = false; }, 250);
    setTimeout(() => { if (!overRef.current) { csRef.current = 'run'; setCs('run'); } }, 600);
    setTimeout(() => { invRef.current = false; setInv(false); }, 1400);
  }, []);

  const finish = useCallback((): void => {
    if (overRef.current) return; overRef.current = true;
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
    sfx.over(); saveBest(score);
    submitWordRunner({ score, totalQuestions: total, correctCount: correct, durationSec: Math.floor(distRef.current / 10), difficulty: dif, details: { distance: Math.floor(distRef.current) } })
      .catch((e: Error) => logger.error('提交失败', e));
    setView('result');
  }, [score, total, correct, dif, saveBest]);

  const pickOpt = useCallback((idx: 0 | 1): void => {
    const a = obsRef.current.find((o) => !o.passed && !o.answered && o.x < wRef.current - 50);
    if (!a || overRef.current || pauRef.current) return;
    const ok = idx === a.cIdx;
    a.answered = true; a.isCorrect = ok; setTotal((t) => t + 1);
    if (ok) {
      setCorrect((c) => c + 1); comboRef.current += 1; setCombo(comboRef.current);
      setMaxCombo((m) => Math.max(m, comboRef.current));
      setScore((s) => s + 20 + Math.floor(comboRef.current / 3) * 10);
      addPtc(CX + CW / 2, GY - 30, 12, '#06B6D4');
      sfx.score(); doJump(); lcRef.current += 1;
      if (lcRef.current >= WPL) {
        lcRef.current = 0; levelRef.current += 1;
        setLevelBanner(`第 ${levelRef.current - 1} 关完成！`); sfx.levelUp();
        setTimeout(() => setLevelBanner(null), 1500);
      }
    } else {
      comboRef.current = 0; setCombo(0);
      livesRef.current -= 1; setLives(livesRef.current); doHit();
      if (livesRef.current <= 0) setTimeout(() => finish(), 900);
    }
  }, [doJump, doHit, addPtc, finish]);

  const start = useCallback(async () => {
    setLoad(true);
    try {
      const d = await generateWordRunner({ difficulty: dif, count: 25 });
      wordsRef.current = d.obstacles; gidRef.current = d.gameId;
      wIdxRef.current = 0; obsRef.current = []; obsIdRef.current = 0;
      ptcRef.current = []; ptcIdRef.current = 0;
      spdRef.current = INIT_SPEED + (dif - 1) * 20;
      distRef.current = 0; livesRef.current = 3; comboRef.current = 0;
      overRef.current = false; spawnRef.current = 0; slowRef.current = 0;
      jumpingRef.current = false; csRef.current = 'run'; invRef.current = false;
      levelRef.current = 1; lcRef.current = 0; hbRef.current = 0;
      bgRef.current = { stars: 0, city: 0, ground: 0 };
      setScore(0); setLives(3); setDist(0); setCorrect(0); setTotal(0); setCombo(0); setMaxCombo(0);
      setPaused(false); pauRef.current = false; setLevelBanner(null);
      setCs('run'); setInv(false); lastFRef.current = performance.now(); setView('play');
    } catch (e) { logger.error('生成失败', e as Error); }
    finally { setLoad(false); }
  }, [dif]);

  useEffect(() => {
    if (view !== 'play') return;
    const kd = (e: KeyboardEvent): void => {
      if (e.key === '1' || e.key === 'a' || e.key === 'A') pickOpt(0);
      else if (e.key === '2' || e.key === 'd' || e.key === 'D') pickOpt(1);
      else if (e.key === ' ') { e.preventDefault(); setPaused((p) => { pauRef.current = !p; return !p; }); }
    };
    window.addEventListener('keydown', kd);
    return () => window.removeEventListener('keydown', kd);
  }, [view, pickOpt]);

  // 游戏主循环
  useEffect(() => {
    if (view !== 'play') return;
    const loop = (now: number): void => {
      if (overRef.current) return;
      if (pauRef.current) { lastFRef.current = now; rafRef.current = requestAnimationFrame(loop); return; }
      const dt = Math.min(now - lastFRef.current, 50); lastFRef.current = now;
      const sec = dt / 1000;
      const slowF = slowRef.current > 0 ? 0.5 : 1;
      if (slowRef.current > 0) slowRef.current = Math.max(0, slowRef.current - dt);
      const spd = spdRef.current * slowF;
      distRef.current += spd * sec * 0.1;
      spdRef.current = Math.min(spdRef.current + SPEED_INC * sec, MAX_SPEED);
      if (shakeRef.current > 0) shakeRef.current = Math.max(0, shakeRef.current - dt * 0.04);
      if (jumpingRef.current && now - jumpStartRef.current >= JUMP_MS) jumpingRef.current = false;
      bgRef.current.stars -= spd * sec * 0.05; bgRef.current.city -= spd * sec * 0.2; bgRef.current.ground -= spd * sec;
      obsRef.current = obsRef.current.map((o) => ({ ...o, x: o.x - spd * sec })).filter((o) => o.x > -200);
      spawnRef.current += dt;
      const iv = Math.max(1200, 2400 - distRef.current * 2);
      if (spawnRef.current >= iv && wIdxRef.current < wordsRef.current.length) { spawnRef.current = 0; spawnObs(); }

      const jp = jumpingRef.current ? Math.min((now - jumpStartRef.current) / JUMP_MS, 1) : 0;
      const jy = jumpingRef.current ? Math.sin(jp * Math.PI) * JUMP_H : 0;
      const cL = CX, cR = CX + CW;

      for (const o of obsRef.current) {
        if (o.passed) continue;
        const oL = o.x, oR = o.x + o.w;
        if (!o.shown && o.x < wRef.current - 150) o.shown = true;
        if (cR > oL && cL < oR && !o.answered) {
          const hit = o.type === 'gap' ? (!jumpingRef.current || jy < 20) : (jy < o.h - 10);
          if (hit) {
            o.passed = true; o.answered = true; o.isCorrect = false;
            setTotal((t) => t + 1); comboRef.current = 0; setCombo(0);
            livesRef.current -= 1; setLives(livesRef.current); doHit();
            if (livesRef.current <= 0) setTimeout(() => finish(), 900);
          }
        }
        if (!o.passed && cL > oR) {
          o.passed = true;
          if (!o.answered) {
            o.answered = true; o.isCorrect = false;
            setTotal((t) => t + 1); comboRef.current = 0; setCombo(0);
            livesRef.current -= 1; setLives(livesRef.current); doHit();
            if (livesRef.current <= 0) setTimeout(() => finish(), 900);
          }
        }
      }

      ptcRef.current = ptcRef.current
        .map((p) => ({ ...p, x: p.x + p.vx * sec, y: p.y + p.vy * sec, vy: p.vy + 400 * sec, life: p.life - sec / p.max }))
        .filter((p) => p.life > 0);
      if (livesRef.current === 1) { hbRef.current += dt; if (hbRef.current >= 1000) { hbRef.current = 0; sfx.heartbeat(); } }
      setDist(Math.floor(distRef.current)); fr();
      rafRef.current = requestAnimationFrame(loop);
    };
    lastFRef.current = performance.now(); rafRef.current = requestAnimationFrame(loop);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [view, spawnObs, doHit, finish, fr]);

  const togglePause = useCallback((): void => { setPaused((p) => { const n = !p; pauRef.current = n; if (!n) lastFRef.current = performance.now(); return n; }); }, []);

  let jumpY = 0;
  if (jumpingRef.current) { const p = Math.min((performance.now() - jumpStartRef.current) / JUMP_MS, 1); jumpY = Math.sin(p * Math.PI) * JUMP_H; }
  const sx = shakeRef.current > 0 ? (Math.random() - 0.5) * shakeRef.current : 0;
  const sy = shakeRef.current > 0 ? (Math.random() - 0.5) * shakeRef.current * 0.5 : 0;
  const acc = total > 0 ? Math.round((correct / total) * 100) : 0;
  const grade = gradeOf(acc);
  const activeObs = obsRef.current.find((o) => o.shown && !o.passed);

  // ===== intro =====
  if (view === 'intro') return (
    <div className="space-y-5">
      <button onClick={onBack} className="flex items-center gap-1 text-deep-text-secondary hover:text-deep-text text-sm font-medium">
        <ArrowLeft size={18} /> 返回游戏乐园
      </button>
      <div className="relative rounded-2xl overflow-hidden" style={{ background: 'linear-gradient(180deg, #EEF2FF 0%, #1a1040 50%, #2d1b69 100%)', boxShadow: '0 0 40px rgba(99,102,241,0.25)' }}>
        <div className="absolute inset-0 opacity-70" style={{ backgroundImage: STAR_BG, backgroundSize: '200px 200px' }} />
        <div className="relative p-6 text-white flex items-center gap-4">
          <div className="animate-bounce"><Runner state="run" /></div>
          <div>
            <h1 className="text-2xl font-bold mb-1" style={{ textShadow: '0 0 20px rgba(99, 102, 241, 0.5)' }}>单词跑酷</h1>
            <p className="text-sm text-purple-200">看释义选单词，边跑酷边背单词！</p>
          </div>
        </div>
        <div className="relative h-10" style={{ background: 'linear-gradient(to top, #1a1040, transparent)', borderTop: '2px solid #6366F1', boxShadow: '0 -5px 20px rgba(99,102,241,0.35)' }} />
      </div>
      <div className="bg-[#FFFFFF] rounded-2xl border border-purple-500/30 p-5 space-y-5">
        <div>
          <h3 className="text-sm font-bold text-deep-text mb-2">🎯 玩法说明</h3>
          <p className="text-sm text-deep-text-secondary leading-relaxed">
            角色自动向右奔跑，遇到高墙/地刺/断崖时上方出现中文释义和2个单词选项。
            点击<span className="text-cyan-400">正确拼写</span>角色起跳越过障碍，
            <span className="text-red-400">选错</span>撞障碍掉血。3条生命，速度越来越快！
            键盘 <span className="text-purple-300">1/2</span> 或 <span className="text-purple-300">A/D</span> 快速作答。
          </p>
        </div>
        <div>
          <label className="text-sm font-bold text-deep-text mb-3 block">难度：{DIF_LABELS[dif - 1]}</label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((lv) => (
              <button key={lv} onClick={() => setDif(lv)} className={`flex-1 py-3 rounded-xl flex items-center justify-center transition-all ${dif >= lv ? 'bg-purple-500/20 border-2 border-purple-400 text-purple-300' : 'bg-[#F8FAFC] border-2 border-transparent text-gray-600'}`}>★</button>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-between p-3 bg-yellow-500/10 rounded-xl border border-yellow-500/20">
          <div className="flex items-center gap-2"><Trophy size={20} className="text-yellow-400" /><span className="text-sm text-yellow-200">历史最高分</span></div>
          <span className="text-lg font-bold text-yellow-400">{best} 分</span>
        </div>
        <button onClick={start} disabled={load} className="w-full py-4 rounded-xl text-white font-bold text-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-60 active:scale-98"
          style={{ background: 'linear-gradient(135deg, #6366F1 0%, #2563EB 100%)', boxShadow: '0 0 20px rgba(99,102,241,0.35)' }}>
          {load ? '加载中...' : '🚀 开始奔跑'}
        </button>
      </div>
      <div dangerouslySetInnerHTML={{ __html: KF }} />
    </div>
  );

  // ===== play =====
  if (view === 'play') return (
    <div className="space-y-3">
      <div className="flex items-center justify-between bg-[#FFFFFF] rounded-xl p-3 border border-purple-500/30">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1"><Zap size={16} className="text-yellow-400" /><span className="text-sm font-bold text-white">{score}</span></div>
          <div className="flex items-center gap-1 text-sm text-deep-text-secondary"><Flag size={14} />{dist}m</div>
          {combo > 1 && <motion.span key={combo} initial={{ scale: 1.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-xs font-bold text-orange-400">🔥 {combo}连击</motion.span>}
        </div>
        <div className="flex items-center gap-0.5">
          {[0, 1, 2].map((i) => <Heart key={i} size={18} className={i < lives ? 'text-red-500' : 'text-gray-700'} fill={i < lives ? 'currentColor' : 'none'} />)}
        </div>
        <button onClick={togglePause} className="p-2 rounded-lg bg-[#F8FAFC] hover:bg-[#E0E7FF] transition-colors border border-purple-500/20">
          {paused ? <Play size={16} className="text-purple-300" /> : <Pause size={16} className="text-purple-300" />}
        </button>
      </div>
      <div ref={sceneRef} className="relative w-full overflow-hidden rounded-2xl border border-purple-500/40 select-none"
        style={{ height: '360px', transform: `translate(${sx}px, ${sy}px)`, background: 'linear-gradient(to bottom, #EEF2FF 0%, #1a1040 45%, #2d1b69 75%, #1a1040 100%)' }}>
        <div className="absolute inset-0 opacity-60 pointer-events-none" style={{ backgroundImage: STAR_BG, backgroundRepeat: 'repeat', backgroundSize: '200px 200px', backgroundPosition: `${bgRef.current.stars}px 0` }} />
        <div className="absolute left-0 right-0 pointer-events-none" style={{ bottom: `${360 - GY + 20}px`, height: '100px' }}>
          <div className="absolute top-0 left-0 w-[200%] h-full" style={{ transform: `translateX(${bgRef.current.city % 800}px)`, background: 'linear-gradient(to top, #1e1b4b, transparent)', clipPath: CITY_CLIP, opacity: 0.5 }} />
        </div>
        <div className="absolute left-0 right-0 pointer-events-none" style={{ bottom: `${360 - GY + 5}px`, height: '60px' }}>
          <div className="absolute top-0 left-0 w-[200%] h-full" style={{ transform: `translateX(${bgRef.current.city * 1.5 % 600}px)`, background: 'linear-gradient(to top, #312e81, transparent)', clipPath: CITY_CLIP, opacity: 0.6, filter: 'drop-shadow(0 0 8px rgba(99, 102, 241, 0.3))' }} />
        </div>
        {/* 地面 */}
        <div className="absolute left-0 right-0 pointer-events-none" style={{ top: `${GY}px`, bottom: 0, overflow: 'hidden' }}>
          <div className="absolute top-0 left-0 w-[200%] h-2" style={{ transform: `translateX(${bgRef.current.ground % 400}px)`, background: 'linear-gradient(90deg, #6366F1, #2563EB, #06B6D4, #6366F1, #2563EB)', boxShadow: '0 0 15px rgba(99, 102, 241, 0.5)' }} />
          <div className="absolute top-2 left-0 w-full bottom-0" style={{ background: 'linear-gradient(to bottom, #1a1040, #EEF2FF)' }}>
            <div className="absolute inset-0" style={{ backgroundImage: `repeating-linear-gradient(90deg, transparent 0px, transparent 38px, rgba(99,102,241,0.12) 38px, rgba(99,102,241,0.12) 40px)`, backgroundPosition: `${bgRef.current.ground % 40}px 0` }} />
          </div>
        </div>
        {flashRef.current && <div className="absolute inset-0 pointer-events-none z-30" style={{ background: 'rgba(239,68,68,0.35)' }} />}
        {/* 障碍物 */}
        {obsRef.current.map((o) => {
          if (o.x > wRef.current + 50 || o.x < -100) return null;
          const okG = o.answered && o.isCorrect, badG = o.answered && !o.isCorrect;
          const glow = badG ? 'rgba(239,68,68,0.8)' : okG ? 'rgba(34,211,238,0.8)' : 'rgba(99, 102, 241, 0.4)';
          const fill = badG ? '#ef4444' : okG ? '#06B6D4' : '#6366F1';
          const stroke = badG ? '#fca5a5' : okG ? '#67e8f9' : '#c4b5fd';
          return (
            <div key={o.id} className="absolute z-10 pointer-events-none" style={{ left: `${o.x}px`, top: `${GY - o.h}px` }}>
              {o.type === 'wall' && (
                <div style={{ width: `${o.w}px`, height: `${o.h}px`, background: badG ? 'linear-gradient(180deg, #ef4444, #991b1b)' : okG ? 'linear-gradient(180deg, #06B6D4, #0891b2)' : 'linear-gradient(180deg, #6366F1, #4c1d95)', borderRadius: '4px 4px 0 0', boxShadow: `0 0 15px ${glow}`, border: '2px solid', borderColor: stroke, position: 'relative' }}>
                  <div className="absolute top-1 left-1 right-1 h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.4)' }} />
                </div>
              )}
              {o.type === 'spike' && (
                <svg width={o.w} height={o.h} style={{ filter: `drop-shadow(0 0 8px ${glow})` }}>
                  {Array.from({ length: Math.floor(o.w / 12) }).map((_, i) => (
                    <polygon key={i} points={`${i * 12},${o.h} ${i * 12 + 6},0 ${i * 12 + 12},${o.h}`} fill={fill} stroke={stroke} strokeWidth="1" />
                  ))}
                </svg>
              )}
              {o.type === 'gap' && (
                <div style={{ width: `${o.w}px`, height: '20px', marginTop: '-2px', background: 'linear-gradient(to bottom, #EEF2FF, transparent)', borderTop: '2px solid rgba(239,68,68,0.5)', position: 'relative' }}>
                  <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-red-400 text-xs">⚠</div>
                </div>
              )}
            </div>
          );
        })}
        {/* 单词选项 */}
        {activeObs && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="absolute z-20 left-1/2 -translate-x-1/2 pt-4" style={{ top: '20px', width: 'min(90%, 480px)' }}>
            <div className="text-center mb-3 px-4 py-2 rounded-xl bg-[#FFFFFF]/90 backdrop-blur-sm border border-purple-500/40" style={{ boxShadow: '0 0 20px rgba(99,102,241,0.25)' }}>
              <div className="text-xs text-purple-300 mb-0.5">中文释义</div>
              <div className="text-lg font-bold text-white">{activeObs.meaning}</div>
            </div>
            <div className="flex gap-3 justify-center">
              {activeObs.opts.map((opt, i) => {
                const ok = activeObs.cIdx === i, show = activeObs.answered;
                return (
                  <button key={i} onClick={() => pickOpt(i as 0 | 1)} disabled={activeObs.answered || paused}
                    className={`px-6 py-3 rounded-xl font-bold text-base transition-all border-2 min-w-[120px] backdrop-blur-sm ${
                      show && ok ? 'bg-cyan-500/40 border-cyan-400 text-cyan-100 shadow-[0_0_25px_rgba(34_211_238_0.7)] scale-105' :
                      show && !ok ? 'bg-red-500/40 border-red-400 text-red-100' :
                      'bg-[#F8FAFC]/90 text-purple-100 border-purple-500/50 hover:bg-purple-600/30 hover:border-purple-300 hover:scale-105 active:scale-95 hover:shadow-[0_0_20px_rgba(124_58_237_0.6)]'
                    } disabled:cursor-not-allowed`}>
                    <span className="text-yellow-400 font-bold mr-2">{String.fromCharCode(65 + i)}</span>{opt}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
        {/* 粒子 */}
        {ptcRef.current.map((p) => (
          <div key={p.id} className="absolute rounded-full pointer-events-none" style={{ left: `${p.x}px`, top: `${p.y}px`, width: '6px', height: '6px', background: p.color, opacity: Math.max(0, p.life), boxShadow: `0 0 8px ${p.color}`, zIndex: 15 }} />
        ))}
        {/* 角色 */}
        <div className="absolute z-20 pointer-events-none" style={{ left: `${CX}px`, top: `${GY - CH - jumpY}px` }}>
          <Runner state={cs} inv={inv} />
          <div className="absolute -bottom-1 left-1/2 rounded-full" style={{ width: `${jumpingRef.current ? 20 : 36}px`, height: '5px', background: 'radial-gradient(ellipse, rgba(0,0,0,0.5), transparent)', filter: 'blur(2px)', transform: `translateX(-50%) translateY(${jumpY * 0.3}px) scale(${1 - jumpY / JUMP_H * 0.4})`, transition: 'width 0.1s' }} />
        </div>
        {/* 关卡横幅 */}
        <AnimatePresence>
          {levelBanner && (
            <motion.div key="lv" initial={{ opacity: 0, scale: 0.5, y: -30 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.8 }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 px-8 py-4 rounded-2xl text-center"
              style={{ background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.7), rgba(59,130,246,0.9))', boxShadow: '0 0 40px rgba(99, 102, 241, 0.5)', backdropFilter: 'blur(8px)' }}>
              <div className="text-2xl font-bold text-white" style={{ textShadow: '0 0 10px rgba(255,255,255,0.5)' }}>
                <Sparkles className="inline mr-2" size={24} />{levelBanner}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        {/* 暂停 */}
        <AnimatePresence>
          {paused && (
            <motion.div key="p" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/70 flex items-center justify-center z-40 backdrop-blur-sm rounded-2xl">
              <div className="text-center">
                <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="text-5xl mb-3">⏸️</motion.div>
                <p className="text-white text-lg font-bold mb-4">游戏暂停</p>
                <button onClick={togglePause} className="px-6 py-2 rounded-xl font-bold text-white shadow-lg" style={{ background: 'linear-gradient(135deg, #6366F1, #2563EB)' }}>继续游戏</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <div className="bg-[#FFFFFF] rounded-xl p-3 border border-purple-500/30 text-center">
        <p className="text-xs text-deep-text-secondary">键盘 <span className="text-purple-300 font-bold">1 / 2</span> 或 <span className="text-purple-300 font-bold">A / D</span> 快速选答案 · <span className="text-purple-300 font-bold">空格</span> 暂停</p>
      </div>
      <div dangerouslySetInnerHTML={{ __html: KF }} />
    </div>
  );

  // ===== result =====
  const isNew = score > best;
  return (
    <div className="space-y-5">
      <button onClick={onBack} className="flex items-center gap-1 text-deep-text-secondary hover:text-deep-text text-sm font-medium"><ArrowLeft size={18} /> 返回游戏乐园</button>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="relative rounded-2xl overflow-hidden text-center p-6"
        style={{ background: 'linear-gradient(135deg, #1a1040 0%, #4c1d95 50%, #6366F1 100%)', boxShadow: `0 0 40px ${grade[2]}40` }}>
        {isNew && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.4, stiffness: 200 }} className="absolute top-3 right-3 px-3 py-1 bg-yellow-500 text-yellow-900 text-xs font-bold rounded-full">🎉 新纪录</motion.div>}
        <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', delay: 0.2, stiffness: 150 }} className={`text-7xl font-bold ${grade[1]} mb-2`} style={{ textShadow: `0 0 30px ${grade[2]}` }}>{grade[0].charAt(0)}</motion.div>
        <h2 className="text-xl font-bold text-white mb-1">{acc >= 90 ? '跑酷大神！' : acc >= 75 ? '非常优秀！' : acc >= 60 ? '表现不错！' : '继续加油！'}</h2>
        <p className="text-sm text-purple-200 mb-3">单词跑酷挑战结束</p>
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }} className="text-5xl font-bold text-white">{score}</motion.div>
        <div className="text-sm text-purple-200 mt-1">最终得分</div>
      </motion.div>
      <div className="bg-[#FFFFFF] rounded-2xl border border-purple-500/30 p-5">
        <div className="text-center mb-4"><span className={`inline-block px-4 py-1 rounded-full text-sm font-bold bg-purple-500/10 ${grade[1]} border border-purple-500/30`}>{grade[0]}</span></div>
        <div className="grid grid-cols-3 gap-2 mb-3">
          {[[correct, '正确', 'text-green-400', 'border-green-500/20 bg-green-500/10'],
            [dist + 'm', '距离', 'text-blue-400', 'border-blue-500/20 bg-blue-500/10'],
            [maxCombo, '最高连击', 'text-orange-400', 'border-orange-500/20 bg-orange-500/10'],
            [acc + '%', '正确率', 'text-purple-400', 'border-purple-500/20 bg-purple-500/10'],
            [total, '答题数', 'text-pink-400', 'border-pink-500/20 bg-pink-500/10'],
            [levelRef.current, '关卡', 'text-cyan-400', 'border-cyan-500/20 bg-cyan-500/10'],
          ].map(([v, l, tc, bc], i) => (
            <div key={i} className={`rounded-lg p-2 text-center border ${bc}`}>
              <div className={`text-xl font-bold ${tc}`}>{v}</div>
              <div className="text-xs text-deep-text-secondary mt-0.5">{l}</div>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between p-3 bg-yellow-500/10 rounded-xl mb-3 border border-yellow-500/20">
          <div className="flex items-center gap-2"><Trophy size={18} className="text-yellow-400" /><span className="text-sm text-yellow-200">历史最高分</span></div>
          <span className="text-lg font-bold text-yellow-400">{best} 分</span>
        </div>
        <div className="flex items-center justify-between p-3 bg-purple-500/10 rounded-xl mb-5 border border-purple-500/20">
          <div className="flex items-center gap-2"><Sparkles size={18} className="text-purple-400" /><span className="text-sm text-purple-200">难度等级</span></div>
          <span className="text-lg font-bold text-purple-400">{DIF_LABELS[dif - 1]}</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => setView('intro')} className="py-3 rounded-xl bg-[#F8FAFC] text-purple-200 font-semibold text-sm flex items-center justify-center gap-2 hover:bg-[#E0E7FF] transition-all border border-purple-500/30"><RotateCcw size={16} /> 重新设置</button>
          <button onClick={start} className="py-3 rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all active:scale-98" style={{ background: 'linear-gradient(135deg, #6366F1 0%, #2563EB 100%)' }}>🔄 再来一局</button>
        </div>
      </div>
    </div>
  );
};

export default G;
