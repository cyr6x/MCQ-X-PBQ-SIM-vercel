/**
 * Reference-simulator flow model.
 *
 * Reproduces the sy0-701-exam-simulator experience: Welcome (mode select),
 * Exam (Pearson VUE chrome), Results (score hero + domain breakdown) and
 * Review (filterable answer breakdown). Pool building, persistence and
 * scoring live here so the screens stay presentational.
 */

import {
  buildExam,
  buildStudyQuestions,
  DOMAIN_LABELS,
  pbqBank,
  shuffleOptions,
  type Domain,
  type ExamNumber,
  type MCQuestion,
  type PBQuestion,
} from '@/data/questions';
import {
  calculateScore,
  getPBQCredit,
  isMCQCorrect,
  type ScoreResult,
} from '@/lib/examEngine';
import type { ExamAttempt, QuestionAttempt } from '@/lib/examHistory';

export type SimMode = 'exam' | 'study';

export interface SimConfig {
  mode: SimMode;
  examNumber: ExamNumber;
  studyCount: 10 | 20 | 30 | 60 | 90;
  domain: 'all' | Domain;
  includeMcq: boolean;
  includePbq: boolean;
  candidate: string;
}

export interface SimItem {
  id: string;
  kind: 'mcq' | 'pbq';
  q: MCQuestion | PBQuestion;
}

export interface SimState {
  cfg: SimConfig;
  /** ordered question ids — rebuilt into items via SIM_ITEM_STORE */
  order: string[];
  answers: Record<string, any>;
  flags: string[];
  idx: number;
  startedAt: number;
}

export interface SimReviewItem {
  id: string;
  index: number;
  kind: 'mcq' | 'pbq';
  typeLabel: string;
  domainLabel: string;
  questionText: string;
  userAnswerText: string;
  correctAnswerText: string;
  isCorrect: boolean;
  flagged: boolean;
  explanation: string;
  pbqEarned?: number;
  pbqTotal?: number;
}

export interface SimResult {
  score: ScoreResult;
  review: SimReviewItem[];
  attempt: ExamAttempt;
  mode: SimMode;
  completedAt: number;
  candidate: string;
}

export const SIM_STATE_KEY = 'sim0701-exam-state';
export const SIM_RESULT_KEY = 'sim0701-last-result';
export const SIM_ITEMS_KEY = 'sim0701-item-store';
export const SIM_OPTIONS_KEY = 'sim0701-options';

export const DEFAULT_SIM_CONFIG: SimConfig = {
  mode: 'exam',
  examNumber: 1,
  studyCount: 20,
  domain: 'all',
  includeMcq: true,
  includePbq: true,
  candidate: '',
};

export const EXAM_DURATION_SECONDS = 90 * 60;

// ── Pool building ────────────────────────────────────────────────

export function buildPool(cfg: SimConfig): SimItem[] {
  if (cfg.mode === 'exam') {
    const exam = buildExam(cfg.examNumber);
    return [
      ...exam.pbqs.map<SimItem>(q => ({ id: q.id, kind: 'pbq', q })),
      ...exam.mcqs.map<SimItem>(q => ({ id: q.id, kind: 'mcq', q: q as unknown as MCQuestion })),
    ];
  }

  const domain = cfg.domain === 'all' ? undefined : cfg.domain;
  const items: SimItem[] = [];

  if (cfg.includePbq) {
    const pbqs = (domain ? pbqBank.filter(p => p.domain === domain) : pbqBank)
      .slice(0, Math.min(6, Math.max(0, Math.floor(cfg.studyCount / 10))));
    pbqs.forEach(p => items.push({ id: p.id, kind: 'pbq', q: p }));
  }

  const mcqShare = cfg.includeMcq
    ? Math.max(items.length === 0 ? cfg.studyCount : cfg.studyCount - items.length, 0)
    : 0;
  if (mcqShare > 0) {
    const mcqs = shuffleOptionsPool(buildStudyQuestions(domain)).slice(0, mcqShare);
    mcqs.forEach(q => items.push({ id: (q as any).id, kind: 'mcq', q }));
  }

  return items;
}

/** fresh options order on every study session (exam mode keeps seeded order) */
function shuffleOptionsPool(mcqs: MCQuestion[]): MCQuestion[] {
  return [...mcqs].map(shuffleOptions).sort(() => Math.random() - 0.5);
}

