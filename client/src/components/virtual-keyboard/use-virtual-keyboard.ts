// 虚拟键盘逻辑 Hook：物理键盘同步、输入状态、修饰键管理
import { useState, useEffect, useCallback, useRef } from 'react';
import {
  KEYBOARD_LAYOUTS,
  findKeyByKeyCode,
  findKeyByValue,
  type KeyDefinition,
  type KeyboardLayout,
} from './keyboard-layouts';
import { useKeyboardSound } from '@client/src/hooks/use-keyboard-sound';

export type KeyboardLayoutType = 'qwerty' | 'pinyin' | 'number';

interface UseVirtualKeyboardOptions {
  layout: KeyboardLayoutType;
  value: string;
  onChange: (value: string) => void;
  onSubmit?: () => void;
  /** 自定义空格行为（返回 true 表示已处理，不追加空格字符） */
  onSpacePress?: () => boolean | void;
  disabled?: boolean;
  /** 句子末尾空格提交：已输入到目标句末时按空格触发 onSubmit */
  spaceSubmit?: boolean;
  /** 目标文本（配合 spaceSubmit 判断是否已到句末） */
  targetText?: string;
  /** 禁用内部点击音效，由外部精确控制 */
  suppressInternalSound?: boolean;
}

interface UseVirtualKeyboardReturn {
  layout: KeyboardLayout;
  activeKeys: Set<string>;        // 当前按下的键（value）
  shiftActive: boolean;
  capsActive: boolean;
  wrongKey: string | null;
  targetKey: string | null;
  pressKey: (keyDef: KeyDefinition) => void;
  releaseKey: (keyDef: KeyDefinition) => void;
  setTargetKey: (key: string | null) => void;
  setWrongKey: (key: string | null) => void;
  highlightKeysInSequence: (keys: string[], speed: number) => Promise<void>;
  stopSequence: () => void;
}

