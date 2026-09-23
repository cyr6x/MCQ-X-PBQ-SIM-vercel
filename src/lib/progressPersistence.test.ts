import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/cloudSync', () => ({
  pushExamAttempt: vi.fn(),
  upsertQuestionStat: vi.fn(),
}));

import {
  PROGRESS_EVENT,
  loadHistory,
  loadQuestionStats,
  saveAttempt,
} from '@/lib/examHistory';

describe('local progress persistence', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('persists an attempt, updates stats and broadcasts a progress change', () => {
    const listener = vi.fn();
    window.addEventListener(PROGRESS_EVENT, listener);

    saveAttempt({
      id: 'practice-test',
      mode: 'practice',
      startTime: 1_000,
      endTime: 61_000,
      totalQuestions: 1,
      correctAnswers: 0,
      percentage: 0,
      passed: false,
      domainScores: {
        '1.0 General Security Concepts': { correct: 0, total: 1 },
      },
      questions: [{
        questionId: 'test-q',
        questionText: 'Test question',
        domain: '1.0 General Security Concepts',
        type: 'mcq',
        isCorrect: false,
        userAnswer: '0',
        correctAnswer: '1',
        explanation: 'Test explanation',
        timeSpentSeconds: 42,
        timestamp: 61_000,
      }],
    });

    expect(loadHistory()).toHaveLength(1);
    expect(loadQuestionStats()['test-q']).toMatchObject({
      timesAttempted: 1,
      timesFailed: 1,
      streak: -1,
      avgTimeSeconds: 42,
    });
    expect(listener).toHaveBeenCalledTimes(1);

    window.removeEventListener(PROGRESS_EVENT, listener);
  });
});
