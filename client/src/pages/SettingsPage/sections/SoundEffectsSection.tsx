import React from 'react';
import {
  Volume2,
  MousePointer2,
  Mic2,
  CheckCircle2,
  XCircle,
  Trophy,
  Zap,
} from 'lucide-react';
import { Slider } from '@client/src/components/ui/slider';
import { Switch } from '@client/src/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@client/src/components/ui/select';
import {
  useSettingsStore,
  type TypingSoundType,
  type CorrectSoundType,
  type WrongSoundType,
  type CompleteSoundType,
} from '../store/settingsStore';

const typingOptions: Array<{ value: TypingSoundType; label: string }> = [
  { value: 'original', label: '原键' },
  { value: 'mechanical', label: '机械' },
  { value: 'mute', label: '静音' },
];

const correctOptions: Array<{ value: CorrectSoundType; label: string }> = [
  { value: 'clear', label: '清音' },
  { value: 'dingdong', label: '叮咚' },
  { value: 'mute', label: '静音' },
];

const wrongOptions: Array<{ value: WrongSoundType; label: string }> = [
  { value: 'alert', label: '轻警' },
  { value: 'buzz', label: '嗡嗡' },
  { value: 'mute', label: '静音' },
];

const completeOptions: Array<{ value: CompleteSoundType; label: string }> = [
  { value: 'curtain', label: '落幕' },
  { value: 'cheer', label: '欢呼' },
  { value: 'mute', label: '静音' },
];

