import { describe, expect, it, vi } from 'vitest';
import {
  buildExam,
  type MCQuestion,
  type PBQuestion,
} from '@/data/questions';
import { buildStrictExamOrder } from '@/lib/strictExamOrder';
import { calculateScore, getPBQCredit, isMCQCorrect } from '@/lib/examEngine';

function modelPBQAnswer(q: PBQuestion): unknown {
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

function wrongMCQAnswer(q: MCQuestion): number | number[] {
  if (q.type === 'select-two') return [];
  const correct = q.answer as number;
  return (correct + 1) % q.options.length;
}

describe('full training journey whitebox', () => {
  it('runs a 90-item mixed form with multiple PBQs, misses, review signals and a strong pass', () => {
    const exam = buildExam(3);
    const ordered = buildStrictExamOrder(exam.pbqs, exam.mcqs, 3);

    expect(ordered).toHaveLength(90);
    expect(new Set(exam.pbqs.map((q) => q.type)).size).toBeGreaterThanOrEqual(4);

    const pbqPositions = ordered
      .map((item, index) => item.kind === 'pbq' ? index : -1)
      .filter((index) => index >= 0);
    expect(pbqPositions.some((index) => index < 30)).toBe(true);
    expect(pbqPositions.some((index) => index >= 30 && index < 60)).toBe(true);
    expect(pbqPositions.some((index) => index >= 60)).toBe(true);

    const mcqAnswers: Record<string, number | number[]> = {};
    exam.mcqs.forEach((q, index) => {
      mcqAnswers[q.id] = index < 6 ? wrongMCQAnswer(q) : q.answer;
    });

    const pbqAnswers: Record<string, unknown> = {};
    exam.pbqs.forEach((q, index) => {
      pbqAnswers[q.id] = index === 0 ? undefined : modelPBQAnswer(q);
    });

    const result = calculateScore(exam.pbqs, exam.mcqs, pbqAnswers, mcqAnswers, Date.now());

    const missedMcqs = exam.mcqs.filter((q) => !isMCQCorrect(q, mcqAnswers[q.id]));
    const weakPbqs = exam.pbqs.filter((q) => getPBQCredit(q, pbqAnswers[q.id]).ratio < 1);

    expect(missedMcqs).toHaveLength(6);
    expect(weakPbqs).toHaveLength(1);
    expect(result.passed).toBe(true);
    expect(result.scaledScore).toBeGreaterThanOrEqual(800);
    expect(result.domainScores).toBeDefined();
  });

  it('excludes interruption pause time from the reported training duration', () => {
    const exam = buildExam(1);
    const now = Date.now();
    const start = now - 20 * 60_000;
    const paused = 10 * 60_000;

    const spy = vi.spyOn(Date, 'now').mockReturnValue(now);
    const result = calculateScore(exam.pbqs, exam.mcqs, {}, {}, start, paused);
    spy.mockRestore();

    expect(result.timeUsedMinutes).toBe(10);
  });
});
