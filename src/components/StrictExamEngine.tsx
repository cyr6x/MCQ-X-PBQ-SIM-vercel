import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Clock,
  Flag,
  ListChecks,
  Pause,
  Play,
  ShieldCheck,
} from 'lucide-react';
import type { MCQuestion, PBQuestion } from '@/data/questions';
import { calculateScore, isMCQCorrect, isPBQCorrect, type ScoreResult } from '@/lib/examEngine';
import { saveAttempt, type QuestionAttempt } from '@/lib/examHistory';
import { DOMAIN_LABELS } from '@/data/questions';
import { PBQRenderer } from '@/components/PBQRenderer';
import { EvidenceBlocks } from '@/components/EvidenceBlocks';
import { ExamResults } from '@/components/ExamResults';
import { buildStrictExamOrder } from '@/lib/strictExamOrder';
import { useSettings } from '@/lib/SettingsContext';

type ReviewFilter = 'all' | 'incomplete' | 'flagged';

interface StrictExamEngineProps {
  pbqs: PBQuestion[];
  mcqs: MCQuestion[];
  durationMinutes: number;
  examNumber?: 1 | 2 | 3 | 4 | 5;
  onFinish: () => void;
}

function pbqAttempted(answer: unknown): boolean {
  if (answer === undefined || answer === null) return false;
  if (Array.isArray(answer)) return answer.some(value => value !== undefined && value !== '');
  if (typeof answer === 'object') return Object.keys(answer as Record<string, unknown>).length > 0;
  return true;
}

function mcqAttempted(answer: number | number[] | undefined): boolean {
  if (answer === undefined) return false;
  return Array.isArray(answer) ? answer.length > 0 : true;
}

