import type { MCQuestion, PBQuestion } from '@/data/questions';

export type StudyQuestion =
  | { kind: 'pbq'; data: PBQuestion }
  | { kind: 'mcq'; data: MCQuestion };

/**
 * Mixes study/retest formats without implying an official exam sequence.
 * PBQs are spaced through the set while both families are independently
 * shuffled. Strict full-exam ordering is owned by strictExamOrder.ts.
 */
export function buildStudyOrder(pbqs: PBQuestion[], mcqs: MCQuestion[]): StudyQuestion[] {
  const shuffledPbqs = [...pbqs].sort(() => Math.random() - 0.5);
  const shuffledMcqs = [...mcqs].sort(() => Math.random() - 0.5);

  if (!shuffledPbqs.length) return shuffledMcqs.map((data) => ({ kind: 'mcq' as const, data }));
  if (!shuffledMcqs.length) return shuffledPbqs.map((data) => ({ kind: 'pbq' as const, data }));

  const total = shuffledPbqs.length + shuffledMcqs.length;
  const pbqPositions = new Set(
    shuffledPbqs.map((_, index) =>
      Math.max(0, Math.min(total - 1, Math.round(((index + 1) * total) / (shuffledPbqs.length + 1)) - 1)),
    ),
  );

  const ordered: StudyQuestion[] = [];
  let pbqIndex = 0;
  let mcqIndex = 0;

  for (let position = 0; position < total; position += 1) {
    if (pbqPositions.has(position) && pbqIndex < shuffledPbqs.length) {
      ordered.push({ kind: 'pbq', data: shuffledPbqs[pbqIndex++] });
    } else if (mcqIndex < shuffledMcqs.length) {
      ordered.push({ kind: 'mcq', data: shuffledMcqs[mcqIndex++] });
    } else if (pbqIndex < shuffledPbqs.length) {
      ordered.push({ kind: 'pbq', data: shuffledPbqs[pbqIndex++] });
    }
  }

  return ordered;
}
