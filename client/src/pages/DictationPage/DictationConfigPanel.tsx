import React, { useState } from 'react';
import { X, Play } from 'lucide-react';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { dictationApi } from '@client/src/api';
import type {
  DictationMode,
  DictationSpeechRate,
  DictationSession,
} from '@shared/api.interface';

interface DictationConfigPanelProps {
  open: boolean;
  onClose: () => void;
  onStart: (session: DictationSession) => void;
  /** 预填配置（从教材页进入时） */
  preset?: {
    grade?: string;
    semester?: string;
    textbookId?: string;
    unitId?: string;
    unitTitle?: string;
  };
}

const GRADE_OPTIONS = [
  { value: 'grade1', label: '一年级' },
  { value: 'grade2', label: '二年级' },
  { value: 'grade3', label: '三年级' },
  { value: 'grade4', label: '四年级' },
  { value: 'grade5', label: '五年级' },
  { value: 'grade6', label: '六年级' },
];

const SEMESTER_OPTIONS = [
  { value: 'upper', label: '上册' },
  { value: 'lower', label: '下册' },
];

const MODE_OPTIONS: { value: DictationMode; label: string; desc: string }[] = [
  { value: 'pinyin_to_char', label: '看拼音写汉字', desc: '给出拼音，写出对应汉字' },
  { value: 'char_to_pinyin', label: '看汉字写拼音', desc: '给出汉字，写出对应拼音' },
  { value: 'audio_to_char', label: '听音写汉字', desc: '听发音，写出对应汉字' },
  { value: 'audio_to_pinyin', label: '听音写拼音', desc: '听发音，写出对应拼音' },
];

const COUNT_OPTIONS: { value: number | 'all'; label: string }[] = [
  { value: 5, label: '5 题' },
  { value: 10, label: '10 题' },
  { value: 20, label: '20 题' },
  { value: 'all', label: '全部' },
];

const SPEED_OPTIONS: { value: DictationSpeechRate; label: string }[] = [
  { value: 'slow', label: '慢速' },
  { value: 'normal', label: '正常' },
  { value: 'fast', label: '快速' },
];

