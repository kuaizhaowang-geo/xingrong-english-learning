import React from 'react';
import { Mic2, Volume2, PlayCircle, Repeat, Timer, Sparkles } from 'lucide-react';
import { Slider } from '@client/src/components/ui/slider';
import { Switch } from '@client/src/components/ui/switch';
import {
  useSettingsStore,
  type VoiceType,
} from '../store/settingsStore';

const voiceOptions: Array<{ value: VoiceType; label: string; desc: string; accent: string }> = [
  { value: 'britishMale', label: '英式男声', desc: '沉稳绅士', accent: 'British' },
  { value: 'britishFemale', label: '英式女声', desc: '优雅纯正', accent: 'British' },
  { value: 'americanMale', label: '美式男声', desc: '磁性浑厚', accent: 'American' },
  { value: 'americanFemale', label: '美式女声', desc: '甜美自然', accent: 'American' },
];

const PronunciationSection: React.FC = () => {
  const { pronunciation, setPronunciation } = useSettingsStore();

  return (
    <div className="space-y-5">
      {/* 发音人选择 */}
      <div
        className="rounded-2xl p-5 border backdrop-blur-xl"
        style={{
          background: 'rgba(15, 23, 42, 0.6)',
          borderColor: 'rgba(139, 92, 246, 0.2)',
          boxShadow: '0 0 30px rgba(139, 92, 246, 0.05)',
        }}
      >
        <div className="flex items-center gap-2 mb-4">
          <Mic2 className="w-5 h-5" style={{ color: '#A78BFA' }} />
          <h3 className="text-base font-semibold text-white">发音人选择</h3>
          <Sparkles className="w-4 h-4 ml-1" style={{ color: '#22D3EE' }} />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {voiceOptions.map((opt) => {
            const active = pronunciation.voiceType === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => setPronunciation({ voiceType: opt.value })}
                className={`relative p-4 rounded-xl border transition-all duration-300 text-left group ${
                  active ? 'scale-[1.02]' : 'hover:border-purple-500/40 hover:bg-purple-500/5'
                }`}
                style={{
                  background: active
                    ? 'linear-gradient(135deg, rgba(139,92,246,0.2) 0%, rgba(59,130,246,0.15) 100%)'
                    : 'rgba(255, 255, 255, 0.03)',
                  borderColor: active
                    ? 'rgba(167, 139, 250, 0.5)'
                    : 'rgba(255, 255, 255, 0.1)',
                  boxShadow: active ? '0 0 20px rgba(139, 92, 246, 0.25)' : 'none',
                }}
              >
                <div
                  className="text-sm font-medium mb-1"
                  style={{ color: active ? '#A78BFA' : '#CBD5E1' }}
                >
                  {opt.label}
                </div>
                <div className="text-xs text-slate-400 mb-2">{opt.desc}</div>
                <div
                  className="text-[10px] px-1.5 py-0.5 rounded-full inline-block"
                  style={{
                    background: active ? 'rgba(139,92,246,0.25)' : 'rgba(255,255,255,0.05)',
                    color: active ? '#A78BFA' : '#94A3B8',
                  }}
                >
                  {opt.accent}
                </div>
                {active && (
                  <div
                    className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full"
                    style={{
                      background: '#6366F1',
                      boxShadow: '0 0 8px #6366F1',
                    }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 语速 + 音量 */}
      <div
        className="rounded-2xl p-5 border backdrop-blur-xl"
        style={{
          background: 'rgba(15, 23, 42, 0.6)',
          borderColor: 'rgba(59, 130, 246, 0.2)',
          boxShadow: '0 0 30px rgba(59, 130, 246, 0.05)',
        }}
      >
        <div className="flex items-center gap-2 mb-4">
          <Volume2 className="w-5 h-5" style={{ color: '#60A5FA' }} />
          <h3 className="text-base font-semibold text-white">语速与音量</h3>
        </div>

        <div className="space-y-5">
          {/* 语速 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400">发音人语速</span>
              <span className="text-sm font-semibold" style={{ color: '#818CF8' }}>
                {pronunciation.speechRate.toFixed(1)}x
              </span>
            </div>
            <Slider
              value={[pronunciation.speechRate]}
              min={0.5}
              max={2}
              step={0.1}
              onValueChange={(vals: number[]) =>
                setPronunciation({ speechRate: vals[0] })
              }
              className="[&_[data-slot=slider-track]]:bg-white/10 [&_[data-slot=slider-range]]:bg-gradient-to-r [&_[data-slot=slider-range]]:from-fuchsia-500 [&_[data-slot=slider-range]]:to-blue-500 [&_[data-slot=slider-thumb]]:border-fuchsia-400 [&_[data-slot=slider-thumb]]:bg-fuchsia-900 [&_[data-slot=slider-thumb]]:shadow-[0_0_10px_rgba(217_70_239_0.5)]"
            />
             <div className="flex justify-between text-xs text-slate-500">
               <span>0.5x</span>
               <span>1.0x</span>
               <span>1.5x</span>
               <span>2.0x</span>
             </div>
          </div>

          {/* 音量 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400">发音人音量</span>
              <span className="text-sm font-semibold" style={{ color: '#06B6D4' }}>
                {pronunciation.volume}%
              </span>
            </div>
            <Slider
              value={[pronunciation.volume]}
              min={0}
              max={100}
              step={1}
              onValueChange={(vals: number[]) =>
                setPronunciation({ volume: vals[0] })
              }
              className="[&_[data-slot=slider-track]]:bg-white/10 [&_[data-slot=slider-range]]:bg-gradient-to-r [&_[data-slot=slider-range]]:from-cyan-500 [&_[data-slot=slider-range]]:to-purple-500 [&_[data-slot=slider-thumb]]:border-cyan-400 [&_[data-slot=slider-thumb]]:bg-cyan-200 [&_[data-slot=slider-thumb]]:shadow-[0_0_10px_rgba(34_211_238_0.5)]"
            />
             <div className="flex justify-between text-xs text-slate-500">
               <span>静音</span>
               <span>50%</span>
               <span>最大</span>
             </div>
          </div>
        </div>
      </div>

      {/* 朗读次数 + 间隔 */}
      <div
        className="rounded-2xl p-5 border backdrop-blur-xl"
        style={{
          background: 'rgba(15, 23, 42, 0.6)',
          borderColor: 'rgba(6, 182, 212, 0.2)',
          boxShadow: '0 0 30px rgba(6, 182, 212, 0.05)',
        }}
      >
        <div className="flex items-center gap-2 mb-4">
          <Repeat className="w-5 h-5" style={{ color: '#22D3EE' }} />
          <h3 className="text-base font-semibold text-white">朗读设置</h3>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          {/* 朗读次数 */}
          <div>
             <div className="text-sm text-slate-400 mb-2">朗读次数</div>
            <div className="flex items-center gap-2">
              <button
                onClick={() =>
                  setPronunciation({
                    readCount: Math.max(1, pronunciation.readCount - 1),
                  })
                }
                 className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-300 transition-colors hover:bg-white/10"
                 style={{
                   background: 'rgba(255, 255, 255, 0.05)',
                   border: '1px solid rgba(255, 255, 255, 0.1)',
                 }}
               >
                 −
               </button>
               <div
                 className="flex-1 h-8 rounded-lg flex items-center justify-center text-sm font-semibold"
                 style={{
                   background: 'rgba(139, 92, 246, 0.15)',
                   border: '1px solid rgba(167, 139, 250, 0.3)',
                   color: '#A78BFA',
                 }}
               >
                 {pronunciation.readCount} 次
               </div>
               <button
                 onClick={() =>
                   setPronunciation({
                     readCount: Math.min(5, pronunciation.readCount + 1),
                   })
                 }
                 className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-300 transition-colors hover:bg-white/10"
                 style={{
                   background: 'rgba(255, 255, 255, 0.05)',
                   border: '1px solid rgba(255, 255, 255, 0.1)',
                 }}
               >
                 +
               </button>
            </div>
          </div>

          {/* 朗读间隔 */}
           <div>
             <div className="text-sm text-slate-400 mb-2">朗读间隔</div>
             <div className="flex items-center gap-2">
               <button
                 onClick={() =>
                   setPronunciation({
                     readInterval: Math.max(1, pronunciation.readInterval - 1),
                   })
                 }
                 className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-300 transition-colors hover:bg-white/10"
                 style={{
                   background: 'rgba(255, 255, 255, 0.05)',
                   border: '1px solid rgba(255, 255, 255, 0.1)',
                 }}
               >
                 −
               </button>
               <div
                 className="flex-1 h-8 rounded-lg flex items-center justify-center text-sm font-semibold"
                 style={{
                   background: 'rgba(6, 182, 212, 0.15)',
                   border: '1px solid rgba(34, 211, 238, 0.3)',
                   color: '#22D3EE',
                 }}
               >
                 {pronunciation.readInterval} 秒
               </div>
               <button
                 onClick={() =>
                   setPronunciation({
                     readInterval: Math.min(5, pronunciation.readInterval + 1),
                   })
                 }
                 className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-300 transition-colors hover:bg-white/10"
                 style={{
                   background: 'rgba(255, 255, 255, 0.05)',
                   border: '1px solid rgba(255, 255, 255, 0.1)',
                 }}
               >
                 +
               </button>
            </div>
          </div>
        </div>

        <p className="text-xs text-slate-400 flex items-center gap-1.5">
          <Timer className="w-3 h-3" />
          多次朗读时，每次朗读之间的停顿时间
        </p>
      </div>

      {/* 开关项 */}
      <div
        className="rounded-2xl p-5 border backdrop-blur-xl"
        style={{
          background: 'rgba(15, 23, 42, 0.6)',
          borderColor: 'rgba(168, 85, 247, 0.2)',
          boxShadow: '0 0 30px rgba(168, 85, 247, 0.05)',
        }}
      >
        <div className="flex items-center gap-2 mb-4">
          <PlayCircle className="w-5 h-5" style={{ color: '#C084FC' }} />
          <h3 className="text-base font-semibold text-white">自动朗读</h3>
        </div>

        <div className="space-y-1">
          <SettingSwitchRow
            label="切题后自动朗读"
            desc="切换到新题目时自动朗读句子"
            icon={<PlayCircle className="w-4 h-4" />}
            color="#6366F1"
            checked={pronunciation.autoPronounce}
            onChange={(v) => setPronunciation({ autoPronounce: v })}
          />
          <SettingSwitchRow
            label="答题正确后朗读"
            desc="答对时自动朗读正确答案"
            icon={<Sparkles className="w-4 h-4" />}
            color="#06B6D4"
            checked={pronunciation.pronounceOnCorrect}
            onChange={(v) => setPronunciation({ pronounceOnCorrect: v })}
            divider
          />
          <SettingSwitchRow
            label="口语评测结束后自动播放"
            desc="口语评测完成后自动播放标准发音"
            icon={<Mic2 className="w-4 h-4" />}
            color="#F59E0B"
            checked={pronunciation.autoPlayAfterEvaluation}
            onChange={(v) => setPronunciation({ autoPlayAfterEvaluation: v })}
          />
        </div>
      </div>
    </div>
  );
};

interface SettingSwitchRowProps {
  label: string;
  desc: string;
  icon: React.ReactNode;
  color: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  divider?: boolean;
}

const SettingSwitchRow: React.FC<SettingSwitchRowProps> = ({
  label,
  desc,
  icon,
  color,
  checked,
  onChange,
  divider,
}) => (
  <div
    className={`flex items-center justify-between py-3 ${
      divider ? 'border-b border-white/5' : ''
    }`}
  >
    <div className="flex items-center gap-3">
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center"
        style={{ background: `${color}20`, color }}
      >
        {icon}
      </div>
      <div>
        <div className="text-sm text-slate-200">{label}</div>
        <div className="text-xs text-slate-400 mt-0.5">{desc}</div>
      </div>
    </div>
    <Switch
      checked={checked}
      onCheckedChange={onChange}
      className="data-[state=checked]:bg-purple-600 data-[state=unchecked]:bg-slate-700"
    />
  </div>
);

export default PronunciationSection;
