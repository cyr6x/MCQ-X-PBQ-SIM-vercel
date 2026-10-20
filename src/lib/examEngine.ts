/**
 * Exam Engine ΓÇö scoring, state management, and utilities
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

/**
 * Model solution for a PBQ, rendered as label → value rows. Shared by the
 * results screen and the training-journey characterization test so the
 * displayed key can never drift from the credited key.
 */
export function getPBQModelAnswer(q: PBQuestion): unknown {
  switch (q.type) {
    case 'firewall':
      return [...q.correctActions];
    case 'ordering':
      return [...q.steps].sort((a, b) => a.correctPosition - b.correctPosition).map((step) => step.label);
    case 'log-analysis':
      return { attackType: q.correctAttackType, sourceIP: q.correctSourceIP, response: q.correctResponse };
    case 'matching':
      return Object.fromEntries(q.items.map((item) => [item.left, item.correctRight]));
    case 'placement':
      return Object.fromEntries(q.items.map((item) => [item.label, item.correctZone]));
    case 'terminal':
      return q.tasks.map((task) => task.correctIndex);
    case 'packet-analysis':
      return {
        packetIds: [...q.suspiciousPacketIds],
        attackType: q.correctAttackType,
        response: q.correctResponse,
      };
    case 'topology':
      return Object.fromEntries(q.nodes.map((node) => [node.id, node.correctZone]));
  }
}

function responseLabel(value: unknown): string {
  if (value === 0) return 'Block / isolate';
  if (value === 1) return 'Allow / monitor';
  return String(value ?? '—');
}

/** Row strings describing the credited answer, one per explicit subtask. */
export function getPBQModelRows(q: PBQuestion): string[] {
  switch (q.type) {
    case 'firewall':
      return q.rules.map((rule, i) =>
        `${rule.sourceIP} → ${rule.destIP}:${rule.port}/${rule.protocol} = ${q.correctActions[i] ?? '—'}`);
    case 'ordering':
      return [...q.steps]
        .sort((a, b) => a.correctPosition - b.correctPosition)
        .map((step, i) => `${i + 1}. ${step.label}`);
    case 'log-analysis':
      return [
        `Attack type = ${q.correctAttackType}`,
        `Source IP = ${q.correctSourceIP}`,
        `Response = ${responseLabel(q.correctResponse)}`,
      ];
    case 'matching':
      return q.items.map((item) => `${item.left} → ${item.correctRight}`);
    case 'placement':
      return q.items.map((item) => `${item.label} → ${item.correctZone}`);
    case 'terminal':
      return q.tasks.map((task, i) => (task.label ? `${task.label} = ${task.correctIndex}` : `Option ${i + 1} = ${task.correctIndex}`));
    case 'packet-analysis':
      return [
        `Suspicious packets = ${q.suspiciousPacketIds.join(', ')}`,
        `Attack type = ${q.correctAttackType}`,
        `Response = ${responseLabel(q.correctResponse)}`,
      ];
    case 'topology':
      return q.nodes.map((node) => `${node.id} → ${node.correctZone}`);
  }
}

function asMap(answer: unknown): Record<string, unknown> {
  return answer && typeof answer === 'object' && !Array.isArray(answer)
    ? answer as Record<string, unknown>
    : {};
}

/** Row strings describing what the candidate submitted for a PBQ. */
export function getPBQUserRows(q: PBQuestion, answer: unknown): string[] {
  const dash = '—';
  switch (q.type) {
    case 'firewall': {
      const list = Array.isArray(answer) ? answer as unknown[] : [];
      return q.rules.map((rule, i) =>
        `${rule.sourceIP} → ${rule.destIP}:${rule.port}/${rule.protocol} = ${list[i] ?? dash}`);
    }
    case 'ordering': {
      const list = Array.isArray(answer) ? answer as string[] : [];
      return list.map((label, i) => `${i + 1}. ${label ?? dash}`);
    }
    case 'log-analysis': {
      const a = asMap(answer);
      return [
        `Attack type = ${String(a.attackType ?? dash)}`,
        `Source IP = ${String(a.sourceIP ?? dash)}`,
        `Response = ${responseLabel(a.response)}`,
      ];
    }
    case 'matching': {
      const a = asMap(answer);
      return q.items.map((item) => `${item.left} → ${String(a[item.left] ?? dash)}`);
    }
    case 'placement': {
      const a = asMap(answer);
      return q.items.map((item) => `${item.label} → ${String(a[item.label] ?? dash)}`);
    }
    case 'terminal': {
      const list = Array.isArray(answer) ? answer as unknown[] : [];
      return q.tasks.map((task, i) => (task.label ? `${task.label} = ${String(list[i] ?? dash)}` : `Option ${i + 1} = ${String(list[i] ?? dash)}`));
    }
    case 'packet-analysis': {
      const a = asMap(answer);
      const packets = Array.isArray(a.packetIds) && (a.packetIds as unknown[]).length
        ? (a.packetIds as unknown[]).join(', ')
        : dash;
      return [
        `Suspicious packets = ${packets}`,
        `Attack type = ${String(a.attackType ?? dash)}`,
        `Response = ${responseLabel(a.response)}`,
      ];
    }
    case 'topology': {
      const a = asMap(answer);
      return q.nodes.map((node) => `${node.id} → ${String(a[node.id] ?? dash)}`);
    }
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

  // Practice scaled score only. CompTIA publishes a 100ΓÇô900 reporting scale,
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
