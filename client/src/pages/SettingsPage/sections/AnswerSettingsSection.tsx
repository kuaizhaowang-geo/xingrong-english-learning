import React from 'react';
import {
  BookOpen,
  Languages,
  Mic2,
  SkipForward,
  UserRound,
  CaseSensitive,
  Eye,
  AlertTriangle,
  Space,
} from 'lucide-react';
import { Switch } from '@client/src/components/ui/switch';
import { useSettingsStore } from '../store/settingsStore';

const AnswerSettingsSection: React.FC = () => {
  const { answer, setAnswer } = useSettingsStore();

  return (
    <div className="space-y-5">
      {/* 答题显示 */}
      <div
        className="rounded-2xl p-5 border backdrop-blur-xl"
        style={{
          background: 'rgba(15, 23, 42, 0.6)',
          borderColor: 'rgba(139, 92, 246, 0.2)',
          boxShadow: '0 0 30px rgba(139, 92, 246, 0.05)',
        }}
      >
        <div className="flex items-center gap-2 mb-4">
          <Eye className="w-5 h-5" style={{ color: '#818CF8' }} />
          <h3 className="text-base font-semibold text-white">答题显示</h3>
        </div>

        <div className="space-y-1">
          <SettingRow
            label="显示翻译"
            desc="在题目中显示中文翻译"
            icon={<Languages className="w-4 h-4" />}
            color="#6366F1"
            checked={answer.showTranslation}
            onChange={(v) => setAnswer({ showTranslation: v })}
            divider
          />
          <SettingRow
            label="答题后显示口语评测"
            desc="提交答案后显示发音评分"
            icon={<Mic2 className="w-4 h-4" />}
            color="#2563EB"
            checked={answer.showEvaluationAfterAnswer}
            onChange={(v) => setAnswer({ showEvaluationAfterAnswer: v })}
          />
        </div>
      </div>

      {/* 答题行为 */}
      <div
        className="rounded-2xl p-5 border backdrop-blur-xl"
        style={{
          background: 'rgba(15, 23, 42, 0.6)',
          borderColor: 'rgba(6, 182, 212, 0.2)',
          boxShadow: '0 0 30px rgba(6, 182, 212, 0.05)',
        }}
      >
        <div className="flex items-center gap-2 mb-4">
          <SkipForward className="w-5 h-5" style={{ color: '#22D3EE' }} />
          <h3 className="text-base font-semibold text-white">答题行为</h3>
        </div>

        <div className="space-y-1">
          <SettingRow
            label="答题正确后自动下一题"
            desc="答对后自动跳转到下一题"
            icon={<SkipForward className="w-4 h-4" />}
            color="#06B6D4"
            checked={answer.autoNextOnCorrect}
            onChange={(v) => setAnswer({ autoNextOnCorrect: v })}
            divider
          />
          <SettingRow
            label="忽略人名"
            desc="判定时不计较专有名词拼写"
            icon={<UserRound className="w-4 h-4" />}
            color="#A855F7"
            checked={answer.ignoreProperNouns}
            onChange={(v) => setAnswer({ ignoreProperNouns: v })}
            divider
          />
          <SettingRow
            label="忽略大小写"
            desc="判定时不区分大小写"
            icon={<CaseSensitive className="w-4 h-4" />}
            color="#F59E0B"
            checked={answer.ignoreCase}
            onChange={(v) => setAnswer({ ignoreCase: v })}
          />
        </div>
      </div>

      {/* 空格输入模式 */}
      <div
        className="rounded-2xl p-5 border backdrop-blur-xl"
        style={{
          background: 'rgba(15, 23, 42, 0.6)',
          borderColor: 'rgba(16, 185, 129, 0.2)',
          boxShadow: '0 0 30px rgba(16, 185, 129, 0.05)',
        }}
      >
        <div className="flex items-center gap-2 mb-4">
          <Space className="w-5 h-5" style={{ color: '#34D399' }} />
          <h3 className="text-base font-semibold text-white">空格输入模式</h3>
        </div>
        <div className="text-xs text-slate-400 mb-3">
          选择句子练习中单词之间的空格如何输入
        </div>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setAnswer({ spaceInputMode: 'auto' })}
            className={`relative p-4 rounded-xl border text-left transition-all ${
              answer.spaceInputMode === 'auto'
                ? 'border-fuchsia-500/50 bg-fuchsia-500/15 shadow-[0_0_20px_rgba(217_70_239_0.25)]'
                : 'border-white/10 bg-white/5 hover:border-fuchsia-500/30'
            }`}
          >
            <div className="text-sm font-semibold text-slate-100 mb-1">自动处理空格</div>
            <div className="text-xs text-slate-400 leading-relaxed">
              输完一个单词后自动跳到下一个，无需按空格
            </div>
            {answer.spaceInputMode === 'auto' && (
              <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-violet-500 flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-white" />
              </div>
            )}
          </button>
          <button
            onClick={() => setAnswer({ spaceInputMode: 'manual' })}
            className={`relative p-4 rounded-xl border text-left transition-all ${
              answer.spaceInputMode === 'manual'
                ? 'border-fuchsia-500/50 bg-fuchsia-500/15 shadow-[0_0_20px_rgba(217_70_239_0.25)]'
                : 'border-white/10 bg-white/5 hover:border-fuchsia-500/30'
            }`}
          >
            <div className="text-sm font-semibold text-slate-100 mb-1">需要点击空格</div>
            <div className="text-xs text-slate-400 leading-relaxed">
              空格作为输入项，需主动按空格才能跳到下一词
            </div>
            {answer.spaceInputMode === 'manual' && (
              <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-violet-500 flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-white" />
              </div>
            )}
          </button>
        </div>
      </div>

      {/* 答案显示 */}
      <div
        className="rounded-2xl p-5 border backdrop-blur-xl"
        style={{
          background: 'rgba(15, 23, 42, 0.6)',
          borderColor: 'rgba(236, 72, 153, 0.2)',
          boxShadow: '0 0 30px rgba(236, 72, 153, 0.05)',
        }}
      >
        <div className="flex items-center gap-2 mb-4">
          <BookOpen className="w-5 h-5" style={{ color: '#F472B6' }} />
          <h3 className="text-base font-semibold text-white">答案显示</h3>
        </div>

        <div className="space-y-1">
          <SettingRow
            label="答案自动显示"
            desc="满足条件时自动展示正确答案"
            icon={<Eye className="w-4 h-4" />}
            color="#EC4899"
            checked={answer.autoShowAnswer}
            onChange={(v) => setAnswer({ autoShowAnswer: v })}
            divider
          />

          {/* 错误几次显示答案 */}
          <div className="flex items-center justify-between py-3">
            <div className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: 'rgba(248, 113, 113, 0.15)', color: '#F87171' }}
              >
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <div className="text-sm text-slate-200">错误几次时显示答案</div>
                <div className="text-xs text-slate-400 mt-0.5">
                  答错达到次数后自动显示答案
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() =>
                  setAnswer({
                    showAnswerAfterErrors: Math.max(1, answer.showAnswerAfterErrors - 1),
                  })
                }
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-300 transition-colors hover:bg-white/10"
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(248, 113, 113, 0.3)',
                }}
              >
                −
              </button>
              <div
                className="w-12 h-8 rounded-lg flex items-center justify-center text-sm font-semibold"
                style={{
                  background: 'rgba(248, 113, 113, 0.15)',
                  border: '1px solid rgba(248, 113, 113, 0.35)',
                  color: '#FCA5A5',
                }}
              >
                {answer.showAnswerAfterErrors} 次
              </div>
              <button
                onClick={() =>
                  setAnswer({
                    showAnswerAfterErrors: Math.min(5, answer.showAnswerAfterErrors + 1),
                  })
                }
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-300 transition-colors hover:bg-white/10"
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(248, 113, 113, 0.3)',
                }}
              >
                +
              </button>
            </div>
          </div>
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

export default AnswerSettingsSection;