/** Reference `calculatePBQPositions`: PBQs spread evenly through the list. */
export function distributePbqs(items: SimItem[]): SimItem[] {
  const pbqIdx = items.map((it, i) => (it.kind === 'pbq' ? i : -1)).filter(i => i >= 0);
  const total = items.length;
  if (pbqIdx.length === 0 || total < 2) return items;

  const pbqs = pbqIdx.map(i => items[i]);
  const mcqs = items.filter(it => it.kind === 'mcq');
  if (mcqs.length === 0) return items;

  const interval = Math.max(1, Math.floor(total / (pbqs.length + 1)));
  const pbqPositions = new Set<number>();
  for (let i = 1; i <= pbqs.length; i++) pbqPositions.add(Math.min(i * interval, total - 1));

  const ordered: SimItem[] = [];
  let mcqCursor = 0;
  for (let pos = 0; pos < total; pos++) {
    if (pbqPositions.has(pos)) {
      const nextPbq = pbqs.shift();
      if (nextPbq) ordered.push(nextPbq);
    } else if (mcqCursor < mcqs.length) {
      ordered.push(mcqs[mcqCursor++]);
    }
  }
  // overflow PBQs (positions collided) appended between remaining MCQs
  while (pbqs.length > 0 && ordered.length < total) {
    ordered.push(pbqs.shift()!);
  }
  return ordered;
}

// ── Persistence ──────────────────────────────────────────────────

