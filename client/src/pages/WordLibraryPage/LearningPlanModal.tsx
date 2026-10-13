import React, { useState, useEffect } from 'react';
import { X, Target, Clock, Bell, Check } from 'lucide-react';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { wordsApi } from '@client/src/api';
import type { WordSettings } from '@client/src/api/words';

interface LearningPlanModalProps {
  open: boolean;
  onClose: () => void;
  onSaved?: (settings: WordSettings) => void;
}

const DAILY_GOAL_OPTIONS = [10, 20, 30, 50, 100];

const MODE_OPTIONS = [
  { key: 'recite', label: '闪卡背诵' },
  { key: 'spelling', label: '拼写练习' },
  { key: 'choice', label: '选择题' },
];

const LearningPlanModal: React.FC<LearningPlanModalProps> = ({
  open,
  onClose,
  onSaved,
}) => {
  const [dailyGoal, setDailyGoal] = useState(20);
  const [preferredModes, setPreferredModes] = useState<string[]>(['recite', 'spelling', 'choice']);
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderTime, setReminderTime] = useState('20:00');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    const loadSettings = async (): Promise<void> => {
      setLoading(true);
      try {
        const s = await wordsApi.getWordSettings();
        setDailyGoal(s.dailyGoal || 20);
        setPreferredModes(s.preferredModes?.length ? s.preferredModes : ['recite', 'spelling', 'choice']);
        setReminderEnabled(s.reminderEnabled ?? false);
        setReminderTime(s.reminderTime || '20:00');
      } catch (err) {
        logger.error('加载学习计划设置失败', err as Error);
      } finally {
        setLoading(false);
      }
    };
    loadSettings();
  }, [open]);

  const toggleMode = (mode: string): void => {
    setPreferredModes((prev) => {
      if (prev.includes(mode)) {
        return prev.filter((m: string) => m !== mode);
      }
      return [...prev, mode];
    });
  };

  const handleSave = async (): Promise<void> => {
    setSaving(true);
    try {
      const result = await wordsApi.updateWordSettings({
        dailyGoal,
        preferredModes,
        reminderEnabled,
        reminderTime,
      });
      onSaved?.(result);
      onClose();
    } catch (err) {
      logger.error('保存学习计划失败', err as Error);
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4
        bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md rounded-2xl p-6
          bg-slate-900/95 border border-violet-500/30
          shadow-2xl shadow-violet-500/20
          max-h-[90vh] overflow-y-auto"
      >
        <div className="absolute -top-24 -right-24 w-48 h-48
          rounded-full bg-violet-600/30 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48
          rounded-full bg-cyan-500/20 blur-3xl pointer-events-none" />

        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full
            bg-slate-800/70 text-slate-400 hover:text-white hover:bg-slate-700
            transition-colors z-10"
          aria-label="关闭"
        >
          <X size={18} />
        </button>

        <div className="relative mb-6">
          <div className="w-14 h-14 mx-auto mb-4 rounded-full
            bg-gradient-to-br from-violet-500/30 to-indigo-600/30
            border-2 border-violet-500/40 flex items-center justify-center">
            <Target size={26} className="text-violet-300" />
          </div>
          <h2 className="text-xl font-bold text-white text-center">学习计划设置</h2>
          <p className="text-xs text-slate-400 text-center mt-1">定制你的专属学习节奏</p>
        </div>

        {loading ? (
          <div className="py-12 text-center text-slate-400 text-sm">加载中...</div>
        ) : (
          <div className="relative space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Target size={16} className="text-violet-400" />
                <span className="text-sm font-medium text-slate-300">每日目标单词数</span>
              </div>
              <div className="grid grid-cols-5 gap-2">
                {DAILY_GOAL_OPTIONS.map((goal: number) => {
                  const active = dailyGoal === goal;
                  return (
                    <button
                      key={goal}
                      onClick={() => setDailyGoal(goal)}
                      className={`py-2 rounded-lg text-sm font-medium transition-all duration-200
                        ${active
                          ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-500/30'
                          : 'bg-slate-800/50 border border-slate-700/50 text-slate-400 hover:border-violet-500/50 hover:text-white'
                        }`}
                    >
                      {goal}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-3">
                <Check size={16} className="text-cyan-400" />
                <span className="text-sm font-medium text-slate-300">练习模式偏好</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {MODE_OPTIONS.map((mode) => {
                  const active = preferredModes.includes(mode.key);
                  return (
                    <button
                      key={mode.key}
                      onClick={() => toggleMode(mode.key)}
                      className={`py-2.5 px-3 rounded-lg text-xs font-medium transition-all duration-200
                        ${active
                          ? 'bg-violet-500/20 border border-violet-500/50 text-violet-300'
                          : 'bg-slate-800/50 border border-slate-700/50 text-slate-400 hover:border-slate-600'
                        }`}
                    >
                      {mode.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Bell size={16} className="text-amber-400" />
                  <span className="text-sm font-medium text-slate-300">复习提醒</span>
                </div>
                <button
                  onClick={() => setReminderEnabled(!reminderEnabled)}
                  className={`relative w-12 h-6 rounded-full transition-colors duration-200
                    ${reminderEnabled ? 'bg-violet-500' : 'bg-slate-700'}`}
                >
                  <div
                    className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all duration-200
                      ${reminderEnabled ? 'left-6' : 'left-0.5'}`}
                  />
                </button>
              </div>
              {reminderEnabled && (
                <div className="flex items-center gap-2 pl-6">
                  <Clock size={14} className="text-slate-500" />
                  <input
                    type="time"
                    value={reminderTime}
                    onChange={(e) => setReminderTime(e.target.value)}
                    className="px-3 py-1.5 rounded-lg text-sm
                      bg-slate-800/70 border border-slate-700/50 text-slate-200
                      focus:outline-none focus:border-violet-500/60 transition-colors"
                  />
                  <span className="text-xs text-slate-500">每日提醒</span>
                </div>
              )}
            </div>

            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full py-3 rounded-xl
                bg-gradient-to-r from-violet-600 to-indigo-600
                hover:from-violet-500 hover:to-indigo-500
                text-white font-medium shadow-lg shadow-violet-500/30
                transition-all duration-300 active:scale-95
                disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? '保存中...' : '保存设置'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default LearningPlanModal;
