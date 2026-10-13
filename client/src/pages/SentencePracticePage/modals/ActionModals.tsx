import React, { useState } from 'react';
import { RotateCcw, Flag, Upload, Check } from 'lucide-react';
import ModalShell from '../PracticeModalShell';

interface ResetConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const ResetConfirmModal: React.FC<ResetConfirmModalProps> = ({
  open,
  onClose,
  onConfirm,
}) => {
  return (
    <ModalShell
      open={open}
      onClose={onClose}
      title="重置进度"
      widthClass="max-w-sm"
    >
      <div className="text-center py-2">
         <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-[rgba(124_58_237_0.2)] flex items-center justify-center">
           <RotateCcw size={28} className="text-[#6366F1]" />
        </div>
         <p className="text-white font-medium mb-1">确定重置当前单元进度？</p>
 <p className="text-sm text-slate-400 mb-5">
           重置后当前单元的学习记录将被清空，从第1句重新开始
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-lg neon-btn font-medium"
          >
            取消
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
             className="flex-1 px-4 py-2.5 rounded-lg bg-gradient-to-r from-[#6366F1] to-[#2563EB] text-white hover:shadow-lg hover:shadow-[#6366F1]/40 transition-all font-medium"
          >
            确认重置
          </button>
        </div>
      </div>
    </ModalShell>
  );
};

interface FeedbackModalProps {
  open: boolean;
  onClose: () => void;
  currentSentence: string;
  currentTranslation: string;
  onSubmit: (data: { errorType: string; description: string }) => void;
}

const ERROR_TYPES = [
  { value: 'content', label: '内容有误' },
  { value: 'translation', label: '翻译不准' },
  { value: 'phonetic', label: '音标错误' },
  { value: 'pronunciation', label: '发音问题' },
  { value: 'partOfSpeech', label: '词性标注' },
  { value: 'grammar', label: '语法错误' },
];

export const FeedbackModal: React.FC<FeedbackModalProps> = ({
  open,
  onClose,
  currentSentence,
  currentTranslation,
  onSubmit,
}) => {
  const [feedbackType, setFeedbackType] = useState('');
  const [feedbackDesc, setFeedbackDesc] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (!feedbackType || !feedbackDesc.trim()) return;
    onSubmit({ errorType: feedbackType, description: feedbackDesc });
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setFeedbackType('');
      setFeedbackDesc('');
      onClose();
    }, 1500);
  };

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      title="反馈纠错"
      widthClass="max-w-md"
    >
      {submitted ? (
        <div className="text-center py-8">
           <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[rgba(34_211_238_0.2)] flex items-center justify-center">
             <Check size={32} className="text-[#06B6D4]" />
          </div>
             <p className="text-lg font-bold text-white mb-1">反馈已提交</p>
            <p className="text-sm text-slate-400">感谢您的反馈，我们会尽快处理</p>
        </div>
      ) : (
        <div className="space-y-4">
            <div className="p-3 rounded-lg bg-white/5 border border-fuchsia-500/15">
             <p className="text-xs text-slate-400 mb-1">英文原文</p>
              <p className="text-sm text-slate-200 font-medium">{currentSentence}</p>
             <p className="text-xs text-slate-400 mt-2 mb-1">中文翻译</p>
             <p className="text-sm text-slate-300">{currentTranslation}</p>
          </div>

          <div>
              <label className="text-sm font-medium text-slate-200 mb-2 block">
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
                      ? 'bg-gradient-to-r from-[#6366F1] to-[#2563EB] text-white shadow-md shadow-[#6366F1]/30'
                      : 'bg-white/5 text-slate-300 border border-fuchsia-500/15 hover:bg-white/10 hover:border-fuchsia-400/30'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
              <label className="text-sm font-medium text-slate-200 mb-2 block">
              错误描述
            </label>
            <textarea
              value={feedbackDesc}
              onChange={(e) => setFeedbackDesc(e.target.value)}
              placeholder="请描述具体问题..."
              rows={3}
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-slate-200 placeholder:text-slate-500 text-sm focus:outline-none focus:border-fuchsia-400/50 resize-none"
            />
          </div>

          <div>
              <label className="text-sm font-medium text-slate-200 mb-2 block">
              上传截图
            </label>
            <button
              type="button"
               className="w-full px-4 py-3 rounded-lg bg-white/5 border border-dashed border-fuchsia-500/20 text-slate-400 hover:bg-white/10 hover:border-fuchsia-400/50 transition-all flex items-center justify-center gap-2 text-sm"
            >
              <Upload size={16} />
              点击上传截图（可选）
            </button>
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={!feedbackType || !feedbackDesc.trim()}
             className="w-full py-2.5 rounded-lg bg-gradient-to-r from-[#6366F1] to-[#2563EB] text-white font-medium hover:shadow-lg hover:shadow-[#6366F1]/40 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            提交反馈
          </button>
        </div>
      )}
    </ModalShell>
  );
};