export function useVirtualKeyboard({
  layout: layoutType,
  value,
  onChange,
  onSubmit,
  onSpacePress,
  disabled = false,
  spaceSubmit = false,
  targetText = '',
  suppressInternalSound = false,
}: UseVirtualKeyboardOptions): UseVirtualKeyboardReturn {
  const layout = KEYBOARD_LAYOUTS[layoutType];
  const [activeKeys, setActiveKeys] = useState<Set<string>>(new Set());
  const [shiftActive, setShiftActive] = useState<boolean>(false);
  const [capsActive, setCapsActive] = useState<boolean>(false);
  const [wrongKey, setWrongKey] = useState<string | null>(null);
  const [targetKey, setTargetKey] = useState<string | null>(null);

  const { playKeyClick, playKeyError, playLetterSound } = useKeyboardSound();
  const effectivePlayClick = suppressInternalSound ? () => {} : playKeyClick;

  // 根据布局类型决定字母发音语言
  const letterLang = layoutType === 'qwerty' ? 'en-US' : 'zh-CN';

  const sequenceAbortRef = useRef<{ aborted: boolean } | null>(null);
  const wrongTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ─── 按压一个键 ───────────────────────────────────────────────

  const pressKey = useCallback(
    (keyDef: KeyDefinition) => {
      if (disabled) return;
      const keyValue = keyDef.value;

      // 播放按键音效（所有键都有点击音效）
      effectivePlayClick();

      // 加入 active set
      setActiveKeys((prev) => {
        const next = new Set(prev);
        next.add(keyValue);
        return next;
      });

      // 修饰键
      if (keyDef.specialType === 'shift') {
        setShiftActive(true);
        return;
      }
      if (keyDef.specialType === 'caps') {
        setCapsActive((c) => !c);
        return;
      }

      // 功能键
      if (keyDef.specialType === 'backspace') {
        onChange(value.slice(0, -1));
        return;
      }
      if (keyDef.specialType === 'enter') {
        onSubmit?.();
        return;
      }
      if (keyDef.specialType === 'space') {
        if (onSpacePress) {
          const handled = onSpacePress();
          if (handled) return;
        }
        if (spaceSubmit && targetText && value.length >= targetText.trim().length) {
          onSubmit?.();
          return;
        }
        onChange(value + ' ');
        return;
      }

      // 普通字符输入
      let char = keyDef.value;
      const shouldUpper =
        layoutType === 'qwerty' &&
        (shiftActive !== capsActive) && // XOR
        /^[a-z]$/i.test(char);

      if (shouldUpper) {
        char = char.toUpperCase();
      } else if (shiftActive && keyDef.shiftValue) {
        char = keyDef.shiftValue;
      }

      onChange(value + char);

      // 播放字母/音节发音
      playLetterSound(char, letterLang);

      // shift 是单次的，按下字符后释放
      if (shiftActive && !capsActive) {
        setShiftActive(false);
      }
    },
    [disabled, value, onChange, onSubmit, onSpacePress, shiftActive, capsActive, layoutType, spaceSubmit, targetText, effectivePlayClick, playLetterSound, letterLang],
  );

  // ─── 释放一个键 ───────────────────────────────────────────────

  const releaseKey = useCallback((keyDef: KeyDefinition) => {
    const keyValue = keyDef.value;
    setActiveKeys((prev) => {
      const next = new Set(prev);
      next.delete(keyValue);
      return next;
    });

    if (keyDef.specialType === 'shift') {
      setShiftActive(false);
    }
  }, []);

  // ─── 错误键闪烁（短暂后恢复） ─────────────────────────────────

  const flashWrongKey = useCallback((keyValue: string) => {
    setWrongKey(keyValue);
    playKeyError();
    if (wrongTimeoutRef.current) clearTimeout(wrongTimeoutRef.current);
    wrongTimeoutRef.current = setTimeout(() => {
      setWrongKey(null);
    }, 600);
  }, [playKeyError]);

  // ─── 物理键盘事件监听 ─────────────────────────────────────────

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (disabled) return;

      // 如果焦点在原生输入元素内，让浏览器正常处理，不拦截
      const target = e.target as HTMLElement | null;
      if (target) {
        const tag = target.tagName.toLowerCase();
        const isNativeInput =
          tag === 'input' ||
          tag === 'textarea' ||
          target.isContentEditable;
        const isVirtualInput = target.closest('[data-virtual-keyboard-input]');
        if (isNativeInput && !isVirtualInput) return;
      }

      const keyDef = findKeyByKeyCode(layout, e.code);
      if (!keyDef) {
        const byValue = findKeyByValue(layout, e.key);
        if (byValue) {
          pressKey(byValue);
        }
        return;
      }

      e.preventDefault();
      pressKey(keyDef);
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (disabled) return;
      const keyDef = findKeyByKeyCode(layout, e.code);
      if (!keyDef) return;
      releaseKey(keyDef);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [layout, pressKey, releaseKey, disabled]);

  // ─── 按序列高亮（语音联动 / 听音打字引导） ────────────────────

  const highlightKeysInSequence = useCallback(
    async (keys: string[], speed: number) => {
      // 中止上一个序列
      if (sequenceAbortRef.current) {
        sequenceAbortRef.current.aborted = true;
      }
      const abortCtrl = { aborted: false };
      sequenceAbortRef.current = abortCtrl;

      const delay = speed; // ms per key

      for (const k of keys) {
        if (abortCtrl.aborted) return;
        const keyDef = findKeyByValue(layout, k);
        if (keyDef) {
          setTargetKey(keyDef.value);
          await new Promise<void>((resolve) => {
            setTimeout(resolve, delay);
          });
          if (abortCtrl.aborted) return;
        }
      }
      setTargetKey(null);
      if (sequenceAbortRef.current === abortCtrl) {
        sequenceAbortRef.current = null;
      }
    },
    [layout],
  );

  const stopSequence = useCallback(() => {
    if (sequenceAbortRef.current) {
      sequenceAbortRef.current.aborted = true;
      sequenceAbortRef.current = null;
    }
    setTargetKey(null);
  }, []);

  // 清理
  useEffect(() => {
    return () => {
      if (wrongTimeoutRef.current) clearTimeout(wrongTimeoutRef.current);
      stopSequence();
    };
  }, [stopSequence]);

  return {
    layout,
    activeKeys,
    shiftActive,
    capsActive,
    wrongKey,
    targetKey,
    pressKey,
    releaseKey,
    setTargetKey,
    setWrongKey: flashWrongKey,
    highlightKeysInSequence,
    stopSequence,
  };
}
