import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  saveExamSession,
  loadExamSession,
  clearExamSession,
  hasExamSession,
  examSessionProgress,
  formatClock,
  setExamActive,
  setStudyActive,
  confirmLeaveExam,
  type ExamSessionSnapshot,
} from '@/lib/examSession';
import { mcqSingle, mcqSelectTwo, pbqBank, shufflePBQOptions, buildExam, shuffleOptions, selectionCount } from '@/data/questions';
import { isMCQCorrect, getPBQCredit, mcqAnswerText, pbqAnswerText, pbqCorrectText } from '@/lib/examEngine';
import type { MCQuestion, PBQuestion } from '@/data/questions';

function makeSession(overrides: Partial<ExamSessionSnapshot> = {}): ExamSessionSnapshot {
  const q: MCQuestion = mcqSingle[0];
  return {
    version: 2,
    examNumber: 1,
    savedAt: Date.now(),
    startedAt: Date.now(),
    remainingSeconds: 3000,
    isPaused: false,
    phase: 'item',
    idx: 2,
    flags: ['s1'],
    mcqAnswers: { [q.id]: 1 },
    pbqAnswers: {},
    questions: [{ kind: 'mcq', data: q }],
    ...overrides,
  };
}

describe('examSession persistence', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('round-trips a session through localStorage', () => {
    const s = makeSession();
    expect(hasExamSession()).toBe(false);
    saveExamSession(s);
    expect(hasExamSession()).toBe(true);
    expect(loadExamSession()).toEqual(s);
    clearExamSession();
    expect(loadExamSession()).toBeNull();
  });

  it('rejects corrupt or wrong-version payloads', () => {
    localStorage.setItem('secplus-active-exam-session', '{not json');
    expect(loadExamSession()).toBeNull();
    localStorage.setItem('secplus-active-exam-session', JSON.stringify({ version: 1 }));
    expect(loadExamSession()).toBeNull();
  });

  it('summarizes answered / flagged progress', () => {
    const s = makeSession({
      mcqAnswers: { s1: 1 },
      flags: ['s1', 's2'],
    });
    const p = examSessionProgress(s);
    expect(p.total).toBe(1);
    expect(p.answered).toBe(1);
    expect(p.flags).toBe(2);
  });

  it('formats a countdown clock', () => {
    expect(formatClock(0)).toBe('00:00');
    expect(formatClock(65)).toBe('01:05');
    expect(formatClock(5400)).toBe('90:00');
    expect(formatClock(-5)).toBe('00:00');
  });
});

describe('navigation guard', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    setExamActive(false);
    setStudyActive(false);
  });

  it('allows navigation when nothing is active', () => {
    const confirm = vi.spyOn(window, 'confirm');
    expect(confirmLeaveExam()).toBe(true);
    expect(confirm).not.toHaveBeenCalled();
  });

  it('asks before leaving an active exam', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    setExamActive(true);
    expect(confirmLeaveExam()).toBe(true);
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    expect(confirmLeaveExam()).toBe(false);
    setExamActive(false);
  });

  it('asks before leaving an active study session', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    setStudyActive(true);
    expect(confirmLeaveExam()).toBe(false);
    setStudyActive(false);
    expect(confirmLeaveExam()).toBe(true);
  });
});

describe('question bank integrity', () => {
  it('the insurance THREE question is a real select-three with three answers', () => {
    const q = [...mcqSingle, ...mcqSelectTwo].find(x => x.id === 's128') as MCQuestion;
    expect(q.type).toBe('select-three');
    expect(selectionCount(q)).toBe(3);
    expect(Array.isArray(q.answer)).toBe(true);
    expect((q.answer as number[])).toHaveLength(3);
    expect(isMCQCorrect(q, [0, 4, 6])).toBe(true);
    expect(isMCQCorrect(q, [2, 4, 6])).toBe(false);
    expect(isMCQCorrect(q, [0, 4])).toBe(false); // must pick exactly three
  });

  it('every question asking TWO/THREE is keyed as a multi-select with a matching answer count', () => {
    const all = [...mcqSingle, ...mcqSelectTwo];
    all.forEach(q => {
      const wants = /\bTWO\b/.test(q.question) ? 2 : /\bTHREE\b/.test(q.question) ? 3 : 1;
      if (wants > 1) {
        expect(Array.isArray(q.answer)).toBe(true);
        expect((q.answer as number[])).toHaveLength(wants);
        expect(selectionCount(q)).toBe(wants);
      }
    });
  });
});

