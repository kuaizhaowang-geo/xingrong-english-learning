import type { PhoneticItem } from '@shared/api.interface';

export interface PracticeQuestion {
  targetId: string;
  targetSymbol: string;
  targetWord: string;
  options: { id: string; label: string; sub?: string }[];
  correctId: string;
}

export function shuffle<T>(arr: T[]): T[] {
  const a: T[] = [...arr];
  for (let i: number = a.length - 1; i > 0; i -= 1) {
    const j: number = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function generateQuestions(
  items: PhoneticItem[],
  mode: 'listen' | 'read',
  count: number,
): PracticeQuestion[] {
  const questions: PracticeQuestion[] = [];
  const pool: PhoneticItem[] = shuffle(items);
  for (let i: number = 0; i < Math.min(count, pool.length); i += 1) {
    const target: PhoneticItem = pool[i];
    const distractors: PhoneticItem[] = shuffle(
      pool.filter((p: PhoneticItem) => p.id !== target.id),
    ).slice(0, 3);
    const allOpts: PhoneticItem[] = shuffle([target, ...distractors]);
    const options: { id: string; label: string; sub?: string }[] = allOpts.map(
      (opt: PhoneticItem) => ({
        id: opt.id,
        label:
          mode === 'listen'
            ? opt.symbol
            : opt.examples[0]?.word || opt.symbol,
        sub: mode === 'read' ? opt.symbol : undefined,
      }),
    );
    questions.push({
      targetId: target.id,
      targetSymbol: target.symbol,
      targetWord: target.examples[0]?.word || '',
      options,
      correctId: target.id,
    });
  }
  return questions;
}
