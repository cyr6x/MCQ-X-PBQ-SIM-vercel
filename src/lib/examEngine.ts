/**
 * Exam Engine — scoring, state management, and utilities
 */

import type { MCQuestion, PBQuestion, Domain } from '@/data/questions';
import { DOMAIN_LABELS, selectionCount } from '@/data/questions';

export { selectionCount };

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
      q.type === 'placement' ? q.items.length :
      q.type === 'terminal' ? q.tasks.length :
      q.type === 'packet-analysis' ? 3 :
      q.nodes.length;
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
      const a = ans as { attackType?: string; sourceIP?: string; response?: string | number };
      // `response` is stored as the option TEXT (not an index) so shuffled
      // response lists stay score-safe across renders and persisted sessions.
      const correctResponse = q.responseOptions[q.correctResponse];
      const userResponse = typeof a?.response === 'number' ? q.responseOptions[a.response] : a?.response;
      earned =
        (a.attackType === q.correctAttackType ? 1 : 0) +
        (a.sourceIP === q.correctSourceIP ? 1 : 0) +
        (userResponse === correctResponse ? 1 : 0);
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
    case 'terminal':
      total = q.tasks.length;
      earned = q.tasks.reduce((sum, task, index) => sum + ((ans as number[])?.[index] === task.correctIndex ? 1 : 0), 0);
      break;
    case 'packet-analysis': {
      total = 3;
      const a = ans as { packetIds?: string[]; attackType?: string; response?: number };
      const selected = [...(a.packetIds || [])].sort();
      const expected = [...q.suspiciousPacketIds].sort();
      earned =
        (JSON.stringify(selected) === JSON.stringify(expected) ? 1 : 0) +
        (a.attackType === q.correctAttackType ? 1 : 0) +
        (a.response === q.correctResponse ? 1 : 0);
      break;
    }
    case 'topology':
      total = q.nodes.length;
      earned = q.nodes.reduce((sum, node) => sum + (ans?.[node.id] === node.correctZone ? 1 : 0), 0);
      break;
  }

  const safeTotal = Math.max(1, total);
  return { earned, total: safeTotal, ratio: earned / safeTotal };
}

export function isPBQCorrect(q: PBQuestion, ans: any): boolean {
  return getPBQCredit(q, ans).ratio === 1;
}

/* =================================================================
   Readable answer text — used for exam history / review screens so
   a stored attempt can be understood without the interactive widget.
   ================================================================= */

const NOT_ANSWERED = 'Not answered';
const letter = (i: number) => String.fromCharCode(65 + i);

export function mcqAnswerText(q: MCQuestion, ans: number | number[] | undefined): string {
  if (ans === undefined || (Array.isArray(ans) && ans.length === 0)) return NOT_ANSWERED;
  const idxs = Array.isArray(ans) ? ans : [ans];
  return idxs.map(i => `${letter(i)}. ${q.options[i] ?? '—'}`).join('  |  ');
}

export function pbqAnswerText(q: PBQuestion, ans: unknown): string {
  if (ans === undefined || ans === null) return NOT_ANSWERED;
  switch (q.type) {
    case 'firewall':
      return Array.isArray(ans) && ans.some((a: string) => a !== '')
        ? `Rule actions: ${ans.join(', ')}`
        : NOT_ANSWERED;
    case 'ordering':
      return Array.isArray(ans) && ans.length > 0
        ? ans.map((s: string, i: number) => `${i + 1}. ${s}`).join('  →  ')
        : NOT_ANSWERED;
    case 'log-analysis': {
      const a = ans as { attackType?: string; sourceIP?: string; response?: string | number };
      const response = typeof a?.response === 'number' ? q.responseOptions[a.response] : a?.response;
      if (!a?.attackType && !a?.sourceIP && !response) return NOT_ANSWERED;
      return [
        `Attack: ${a.attackType || '—'}`,
        `Source: ${a.sourceIP || '—'}`,
        `Response: ${response || '—'}`,
      ].join('  |  ');
    }
    case 'packet-analysis': {
      const a = ans as { packetIds?: string[]; attackType?: string; response?: number };
      if (!a?.packetIds?.length && !a?.attackType && a?.response === undefined) return NOT_ANSWERED;
      return [
        `Packets: ${(a.packetIds || []).join(', ') || '—'}`,
        `Attack: ${a.attackType || '—'}`,
        `Response: ${a.response !== undefined ? q.responseOptions[a.response] : '—'}`,
      ].join('  |  ');
    }
    case 'terminal': {
      if (!Array.isArray(ans) || ans.length === 0) return NOT_ANSWERED;
      return q.tasks.map((task, i) => `Task ${i + 1}: ${task.options[ans[i]] ?? '—'}`).join('  |  ');
    }
    case 'matching': {
      const a = ans as Record<string, string>;
      if (Object.keys(a || {}).length === 0) return NOT_ANSWERED;
      return q.items.map(it => `${it.left} → ${a[it.left] || '—'}`).join('  |  ');
    }
    case 'placement': {
      const a = ans as Record<string, string>;
      if (Object.keys(a || {}).length === 0) return NOT_ANSWERED;
      return q.items.map(it => `${it.label} → ${a[it.label] || '—'}`).join('  |  ');
    }
    case 'topology': {
      const a = ans as Record<string, string>;
      if (Object.keys(a || {}).length === 0) return NOT_ANSWERED;
      return q.nodes.map(node => `${node.label} → ${a[node.id] || '—'}`).join('  |  ');
    }
    default:
      return NOT_ANSWERED;
  }
}

/** The model (correct) answer for a PBQ, in the same readable format. */
export function pbqCorrectText(q: PBQuestion): string {
  switch (q.type) {
    case 'firewall':
      return `Rule actions: ${q.correctActions.join(', ')}`;
    case 'ordering':
      return [...q.steps]
        .sort((a, b) => a.correctPosition - b.correctPosition)
        .map((s, i) => `${i + 1}. ${s.label}`)
        .join('  →  ');
    case 'log-analysis':
      return [
        `Attack: ${q.correctAttackType}`,
        `Source: ${q.correctSourceIP}`,
        `Response: ${q.responseOptions[q.correctResponse]}`,
      ].join('  |  ');
    case 'packet-analysis':
      return [
        `Packets: ${q.suspiciousPacketIds.join(', ')}`,
        `Attack: ${q.correctAttackType}`,
        `Response: ${q.responseOptions[q.correctResponse]}`,
      ].join('  |  ');
    case 'terminal':
      return q.tasks.map((task, i) => `Task ${i + 1}: ${task.options[task.correctIndex]}`).join('  |  ');
    case 'matching':
      return q.items.map(it => `${it.left} → ${it.correctRight}`).join('  |  ');
    case 'placement':
      return q.items.map(it => `${it.label} → ${it.correctZone}`).join('  |  ');
    case 'topology':
      return q.nodes.map(node => `${node.label} → ${node.correctZone}`).join('  |  ');
    default:
      return '—';
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
  pausedMilliseconds = 0,
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

  // Practice scaled score only. CompTIA publishes a 100–900 reporting scale,
  // but not the proprietary item weighting/formula. Keep the simulator inside
  // that published range without claiming equivalence to the live score.
  const ratio = rawTotal > 0 ? rawCorrect / rawTotal : 0;
  const scaledScore = Math.round((100 + ratio * 800) / 10) * 10;
  const timeUsedMinutes = Math.max(0, Math.round((Date.now() - startTime - pausedMilliseconds) / 60000));

  return {
    rawCorrect,
    rawTotal,
    scaledScore,
    passed: scaledScore >= 750,
    domainScores,
    timeUsedMinutes,
  };
}
