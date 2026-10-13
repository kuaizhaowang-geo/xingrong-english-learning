import React from 'react';
import { Settings, Clock, Bell, BookOpen, MessageSquare, Timer } from 'lucide-react';
import { Slider } from '@client/src/components/ui/slider';
import { Switch } from '@client/src/components/ui/switch';

interface PlanSettingsProps {
  wordTarget: number;
  sentenceTarget: number;
  durationTarget: number;
  startTime: string;
  endTime: string;
  reminderEnabled: boolean;
  onWordTargetChange: (value: number) => void;
  onSentenceTargetChange: (value: number) => void;
  onDurationTargetChange: (value: number) => void;
  onStartTimeChange: (value: string) => void;
  onEndTimeChange: (value: string) => void;
  onReminderToggle: (enabled: boolean) => void;
}

const PlanSettings: React.FC<PlanSettingsProps> = ({
  wordTarget,
  sentenceTarget,
  durationTarget,
  startTime,
  endTime,
  reminderEnabled,
  onWordTargetChange,
  onSentenceTargetChange,
  onDurationTargetChange,
  onStartTimeChange,
  onEndTimeChange,
  onReminderToggle,
}) => {
  const sliderClass =
    '[&_[data-slot=slider-track]]:bg-purple-900/40 ' +
    '[&_[data-slot=slider-range]]:bg-gradient-to-r ' +
    '[&_[data-slot=slider-range]]:from-purple-500 ' +
    '[&_[data-slot=slider-range]]:to-cyan-400 ' +
    '[&_[data-slot=slider-thumb]]:border-purple-400 ' +
    '[&_[data-slot=slider-thumb]]:bg-purple-100 ' +
    '[&_[data-slot=slider-thumb]]:shadow-[0_0_10px_rgba(124_58_237_0.6)]';

  return (
    <div
      className="rounded-xl sm:rounded-2xl p-4 sm:p-6"
      style={{
         background: 'rgba(255, 255, 255, 0.9)',
         border: '1px solid rgba(99, 102, 241, 0.15)',
         backdropFilter: 'blur(10px)',
      }}
      data-ai-section-type="card-list"
    >
      <div className="flex items-center gap-2 mb-6">
        <Settings className="w-5 h-5" style={{ color: '#6366F1' }} />
         <h3 className="text-base sm:text-lg font-semibold" style={{ color: '#1E293B' }}>
           计划设置
         </h3>
      </div>

      <div className="space-y-6">
        {/* Daily targets */}
        <div className="space-y-5">
             <h4 className="text-sm font-medium" style={{ color: '#64748B' }}>
               每日学习目标
          </h4>

          {/* Word target */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4" style={{ color: '#6366F1' }} />
                 <span className="text-sm" style={{ color: '#475569' }}>
                   单词数
                </span>
              </div>
              <span
                className="text-sm font-semibold px-2 py-0.5 rounded-md"
                style={{
                  background: 'rgba(99, 102, 241, 0.12)',
                  color: '#818CF8',
                }}
              >
                {wordTarget} 个
              </span>
            </div>
            <Slider
              value={[wordTarget]}
              min={10}
              max={200}
              step={5}
              onValueChange={(vals: number[]) => onWordTargetChange(vals[0])}
              className={sliderClass}
            />
          </div>

          {/* Sentence target */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4" style={{ color: '#2563EB' }} />
                 <span className="text-sm" style={{ color: '#475569' }}>
                   句子数
                </span>
              </div>
              <span
                className="text-sm font-semibold px-2 py-0.5 rounded-md"
                style={{
                  background: 'rgba(59, 130, 246, 0.2)',
                  color: '#60A5FA',
                }}
              >
                {sentenceTarget} 句
              </span>
            </div>
            <Slider
              value={[sentenceTarget]}
              min={5}
              max={100}
              step={1}
              onValueChange={(vals: number[]) => onSentenceTargetChange(vals[0])}
              className={sliderClass}
            />
          </div>

          {/* Duration target */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Timer className="w-4 h-4" style={{ color: '#06B6D4' }} />
                 <span className="text-sm" style={{ color: '#475569' }}>
                   学习时长
                </span>
              </div>
              <span
                className="text-sm font-semibold px-2 py-0.5 rounded-md"
                style={{
                  background: 'rgba(34, 211, 238, 0.2)',
                  color: '#06B6D4',
                }}
              >
                {durationTarget} 分钟
              </span>
            </div>
            <Slider
              value={[durationTarget]}
              min={10}
              max={180}
              step={5}
              onValueChange={(vals: number[]) => onDurationTargetChange(vals[0])}
              className={sliderClass}
            />
          </div>
        </div>

        {/* Divider */}
        <div
          className="h-px"
          style={{ background: 'rgba(99, 102, 241, 0.08)' }}
        />

        {/* Study time */}
        <div className="space-y-4">
             <h4 className="text-sm font-medium" style={{ color: '#64748B' }}>
               学习时段
          </h4>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="text-xs mb-1 block" style={{ color: '#64748B' }}>
                开始时间
              </label>
              <div
                className="flex items-center gap-2 px-3 py-2 rounded-lg"
                style={{
                  background: 'rgba(99, 102, 241, 0.08)',
                  border: '1px solid rgba(99, 102, 241, 0.15)',
                }}
              >
                <Clock className="w-4 h-4" style={{ color: '#6366F1' }} />
                <input
                  type="time"
                  value={startTime}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    onStartTimeChange(e.target.value)
                  }
                  className="bg-transparent outline-none text-sm flex-1"
                   style={{ color: '#1E293B', colorScheme: 'light' }}
                />
              </div>
            </div>
            <span className="text-lg mt-5" style={{ color: '#64748B' }}>
              —
            </span>
            <div className="flex-1">
              <label className="text-xs mb-1 block" style={{ color: '#64748B' }}>
                结束时间
              </label>
              <div
                className="flex items-center gap-2 px-3 py-2 rounded-lg"
                style={{
                  background: 'rgba(59, 130, 246, 0.1)',
                  border: '1px solid rgba(59, 130, 246, 0.25)',
                }}
              >
                <Clock className="w-4 h-4" style={{ color: '#2563EB' }} />
                <input
                  type="time"
                  value={endTime}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    onEndTimeChange(e.target.value)
                  }
                  className="bg-transparent outline-none text-sm flex-1"
                   style={{ color: '#1E293B', colorScheme: 'light' }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div
          className="h-px"
          style={{ background: 'rgba(99, 102, 241, 0.08)' }}
        />

        {/* Reminder */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4" style={{ color: '#06B6D4' }} />
            <div>
               <span className="text-sm" style={{ color: '#475569' }}>
                 学习提醒
              </span>
              <p className="text-xs mt-0.5" style={{ color: '#64748B' }}>
                到学习时段自动提醒
              </p>
            </div>
          </div>
          <Switch
            checked={reminderEnabled}
            onCheckedChange={onReminderToggle}
            className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-purple-500 data-[state=checked]:to-cyan-400"
          />
        </div>
      </div>
    </div>
  );
};

export default PlanSettings;
