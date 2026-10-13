import React from 'react';
import { CheckCircle, RotateCcw } from 'lucide-react';

interface PracticeFinishProps {
  total: number;
  correct: number;
  accuracy: number;
  onRestart: () => void;
}

const PracticeFinish: React.FC<PracticeFinishProps> = ({
  total,
  correct,
  accuracy,
  onRestart,
}) => {
  return (
    <div className="max-w-xl mx-auto text-center py-12">
      <div
        className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center"
        style={{
          backgroundColor: 'rgba(34, 211, 238, 0.2)',
          boxShadow: '0 0 30px rgba(34, 211, 238, 0.3)',
        }}
      >
        <CheckCircle size={40} className="text-[#06B6D4]" />
      </div>
      <h2 className="text-2xl font-bold text-[#1E293B] mb-2">练习完成！</h2>
      <p className="text-[#94A3B8] mb-8">
        本次共答 {total} 题，答对 {correct} 题
      </p>
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="p-5 rounded-xl bg-[#FFFFFF]/80 border border-[rgba(124_58_237_0.2)]">
          <div className="text-3xl font-bold text-[#1E293B]">
            {correct}/{total}
          </div>
          <div className="text-sm text-[#94A3B8] mt-1">正确数</div>
        </div>
        <div className="p-5 rounded-xl bg-[#FFFFFF]/80 border border-[rgba(34_211_238_0.2)]">
          <div className="text-3xl font-bold text-[#06B6D4]">
            {accuracy}%
          </div>
          <div className="text-sm text-[#94A3B8] mt-1">正确率</div>
        </div>
      </div>
      <button
        onClick={onRestart}
        className="px-8 py-3 rounded-xl text-white font-medium transition-all active:scale-[0.97]"
        style={{
          background: 'linear-gradient(135deg, #6366F1 0%, #2563EB 100%)',
          boxShadow: '0 4px 15px rgba(99, 102, 241, 0.25)',
        }}
      >
        <span className="inline-flex items-center gap-2">
          <RotateCcw size={18} /> 再来一轮
        </span>
      </button>
    </div>
  );
};

export default PracticeFinish;