const SoundEffectsSection: React.FC = () => {
  const { soundEffects, setSoundEffects } = useSettingsStore();

  return (
    <div className="space-y-5">
      {/* 全局开关 */}
      <div
        className="rounded-2xl p-5 border backdrop-blur-xl"
        style={{
          background: 'rgba(15, 23, 42, 0.6)',
          borderColor: 'rgba(139, 92, 246, 0.2)',
          boxShadow: '0 0 30px rgba(139, 92, 246, 0.05)',
        }}
      >
        <div className="flex items-center gap-2 mb-4">
          <Volume2 className="w-5 h-5" style={{ color: '#A78BFA' }} />
          <h3 className="text-base font-semibold text-white">音效开关</h3>
        </div>

        <div className="space-y-1">
          <EffectSwitchRow
            label="切题音效"
            desc="切换题目时的提示音"
            icon={<MousePointer2 className="w-4 h-4" />}
            color="#6366F1"
            checked={soundEffects.switchQuestionSound}
            onChange={(v) => setSoundEffects({ switchQuestionSound: v })}
            divider
          />
          <EffectSwitchRow
            label="口语评测结束音效"
            desc="口语评测完成后的提示音"
            icon={<Mic2 className="w-4 h-4" />}
            color="#2563EB"
            checked={soundEffects.evaluationEndSound}
            onChange={(v) => setSoundEffects({ evaluationEndSound: v })}
          />
        </div>
      </div>

      {/* 打字音效 */}
      <div
        className="rounded-2xl p-5 border backdrop-blur-xl"
        style={{
          background: 'rgba(15, 23, 42, 0.6)',
          borderColor: 'rgba(245, 158, 11, 0.2)',
          boxShadow: '0 0 30px rgba(245, 158, 11, 0.05)',
        }}
      >
        <div className="flex items-center gap-2 mb-4">
          <Zap className="w-5 h-5" style={{ color: '#FBBF24' }} />
          <h3 className="text-base font-semibold text-white">打字音效</h3>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400">音效类型</span>
            <div className="w-32">
              <Select
                value={soundEffects.typingSoundType}
                onValueChange={(val: string) =>
                  setSoundEffects({ typingSoundType: val as TypingSoundType })
                }
              >
                <SelectTrigger
                  className="w-full text-xs h-9"
                  style={{
                    background: 'rgba(255, 255, 255, 0.04)',
                    borderColor: 'rgba(99, 102, 241, 0.15)',
                    color: '#E2E8F0',
                  }}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent
                  style={{
                    background: 'rgba(15, 23, 42, 0.95)',
                    borderColor: 'rgba(139, 92, 246, 0.3)',
                    color: '#E2E8F0',
                  }}
                >
                  {typingOptions.map((opt) => (
                    <SelectItem
                      key={opt.value}
                      value={opt.value}
                      className="text-xs data-[state=checked]:text-purple-400 focus:bg-purple-900/30"
                    >
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {soundEffects.typingSoundType !== 'mute' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">音量</span>
                <span className="text-sm font-semibold" style={{ color: '#F59E0B' }}>
                  {soundEffects.typingSoundVolume}%
                </span>
              </div>
              <Slider
                value={[soundEffects.typingSoundVolume]}
                min={0}
                max={100}
                step={1}
                onValueChange={(vals: number[]) =>
                  setSoundEffects({ typingSoundVolume: vals[0] })
                }
                 className="[&_[data-slot=slider-track]]:bg-white/10 [&_[data-slot=slider-range]]:bg-gradient-to-r [&_[data-slot=slider-range]]:from-amber-500 [&_[data-slot=slider-range]]:to-orange-500 [&_[data-slot=slider-thumb]]:border-amber-400 [&_[data-slot=slider-thumb]]:bg-amber-900 [&_[data-slot=slider-thumb]]:shadow-[0_0_10px_rgba(245_158_11_0.5)]"
              />
            </div>
          )}
        </div>
      </div>

      {/* 答题反馈音效 */}
      <div
        className="rounded-2xl p-5 border backdrop-blur-xl"
        style={{
          background: 'rgba(15, 23, 42, 0.6)',
          borderColor: 'rgba(6, 182, 212, 0.2)',
          boxShadow: '0 0 30px rgba(6, 182, 212, 0.05)',
        }}
      >
        <div className="flex items-center gap-2 mb-4">
          <CheckCircle2 className="w-5 h-5" style={{ color: '#22D3EE' }} />
          <h3 className="text-base font-semibold text-white">答题反馈</h3>
        </div>

        {/* 正确音效 */}
        <SoundSelectRow
          label="答题正确音效"
          icon={<CheckCircle2 className="w-4 h-4" />}
          iconColor="#06B6D4"
          value={soundEffects.correctSoundType}
          options={correctOptions}
          volume={soundEffects.correctSoundVolume}
          onChange={(val) =>
            setSoundEffects({ correctSoundType: val as CorrectSoundType })
          }
          onVolumeChange={(val) => setSoundEffects({ correctSoundVolume: val })}
          divider
        />

        {/* 错误音效 */}
        <SoundSelectRow
          label="答题错误音效"
          icon={<XCircle className="w-4 h-4" />}
          iconColor="#EF4444"
          value={soundEffects.wrongSoundType}
          options={wrongOptions}
          volume={soundEffects.wrongSoundVolume}
          onChange={(val) =>
            setSoundEffects({ wrongSoundType: val as WrongSoundType })
          }
          onVolumeChange={(val) => setSoundEffects({ wrongSoundVolume: val })}
        />
      </div>

      {/* 课程完成音效 */}
      <div
        className="rounded-2xl p-5 border backdrop-blur-xl"
        style={{
          background: 'rgba(15, 23, 42, 0.6)',
          borderColor: 'rgba(251, 191, 36, 0.2)',
          boxShadow: '0 0 30px rgba(251, 191, 36, 0.05)',
        }}
      >
        <div className="flex items-center gap-2 mb-4">
          <Trophy className="w-5 h-5" style={{ color: '#FDE047' }} />
          <h3 className="text-base font-semibold text-white">课程完成</h3>
        </div>

        <SoundSelectRow
          label="课程完成音效"
          icon={<Trophy className="w-4 h-4" />}
          iconColor="#FBBF24"
          value={soundEffects.completeSoundType}
          options={completeOptions}
          volume={soundEffects.completeSoundVolume}
          onChange={(val) =>
            setSoundEffects({ completeSoundType: val as CompleteSoundType })
          }
          onVolumeChange={(val) =>
            setSoundEffects({ completeSoundVolume: val })
          }
        />
      </div>
    </div>
  );
};

interface EffectSwitchRowProps {
  label: string;
  desc: string;
  icon: React.ReactNode;
  color: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  divider?: boolean;
}

const EffectSwitchRow: React.FC<EffectSwitchRowProps> = ({
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

interface SoundSelectRowProps {
  label: string;
  icon: React.ReactNode;
  iconColor: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  volume: number;
  onChange: (value: string) => void;
  onVolumeChange: (value: number) => void;
  divider?: boolean;
}

const SoundSelectRow: React.FC<SoundSelectRowProps> = ({
  label,
  icon,
  iconColor,
  value,
  options,
  volume,
  onChange,
  onVolumeChange,
  divider,
}) => (
  <div className={`${divider ? 'pb-4 mb-4 border-b border-white/5' : ''}`}>
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-3">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: `${iconColor}20`, color: iconColor }}
        >
          {icon}
        </div>
         <span className="text-sm text-slate-200">{label}</span>
      </div>
      <div className="w-28">
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger
            className="w-full text-xs h-8"
            style={{
              background: 'rgba(255, 255, 255, 0.04)',
              borderColor: 'rgba(99, 102, 241, 0.15)',
              color: '#E2E8F0',
            }}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent
            style={{
              background: 'rgba(15, 23, 42, 0.95)',
              borderColor: 'rgba(139, 92, 246, 0.3)',
              color: '#E2E8F0',
            }}
          >
            {options.map((opt) => (
              <SelectItem
                key={opt.value}
                value={opt.value}
                className="text-xs data-[state=checked]:text-purple-400 focus:bg-purple-900/30"
              >
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>

    {value !== 'mute' && (
      <div className="pl-11 space-y-1.5">
        <div className="flex items-center justify-between">
           <span className="text-xs text-slate-400">音量</span>
          <span className="text-xs font-medium" style={{ color: iconColor }}>
            {volume}%
          </span>
        </div>
        <Slider
          value={[volume]}
          min={0}
          max={100}
          step={1}
          onValueChange={(vals: number[]) => onVolumeChange(vals[0])}
           className="[&_[data-slot=slider-track]]:bg-white/10 [&_[data-slot=slider-range]]:from-fuchsia-500 [&_[data-slot=slider-range]]:to-blue-500 [&_[data-slot=slider-thumb]]:border-fuchsia-400 [&_[data-slot=slider-thumb]]:bg-fuchsia-900 [&_[data-slot=slider-thumb]]:shadow-[0_0_8px_rgba(217_70_239_0.4)]"
        />
      </div>
    )}
  </div>
);

export default SoundEffectsSection;