export function saveSimState(state: SimState): void {
  try {
    localStorage.setItem(SIM_STATE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('Failed to save simulator state:', e);
  }
}

export function loadSimState(): SimState | null {
  try {
    const raw = localStorage.getItem(SIM_STATE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && parsed.cfg && Array.isArray(parsed.order)) return parsed as SimState;
    localStorage.removeItem(SIM_STATE_KEY);
  } catch {
    localStorage.removeItem(SIM_STATE_KEY);
  }
  return null;
}

export function clearSimState(): void {
  localStorage.removeItem(SIM_STATE_KEY);
  localStorage.removeItem(SIM_ITEMS_KEY);
}

/** Persist the exact shuffled pool so resumes restore identical question content. */
export function saveSimItems(items: SimItem[]): void {
  try {
    localStorage.setItem(SIM_ITEMS_KEY, JSON.stringify(items));
  } catch { /* ignore */ }
}

export function loadSimItems(order: string[]): SimItem[] | null {
  try {
    const raw = localStorage.getItem(SIM_ITEMS_KEY);
    if (!raw) return null;
    const stored = JSON.parse(raw) as SimItem[];
    if (!Array.isArray(stored) || stored.length !== order.length) return null;
    const byId = new Map(stored.map(i => [i.id, i]));
    const ordered = order.map(id => byId.get(id));
    return ordered.every(Boolean) ? (ordered as SimItem[]) : null;
  } catch {
    return null;
  }
}

export function clearSimItems(): void {
  localStorage.removeItem(SIM_ITEMS_KEY);
}

export function loadSimOptions(): Partial<SimConfig> {
  try {
    return JSON.parse(localStorage.getItem(SIM_OPTIONS_KEY) || '{}');
  } catch {
    return {};
  }
}

export function saveSimOptions(cfg: SimConfig): void {
  try {
    localStorage.setItem(SIM_OPTIONS_KEY, JSON.stringify({ ...cfg, candidate: '' }));
  } catch {
    /* ignore */
  }
}

// ── Result computation ───────────────────────────────────────────

function mcqAnswerText(q: MCQuestion, ans: number | number[] | undefined): string {
  if (ans === undefined || ans === null) return 'No answer';
  const text = (i: number) => (q.options[i] !== undefined ? `${q.options[i]}` : `Invalid (${i})`);
  if (Array.isArray(ans)) {
    if (ans.length === 0) return 'No answer';
    return ans.map(i => `${String.fromCharCode(65 + i)}. ${text(i)}`).join(' + ');
  }
  const i = ans as number;
  return `${String.fromCharCode(65 + i)}. ${text(i)}`;
}

function mcqCorrectText(q: MCQuestion): string {
  if (q.type === 'single') {
    const i = q.answer as number;
    return `${String.fromCharCode(65 + i)}. ${q.options[i]}`;
  }
  return (q.answer as number[])
    .map(i => `${String.fromCharCode(65 + i)}. ${q.options[i]}`)
    .join(' + ');
}

function pbqAnswerText(q: PBQuestion, ans: any): string {
  if (!hasAttempt(ans)) return 'No answer';
  const { earned, total } = getPBQCredit(q, ans);
  return `Interaction recorded — ${Math.round(earned)}/${total} subtasks met`;
}

function hasAttempt(answer: unknown): boolean {
  if (answer === undefined || answer === null) return false;
  if (Array.isArray(answer)) return answer.length > 0;
  if (typeof answer === 'string') return answer.trim().length > 0;
  if (typeof answer === 'object') return Object.keys(answer).length > 0;
  return true;
}

const TYPE_LABELS: Record<PBQuestion['type'], string> = {
  firewall: 'Firewall policy',
  ordering: 'Sequence / workflow',
  'log-analysis': 'SIEM / log analysis',
  matching: 'Matching',
  placement: 'Topology placement',
  terminal: 'Terminal / CLI',
  'packet-analysis': 'Packet analysis',
  topology: 'Network topology',
};

export function computeResult(items: SimItem[], state: SimState): SimResult {
  const pbqs = items.filter(i => i.kind === 'pbq').map(i => i.q as PBQuestion);
  const mcqs = items.filter(i => i.kind === 'mcq').map(i => i.q as unknown as MCQuestion);

  const pbqAnswers: Record<string, any> = {};
  const mcqAnswers: Record<string, number | number[]> = {};
  state.flags.forEach(f => {
    const item = items.find(i => i.id === f);
    if (!item) return;
    if (item.kind === 'pbq') pbqAnswers[f] ??= undefined;
  });
  items.forEach(i => {
    const a = state.answers[i.id];
    if (a === undefined) return;
    if (i.kind === 'mcq') mcqAnswers[i.id] = a as number | number[];
    else pbqAnswers[i.id] = a;
  });

  const score = calculateScore(pbqs, mcqs, pbqAnswers, mcqAnswers, state.startedAt);
  const flagSet = new Set(state.flags);

  const review: SimReviewItem[] = items.map((item, index) => {
    const domainLabel = DOMAIN_LABELS[(item.q as any).domain] ?? (item.q as any).domain;
    if (item.kind === 'mcq') {
      const q = item.q as unknown as MCQuestion;
      const ans = mcqAnswers[item.id];
      return {
        id: item.id,
        index,
        kind: 'mcq',
        typeLabel: q.type === 'select-two' ? 'Multiple select' : 'Single choice',
        domainLabel,
        questionText: q.question,
        userAnswerText: mcqAnswerText(q, ans),
        correctAnswerText: mcqCorrectText(q),
        isCorrect: isMCQCorrect(q, ans),
        flagged: flagSet.has(item.id),
        explanation: q.explanation ?? '',
      };
    }
    const q = item.q as PBQuestion;
    const ans = pbqAnswers[item.id];
    const credit = getPBQCredit(q, ans);
    return {
      id: item.id,
      index,
      kind: 'pbq',
      typeLabel: TYPE_LABELS[q.type] ?? q.type,
      domainLabel,
      questionText: q.title,
      userAnswerText: pbqAnswerText(q, ans),
      correctAnswerText: 'Model solution (see review detail)',
      isCorrect: credit.ratio === 1,
      flagged: flagSet.has(item.id),
      explanation: q.explanation ?? '',
      pbqEarned: credit.earned,
      pbqTotal: credit.total,
    };
  });

  const questionAttempts: QuestionAttempt[] = review.map(r => ({
    questionId: r.id,
    questionText: r.questionText,
    domain: r.domainLabel,
    type: r.kind,
    isCorrect: r.isCorrect,
    userAnswer: r.userAnswerText,
    correctAnswer: r.correctAnswerText,
    explanation: r.explanation,
    timeSpentSeconds: 0,
    timestamp: Date.now(),
  }));

  const now = Date.now();
  const attempt: ExamAttempt = {
    id: `sim-${state.cfg.mode}-${now}`,
    mode: state.cfg.mode === 'exam' ? 'exam' : 'practice',
    examId: `sy0-701-sim-${state.cfg.examNumber}`,
    startTime: state.startedAt,
    endTime: now,
    totalQuestions: items.length,
    correctAnswers: review.filter(r => r.isCorrect).length,
    percentage: items.length > 0 ? Math.round((score.rawCorrect / Math.max(1, score.rawTotal)) * 100) : 0,
    passed: score.passed,
    questions: questionAttempts,
    domainScores: Object.fromEntries(
      Object.entries(score.domainScores).map(([label, ds]) => [label, { correct: ds.correct, total: ds.total }])
    ),
  };

  return { score, review, attempt, mode: state.cfg.mode, completedAt: now, candidate: state.cfg.candidate };
}

export function saveSimResult(result: SimResult): void {
  try {
    sessionStorage.setItem(SIM_RESULT_KEY, JSON.stringify(result));
  } catch {
    try {
      localStorage.setItem(SIM_RESULT_KEY, JSON.stringify(result));
    } catch { /* ignore */ }
  }
}

export function loadSimResult(): SimResult | null {
  try {
    const raw = sessionStorage.getItem(SIM_RESULT_KEY) || localStorage.getItem(SIM_RESULT_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SimResult;
  } catch {
    return null;
  }
}
