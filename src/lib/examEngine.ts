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

export interface PBQCredit {
  earned: number;
  total: number;
  ratio: number;
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

/**
 * Practice-simulator PBQ credit.
 *
 * CompTIA does not publish the weighting of individual PBQ subtasks, so the
 * simulator treats each explicit subtask as equally weighted. This gives useful
 * partial-credit feedback without claiming to reproduce CompTIA's confidential
 * scoring model.
 */
export function getPBQCredit(q: PBQuestion, ans: any): PBQCredit {
  if (!ans) {
    const total =
      q.type === 'firewall' ? q.correctActions.length :
      q.type === 'ordering' ? q.steps.length :
      q.type === 'log-analysis' ? 3 :
      q.type === 'matching' ? q.items.length :
      q.items.length;
    return { earned: 0, total: Math.max(1, total), ratio: 0 };
  }

  let earned = 0;
  let total = 1;

  switch (q.type) {
    case 'firewall':
      total = q.correctActions.length;
      earned = q.correctActions.reduce((sum, action, i) => sum + ((ans as string[])?.[i] === action ? 1 : 0), 0);
      break;
    case 'ordering':
      total = q.steps.length;
      earned = q.steps.reduce((sum, step) => sum + ((ans as string[])?.[step.correctPosition] === step.label ? 1 : 0), 0);
      break;
    case 'log-analysis': {
      total = 3;
      const a = ans as { attackType?: string; sourceIP?: string; response?: number };
      earned =
        (a.attackType === q.correctAttackType ? 1 : 0) +
        (a.sourceIP === q.correctSourceIP ? 1 : 0) +
        (a.response === q.correctResponse ? 1 : 0);
      break;
    }
    case 'matching':
      total = q.items.length;
      earned = q.items.reduce((sum, item) => sum + (ans?.[item.left] === item.correctRight ? 1 : 0), 0);
      break;
    case 'placement':
      total = q.items.length;
      earned = q.items.reduce((sum, item) => sum + (ans?.[item.label] === item.correctZone ? 1 : 0), 0);
      break;
  }

  const safeTotal = Math.max(1, total);
  return { earned, total: safeTotal, ratio: earned / safeTotal };
}

export function isPBQCorrect(q: PBQuestion, ans: any): boolean {
  return getPBQCredit(q, ans).ratio === 1;
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

  Object.values(DOMAIN_LABELS).forEach(label => {
    domainScores[label] = { correct: 0, total: 0, percentage: 0 };
  });

  // PBQs earn practice partial credit by explicit subtask. This is pedagogical
  // scoring, not a claim about CompTIA's confidential weighting.
  pbqs.forEach(q => {
    const domainLabel = DOMAIN_LABELS[q.domain];
    const credit = getPBQCredit(q, pbqAnswers[q.id]);
    domainScores[domainLabel].total++;
    rawCorrect += credit.ratio;
    domainScores[domainLabel].correct += credit.ratio;
  });

  mcqs.forEach(q => {
    const domainLabel = DOMAIN_LABELS[q.domain];
    domainScores[domainLabel].total++;
    if (isMCQCorrect(q, mcqAnswers[q.id])) {
      rawCorrect++;
      domainScores[domainLabel].correct++;
    }
  });

  Object.values(domainScores).forEach(d => {
    d.percentage = d.total > 0 ? Math.round((d.correct / d.total) * 100) : 0;
  });

  // Practice scaled score only. CompTIA's exact scoring formula is not public.
  const scaledScore = Math.round(((rawCorrect / rawTotal) * 900) / 10) * 10;
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
