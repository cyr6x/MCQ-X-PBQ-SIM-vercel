import type { MCQuestion, PBQuestion } from '@/data/questions';

export type StrictUnifiedQuestion =
  | { kind: 'pbq'; data: PBQuestion }
  | { kind: 'mcq'; data: MCQuestion };

function mulberry32(seed: number) {
  let value = seed >>> 0;
  return () => {
    value += 0x6D2B79F5;
    let t = value;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seededShuffle<T>(items: T[], seed: number): T[] {
  const random = mulberry32(seed);
  const output = [...items];
  for (let i = output.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [output[i], output[j]] = [output[j], output[i]];
  }
  return output;
}

/**
 * Build a reproducible exam order while distributing PBQs across the form.
 *
 * CompTIA publishes that Security+ contains multiple-choice and performance-
 * based questions, but does not publish a guaranteed PBQ position pattern.
 * Distributing PBQs prevents candidates from training against an artificial
 * "all PBQs first" assumption while keeping each exam form reproducible.
 */
export function buildStrictExamOrder(
  pbqs: PBQuestion[],
  mcqs: MCQuestion[],
  examNumber: number,
): StrictUnifiedQuestion[] {
  const total = pbqs.length + mcqs.length;
  if (pbqs.length === 0) return mcqs.map(data => ({ kind: 'mcq' as const, data }));
  if (mcqs.length === 0) return pbqs.map(data => ({ kind: 'pbq' as const, data }));

  const seed = 70100 + examNumber * 997;
  const random = mulberry32(seed);
  const pbqOrder = seededShuffle(pbqs, seed + 11);
  const mcqOrder = seededShuffle(mcqs, seed + 29);

  // One randomized PBQ position per segment spreads them across the full form
  // without forcing a predictable fixed index or accidental clustering.
  const pbqPositions = new Set<number>();
  for (let i = 0; i < pbqOrder.length; i++) {
    const segmentStart = Math.floor((i * total) / pbqOrder.length);
    const segmentEnd = Math.max(
      segmentStart,
      Math.floor(((i + 1) * total) / pbqOrder.length) - 1,
    );
    const span = segmentEnd - segmentStart + 1;
    let position = segmentStart + Math.floor(random() * span);
    while (pbqPositions.has(position) && position < segmentEnd) position++;
    while (pbqPositions.has(position) && position > segmentStart) position--;
    pbqPositions.add(position);
  }

  const ordered: StrictUnifiedQuestion[] = [];
  let pbqIndex = 0;
  let mcqIndex = 0;
  for (let position = 0; position < total; position++) {
    if (pbqPositions.has(position)) {
      ordered.push({ kind: 'pbq', data: pbqOrder[pbqIndex++] });
    } else {
      ordered.push({ kind: 'mcq', data: mcqOrder[mcqIndex++] });
    }
  }
  return ordered;
}