describe('PBQ option shuffling (no more obvious first answer)', () => {
  const logPbqs = pbqBank.filter(p => p.type === 'log-analysis') as Extract<PBQuestion, { type: 'log-analysis' }>[];

  it('bank log-analysis PBQs previously always had the correct response first — shuffled copies keep scoring intact', () => {
    logPbqs.forEach(q => {
      const shuffled = shufflePBQOptions(q) as Extract<PBQuestion, { type: 'log-analysis' }>;
      // Same option set, possibly different order
      expect([...shuffled.responseOptions].sort()).toEqual([...q.responseOptions].sort());
      expect([...shuffled.attackTypeOptions].sort()).toEqual([...q.attackTypeOptions].sort());
      // Text-keyed answers still score full credit after shuffling
      const modelAnswer = {
        attackType: q.correctAttackType,
        sourceIP: q.correctSourceIP,
        response: q.responseOptions[q.correctResponse],
      };
      expect(getPBQCredit(shuffled, modelAnswer).ratio).toBe(1);
      expect(getPBQCredit(q, modelAnswer).ratio).toBe(1);
    });
  });

  it('shuffling eventually moves the correct response off position 0', () => {
    const q = logPbqs[0];
    let moved = false;
    for (let i = 0; i < 60 && !moved; i++) {
      const s = shufflePBQOptions(q) as Extract<PBQuestion, { type: 'log-analysis' }>;
      if (s.responseOptions[0] !== q.responseOptions[q.correctResponse]) moved = true;
    }
    expect(moved).toBe(true);
  });

  it('matching and placement shuffles preserve the answer set', () => {
    pbqBank.filter(p => p.type === 'matching').forEach(raw => {
      const q = raw as Extract<PBQuestion, { type: 'matching' }>;
      const s = shufflePBQOptions(q) as Extract<PBQuestion, { type: 'matching' }>;
      expect([...s.rightOptions].sort()).toEqual([...q.rightOptions].sort());
    });
    pbqBank.filter(p => p.type === 'placement').forEach(raw => {
      const q = raw as Extract<PBQuestion, { type: 'placement' }>;
      const s = shufflePBQOptions(q) as Extract<PBQuestion, { type: 'placement' }>;
      expect([...s.zones].sort()).toEqual([...q.zones].sort());
    });
  });

  it('buildExam returns PBQs with shuffled option lists (still scoreable)', () => {
    for (const n of [1, 2, 3, 4, 5] as const) {
      const exam = buildExam(n);
      expect(exam.pbqs.length).toBeGreaterThan(0);
      exam.pbqs.forEach(p => {
        if (p.type === 'log-analysis') {
          const model = {
            attackType: p.correctAttackType,
            sourceIP: p.correctSourceIP,
            response: p.responseOptions[p.correctResponse],
          };
          expect(getPBQCredit(p, model).ratio).toBe(1);
        }
      });
    }
  });
});

describe('MCQ option shuffle', () => {
  it('remaps select-three answers and whyWrong keys', () => {
    const base = [...mcqSingle].find(q => q.id === 's128')!;
    for (let i = 0; i < 10; i++) {
      const s = shuffleOptions(base);
      expect((s.answer as number[])).toHaveLength(3);
      const correctTexts = (base.answer as number[]).map(idx => base.options[idx]);
      const shuffledTexts = (s.answer as number[]).map(idx => s.options[idx]);
      expect(shuffledTexts.sort()).toEqual(correctTexts.sort());
      expect(isMCQCorrect(s, s.answer as number[])).toBe(true);
      // whyWrong keys still point at wrong options
      Object.entries(s.whyWrong ?? {}).forEach(([idx, text]) => {
        expect(correctTexts).not.toContain(s.options[Number(idx)]);
        expect(Object.values(base.whyWrong ?? {})).toContain(text);
      });
    }
  });
});

describe('readable answer text for history', () => {
  it('formats MCQ answers with letters and option text', () => {
    const q = mcqSingle[0];
    expect(mcqAnswerText(q, 1)).toBe(`B. ${q.options[1]}`);
    expect(mcqAnswerText(q, undefined)).toBe('Not answered');
    const multi = mcqSelectTwo[0];
    expect(mcqAnswerText(multi, [0, 2])).toBe(`A. ${multi.options[0]}  |  C. ${multi.options[2]}`);
  });

  it('formats PBQ answers and model answers', () => {
    const log = logPbqMock();
    expect(pbqAnswerText(log, {
      attackType: log.correctAttackType,
      sourceIP: log.correctSourceIP,
      response: log.responseOptions[log.correctResponse],
    })).toContain(`Attack: ${log.correctAttackType}`);
    expect(pbqCorrectText(log)).toContain(`Response: ${log.responseOptions[log.correctResponse]}`);
    expect(pbqAnswerText(log, undefined)).toBe('Not answered');
  });
});

function logPbqMock() {
  const q = pbqBank.find(p => p.type === 'log-analysis');
  if (!q || q.type !== 'log-analysis') throw new Error('no log-analysis PBQ in bank');
  return q;
}
