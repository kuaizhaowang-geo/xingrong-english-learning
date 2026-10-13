import { logger } from '@lark-apaas/client-toolkit/logger';

export function speak(text: string, rate: number = 0.8): void {
  try {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = rate;
    utterance.pitch = 1.1;
    speechSynthesis.speak(utterance);
  } catch (e) {
    logger.error('speak error: ' + String(e));
  }
}
