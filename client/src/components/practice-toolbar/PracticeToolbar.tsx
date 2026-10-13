import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen,
  Settings,
  List,
  Layers,
  Pause,
  RotateCcw,
  Flag,
  Volume2,
  Hand,
  Eye,
  ChevronRight,
  Check,
  X,
  Upload,
  Play,
} from 'lucide-react';

export type PracticeMode = 'watch-speak' | 'dictation' | 'typing' | 'shadowing';

interface ModeOption {
  id: PracticeMode;
  title: string;
  subtitle: string;
  description: string;
  icon: React.ReactNode;
  gradient: string;
  badge?: string;
}

const MODES: ModeOption[] = [
  {
    id: 'watch-speak',
    title: '看说模式',
    subtitle: '表达训练',
    description: '看中文翻译，尝试用英文表达，录音后对照原文和语法解析',
    icon: <Eye size={24} />,
    gradient: 'from-amber-500 to-orange-600',
    badge: '入门',
  },
  {
    id: 'dictation',
    title: '听写模式',
    subtitle: '听力+拼写',
    description: '播放英语音频，逐词听写，空格跳格，错误即时标红',
    icon: <Volume2 size={24} />,
    gradient: 'from-sky-500 to-blue-600',
    badge: '基础',
  },
  {
    id: 'typing',
    title: '打字模式',
    subtitle: '指法+输入',
    description: '26键虚拟键盘+虚拟双手指法引导，逐字母输入练习',
    icon: <Layers size={24} />,
    gradient: 'from-violet-500 to-purple-700',
    badge: '核心',
  },
  {
    id: 'shadowing',
    title: '跟读模式',
    subtitle: '口语评测',
    description: '跟读完整句子，获得准确度和流利度评分，突破口语瓶颈',
    icon: <Play size={24} />,
    gradient: 'from-rose-500 to-pink-600',
    badge: '进阶',
  },
];

const ERROR_TYPES = [
  { value: 'content', label: '内容有误' },
  { value: 'translation', label: '翻译不准' },
  { value: 'phonetic', label: '音标错误' },
  { value: 'pronunciation', label: '发音问题' },
  { value: 'partOfSpeech', label: '词性标注' },
  { value: 'grammar', label: '语法错误' },
];

interface ToolbarButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  active?: boolean;
  badge?: string | number;
}

