import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Keyboard, RefreshCw, Edit3, X, AlertCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@client/src/components/ui/dialog';
import { Button } from '@client/src/components/ui/button';
import {
  useSettingsStore,
  type ShortcutActionKey,
} from '../store/settingsStore';

interface ShortcutRow {
  key: ShortcutActionKey;
  label: string;
  defaultCombo: string;
}

const shortcutRows: ShortcutRow[] = [
  { key: 'playRead', label: '播放朗读', defaultCombo: 'Ctrl+A' },
  { key: 'markMastered', label: '标记掌握', defaultCombo: 'Ctrl+M' },
  { key: 'markNewWord', label: '标记生词', defaultCombo: 'Ctrl+Q' },
  { key: 'skipQuestion', label: '跳过题目', defaultCombo: 'Ctrl+→' },
  { key: 'resetProgress', label: '重置进度', defaultCombo: 'Ctrl+R' },
];

/**
 * 校验快捷键组合：
 * - 不能是单个字母
 * - 不能是 Shift+字母
 * - 必须包含 Ctrl/Meta/Alt 或 功能键（F1-F12、方向键等）
 */
function validateShortcut(combo: string): { valid: boolean; reason?: string } {
  if (!combo) return { valid: false, reason: '请按下快捷键' };

  // 单个字母（不含任何修饰键）
  if (/^[A-Z]$/.test(combo)) {
    return { valid: false, reason: '不能使用单个字母作为快捷键' };
  }

  // Shift+字母
  if (/^Shift\+[A-Z]$/.test(combo)) {
    return { valid: false, reason: '不能使用 Shift+字母 作为快捷键' };
  }

  return { valid: true };
}

/**
 * 将 KeyboardEvent 转为显示用的组合键字符串
 */
function eventToCombo(e: KeyboardEvent): string {
  const parts: string[] = [];
  if (e.ctrlKey) parts.push('Ctrl');
  if (e.metaKey) parts.push('Ctrl');
  if (e.altKey) parts.push('Alt');
  if (e.shiftKey) parts.push('Shift');

  // 处理特殊键
  let key = e.key;
  if (key === ' ') key = 'Space';
  else if (key === 'ArrowUp') key = '↑';
  else if (key === 'ArrowDown') key = '↓';
  else if (key === 'ArrowLeft') key = '←';
  else if (key === 'ArrowRight') key = '→';
  else if (key === 'Escape') key = 'Esc';
  else if (key === 'Backspace') key = 'Backspace';
  else if (key === 'Enter') key = 'Enter';
  else if (key === 'Tab') key = 'Tab';
  else if (key.length === 1) key = key.toUpperCase();

  // 避免重复（如 Ctrl+Ctrl+A）
  if (!parts.includes(key)) {
    parts.push(key);
  }

  return parts.join('+');
}

