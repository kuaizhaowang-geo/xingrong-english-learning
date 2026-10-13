import { logger } from '@lark-apaas/client-toolkit/logger';
import type { PhoneticItem } from '@shared/api.interface';

export function speak(text: string, rate = 0.8): void {
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    logger.warn('Web Speech API not supported');
    return;
  }
  window.speechSynthesis.cancel();
  const utterance: SpeechSynthesisUtterance =
    new SpeechSynthesisUtterance(text);
  utterance.lang = 'en-US';
  utterance.rate = rate;
  window.speechSynthesis.speak(utterance);
}

export function speakPhonetic(item: PhoneticItem): void {
  const firstWord: string = item.examples[0]?.word || '';
  if (firstWord) speak(firstWord, 0.7);
}