export function StrictExamEngine({
  pbqs,
  mcqs,
  durationMinutes,
  examNumber = 1,
  onFinish,
}: StrictExamEngineProps) {
  const { settings } = useSettings();
  const questions = useMemo(
    () => buildStrictExamOrder(pbqs, mcqs, examNumber),
    [pbqs, mcqs, examNumber],
  );

  const [idx, setIdx] = useState(0);
  const [phase, setPhase] = useState<'item' | 'review' | 'submitted'>('item');
  const [reviewFilter, setReviewFilter] = useState<ReviewFilter>('all');
  const [pbqAnswers, setPbqAnswers] = useState<Record<string, unknown>>({});
  const [mcqAnswers, setMcqAnswers] = useState<Record<string, number | number[]>>({});
  const [flags, setFlags] = useState<Set<string>>(new Set());
  const [remaining, setRemaining] = useState(durationMinutes * 60);
  const [scoreResult, setScoreResult] = useState<ScoreResult | null>(null);
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [focusNotice, setFocusNotice] = useState(false);
  const [focusViolations, setFocusViolations] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const startTimeRef = useRef(Date.now());
  const timeByQuestionRef = useRef<Record<string, number>>({});
  const activeItemRef = useRef<{ id: string; startedAt: number } | null>(null);
  const submittedRef = useRef(false);
  const totalPausedMsRef = useRef(0);
  const pauseStartedAtRef = useRef<number | null>(null);

  const current = questions[idx];
  const currentId = current?.data.id;

  const isAnswered = useCallback(
    (question: ReturnType<typeof buildStrictExamOrder>[number]) =>
      question.kind === 'pbq'
        ? pbqAttempted(pbqAnswers[question.data.id])
        : mcqAttempted(mcqAnswers[question.data.id]),
    [pbqAnswers, mcqAnswers],
  );

  const incompleteCount = useMemo(
    () => questions.filter(question => !isAnswered(question)).length,
    [questions, isAnswered],
  );

  const recordCurrentItemTime = useCallback(() => {
    const active = activeItemRef.current;
    if (!active) return;
    const elapsed = Math.max(0, Math.floor((Date.now() - active.startedAt) / 1000));
    timeByQuestionRef.current[active.id] = (timeByQuestionRef.current[active.id] || 0) + elapsed;
    activeItemRef.current = null;
  }, []);

  useEffect(() => {
    if (phase !== 'item' || !currentId || isPaused) return;
    activeItemRef.current = { id: currentId, startedAt: Date.now() };
    return () => recordCurrentItemTime();
  }, [currentId, phase, isPaused, recordCurrentItemTime]);

  const togglePause = useCallback(() => {
    if (!settings.exam_pause_enabled || phase === 'submitted') return;

    if (isPaused) {
      const started = pauseStartedAtRef.current;
      if (started !== null) totalPausedMsRef.current += Date.now() - started;
      pauseStartedAtRef.current = null;
      setIsPaused(false);
      return;
    }

    recordCurrentItemTime();
    pauseStartedAtRef.current = Date.now();
    setIsPaused(true);
  }, [isPaused, phase, recordCurrentItemTime, settings.exam_pause_enabled]);

  const pausedMilliseconds = useCallback(() => {
    const activePause = isPaused && pauseStartedAtRef.current !== null
      ? Date.now() - pauseStartedAtRef.current
      : 0;
    return totalPausedMsRef.current + activePause;
  }, [isPaused]);

  const finishExam = useCallback(() => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    recordCurrentItemTime();

    const startTime = startTimeRef.current;
    const result = calculateScore(
      pbqs,
      mcqs,
      pbqAnswers,
      mcqAnswers,
      startTime,
      pausedMilliseconds(),
    );
    const questionTimes = { ...timeByQuestionRef.current };

    const attemptQs: QuestionAttempt[] = [
      ...pbqs.map(q => ({
        questionId: q.id,
        questionText: q.title,
        domain: DOMAIN_LABELS[q.domain],
        type: 'pbq' as const,
        isCorrect: isPBQCorrect(q, pbqAnswers[q.id]),
        userAnswer: JSON.stringify(pbqAnswers[q.id] ?? {}),
        correctAnswer: '',
        explanation: q.explanation,
        timeSpentSeconds: questionTimes[q.id] || 0,
        timestamp: Date.now(),
      })),
      ...mcqs.map(q => ({
        questionId: q.id,
        questionText: q.question,
        domain: DOMAIN_LABELS[q.domain],
        type: 'mcq' as const,
        isCorrect: isMCQCorrect(q, mcqAnswers[q.id]),
        userAnswer: mcqAnswers[q.id] !== undefined ? JSON.stringify(mcqAnswers[q.id]) : 'Not answered',
        correctAnswer: JSON.stringify(q.answer),
        explanation: q.explanation,
        timeSpentSeconds: questionTimes[q.id] || 0,
        timestamp: Date.now(),
      })),
    ];

    const domainScores: Record<string, { correct: number; total: number }> = {};
    Object.entries(result.domainScores).forEach(([domain, value]) => {
      domainScores[domain] = { correct: value.correct, total: value.total };
    });

    saveAttempt({
      id: `exam-${Date.now()}`,
      mode: 'exam',
      startTime,
      endTime: Date.now(),
      totalQuestions: questions.length,
      correctAnswers: result.rawCorrect,
      percentage: Math.round((result.rawCorrect / result.rawTotal) * 100),
      passed: result.passed,
      questions: attemptQs,
      domainScores,
    });

    setScoreResult(result);
    setShowEndConfirm(false);
    setIsPaused(false);
    setPhase('submitted');
  }, [
    mcqAnswers,
    mcqs,
    pausedMilliseconds,
    pbqAnswers,
    pbqs,
    questions.length,
    recordCurrentItemTime,
  ]);

  useEffect(() => {
    if (phase === 'submitted' || isPaused) return;

    const tick = () => {
      const elapsed = Math.floor(
        (Date.now() - startTimeRef.current - totalPausedMsRef.current) / 1000
      );
      const next = Math.max(0, durationMinutes * 60 - elapsed);
      setRemaining(next);
      if (next === 0) finishExam();
    };

    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [durationMinutes, finishExam, isPaused, phase]);

  useEffect(() => {
    if (phase === 'submitted') return;

    const beforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };

    let wasHidden = false;
    const visibility = () => {
      if (!settings.exam_focus_notice || isPaused) return;
      if (document.hidden) {
        wasHidden = true;
        setFocusViolations(count => count + 1);
      } else if (wasHidden) {
        wasHidden = false;
        setFocusNotice(true);
      }
    };

    window.addEventListener('beforeunload', beforeUnload);
    document.addEventListener('visibilitychange', visibility);
    return () => {
      window.removeEventListener('beforeunload', beforeUnload);
      document.removeEventListener('visibilitychange', visibility);
    };
  }, [isPaused, phase, settings.exam_focus_notice]);

  const timerDisplay = `${String(Math.floor(remaining / 60)).padStart(2, '0')}:${String(remaining % 60).padStart(2, '0')}`;
  const timerTone =
    remaining <= settings.red_threshold_seconds
      ? 'destructive'
      : remaining <= settings.amber_threshold_seconds
        ? 'warning'
        : 'normal';

  const goToQuestion = (nextIndex: number) => {
    if (isPaused || nextIndex < 0 || nextIndex >= questions.length) return;
    recordCurrentItemTime();
    setIdx(nextIndex);
    setPhase('item');
  };

  const toggleFlag = () => {
    if (!currentId || isPaused) return;
    setFlags(previous => {
      const next = new Set(previous);
      if (next.has(currentId)) next.delete(currentId);
      else next.add(currentId);
      return next;
    });
  };

  if (phase === 'submitted' && scoreResult) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <ExamResults
          score={scoreResult}
          pbqs={pbqs}
          mcqs={mcqs}
          pbqAnswers={pbqAnswers}
          mcqAnswers={mcqAnswers}
          flags={flags}
          questionOrder={questions.map(question => question.data.id)}
          onRestart={() => window.location.reload()}
          onBackToMenu={() => {
            if (document.fullscreenElement) void document.exitFullscreen().catch(() => undefined);
            onFinish();
          }}
        />
      </div>
    );
  }

  const topBar = (
    <ExamTopBar
      timerDisplay={timerDisplay}
      examNumber={examNumber}
      timerTone={timerTone}
      pauseEnabled={settings.exam_pause_enabled}
      isPaused={isPaused}
      onPause={togglePause}
    />
  );

  if (phase === 'review') {
    const visibleQuestions = questions
      .map((question, index) => ({ question, index }))
      .filter(({ question }) => {
        if (reviewFilter === 'incomplete') return !isAnswered(question);
        if (reviewFilter === 'flagged') return flags.has(question.data.id);
        return true;
      });

    return (
      <div className="min-h-screen bg-background text-foreground">
        {topBar}
        {isPaused && <PauseOverlay onResume={togglePause} />}
        <main className="mx-auto max-w-5xl px-4 py-8 sm:px-8">
          <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            <div className="border-b border-border bg-muted/40 px-5 py-3">
              <h1 className="text-base font-semibold">Item Review</h1>
            </div>

            <div className="border-b border-border px-5 py-4 text-sm leading-6 text-muted-foreground">
              Review any item before ending the exam. Unanswered items are marked incomplete. Flagging an item does not change its score.
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-3">
              <div className="text-sm font-semibold">
                Items <span className="font-normal text-destructive">({incompleteCount} Unseen/Incomplete)</span>
              </div>
              <div className="text-xs text-muted-foreground">{flags.size} flagged</div>
            </div>

            <div className="grid gap-px bg-border p-px sm:grid-cols-2 lg:grid-cols-3">
              {visibleQuestions.map(({ question, index }) => {
                const answered = isAnswered(question);
                const flagged = flags.has(question.data.id);
                return (
                  <button
                    key={question.data.id}
                    onClick={() => goToQuestion(index)}
                    className="flex min-h-14 items-center gap-3 bg-card px-4 py-3 text-left hover:bg-muted/50"
                  >
                    <Flag className={`h-4 w-4 shrink-0 ${flagged ? 'fill-current text-warning' : 'text-muted-foreground/40'}`} />
                    <span className="font-mono text-sm font-semibold">Question {index + 1}</span>
                    {!answered && <span className="ml-auto text-[11px] font-semibold text-destructive">Incomplete</span>}
                  </button>
                );
              })}
            </div>

            {visibleQuestions.length === 0 && (
              <div className="px-5 py-10 text-center text-sm text-muted-foreground">
                No items match this review filter.
              </div>
            )}

            <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border bg-muted/30 px-4 py-4">
              <button
                onClick={() => setShowEndConfirm(true)}
                className="mr-auto rounded-lg border border-border bg-card px-4 py-2 text-sm font-semibold hover:bg-muted"
              >
                End Review
              </button>
              {([
                ['all', 'Review All'],
                ['incomplete', 'Review Incomplete'],
                ['flagged', 'Review Flagged'],
              ] as const).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setReviewFilter(key)}
                  className={`rounded-lg border px-4 py-2 text-sm font-semibold ${
                    reviewFilter === key
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-card text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </section>
        </main>
        {showEndConfirm && (
          <EndExamConfirm
            incompleteCount={incompleteCount}
            onCancel={() => setShowEndConfirm(false)}
            onConfirm={finishExam}
          />
        )}
      </div>
    );
  }

  if (!current) return null;

  const openReview = () => {
    if (isPaused) return;
    recordCurrentItemTime();
    setReviewFilter('all');
    setPhase('review');
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background text-foreground">
      {topBar}
      {isPaused && <PauseOverlay onResume={togglePause} />}

      {focusNotice && (
        <div className="shrink-0 border-b border-warning/30 bg-warning/10 px-4 py-2 text-center text-xs font-medium text-warning">
          Focus changed while the exam was running. The timer continued.
          <button onClick={() => setFocusNotice(false)} className="ml-3 underline">Dismiss</button>
        </div>
      )}

      <main className="relative min-h-0 flex-1 overflow-hidden">
        <div className="mx-auto flex h-full max-w-6xl flex-col px-3 py-3 sm:px-6">
          <div className="mb-3 flex shrink-0 items-center justify-between border-b border-border pb-2.5">
            <div>
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Question</div>
              <div className="font-mono text-base font-semibold">{idx + 1} of {questions.length}</div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={toggleFlag}
                className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold ${
                  flags.has(currentId)
                    ? 'border-warning/50 bg-warning/10 text-warning'
                    : 'border-border bg-card text-muted-foreground hover:text-foreground'
                }`}
              >
                <Flag className={`h-4 w-4 ${flags.has(currentId) ? 'fill-current' : ''}`} />
                <span className="hidden sm:inline">Flag for Review</span>
                <span className="sm:hidden">Flag</span>
              </button>
              <button
                onClick={openReview}
                className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground"
              >
                <ListChecks className="h-4 w-4" />
                Review
              </button>
            </div>
          </div>

          <section className="min-h-0 flex-1 overflow-auto overscroll-contain rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-6">
            {current.kind === 'pbq' ? (
              <PBQRenderer
                q={current.data}
                ans={pbqAnswers[current.data.id]}
                onAns={answer => setPbqAnswers(previous => ({ ...previous, [current.data.id]: answer }))}
                submitted={false}
                studyRevealed={false}
                examMode
              />
            ) : (
              <StrictMCQ
                q={current.data}
                answer={mcqAnswers[current.data.id]}
                onAnswer={answer => setMcqAnswers(previous => ({ ...previous, [current.data.id]: answer }))}
              />
            )}
          </section>

          <footer className="mt-3 flex shrink-0 items-center justify-between border-t border-border pt-3">
            <button
              onClick={() => goToQuestion(idx - 1)}
              disabled={idx === 0}
              className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-semibold disabled:opacity-30 hover:bg-muted"
            >
              <ChevronLeft className="h-4 w-4" /> Previous
            </button>

            <div className="hidden text-xs text-muted-foreground sm:block">
              {focusViolations > 0
                ? `Focus changes recorded: ${focusViolations}`
                : settings.exam_pause_enabled
                  ? 'Pause is available for real-world interruptions'
                  : 'Exam timer runs continuously'}
            </div>

            {idx < questions.length - 1 ? (
              <button
                onClick={() => goToQuestion(idx + 1)}
                className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 md:hidden"
              >
                Next <ChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={openReview}
                className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 md:hidden"
              >
                Review Exam <ChevronRight className="h-4 w-4" />
              </button>
            )}
          </footer>
        </div>

        <button
          onClick={idx < questions.length - 1 ? () => goToQuestion(idx + 1) : openReview}
          className="fixed right-0 top-1/2 z-50 hidden -translate-y-1/2 items-center gap-2 rounded-l-xl border-y border-l border-primary/40 bg-primary px-4 py-4 text-sm font-bold text-primary-foreground shadow-xl transition-all hover:pl-5 hover:opacity-95 md:flex"
          aria-label={idx < questions.length - 1 ? 'Next question' : 'Review exam'}
          title={idx < questions.length - 1 ? 'Next question' : 'Review exam'}
        >
          <span>{idx < questions.length - 1 ? 'Next' : 'Review'}</span>
          <ChevronRight className="h-5 w-5" />
        </button>
      </main>
    </div>
  );
}

