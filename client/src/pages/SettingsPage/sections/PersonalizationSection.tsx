import React from 'react';
import {
  Palette,
  Sparkles,
  Type,
  Keyboard,
  Hand,
  Volume2,
} from 'lucide-react';
import { Switch } from '@client/src/components/ui/switch';
import {
  useSettingsStore,
  type ThemeMode,
  type FontSize,
  type KeyboardStyle,
} from '../store/settingsStore';

const themeOptions: Array<{
  value: ThemeMode;
  label: string;
  desc: string;
  gradient: string;
  accent: string;
}> = [
  {
    value: 'deepPurple',
    label: '深蓝紫',
    desc: '科技沉浸感',
    gradient: 'linear-gradient(135deg, #EEF2FF 0%, #1E1B4B 50%, #312E81 100%)',
    accent: '#6366F1',
  },
  {
    value: 'dark',
    label: '暗黑',
    desc: '经典深色',
    gradient: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
    accent: '#475569',
  },
  {
    value: 'light',
    label: '明亮',
    desc: '明亮清爽',
    gradient: 'linear-gradient(135deg, #F8FAFC 0%, #E2E8F0 100%)',
    accent: '#64748B',
  },
];

const fontSizeOptions: Array<{
  value: FontSize;
  label: string;
  desc: string;
  sizeClass: string;
}> = [
  { value: 'small', label: '小', desc: '紧凑', sizeClass: 'text-sm' },
  { value: 'medium', label: '中', desc: '标准', sizeClass: 'text-base' },
  { value: 'large', label: '大', desc: '易读', sizeClass: 'text-lg' },
];

const keyboardStyleOptions: Array<{
  value: KeyboardStyle;
  label: string;
  desc: string;
  preview: string;
}> = [
  {
    value: 'neon',
    label: '霓虹灯',
    desc: '赛博霓虹',
    preview:
      'linear-gradient(135deg, #6366F1 0%, #2563EB 50%, #06B6D4 100%)',
  },
  {
    value: 'classic',
    label: '经典',
    desc: '复古质感',
    preview: 'linear-gradient(135deg, #374151 0%, #1F2937 100%)',
  },
  {
    value: 'minimal',
    label: '简约',
    desc: '简洁干净',
    preview: 'linear-gradient(135deg, #E5E7EB 0%, #D1D5DB 100%)',
  },
];