const ToolbarButton: React.FC<ToolbarButtonProps> = ({
  icon,
  label,
  onClick,
  active,
  badge,
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
      active
        ? 'bg-violet-100 text-violet-700 border border-violet-300'
        : 'text-slate-600 hover:text-slate-800 hover:bg-indigo-50 border border-transparent'
    }`}
  >
    {icon}
    <span>{label}</span>
    {badge !== undefined && (
      <span className="ml-0.5 px-1.5 py-0.5 text-[10px] rounded-full bg-violet-500 text-white">
        {badge}
      </span>
    )}
  </button>
);

interface PracticeToolbarProps {
  unitTitle: string;
  progress: { current: number; total: number };
  currentMode: PracticeMode;
  onModeChange: (mode: PracticeMode) => void;
  isPaused: boolean;
  onPauseToggle: () => void;
  onResetProgress: () => void;
  showGrammarTags: boolean;
  onToggleGrammarTags: () => void;
  showIllustration: boolean;
  onToggleIllustration: () => void;
  settings: {
    selectedVoice: string;
    speechRate: number;
    soundEffectsEnabled: boolean;
    keyboardVisible: boolean;
    fingerGuideEnabled: boolean;
  };
  onSettingsChange: (key: string, value: unknown) => void;
  sentenceList: Array<{ id: string; sentence: string; translation: string }>;
  currentIndex: number;
  onJumpTo: (index: number) => void;
  currentSentence: string;
  currentTranslation: string;
  onSubmitFeedback: (data: {
    errorType: string;
    description: string;
    screenshotUrl?: string;
  }) => void;
}

const PracticeToolbar: React.FC<PracticeToolbarProps> = ({
  unitTitle,
  progress,
  currentMode,
  onModeChange,
  isPaused,
  onPauseToggle,
  onResetProgress,
  showGrammarTags,
  onToggleGrammarTags,
  showIllustration,
  onToggleIllustration,
  settings,
  onSettingsChange,
  sentenceList,
  currentIndex,
  onJumpTo,
  currentSentence,
  currentTranslation,
  onSubmitFeedback,
}) => {
  const [showSettings, setShowSettings] = useState(false);
  const [showList, setShowList] = useState(false);
  const [showModeSelector, setShowModeSelector] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackType, setFeedbackType] = useState('');
  const [feedbackDesc, setFeedbackDesc] = useState('');
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  const handleSubmitFeedback = () => {
    if (!feedbackType || !feedbackDesc.trim()) return;
    onSubmitFeedback({
      errorType: feedbackType,
      description: feedbackDesc,
    });
    setFeedbackSubmitted(true);
    setTimeout(() => {
      setShowFeedback(false);
      setFeedbackSubmitted(false);
      setFeedbackType('');
      setFeedbackDesc('');
    }, 1500);
  };

  const ModalShell: React.FC<{
    open: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    widthClass?: string;
  }> = ({ open, onClose, title, children, widthClass = 'max-w-md' }) => (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className={`relative w-full ${widthClass} rounded-2xl shadow-2xl overflow-hidden bg-[#FFFFFF] border border-indigo-200`}
            initial={{ scale: 0.92, y: 16, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.92, y: 16, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 320 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-500 via-blue-500 to-cyan-400" />
              <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-indigo-100">
              <h3 className="text-lg font-bold text-slate-800">{title}</h3>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-indigo-50 text-slate-500 hover:text-slate-700 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <div className="px-6 py-4 max-h-[70vh] overflow-y-auto">
              {children}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <div className="flex items-center justify-between px-4 py-2.5 bg-white/90 backdrop-blur-md border-b border-indigo-100">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-50 border border-indigo-200">
          <BookOpen size={16} className="text-indigo-600" />
          <div className="flex flex-col leading-tight">
            <span className="text-xs text-indigo-500">当前单元</span>
            <span className="text-sm font-semibold text-slate-800 truncate max-w-[180px]">
              {unitTitle || '综合练习'}
            </span>
          </div>
          <div className="ml-2 pl-2 border-l border-indigo-200">
            <span className="text-xs text-cyan-600 font-medium">
              {progress.current}/{progress.total}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onToggleGrammarTags}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
               showGrammarTags
                 ? 'bg-cyan-50 text-cyan-700 border border-cyan-200'
                 : 'text-slate-500 hover:text-slate-700 hover:bg-indigo-50 border border-transparent'
            }`}
          >
            <Layers size={14} />
            句式拆解
          </button>
          <button
            type="button"
            onClick={onToggleIllustration}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
               showIllustration
                 ? 'bg-pink-50 text-pink-700 border border-pink-200'
                 : 'text-slate-500 hover:text-slate-700 hover:bg-indigo-50 border border-transparent'
            }`}
          >
            <Eye size={14} />
            情景配图
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <ToolbarButton
          icon={<Settings size={16} />}
          label="偏好设置"
          onClick={() => setShowSettings(true)}
        />
        <ToolbarButton
          icon={<List size={16} />}
          label="内容列表"
          onClick={() => setShowList(true)}
          badge={progress.total}
        />
        <ToolbarButton
          icon={<Layers size={16} />}
          label="模式切换"
          onClick={() => setShowModeSelector(true)}
          active
        />
        <ToolbarButton
          icon={isPaused ? <Play size={16} /> : <Pause size={16} />}
          label={isPaused ? '继续学习' : '暂停学习'}
          onClick={onPauseToggle}
          active={isPaused}
        />
        <ToolbarButton
          icon={<RotateCcw size={16} />}
          label="重置进度"
          onClick={() => setShowResetConfirm(true)}
        />
        <ToolbarButton
          icon={<Flag size={16} />}
          label="反馈纠错"
          onClick={() => setShowFeedback(true)}
        />
      </div>

      <ModalShell
        open={showSettings}
        onClose={() => setShowSettings(false)}
        title="偏好设置"
      >
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700 mb-2 block">
               发音音色
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: 'young_female', label: '年轻女声' },
                { value: 'mature_female', label: '成熟女声' },
                { value: 'young_male', label: '年轻男声' },
                { value: 'mature_male', label: '成熟男声' },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => onSettingsChange('selectedVoice', opt.value)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                     settings.selectedVoice === opt.value
                       ? 'bg-indigo-100 text-indigo-700 border border-indigo-300'
                       : 'bg-slate-50 text-slate-600 border border-indigo-100 hover:bg-indigo-50'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
             <label className="text-sm font-medium text-slate-700 mb-2 flex items-center justify-between">
              <span>语速</span>
              <span className="text-cyan-600">{settings.speechRate}x</span>
            </label>
            <input
              type="range"
              min="0.5"
              max="2"
              step="0.1"
              value={settings.speechRate}
              onChange={(e) =>
                onSettingsChange('speechRate', Number(e.target.value))
              }
              className="w-full accent-violet-500"
            />
            <div className="flex justify-between text-xs text-slate-500 mt-1">
              <span>0.5x</span>
              <span>2.0x</span>
            </div>
          </div>

          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-2">
               <Volume2 size={18} className="text-slate-500" />
               <span className="text-sm text-slate-700">音效开关</span>
            </div>
            <button
              type="button"
              onClick={() =>
                onSettingsChange('soundEffectsEnabled', !settings.soundEffectsEnabled)
              }
              className={`w-11 h-6 rounded-full transition-colors relative ${
                settings.soundEffectsEnabled ? 'bg-violet-500' : 'bg-slate-600'
              }`}
            >
              <motion.div
                animate={{ x: settings.soundEffectsEnabled ? 20 : 2 }}
                className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-md"
              />
            </button>
          </div>

          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-2">
               <Layers size={18} className="text-slate-500" />
               <span className="text-sm text-slate-700">显示键盘</span>
            </div>
            <button
              type="button"
              onClick={() =>
                onSettingsChange('keyboardVisible', !settings.keyboardVisible)
              }
              className={`w-11 h-6 rounded-full transition-colors relative ${
                settings.keyboardVisible ? 'bg-violet-500' : 'bg-slate-600'
              }`}
            >
              <motion.div
                animate={{ x: settings.keyboardVisible ? 20 : 2 }}
                className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-md"
              />
            </button>
          </div>

          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-2">
               <Hand size={18} className="text-slate-500" />
               <span className="text-sm text-slate-700">指法引导</span>
            </div>
            <button
              type="button"
              onClick={() =>
                onSettingsChange('fingerGuideEnabled', !settings.fingerGuideEnabled)
              }
              className={`w-11 h-6 rounded-full transition-colors relative ${
                settings.fingerGuideEnabled ? 'bg-violet-500' : 'bg-slate-600'
              }`}
            >
              <motion.div
                animate={{ x: settings.fingerGuideEnabled ? 20 : 2 }}
                className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-md"
              />
            </button>
          </div>
        </div>
      </ModalShell>

      <ModalShell
        open={showList}
        onClose={() => setShowList(false)}
        title="学习内容"
        widthClass="max-w-lg"
      >
        <div className="space-y-1.5">
          {sentenceList.map((item, idx) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                onJumpTo(idx);
                setShowList(false);
              }}
              className={`w-full text-left px-3 py-2.5 rounded-lg transition-all ${
                 idx === currentIndex
                   ? 'bg-indigo-50 border border-indigo-200'
                   : 'hover:bg-indigo-50 border border-transparent'
              }`}
            >
              <div className="flex items-start gap-2">
                <span
                  className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                     idx === currentIndex
                       ? 'bg-indigo-600 text-white'
                       : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {idx + 1}
                </span>
                <div className="flex-1 min-w-0">
                   <p className="text-sm font-medium text-slate-800 truncate">
                    {item.sentence}
                  </p>
                   <p className="text-xs text-slate-500 truncate mt-0.5">
                    {item.translation}
                  </p>
                </div>
                 <ChevronRight size={16} className="text-slate-500 flex-shrink-0 mt-1" />
              </div>
            </button>
          ))}
        </div>
      </ModalShell>

      <ModalShell
        open={showModeSelector}
        onClose={() => setShowModeSelector(false)}
        title="切换练习模式"
        widthClass="max-w-2xl"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {MODES.map((mode) => {
            const isCurrent = currentMode === mode.id;
            return (
              <button
                key={mode.id}
                type="button"
                onClick={() => {
                  onModeChange(mode.id);
                  setShowModeSelector(false);
                }}
                className={`relative text-left p-4 rounded-xl border-2 transition-all hover:scale-[1.02] ${
                   isCurrent
                     ? 'border-indigo-300 bg-indigo-50'
                     : 'border-indigo-100 bg-white hover:border-indigo-300'
                }`}
              >
                {mode.badge && (
                   <span className="absolute top-3 right-3 text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-600 border border-indigo-200">
                    {mode.badge}
                  </span>
                )}
                {isCurrent && (
                   <span className="absolute top-3 right-3 flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-50 text-cyan-600 border border-cyan-200">
                    <Check size={10} />
                    当前
                  </span>
                )}
                <div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-br ${mode.gradient} text-white flex items-center justify-center shadow-lg mb-3`}
                >
                  {mode.icon}
                </div>
                 <h4 className="text-base font-bold text-slate-800 mb-0.5">
                  {mode.title}
                </h4>
                 <p className="text-xs text-slate-500 mb-1.5">{mode.subtitle}</p>
                 <p className="text-sm text-slate-600 leading-relaxed">
                  {mode.description}
                </p>
              </button>
            );
          })}
        </div>
      </ModalShell>

      <ModalShell
        open={showResetConfirm}
        onClose={() => setShowResetConfirm(false)}
        title="重置进度"
        widthClass="max-w-sm"
      >
        <div className="text-center py-2">
          <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-orange-500/20 flex items-center justify-center">
            <RotateCcw size={28} className="text-orange-400" />
          </div>
           <p className="text-slate-700 font-medium mb-1">确定重置当前单元进度？</p>
           <p className="text-sm text-slate-500 mb-5">
            重置后当前单元的学习记录将被清空，从第1句重新开始
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setShowResetConfirm(false)}
               className="flex-1 px-4 py-2.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors font-medium"
            >
              取消
            </button>
            <button
              type="button"
              onClick={() => {
                onResetProgress();
                setShowResetConfirm(false);
              }}
              className="flex-1 px-4 py-2.5 rounded-lg bg-orange-500 text-white hover:bg-orange-600 transition-colors font-medium"
            >
              确认重置
            </button>
          </div>
        </div>
      </ModalShell>

      <ModalShell
        open={showFeedback}
        onClose={() => setShowFeedback(false)}
        title="反馈纠错"
        widthClass="max-w-md"
      >
        {feedbackSubmitted ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
              <Check size={32} className="text-green-400" />
            </div>
             <p className="text-lg font-bold text-slate-800 mb-1">反馈已提交</p>
             <p className="text-sm text-slate-500">感谢您的反馈，我们会尽快处理</p>
          </div>
        ) : (
          <div className="space-y-4">
             <div className="p-3 rounded-lg bg-slate-50 border border-indigo-100">
               <p className="text-xs text-slate-500 mb-1">英文原文</p>
               <p className="text-sm text-slate-800 font-medium">{currentSentence}</p>
               <p className="text-xs text-slate-500 mt-2 mb-1">中文翻译</p>
               <p className="text-sm text-slate-600">{currentTranslation}</p>
            </div>

            <div>
               <label className="text-sm font-medium text-slate-700 mb-2 block">
                 错误类型
              </label>
              <div className="grid grid-cols-2 gap-2">
                {ERROR_TYPES.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setFeedbackType(opt.value)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                       feedbackType === opt.value
                         ? 'bg-indigo-100 text-indigo-700 border border-indigo-300'
                         : 'bg-slate-50 text-slate-600 border border-indigo-100 hover:bg-indigo-50'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
               <label className="text-sm font-medium text-slate-700 mb-2 block">
                 错误描述
              </label>
              <textarea
                value={feedbackDesc}
                onChange={(e) => setFeedbackDesc(e.target.value)}
                placeholder="请描述具体问题..."
                rows={3}
                 className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-indigo-100 text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:border-indigo-400 resize-none"
              />
            </div>

            <div>
               <label className="text-sm font-medium text-slate-700 mb-2 block">
                 上传截图
              </label>
              <button
                type="button"
                 className="w-full px-4 py-3 rounded-lg bg-slate-50 border border-dashed border-indigo-200 text-slate-500 hover:bg-indigo-50 hover:border-indigo-300 transition-all flex items-center justify-center gap-2 text-sm"
              >
                <Upload size={16} />
                点击上传截图（可选）
              </button>
            </div>

            <button
              type="button"
              onClick={handleSubmitFeedback}
              disabled={!feedbackType || !feedbackDesc.trim()}
              className="w-full py-2.5 rounded-lg bg-gradient-to-r from-violet-500 to-blue-500 text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
            >
              提交反馈
            </button>
          </div>
        )}
      </ModalShell>
    </div>
  );
};

export default PracticeToolbar;