function ExamTopBar({
  timerDisplay,
  examNumber,
  timerTone,
  pauseEnabled,
  isPaused,
  onPause,
}: {
  timerDisplay: string;
  examNumber: number;
  timerTone: 'normal' | 'warning' | 'destructive';
  pauseEnabled: boolean;
  isPaused: boolean;
  onPause: () => void;
}) {
  const timerClass =
    timerTone === 'destructive'
      ? 'border-destructive/40 bg-destructive/10 text-destructive'
      : timerTone === 'warning'
        ? 'border-warning/40 bg-warning/10 text-warning'
        : 'border-border bg-muted/40 text-foreground';

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur-xl">
      <div className="mx-auto flex min-h-14 max-w-6xl items-center gap-3 px-4 py-2 sm:px-8">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold">Security+ SY0-701 Simulation</span>
          <span className="hidden rounded-md border border-border bg-muted/30 px-2 py-0.5 text-[10px] text-muted-foreground sm:inline">
            Form {examNumber}
          </span>
        </div>

        <div className="ml-auto flex items-center gap-2">
          {pauseEnabled && (
            <button
              onClick={onPause}
              className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
              <span className="hidden sm:inline">{isPaused ? 'Resume' : 'Pause'}</span>
            </button>
          )}
          <div className={`flex items-center gap-2 rounded-lg border px-3 py-2 font-mono text-sm font-bold ${timerClass}`}>
            <Clock className="h-4 w-4" />
            <span className="hidden text-[10px] font-sans font-normal uppercase tracking-wider sm:inline">Time</span>
            {timerDisplay}
          </div>
        </div>
      </div>
    </header>
  );
}

