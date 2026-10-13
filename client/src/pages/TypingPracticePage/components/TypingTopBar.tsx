import React, { useState } from 'react';
import {
  BookOpen,
  Settings,
  List,
  Layers,
  Pause,
  RotateCcw,
  Flag,
  Maximize2,
  Play,
  X,
  ArrowLeft,
  Languages,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type {
  ChineseMode,
  EnglishMode,
  Language,
  ChineseChar,
} from '../data/typingData';
import { CHINESE_MODES, ENGLISH_MODES } from '../data/typingData';

interface TypingTopBarProps {
  title: string;
  subtitle: string;
  progress: { current: number; total: number };
  language: Language;
  onLanguageChange: (lang: Language) => void;
  currentZhMode: ChineseMode;
  currentEnMode: EnglishMode;
  onZhModeChange: (mode: ChineseMode) => void;
  onEnModeChange: (mode: EnglishMode) => void;
  isPaused: boolean;
  onPauseToggle: () => void;
  onResetProgress: () => void;
  onBack: () => void;
  charList: ChineseChar[] | string[];
  currentIndex: number;
  onJumpTo: (index: number) => void;
  autoNextEnabled?: boolean;
  onToggleAutoNext?: () => void;
}

const ToolbarButton: React.FC<{
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  active?: boolean;
  badge?: string | number;
}> = ({ icon, label, onClick, active, badge }) => (
  <button
    type="button"
    onClick={onClick}
    className={`flex items-center justify-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-all h-7 ${
      active
        ? 'bg-violet-500/25 text-violet-200 border border-violet-500/50'
        : 'text-slate-300 hover:text-white hover:bg-white/5 border border-transparent hover:border-cyan-500/30'
    }`}
  >
    {icon}
    <span className="truncate text-[11px]">{label}</span>
    {badge !== undefined && (
      <span className="ml-0.5 px-1 py-0.5 text-[10px] rounded-full bg-violet-500/80 text-white leading-none">
        {badge}
      </span>
    )}
  </button>
);

const ModalShell: React.FC<{
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}> = ({ open, onClose, title, children }) => (
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
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
           className="w-full max-w-md rounded-xl glass-card overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-violet-500/20">
            <h3 className="text-sm font-semibold text-white">{title}</h3>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-md flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/5"
            >
              <X size={16} />
            </button>
          </div>
          <div className="p-4 max-h-[60vh] overflow-y-auto">{children}</div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

const TypingTopBar: React.FC<TypingTopBarProps> = ({
  title,
  subtitle,
  progress,
  language,
  onLanguageChange,
  currentZhMode,
  currentEnMode,
  onZhModeChange,
  onEnModeChange,
  isPaused,
  onPauseToggle,
  onResetProgress,
  onBack,
  charList,
  currentIndex,
  onJumpTo,
  autoNextEnabled = true,
  onToggleAutoNext = () => {},
}) => {
  const [showSettings, setShowSettings] = useState(false);
  const [showList, setShowList] = useState(false);
  const [showModeSelector, setShowModeSelector] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');

  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  };

  const modeName =
    language === 'zh'
      ? CHINESE_MODES.find((m) => m.id === currentZhMode)?.name ?? ''
      : ENGLISH_MODES.find((m) => m.id === currentEnMode)?.name ?? '';

  const modeList = language === 'zh' ? CHINESE_MODES : ENGLISH_MODES;

  const handleModeSelect = (modeId: string) => {
    if (language === 'zh') {
      onZhModeChange(modeId as ChineseMode);
    } else {
      onEnModeChange(modeId as EnglishMode);
    }
    setShowModeSelector(false);
  };

  const handleLanguageToggle = () => {
    onLanguageChange(language === 'zh' ? 'en' : 'zh');
  };

  return (
    <>
       <div className="flex items-center justify-between px-3 py-1 bg-white/5 backdrop-blur-sm border-b border-fuchsia-500/15">
        {/* 左侧：标题+返回 */}
        <div className="flex items-center gap-2 flex-shrink-0">
           <button
             type="button"
             onClick={onBack}
               className="w-7 h-7 rounded-md flex items-center justify-center text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-all"
           >
             <ArrowLeft size={16} />
           </button>
           <div className="flex flex-col min-w-0 leading-none">
             <div className="flex items-center gap-1 min-w-0">
                <span className="text-sm font-semibold text-slate-100 truncate">
                 {title}
               </span>
                <span className="text-[10px] font-medium text-fuchsia-400 whitespace-nowrap">
                 ({progress.current}/{progress.total})
               </span>
             </div>
               <span className="text-[11px] text-slate-400 truncate">
               {subtitle}
             </span>
           </div>
          {/* 语言切换按钮 */}
          <button
            type="button"
            onClick={handleLanguageToggle}
            className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium transition-all h-6 ${
              language === 'zh'
                ? 'bg-cyan-500/25 text-cyan-200 border border-cyan-500/50'
                : 'bg-violet-500/25 text-violet-200 border border-violet-500/50'
            }`}
          >
            <Languages size={11} />
            <span>{language === 'zh' ? '中文打字' : '英文打字'}</span>
          </button>
        </div>

         {/* 右侧：文字+图标按钮 */}
         <div className="flex items-center gap-0.5 flex-shrink-0">
           <ToolbarButton
             icon={<Settings size={14} />}
             label="设置"
             onClick={() => setShowSettings(true)}
           />
            <ToolbarButton
              icon={<List size={14} />}
              label="学习内容"
              onClick={() => setShowList(true)}
              badge={progress.total}
            />
            <ToolbarButton
              icon={<Layers size={14} />}
              label="练习模式"
              onClick={() => setShowModeSelector(true)}
              active
            />
            <ToolbarButton
              icon={isPaused ? <Play size={14} /> : <Pause size={14} />}
              label={isPaused ? '继续练习' : '暂停练习'}
              onClick={onPauseToggle}
              active={isPaused}
            />
            <ToolbarButton
              icon={<RotateCcw size={14} />}
              label="重置进度"
              onClick={() => setShowResetConfirm(true)}
            />
            <ToolbarButton
              icon={<Flag size={14} />}
              label="报告错误"
              onClick={() => setShowFeedback(true)}
            />
         </div>
      </div>

      {/* 设置弹窗 */}
      <ModalShell open={showSettings} onClose={() => setShowSettings(false)} title="偏好设置">
         <div className="space-y-3 text-xs text-slate-300">
          <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-white/[0.03] border border-white/10">
            <div>
              <div className="text-sm text-white">自动切换下一题</div>
               <div className="text-[11px] text-slate-400 mt-0.5">输入正确后自动切换到下一题</div>
            </div>
            <button
              type="button"
              onClick={onToggleAutoNext}
              role="switch"
              aria-checked={autoNextEnabled}
              className={`w-10 h-5 rounded-full transition-colors relative flex-shrink-0 ${
                autoNextEnabled ? 'bg-violet-500' : 'bg-slate-600'
              }`}
            >
              <span
                className="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-md transition-all"
                style={{ left: autoNextEnabled ? 20 : 2 }}
              />
            </button>
          </div>
        </div>
      </ModalShell>

      {/* 内容列表弹窗 */}
      <ModalShell open={showList} onClose={() => setShowList(false)} title="内容列表">
        <div className="space-y-1.5">
          {charList.map((item: ChineseChar | string, idx: number) => {
            const isChar = typeof item === 'object' && 'char' in item;
            const displayText = isChar ? item.char : (item as string);
            const subText = isChar ? (item as ChineseChar).pinyin : '';
            return (
              <button
                key={idx}
                onClick={() => {
                  onJumpTo(idx);
                  setShowList(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-colors ${
                  idx === currentIndex
                    ? 'bg-violet-500/20 border border-violet-500/40'
                    : 'bg-white/[0.02] border border-transparent hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-[11px] text-slate-500 w-6 flex-shrink-0">
                    {idx + 1}.
                  </span>
                  <span className="text-sm font-medium text-white truncate">{displayText}</span>
                  {subText && (
                    <span className="text-[10px] text-slate-500 flex-shrink-0">{subText}</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </ModalShell>

      {/* 模式选择弹窗 */}
      <ModalShell open={showModeSelector} onClose={() => setShowModeSelector(false)} title="选择练习模式">
        <div className="grid grid-cols-2 gap-2">
          {modeList.map((mode) => (
            <button
              key={mode.id}
              onClick={() => handleModeSelect(mode.id)}
              className={`px-4 py-3 rounded-lg text-left transition-all ${
                (language === 'zh' && mode.id === currentZhMode) ||
                (language === 'en' && mode.id === currentEnMode)
                  ? 'bg-gradient-to-br from-violet-500/30 to-blue-500/30 border border-violet-500/50 text-white'
                   : 'neon-btn text-slate-200'
              }`}
            >
              <div className="text-sm font-medium mb-1">{mode.name}</div>
               <div className="text-[10px] text-slate-400">{mode.desc}</div>
            </button>
          ))}
        </div>
      </ModalShell>

      {/* 重置确认弹窗 */}
      <ModalShell open={showResetConfirm} onClose={() => setShowResetConfirm(false)} title="重置进度">
        <div className="space-y-4">
          <p className="text-sm text-slate-300">确定要重置当前练习进度吗？所有统计数据将清零。</p>
          <div className="flex gap-2">
            <button
              onClick={() => setShowResetConfirm(false)}
               className="flex-1 px-4 py-2 rounded-lg neon-btn text-sm"
            >
              取消
            </button>
            <button
              onClick={() => {
                onResetProgress();
                setShowResetConfirm(false);
              }}
              className="flex-1 px-4 py-2 rounded-lg bg-gradient-to-r from-violet-500 to-blue-500 text-white text-sm font-medium"
            >
              确认重置
            </button>
          </div>
        </div>
      </ModalShell>

      {/* 反馈弹窗 */}
      <ModalShell open={showFeedback} onClose={() => setShowFeedback(false)} title="反馈纠错">
        <div className="space-y-3">
          <textarea
            value={feedbackText}
            onChange={(e) => setFeedbackText(e.target.value)}
            placeholder="请输入您的反馈或纠错内容..."
            className="w-full h-24 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder:text-slate-500 resize-none focus:outline-none focus:border-violet-500/50"
          />
          <button
            onClick={() => {
              setShowFeedback(false);
              setFeedbackText('');
            }}
            className="w-full px-4 py-2 rounded-lg bg-gradient-to-r from-violet-500 to-blue-500 text-white text-sm font-medium"
          >
            提交反馈
          </button>
        </div>
      </ModalShell>
    </>
  );
};

export default TypingTopBar;
