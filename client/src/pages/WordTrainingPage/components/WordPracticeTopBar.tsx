import React, { useState } from 'react';
import { toast } from 'sonner';
import {
  BookOpen,
  Settings,
  List,
  Layers,
  Pause,
  RotateCcw,
  Flag,
  Play,
  X,
  ArrowLeft,
  Check,
  Volume2,
  Mic,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { PracticeMode } from '@client/src/components/practice-toolbar';
import ContentSidebar from '@client/src/components/ContentSidebar';
import type { ContentSidebarItem } from '@client/src/components/ContentSidebar';

interface WordItem {
  word: string;
  phonetic: string;
  pos: string;
  meaning: string;
  example: string;
}

interface WordPracticeTopBarProps {
  onBack: () => void;
  title: string;
  textbookTitle: string;
  progress: { current: number; total: number };
  currentMode: PracticeMode;
  onModeChange: (mode: PracticeMode) => void;
  isPaused: boolean;
  onPauseToggle: () => void;
  onResetProgress: () => void;
  wordList: WordItem[];
  currentIndex: number;
  onJumpTo: (index: number) => void;
  currentWord: string;
  currentMeaning: string;
  masteryMap: Record<string, 'mastered' | 'review'>;
  completedSet: Set<string>;
  elapsedSeconds: number;
  /** 是否在顶部栏下方显示模式切换标签 */
  showModeTabs?: boolean;
}

const MODE_NAMES: Record<PracticeMode, string> = {
  'watch-speak': '中译英模式',
  dictation: '听力模式',
  typing: '打字练习',
  shadowing: '口语练习',
};

const MODE_SUBTITLES: Record<PracticeMode, string> = {
  'watch-speak': '新手推荐',
  dictation: '泛听神器',
  typing: '输入强化',
  shadowing: '口语矫正',
};

const MODE_DESCRIPTIONS: Record<PracticeMode, string> = {
  'watch-speak': '看中文释义拼写英文单词',
  dictation: '听单词发音拼写',
  typing: '看单词打字练习拼写',
  shadowing: '跟读单词练习发音',
};

const MODE_BADGES: Record<PracticeMode, string> = {
  'watch-speak': '新手推荐',
  dictation: '泛听神器',
  typing: '输入强化',
  shadowing: '口语矫正',
};

const MODE_ICONS: Record<PracticeMode, React.ReactNode> = {
  'watch-speak': <BookOpen size={14} />,
  dictation: <Volume2 size={14} />,
  typing: <Layers size={14} />,
  shadowing: <Mic size={14} />,
};

const MODE_LIST: PracticeMode[] = ['watch-speak', 'dictation', 'typing', 'shadowing'];

const TextIconButton: React.FC<{
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  active?: boolean;
  badge?: string | number;
}> = ({ icon, label, onClick, active, badge }) => (
  <button
    type="button"
    onClick={onClick}
    className={`relative h-7 px-2.5 rounded-md flex items-center gap-1 text-[11px] font-medium transition-all ${
      active
        ? 'bg-gradient-to-br from-[#6366F1] to-[#2563EB] text-white shadow-sm shadow-[#6366F1]/40'
        : 'text-slate-500 hover:text-slate-700 hover:bg-indigo-50'
    }`}
  >
    {icon}
    <span>{label}</span>
    {badge !== undefined && (
      <span className="absolute -top-1 -right-1 min-w-[15px] h-3.5 px-1 text-[9px] rounded-full bg-gradient-to-r from-[#EF476F] to-[#F97316] text-white leading-none flex items-center justify-center">
        {badge}
      </span>
    )}
  </button>
);

const formatTime = (seconds: number): string => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

// ─── 霓虹深色图标按钮 ─────────────────────────────────────────
const IconButton: React.FC<{
  icon: React.ReactNode;
  onClick: () => void;
  label: string;
  active?: boolean;
  badge?: string | number;
}> = ({ icon, onClick, label, active, badge }) => (
  <button
    type="button"
    onClick={onClick}
    title={label}
    className={`relative w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
      active
        ? 'bg-gradient-to-r from-[#6366F1] to-[#2563EB] text-white shadow-md shadow-[#6366F1]/40'
        : 'text-slate-500 hover:text-slate-700 hover:bg-indigo-50'
    }`}
  >
    {icon}
    {badge !== undefined && (
      <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 text-[10px] rounded-full bg-gradient-to-r from-[#6366F1] to-[#2563EB] text-white leading-none flex items-center justify-center shadow-sm shadow-[#6366F1]/50">
        {badge}
      </span>
    )}
  </button>
);

// ─── 霓虹深色弹窗壳 ─────────────────────────────────────────
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
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.96, opacity: 0, y: 10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.96, opacity: 0, y: 10 }}
          transition={{ type: 'spring', stiffness: 350, damping: 28 }}
          className={`w-full ${widthClass} rounded-2xl glass-card overflow-hidden`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
            <h3 className="text-base font-semibold text-white">{title}</h3>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/5"
            >
              <X size={18} />
            </button>
          </div>
          <div className="p-5 max-h-[65vh] overflow-y-auto">{children}</div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

// 模式卡片
const ModeCard: React.FC<{
  mode: PracticeMode;
  isCurrent: boolean;
  onClick: () => void;
  index: number;
}> = ({ mode, isCurrent, onClick, index }) => {
  const iconMap: Record<PracticeMode, React.ReactNode> = {
    'watch-speak': <BookOpen size={20} />,
    dictation: <Volume2 size={20} />,
    typing: <Layers size={20} />,
    shadowing: <Mic size={20} />,
  };

  const gradientMap: Record<PracticeMode, string> = {
    'watch-speak': 'from-[#6366F1] to-[#A855F7]',
    dictation: 'from-[#2563EB] to-[#06B6D4]',
    typing: 'from-[#6366F1] to-[#2563EB]',
    shadowing: 'from-[#EC4899] to-[#6366F1]',
  };

  return (
    <motion.button
      type="button"
      whileHover={isCurrent ? { scale: 1.02 } : { scale: 1.01 }}
      whileTap={{ scale: 0.97 }}
      animate={isCurrent ? { y: -2 } : { y: 0 }}
      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
      onClick={onClick}
      className={`relative text-left rounded-xl border-2 overflow-hidden transition-all w-full ${
        isCurrent
          ? 'border-[#6366F1] shadow-lg shadow-[#6366F1]/30 bg-[rgba(124_58_237_0.1)]'
          : 'border-fuchsia-500/15 bg-white/5 hover:border-fuchsia-400/50 hover:bg-white/10'
      }`}
    >
      {isCurrent && (
        <span className="absolute top-2 right-2 z-10 flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-gradient-to-r from-[#6366F1] to-[#2563EB] text-white shadow-md shadow-[#6366F1]/50">
          <Check size={10} />
          当前
        </span>
      )}
      {!isCurrent && (
         <span className="absolute top-2 right-2 z-10 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/5 text-slate-300 border border-white/10">
          {MODE_BADGES[mode]}
        </span>
      )}
      <span className="absolute top-2 left-2 z-10 flex items-center gap-0.5 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md bg-[rgba(26_22_53_0.8)] text-[#94A3B8] border border-[rgba(124_58_237_0.2)] backdrop-blur-sm">
        {index + 1}
      </span>
      <div className="p-4 pt-6">
        <div className="flex items-center gap-3 mb-2">
          <div
            className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradientMap[mode]} text-white flex items-center justify-center shadow-lg shadow-[#6366F1]/30`}
          >
            {iconMap[mode]}
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-800 leading-tight">
              {MODE_NAMES[mode]}
            </h4>
            <p className="text-[11px] text-slate-500 leading-tight">
              {MODE_SUBTITLES[mode]}
            </p>
          </div>
        </div>
        <p className="text-xs text-slate-500 leading-relaxed">
          {MODE_DESCRIPTIONS[mode]}
        </p>
      </div>
    </motion.button>
  );
};

const WordPracticeTopBar: React.FC<WordPracticeTopBarProps> = ({
  onBack,
  title,
  textbookTitle,
  progress,
  currentMode,
  onModeChange,
  isPaused,
  onPauseToggle,
  onResetProgress,
  wordList,
  currentIndex,
  onJumpTo,
  currentWord,
  currentMeaning,
  masteryMap,
  completedSet,
  elapsedSeconds,
  showModeTabs = false,
}) => {
  const [showSettings, setShowSettings] = useState(false);
  const [showList, setShowList] = useState(false);
  const [showModeSelector, setShowModeSelector] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackType, setFeedbackType] = useState('content-error');

  const handleSubmitFeedback = () => {
    setShowFeedback(false);
    setFeedbackText('');
    toast.success('反馈已提交，感谢您的帮助');
  };

  return (
    <>
      {/* 顶部导航栏（单行，哇学社风格 - 霓虹深色） */}
       <div className="flex items-center justify-between px-3 py-1 bg-white/5 backdrop-blur-sm border-b border-fuchsia-500/15">
        {/* 左侧：返回 */}
        <div className="flex items-center gap-2 flex-shrink-0">
           <button
             type="button"
             onClick={onBack}
              className="w-7 h-7 rounded-md flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/5 transition-all"
             title="返回"
           >
             <ArrowLeft size={16} />
           </button>
        </div>

        {/* 中间偏左：词书名 + 进度 */}
         <div className="flex flex-col min-w-0 leading-none">
           <div className="flex items-center gap-1 min-w-0">
              <BookOpen size={13} className="text-fuchsia-400 flex-shrink-0" />
             <span className="text-sm font-semibold text-white truncate">
               {textbookTitle}
             </span>
           </div>
           <span className="text-[11px] text-slate-400 truncate pl-[18px]">
             {title}
           </span>
         </div>

         {/* 右侧：文字+图标按钮 + 计时器 */}
         <div className="flex items-center gap-0.5 flex-shrink-0">
           <TextIconButton
             icon={<Settings size={14} />}
             label="设置"
             onClick={() => setShowSettings(true)}
           />
            <TextIconButton
              icon={<List size={14} />}
              label="学习内容"
              onClick={() => setShowList(true)}
              badge={progress.total}
            />
            <TextIconButton
              icon={<Layers size={14} />}
              label="练习模式"
              onClick={() => setShowModeSelector(true)}
              active
            />
            <TextIconButton
              icon={isPaused ? <Play size={14} /> : <Pause size={14} />}
              label={isPaused ? '继续练习' : '暂停练习'}
              onClick={onPauseToggle}
            />
            <TextIconButton
              icon={<RotateCcw size={14} />}
              label="重置进度"
              onClick={() => setShowResetConfirm(true)}
            />
            <TextIconButton
              icon={<Flag size={14} />}
              label="报告错误"
              onClick={() => setShowFeedback(true)}
            />
          </div>
       </div>

       {/* 模式切换标签栏 */}
       {showModeTabs && (
         <div className="flex items-center justify-center gap-1 px-3 py-1.5 bg-white/5 backdrop-blur-sm border-b border-fuchsia-500/15">
           {MODE_LIST.map((mode: PracticeMode) => {
             const active = currentMode === mode;
             return (
               <button
                 key={mode}
                 type="button"
                 onClick={() => onModeChange(mode)}
                 className={`relative px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all flex items-center gap-1.5 ${
                   active
                     ? 'bg-gradient-to-r from-[#6366F1] to-[#2563EB] text-white shadow-md shadow-[#6366F1]/30'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                 }`}
               >
                 {MODE_ICONS[mode]}
                 {MODE_NAMES[mode]}
                 {active && (
                   <motion.div
                     layoutId="mode-tab-indicator"
                     className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full bg-[#06B6D4]"
                   />
                 )}
               </button>
             );
           })}
         </div>
       )}
      <ModalShell open={showSettings} onClose={() => setShowSettings(false)} title="偏好设置">
        <div className="space-y-3 text-sm text-slate-500">
          <p>设置功能即将上线，敬请期待。</p>
        </div>
      </ModalShell>

      {/* 单词列表侧边栏 */}
      <ContentSidebar
        open={showList}
        onClose={() => setShowList(false)}
        title="单词列表"
        theme="dark"
        items={wordList.map((item: WordItem, idx: number): ContentSidebarItem => {
          const key = item.word;
          const isCompleted = completedSet.has(key);
          const mastery = masteryMap[key];
          let status: ContentSidebarItem['status'] = 'pending';
          if (mastery === 'mastered') status = 'mastered';
          else if (mastery === 'review') status = 'review';
          else if (isCompleted) status = 'completed';
          return {
            id: key,
            index: idx,
            preview: item.word,
            subtitle: item.meaning,
            status,
          };
        })}
        currentIndex={currentIndex}
        onJumpTo={onJumpTo}
        footerText={`${progress.current} / ${progress.total}`}
        masteredCount={Object.values(masteryMap).filter((v: string) => v === 'mastered').length}
        reviewCount={Object.values(masteryMap).filter((v: string) => v === 'review').length}
      />

      {/* 模式选择弹窗 */}
      <ModalShell
        open={showModeSelector}
        onClose={() => setShowModeSelector(false)}
        title="选择练习模式"
        widthClass="max-w-2xl"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {MODE_LIST.map((mode: PracticeMode, idx: number) => (
            <ModeCard
              key={mode}
              mode={mode}
              isCurrent={currentMode === mode}
              index={idx}
              onClick={() => {
                onModeChange(mode);
                setShowModeSelector(false);
              }}
            />
          ))}
        </div>
        <div className="mt-4 flex items-center justify-center gap-2 text-[11px] text-slate-400">
          <kbd className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-slate-400 font-mono">
            Tab
          </kbd>
          <span>切换模式</span>
        </div>
      </ModalShell>

      {/* 重置确认弹窗 */}
      <ModalShell open={showResetConfirm} onClose={() => setShowResetConfirm(false)} title="重置进度">
        <p className="text-sm text-slate-400 mb-5">确定要重置当前练习进度吗？此操作不可撤销。</p>
        <div className="flex gap-2 justify-end">
          <button
            onClick={() => setShowResetConfirm(false)}
            className="px-4 py-2 rounded-lg neon-btn text-sm"
          >
            取消
          </button>
          <button
            onClick={() => {
              onResetProgress();
              setShowResetConfirm(false);
            }}
            className="px-4 py-2 rounded-lg text-white text-sm font-medium shadow-md shadow-[#6366F1]/40 bg-gradient-to-r from-[#6366F1] to-[#2563EB] hover:shadow-[#6366F1]/60"
          >
            确认重置
          </button>
        </div>
      </ModalShell>

      {/* 反馈弹窗 */}
      <ModalShell open={showFeedback} onClose={() => setShowFeedback(false)} title="报告错误">
        <div className="space-y-4">
          <div className="text-sm text-slate-400">
            当前单词：
            <span className="text-white font-medium ml-1">{currentWord}</span>
            <span className="text-slate-400 ml-2">{currentMeaning}</span>
          </div>
          <div className="space-y-1.5">
             <label className="text-xs text-slate-400">问题类型</label>
            <select
              value={feedbackType}
              onChange={(e) => setFeedbackType(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-slate-200 focus:outline-none focus:border-fuchsia-400/50 focus:ring-2 focus:ring-fuchsia-500/20"
            >
              <option value="content-error">内容错误</option>
              <option value="translation-error">翻译错误</option>
              <option value="pronunciation-error">发音错误</option>
              <option value="other">其他问题</option>
            </select>
          </div>
          <div className="space-y-1.5">
             <label className="text-xs text-slate-400">问题描述</label>
            <textarea
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              rows={3}
              placeholder="请描述您遇到的问题..."
               className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-fuchsia-400/50 focus:ring-2 focus:ring-fuchsia-500/20 resize-none"
            />
          </div>
          <div className="flex justify-end">
            <button
              onClick={handleSubmitFeedback}
              className="px-4 py-2 rounded-lg text-white text-sm font-medium shadow-md shadow-[#6366F1]/40 bg-gradient-to-r from-[#6366F1] to-[#2563EB] hover:shadow-[#6366F1]/60"
            >
              提交反馈
            </button>
          </div>
        </div>
      </ModalShell>
    </>
  );
};

export default WordPracticeTopBar;