function PauseOverlay({ onResume }: { onResume: () => void }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/95 p-4 backdrop-blur-xl">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-7 text-center shadow-2xl">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Pause className="h-7 w-7" />
        </div>
        <h2 className="text-xl font-bold">Exam paused</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          The countdown and question timer are stopped, and the active question is covered until you resume.
        </p>
        <button
          onClick={onResume}
          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-bold text-primary-foreground hover:opacity-90"
        >
          <Play className="h-4 w-4" />
          Resume exam
        </button>
      </div>
    </div>
  );
}

function StrictMCQ({
  q,
  answer,
  onAnswer,
}: {
  q: MCQuestion;
  answer?: number | number[];
  onAnswer: (answer: number | number[]) => void;
}) {
  const isSelected = (index: number) =>
    q.type === 'single'
      ? answer === index
      : Array.isArray(answer) && answer.includes(index);

  const choose = (index: number) => {
    if (q.type === 'single') {
      onAnswer(index);
      return;
    }

    const current = Array.isArray(answer) ? answer : [];
    if (current.includes(index)) onAnswer(current.filter(value => value !== index));
    else if (current.length < 2) onAnswer([...current, index]);
  };

  return (
    <div>
      {q.type === 'select-two' && (
        <div className="mb-4 inline-flex rounded-md border border-accent/25 bg-accent/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-accent">
          Select exactly two
        </div>
      )}
      <h1 className="mb-5 max-w-4xl text-lg font-medium leading-7 sm:text-xl">{q.question}</h1>
      <EvidenceBlocks evidence={q.evidence} />
      <div className="space-y-3">
        {q.options.map((option, index) => {
          const selected = isSelected(index);
          return (
            <button
              key={index}
              onClick={() => choose(index)}
              className={`flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-left text-sm leading-6 transition-all ${
                selected
                  ? 'border-primary bg-primary/10 ring-1 ring-primary/40'
                  : 'border-border bg-background/40 hover:border-primary/40 hover:bg-muted/30'
              }`}
            >
              <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border text-xs font-semibold ${
                selected
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border text-muted-foreground'
              }`}>
                {String.fromCharCode(65 + index)}
              </span>
              <span>{option}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function EndExamConfirm({
  incompleteCount,
  onCancel,
  onConfirm,
}: {
  incompleteCount: number;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl">
        <div className="mb-3 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-warning" />
          <h2 className="text-lg font-semibold">End exam?</h2>
        </div>
        <p className="text-sm leading-6 text-muted-foreground">
          {incompleteCount > 0
            ? `You still have ${incompleteCount} incomplete item${incompleteCount === 1 ? '' : 's'}. Ending the exam submits them unanswered.`
            : 'Once you end the exam, you cannot return to any question.'}
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-semibold hover:bg-muted"
          >
            Continue Review
          </button>
          <button
            onClick={onConfirm}
            className="rounded-lg bg-destructive px-4 py-2 text-sm font-semibold text-destructive-foreground hover:opacity-90"
          >
            End Exam
          </button>
        </div>
      </div>
    </div>
  );
}
