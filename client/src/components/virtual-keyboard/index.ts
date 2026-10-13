// 虚拟键盘桶导出
export { default as VirtualKeyboard } from './VirtualKeyboard';
export type { VirtualKeyboardProps, SpaceActionButton, KeyboardToolbarConfig } from './VirtualKeyboard';
export { default as FingerAnimation } from './FingerAnimation';
export { useVirtualKeyboard } from './use-virtual-keyboard';
export { useTypingFeedback } from './use-typing-feedback';
export type { KeyboardLayoutType } from './use-virtual-keyboard';
export {
  KEYBOARD_LAYOUTS,
  QWERTY_LAYOUT,
  PINYIN_LAYOUT,
  NUMBER_LAYOUT,
  FINGER_COLORS,
  findKeyByValue,
  findKeyByKeyCode,
  computeTypedKeys,
  computeNextKey,
} from './keyboard-layouts';
export type {
  KeyDefinition,
  KeyboardLayout,
  FingerSide,
} from './keyboard-layouts';
