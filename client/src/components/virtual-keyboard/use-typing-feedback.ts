// 输入反馈 Hook：计算已输入键集合、下一个待输入键、正确/错误反馈状态
import { useState, useRef, useEffect, useMemo } from 'react';
import {
  computeTypedKeys,
  computeNextKey,
  findKeyByValue,
  type KeyDefinition,
  type KeyboardLayout,
} from './keyboard-layouts';

interface UseTypingFeedbackOptions {
  layout: KeyboardLayout;
  value: string;
  targetWord: string;
  showTypedHighlight: boolean;
  showNextGuide: boolean;
  highlightKey: string | null;
}

interface UseTypingFeedbackReturn {
  typedKeys: Set<string>;       // 已输入的键值集合
  nextKeyVal: string | null;    // 下一个待输入键值
  nextKeyDef: KeyDefinition | null; // 下一键的键定义
  targetKeyDef: KeyDefinition | null; // 综合目标键（外部 highlightKey 优先，其次 nextKey）
  correctKey: string | null;    // 最近正确按键（用于弹跳动画）
}

// 收集可输入键值（排除空格/退格/回车/shift/caps）
function collectTypeableKeys(layout: KeyboardLayout): string[] {
  const keys: string[] = [];
  for (const row of layout) {
    for (const k of row) {
      if (
        k.specialType === 'space' ||
        k.specialType === 'backspace' ||
        k.specialType === 'enter' ||
        k.specialType === 'shift' ||
        k.specialType === 'caps'
      ) continue;
      keys.push(k.value);
    }
  }
  return keys;
}

// 从文本末尾反向贪婪匹配，找出最后一个键值
function findLastKey(text: string, layout: KeyboardLayout): string | null {
  if (!text) return null;
  const typeable = collectTypeableKeys(layout);
  const byLen = [...typeable].sort((a, b) => b.length - a.length);
  const lower = text.toLowerCase();
  let i = lower.length;
  let lastKeyVal: string | null = null;
  while (i > 0) {
    let found = false;
    for (const kv of byLen) {
      if (i >= kv.length && lower.slice(i - kv.length, i) === kv) {
        lastKeyVal = kv;
        i -= kv.length;
        found = true;
        break;
      }
    }
    if (!found) i -= 1;
  }
  return lastKeyVal;
}

export function useTypingFeedback({
  layout,
  value,
  targetWord,
  showTypedHighlight,
  showNextGuide,
  highlightKey,
}: UseTypingFeedbackOptions): UseTypingFeedbackReturn {
  // ─── 已输入键集合 ─────────────────────────────────────────────
  const typedKeys = useMemo(() => {
    if (!showTypedHighlight || !value) return new Set<string>();
    return computeTypedKeys(layout, value);
  }, [showTypedHighlight, value, layout]);

  // ─── 下一个待输入键 ───────────────────────────────────────────
  const nextKeyVal = useMemo(() => {
    if (!showNextGuide || !targetWord) return null;
    if (value.length >= targetWord.length) return null;
    return computeNextKey(layout, value, targetWord);
  }, [showNextGuide, targetWord, value, layout]);

  const nextKeyDef = useMemo(() => {
    if (!nextKeyVal) return null;
    return findKeyByValue(layout, nextKeyVal) ?? null;
  }, [nextKeyVal, layout]);

  // 综合目标键：外部 highlightKey 优先，其次 nextKey 引导
  const targetKeyDef = useMemo(() => {
    if (highlightKey) {
      return findKeyByValue(layout, highlightKey) ?? null;
    }
    if (nextKeyDef) return nextKeyDef;
    return null;
  }, [highlightKey, nextKeyDef, layout]);

  // ─── 正确反馈状态 ─────────────────────────────────────────────
  const [correctKey, setCorrectKey] = useState<string | null>(null);
  const correctTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevValueLenRef = useRef<number>(value.length);

  // value 变化时检测：新增字符 → 判断正误
  useEffect(() => {
    const prevLen = prevValueLenRef.current;
    const curLen = value.length;
    prevValueLenRef.current = curLen;

    if (!targetWord || curLen <= prevLen) return;

    const added = value.slice(prevLen);
    if (!added) return;

    const targetSlice = targetWord.slice(prevLen, prevLen + added.length);
    const isCorrect = added.toLowerCase() === targetSlice.toLowerCase();
    const lastKeyVal = findLastKey(added, layout);

    if (!lastKeyVal) return;

    if (isCorrect) {
      setCorrectKey(lastKeyVal);
      if (correctTimerRef.current) clearTimeout(correctTimerRef.current);
      correctTimerRef.current = setTimeout(() => {
        setCorrectKey(null);
      }, 300);
    }
    // 错误反馈复用 wrongKey 机制（由外部/内部触发）
  }, [value, targetWord, layout]);

  // 清理计时器
  useEffect(() => {
    return () => {
      if (correctTimerRef.current) clearTimeout(correctTimerRef.current);
    };
  }, []);

  return {
    typedKeys,
    nextKeyVal,
    nextKeyDef,
    targetKeyDef,
    correctKey,
  };
}