const DictationConfigPanel: React.FC<DictationConfigPanelProps> = ({
  open,
  onClose,
  onStart,
  preset,
}) => {
  const [grade, setGrade] = useState<string>(preset?.grade || 'grade3');
  const [semester, setSemester] = useState<string>(preset?.semester || 'upper');
  const [mode, setMode] = useState<DictationMode>('pinyin_to_char');
  const [count, setCount] = useState<number | 'all'>(10);
  const [speechRate, setSpeechRate] = useState<DictationSpeechRate>('normal');
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const handleStart = async (): Promise<void> => {
    setLoading(true);
    try {
      const session = await dictationApi.createDictationSession({
        subject: 'chinese',
        grade,
        semester,
        textbookId: preset?.textbookId,
        unitId: preset?.unitId,
        mode,
        speechRate,
        count,
      });
      onStart(session);
    } catch (err) {
      logger.error('创建听写会话失败', err as Error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* 背景遮罩 */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* 弹窗主体 */}
      <div
        className="relative w-full max-w-lg rounded-2xl p-6 border overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #FFFFFF 0%, #EEF2FF 100%)',
          borderColor: 'rgba(99, 102, 241, 0.25)',
          boxShadow: '0 0 60px rgba(99, 102, 241, 0.2)',
        }}
      >
        {/* 装饰光晕 */}
        <div
          className="absolute -top-20 -right-20 w-40 h-40 rounded-full blur-3xl pointer-events-none"
          style={{ background: 'rgba(99, 102, 241, 0.2)' }}
        />
        <div
          className="absolute -bottom-20 -left-20 w-40 h-40 rounded-full blur-3xl pointer-events-none"
          style={{ background: 'rgba(59, 130, 246, 0.25)' }}
        />

        {/* 头部 */}
        <div className="relative flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-slate-800">生字听写配置</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-indigo-50 transition-colors"
            aria-label="关闭"
          >
            <X size={20} />
          </button>
        </div>

        <div className="relative space-y-5 max-h-[70vh] overflow-y-auto pr-2">
          {/* 年级选择 */}
          <div>
            <label className="text-sm font-medium text-slate-700 mb-2 block">
              年级
            </label>
            <div className="grid grid-cols-3 gap-2">
              {GRADE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setGrade(opt.value)}
                  className={`py-2 px-3 rounded-lg text-sm font-medium transition-all border ${
                    grade === opt.value
                      ? 'bg-[#6366F1]/20 text-white border-[#6366F1] shadow-[0_0_12px_rgba(124_58_237_0.4)]'
                      : 'bg-[#F8FAFC] text-slate-500 border-indigo-200 hover:border-[#6366F1]/50 hover:text-slate-700'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* 学期选择 */}
          <div>
            <label className="text-sm font-medium text-slate-700 mb-2 block">
              学期
            </label>
            <div className="inline-flex bg-[#F8FAFC] rounded-lg p-0.5 border border-[rgba(124_58_237_0.2)]">
              {SEMESTER_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setSemester(opt.value)}
                  className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${
                    semester === opt.value
                      ? 'bg-gradient-to-r from-[#6366F1] to-[#2563EB] text-white shadow-md'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* 单元提示（从教材进入时） */}
          {preset?.unitTitle && (
            <div className="p-3 rounded-lg bg-[#06B6D4]/10 border border-[#06B6D4]/30">
              <p className="text-sm text-[#06B6D4]">
                📚 选自：{preset.unitTitle}
              </p>
            </div>
          )}

          {/* 听写模式 */}
          <div>
            <label className="text-sm font-medium text-slate-700 mb-2 block">
              听写模式
            </label>
            <div className="grid grid-cols-2 gap-2">
              {MODE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setMode(opt.value)}
                  className={`p-3 rounded-lg text-left transition-all border ${
                    mode === opt.value
                      ? 'bg-[#6366F1]/20 border-[#6366F1] shadow-[0_0_12px_rgba(124_58_237_0.3)]'
                      : 'bg-[#F8FAFC] border-[rgba(124_58_237_0.2)] hover:border-[#6366F1]/50'
                  }`}
                >
                  <div
                    className={`text-sm font-semibold ${
                      mode === opt.value ? 'text-white' : 'text-slate-700'
                    }`}
                  >
                    {opt.label}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    {opt.desc}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* 听写数量 */}
          <div>
            <label className="text-sm font-medium text-slate-700 mb-2 block">
              听写数量
            </label>
            <div className="grid grid-cols-4 gap-2">
              {COUNT_OPTIONS.map((opt) => (
                <button
                  key={String(opt.value)}
                  type="button"
                  onClick={() => setCount(opt.value)}
                  className={`py-2 px-2 rounded-lg text-sm font-medium transition-all border ${
                    count === opt.value
                      ? 'bg-[#06B6D4]/20 text-[#06B6D4] border-[#06B6D4] shadow-[0_0_12px_rgba(34_211_238_0.3)]'
                      : 'bg-[#F8FAFC] text-slate-500 border-indigo-200 hover:border-[#06B6D4]/50 hover:text-slate-700'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* 语速 */}
          <div>
            <label className="text-sm font-medium text-slate-700 mb-2 block">
              语速
            </label>
            <div className="inline-flex bg-[#F8FAFC] rounded-lg p-0.5 border border-[rgba(124_58_237_0.2)]">
              {SPEED_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setSpeechRate(opt.value)}
                  className={`px-5 py-2 rounded-md text-sm font-medium transition-all ${
                    speechRate === opt.value
                      ? 'bg-[#2563EB]/30 text-white border border-[#2563EB]/50'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 底部按钮 */}
        <div className="relative mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-lg text-sm font-medium text-slate-500
              hover:text-slate-700 hover:bg-indigo-50 transition-colors"
          >
            取消
          </button>
          <button
            type="button"
            onClick={handleStart}
            disabled={loading}
            className="px-6 py-2.5 rounded-lg text-sm font-semibold text-white
              bg-gradient-to-r from-[#6366F1] to-[#2563EB]
              hover:shadow-[0_0_20px_rgba(124_58_237_0.5)]
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-all flex items-center gap-2"
          >
            <Play size={16} fill="currentColor" />
            {loading ? '创建中...' : '开始听写'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DictationConfigPanel;