const ShortcutsSection: React.FC = () => {
  const { shortcuts, setShortcuts } = useSettingsStore();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingKey, setEditingKey] = useState<ShortcutActionKey | null>(null);
  const [recording, setRecording] = useState(false);
  const [currentCombo, setCurrentCombo] = useState('');
  const [validationError, setValidationError] = useState('');
  const dialogRef = useRef<HTMLDivElement>(null);

  const openEdit = (key: ShortcutActionKey): void => {
    setEditingKey(key);
    setCurrentCombo(shortcuts[key]);
    setValidationError('');
    setRecording(true);
    setDialogOpen(true);
  };

  const closeDialog = (): void => {
    setDialogOpen(false);
    setEditingKey(null);
    setCurrentCombo('');
    setValidationError('');
    setRecording(false);
  };

  const handleKeyDown = useCallback(
    (e: KeyboardEvent): void => {
      if (!dialogOpen || !recording || !editingKey) return;

      // 阻止默认行为（避免滚动等）
      e.preventDefault();
      e.stopPropagation();

      // Esc 取消
      if (e.key === 'Escape') {
        closeDialog();
        return;
      }

      // 忽略纯修饰键按下
      if (
        e.key === 'Control' ||
        e.key === 'Meta' ||
        e.key === 'Alt' ||
        e.key === 'Shift'
      ) {
        return;
      }

      const combo = eventToCombo(e);
      setCurrentCombo(combo);

      const { valid, reason } = validateShortcut(combo);
      if (!valid) {
        setValidationError(reason || '无效的快捷键');
        return;
      }

      setValidationError('');
      setRecording(false);
    },
    [dialogOpen, recording, editingKey],
  );

  useEffect(() => {
    if (dialogOpen) {
      window.addEventListener('keydown', handleKeyDown, true);
      return () => {
        window.removeEventListener('keydown', handleKeyDown, true);
      };
    }
  }, [dialogOpen, handleKeyDown]);

  const handleSave = (): void => {
    if (!editingKey) return;
    const { valid } = validateShortcut(currentCombo);
    if (!valid) return;

    setShortcuts({ [editingKey]: currentCombo });
    closeDialog();
  };

  const handleReset = (): void => {
    setShortcuts({
      playRead: 'Ctrl+A',
      markMastered: 'Ctrl+M',
      markNewWord: 'Ctrl+Q',
      skipQuestion: 'Ctrl+ArrowRight',
      resetProgress: 'Ctrl+R',
    });
  };

  const handleStartRecording = (): void => {
    setRecording(true);
    setCurrentCombo('');
    setValidationError('');
  };

  // 将快捷键字符串拆分为 keycap 显示数组
  const renderKeycaps = (combo: string): React.ReactNode => {
    const parts = combo.split('+');
    return parts.map((part, i) => (
      <React.Fragment key={i}>
        {i > 0 && <span className="text-slate-500 text-xs mx-0.5">+</span>}
        <kbd
          className="px-2 py-1 text-xs font-mono font-semibold rounded-md border"
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            borderColor: 'rgba(99, 102, 241, 0.12)',
            color: '#E2E8F0',
            boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
            minWidth: '28px',
            textAlign: 'center',
          }}
        >
          {part}
        </kbd>
      </React.Fragment>
    ));
  };

  return (
    <div className="space-y-5">
      {/* 快捷键列表 */}
       <div
         className="rounded-2xl border backdrop-blur-xl overflow-hidden"
         style={{
           background: 'rgba(15, 23, 42, 0.6)',
           borderColor: 'rgba(139, 92, 246, 0.2)',
           boxShadow: '0 0 30px rgba(139, 92, 246, 0.05)',
         }}
       >
         <div className="p-5 border-b border-white/10 flex items-center justify-between">
           <div className="flex items-center gap-2">
             <Keyboard className="w-5 h-5" style={{ color: '#A78BFA' }} />
             <h3 className="text-base font-semibold text-white">快捷键设置</h3>
           </div>
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
            style={{
              color: '#818CF8',
              background: 'rgba(99, 102, 241, 0.08)',
            }}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            恢复默认
          </button>
        </div>

         {/* 行 */}
         <div className="divide-y divide-white/10">
           {shortcutRows.map((row) => (
             <div
               key={row.key}
               className="flex items-center justify-between px-5 py-3.5"
             >
               <span className="text-sm text-slate-200">{row.label}</span>
              <div className="flex items-center gap-3">
                {renderKeycaps(shortcuts[row.key])}
                <button
                  onClick={() => openEdit(row.key)}
                  className="ml-2 w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                  style={{
                    color: '#94A3B8',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(99, 102, 241, 0.08)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = '#818CF8';
                    e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.25)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = '#94A3B8';
                    e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.08)';
                  }}
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 录制对话框 */}
      <Dialog open={dialogOpen} onOpenChange={(open: boolean) => {
        if (!open) closeDialog();
      }}>
         <DialogContent
           ref={dialogRef}
           className="sm:max-w-md"
           style={{
             background: 'rgba(15, 23, 42, 0.95)',
             borderColor: 'rgba(139, 92, 246, 0.3)',
             color: '#E2E8F0',
             backdropFilter: 'blur(20px)',
           }}
           showCloseButton={false}
         >
           <DialogHeader>
             <DialogTitle className="text-white flex items-center gap-2">
              <Keyboard className="w-5 h-5" style={{ color: '#6366F1' }} />
              修改快捷键
            </DialogTitle>
             <DialogDescription className="text-slate-400">
              {editingKey
                ? `为「${shortcutRows.find((r) => r.key === editingKey)?.label}」设置新的快捷键`
                : ''}
            </DialogDescription>
          </DialogHeader>

          {/* 录制区域 */}
          <div
            className={`w-full rounded-xl p-6 flex flex-col items-center justify-center transition-all ${
              recording ? 'ring-2 ring-purple-500/50' : ''
            }`}
            style={{
              background: recording
                 ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(59,130,246,0.15) 100%)'
                 : 'rgba(255, 255, 255, 0.03)',
               border: '1px solid rgba(255, 255, 255, 0.1)',
              minHeight: '120px',
            }}
          >
            {recording ? (
              <>
                 <div className="flex items-center gap-2 mb-3">
                   <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                   <span className="text-sm text-slate-300">正在录制...按下新的快捷键</span>
                 </div>
                 <span className="text-xs text-slate-400">按 Esc 取消</span>
              </>
            ) : (
              <>
                <div className="flex items-center gap-1 mb-3">
                  {currentCombo && renderKeycaps(currentCombo)}
                </div>
                <button
                  onClick={handleStartRecording}
                  className="text-xs font-medium"
                  style={{ color: '#818CF8' }}
                >
                  重新录制
                </button>
              </>
            )}
          </div>

          {/* 错误提示 */}
          {validationError && (
            <div
              className="flex items-center gap-2 text-sm"
              style={{ color: '#F87171' }}
            >
              <AlertCircle className="w-4 h-4" />
              {validationError}
            </div>
          )}

           {/* 提示 */}
           <div className="text-xs text-slate-400 leading-relaxed">
             <div className="flex items-center gap-1.5 mb-1">
               <AlertCircle className="w-3 h-3" />
               <span className="font-medium text-slate-400">校验规则</span>
            </div>
            <ul className="list-disc list-inside space-y-0.5 pl-1">
              <li>不能使用单个字母作为快捷键</li>
              <li>不能使用 Shift+字母 作为快捷键</li>
              <li>推荐使用 Ctrl / Alt 组合键</li>
            </ul>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={closeDialog}
              style={{
                background: 'transparent',
                borderColor: 'rgba(99, 102, 241, 0.2)',
                color: '#94A3B8',
              }}
            >
              <X className="w-4 h-4" />
              取消
            </Button>
            <Button
              onClick={handleSave}
              disabled={recording || !!validationError || !currentCombo}
              className="text-white"
              style={{
                background:
                  'linear-gradient(135deg, #6366F1 0%, #2563EB 100%)',
                border: 'none',
              }}
            >
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 提示 */}
       <div
         className="rounded-2xl p-4 border"
         style={{
           background:
             'linear-gradient(135deg, rgba(59,130,246,0.12) 0%, rgba(139, 92, 246, 0.08) 100%)',
           borderColor: 'rgba(96, 165, 250, 0.25)',
         }}
       >
         <div className="flex gap-3">
           <Keyboard className="w-5 h-5 mt-0.5 text-blue-400" />
           <div>
             <div className="text-sm font-medium text-slate-100">效率提示</div>
             <div className="text-xs text-slate-400 mt-1 leading-relaxed">
              熟练使用快捷键可以显著提升学习效率。建议从最常用的「Ctrl+A 播放朗读」
              和「Ctrl+M 标记掌握」开始记忆。
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShortcutsSection;