const PersonalizationSection: React.FC = () => {
  const { personalization, setPersonalization } = useSettingsStore();

  return (
    <div className="space-y-5">
      {/* 主题选择 */}
      <div
        className="rounded-2xl p-5 border backdrop-blur-xl"
        style={{
          background: 'rgba(15, 23, 42, 0.6)',
          borderColor: 'rgba(139, 92, 246, 0.2)',
          boxShadow: '0 0 30px rgba(139, 92, 246, 0.05)',
        }}
      >
        <div className="flex items-center gap-2 mb-4">
          <Palette className="w-5 h-5" style={{ color: '#A78BFA' }} />
          <h3 className="text-base font-semibold text-white">主题选择</h3>
          <Sparkles className="w-4 h-4 ml-1" style={{ color: '#22D3EE' }} />
        </div>

        <div className="grid grid-cols-3 gap-3">
          {themeOptions.map((opt) => {
            const active = personalization.theme === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => setPersonalization({ theme: opt.value })}
                className={`relative group rounded-xl overflow-hidden transition-all duration-300 ${
                  active ? 'scale-[1.02]' : 'hover:scale-[1.01]'
                }`}
                style={{
                  border: active ? `2px solid ${opt.accent}` : '2px solid transparent',
                  boxShadow: active ? `0 0 20px ${opt.accent}40` : 'none',
                }}
              >
                <div
                  className="h-20 w-full"
                  style={{ background: opt.gradient }}
                />
                  <div
                    className="p-3 text-left"
                    style={{ background: 'rgba(15, 23, 42, 0.6)' }}
                  >
                    <div
                      className="text-sm font-medium"
                      style={{ color: active ? opt.accent : '#CBD5E1' }}
                    >
                      {opt.label}
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">{opt.desc}</div>
                </div>
                {active && (
                  <div
                    className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full"
                    style={{
                      background: opt.accent,
                      boxShadow: `0 0 8px ${opt.accent}`,
                    }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 字体大小 */}
      <div
        className="rounded-2xl p-5 border backdrop-blur-xl"
        style={{
          background: 'rgba(15, 23, 42, 0.6)',
          borderColor: 'rgba(6, 182, 212, 0.2)',
          boxShadow: '0 0 30px rgba(6, 182, 212, 0.05)',
        }}
      >
        <div className="flex items-center gap-2 mb-4">
          <Type className="w-5 h-5" style={{ color: '#22D3EE' }} />
          <h3 className="text-base font-semibold text-white">字体大小</h3>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {fontSizeOptions.map((opt) => {
            const active = personalization.fontSize === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() =>
                  setPersonalization({ fontSize: opt.value })
                }
                className={`py-4 rounded-xl border transition-all duration-300 flex flex-col items-center gap-1.5 ${
                  active ? 'scale-[1.02]' : 'hover:border-cyan-500/40 hover:bg-cyan-500/5'
                }`}
                style={{
                  background: active
                    ? 'linear-gradient(135deg, rgba(34,211,238,0.2) 0%, rgba(139, 92, 246, 0.1) 100%)'
                    : 'rgba(255, 255, 255, 0.03)',
                  borderColor: active
                    ? 'rgba(34, 211, 238, 0.5)'
                    : 'rgba(255, 255, 255, 0.1)',
                  boxShadow: active
                    ? '0 0 15px rgba(34, 211, 238, 0.25)'
                    : 'none',
                }}
              >
                <span
                  className={`font-semibold ${opt.sizeClass}`}
                  style={{ color: active ? '#22D3EE' : '#CBD5E1' }}
                >
                  Aa
                </span>
                <span className="text-xs text-slate-400">{opt.label}</span>
                <span className="text-[10px] text-slate-500">{opt.desc}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 键盘样式 */}
      <div
        className="rounded-2xl p-5 border backdrop-blur-xl"
        style={{
          background: 'rgba(15, 23, 42, 0.6)',
          borderColor: 'rgba(168, 85, 247, 0.2)',
          boxShadow: '0 0 30px rgba(168, 85, 247, 0.05)',
        }}
      >
        <div className="flex items-center gap-2 mb-4">
          <Keyboard className="w-5 h-5" style={{ color: '#C084FC' }} />
          <h3 className="text-base font-semibold text-white">键盘样式</h3>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {keyboardStyleOptions.map((opt) => {
            const active = personalization.keyboardStyle === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() =>
                  setPersonalization({ keyboardStyle: opt.value })
                }
                className={`rounded-xl border transition-all duration-300 overflow-hidden ${
                  active ? 'scale-[1.02]' : 'hover:border-purple-500/40 hover:bg-purple-500/5'
                }`}
                style={{
                  borderColor: active
                    ? 'rgba(168, 85, 247, 0.6)'
                    : 'rgba(255, 255, 255, 0.1)',
                  boxShadow: active
                    ? '0 0 15px rgba(168, 85, 247, 0.3)'
                    : 'none',
                }}
              >
                <div className="p-3 flex gap-1 justify-center" style={{ background: opt.preview }}>
                  <div className="w-4 h-6 rounded-md bg-white/20" />
                  <div className="w-4 h-6 rounded-md bg-white/20" />
                  <div className="w-4 h-6 rounded-md bg-white/20" />
                </div>
                <div
                  className="p-2 text-center"
                  style={{ background: 'rgba(15, 23, 42, 0.6)' }}
                >
                  <div
                    className="text-sm font-medium"
                    style={{ color: active ? '#C084FC' : '#CBD5E1' }}
                  >
                    {opt.label}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {opt.desc}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 功能开关 */}
      <div
        className="rounded-2xl p-5 border backdrop-blur-xl"
        style={{
          background: 'rgba(15, 23, 42, 0.6)',
          borderColor: 'rgba(245, 158, 11, 0.2)',
          boxShadow: '0 0 30px rgba(245, 158, 11, 0.05)',
        }}
      >
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5" style={{ color: '#FBBF24' }} />
          <h3 className="text-base font-semibold text-white">体验偏好</h3>
        </div>

        <div className="space-y-1">
          <SettingRow
            label="指法引导"
            desc="显示手指位置引导提示"
            icon={<Hand className="w-4 h-4" />}
            color="#F59E0B"
            checked={personalization.showFingerGuide}
            onChange={(v) => setPersonalization({ showFingerGuide: v })}
            divider
          />
          <SettingRow
            label="自动发音"
            desc="界面交互时自动播放发音提示"
            icon={<Volume2 className="w-4 h-4" />}
            color="#EC4899"
            checked={personalization.autoPronounce}
            onChange={(v) => setPersonalization({ autoPronounce: v })}
          />
        </div>
      </div>
    </div>
  );
};

interface SettingRowProps {
  label: string;
  desc: string;
  icon: React.ReactNode;
  color: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  divider?: boolean;
}

const SettingRow: React.FC<SettingRowProps> = ({
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

export default PersonalizationSection;
