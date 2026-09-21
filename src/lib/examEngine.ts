/**
 * Exam Engine — scoring, state management, and utilities
 */

import type { MCQuestion, PBQuestion, Domain } from '@/data/questions';
import { DOMAIN_LABELS } from '@/data/questions';

export interface ExamState {
  mcqAnswers: Record<string, number | number[]>;
  pbqAnswers: Record<string, any>;
  flags: Set<string>;
  currentIndex: number;
  submitted: boolean;
  startTime: number;
  questionTimes: Record<string, number>;
}

export function createExamState(): ExamState {
  return {
    mcqAnswers: {},
    pbqAnswers: {},
    flags: new Set(),
    currentIndex: 0,
    submitted: false,
    startTime: Date.now(),
    questionTimes: {},
  };
}

export function isMCQCorrect(q: MCQuestion, ans: number | number[] | undefined): boolean {
  if (ans === undefined) return false;
  if (q.type === 'single') return ans === q.answer;
  const sel = [...(ans as number[])].sort();
  const cor = [...(q.answer as number[])].sort();
  return JSON.stringify(sel) === JSON.stringify(cor);
}

export function isPBQCorrect(q: PBQuestion, ans: any): boolean {
  if (!ans) return false;
  switch (q.type) {
    case 'firewall':
      return q.correctActions.every((a, i) => (ans as string[])?.[i] === a);
    case 'ordering':
      return q.steps.every(s => (ans as string[])?.[s.correctPosition] === s.label);
    case 'log-analysis': {
      const a = ans as { attackType?: string; sourceIP?: string; response?: number };
      return a.attackType === q.correctAttackType && a.sourceIP === q.correctSourceIP && a.response === q.correctResponse;
    }
    case 'matching':
      return q.items.every(it => ans?.[it.left] === it.correctRight);
    case 'placement':
      return q.items.every(it => ans?.[it.label] === it.correctZone);
    default:
      return false;
  }
}

export interface ScoreResult {
  rawCorrect: number;
  rawTotal: number;
  scaledScore: number;
  passed: boolean;
  domainScores: Record<string, { correct: number; total: number; percentage: number }>;
  timeUsedMinutes: number;
}

export function calculateScore(
  pbqs: PBQuestion[],
  mcqs: MCQuestion[],
  pbqAnswers: Record<string, any>,
  mcqAnswers: Record<string, number | number[]>,
  startTime: number,
): ScoreResult {
  let rawCorrect = 0;
  const rawTotal = pbqs.length + mcqs.length;
  const domainScores: Record<string, { correct: number; total: number; percentage: number }> = {};

  // Initialize all domains
  Object.values(DOMAIN_LABELS).forEach(label => {
    domainScores[label] = { correct: 0, total: 0, percentage: 0 };
  });

  // Score PBQs
  pbqs.forEach(q => {
    const domainLabel = DOMAIN_LABELS[q.domain];
    domainScores[domainLabel].total++;
    if (isPBQCorrect(q, pbqAnswers[q.id])) {
      rawCorrect++;
      domainScores[domainLabel].correct++;
    }
  });

  // Score MCQs
  mcqs.forEach(q => {
    const domainLabel = DOMAIN_LABELS[q.domain];
    domainScores[domainLabel].total++;
    if (isMCQCorrect(q, mcqAnswers[q.id])) {
      rawCorrect++;
      domainScores[domainLabel].correct++;
    }
  });

  // Calculate percentages
  Object.values(domainScores).forEach(d => {
    d.percentage = d.total > 0 ? Math.round((d.correct / d.total) * 100) : 0;
  });

  // Compensatory domain-weighted scaled score (mirrors CompTIA SY0-701 methodology).
  // Each domain contributes proportionally to its exam weight; within each domain
  // the per-domain accuracy is multiplied by that weight.  The weighted sum (0–1)
  // is then mapped onto the 100–900 scale and rounded to the nearest 10.
  const domainWeightedSum = (Object.keys(DOMAIN_LABELS) as import('@/data/questions').Domain[]).reduce((acc, d) => {
    const label = DOMAIN_LABELS[d];
    const ds = domainScores[label];
    if (!ds || ds.total === 0) return acc;
    const domainAccuracy = ds.correct / ds.total;
    return acc + domainAccuracy * DOMAIN_WEIGHTS[d];
  }, 0);

  // Fallback to simple ratio if no domain data is available
  const weightedRatio = rawTotal > 0 ? domainWeightedSum : 0;
  const scaledScore = Math.min(900, Math.max(100, Math.round((100 + weightedRatio * 800) / 10) * 10));
  const timeUsedMinutes = Math.round((Date.now() - startTime) / 60000);

  return {
    rawCorrect,
    rawTotal,
    scaledScore,
    passed: scaledScore >= 750,
    domainScores,
    timeUsedMinutes,
  };
}
