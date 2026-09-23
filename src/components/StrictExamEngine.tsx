import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, ChevronLeft, ChevronRight, Clock, Flag, ListChecks, ShieldCheck } from 'lucide-react';
import type { MCQuestion, PBQuestion } from '@/data/questions';
import { calculateScore, isMCQCorrect, isPBQCorrect, type ScoreResult } from '@/lib/examEngine';
import { saveAttempt, type QuestionAttempt } from '@/lib/examHistory';
import { DOMAIN_LABELS } from '@/data/questions';
import { PBQRenderer } from '@/components/PBQRenderer';
import { EvidenceBlocks } from '@/components/EvidenceBlocks';
import { ExamResults } from '@/components/ExamResults';
import { buildStrictExamOrder } from '@/lib/strictExamOrder';

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

  const startTimeRef = useRef(Date.now());
  const timeByQuestionRef = useRef<Record<string, number>>({});
  const activeItemRef = useRef<{ id: string; startedAt: number } | null>(null);
  const submittedRef = useRef(false);

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
    if (phase !== 'item' || !currentId) return;
    activeItemRef.current = { id: currentId, startedAt: Date.now() };
    return () => recordCurrentItemTime();
  }, [currentId, phase, recordCurrentItemTime]);

  const finishExam = useCallback(() => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    recordCurrentItemTime();

    const startTime = startTimeRef.current;
    const result = calculateScore(pbqs, mcqs, pbqAnswers, mcqAnswers, startTime);
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
    setPhase('submitted');
  }, [
    mcqAnswers,
    mcqs,
    pbqAnswers,
    pbqs,
    questions.length,
    recordCurrentItemTime,
  ]);

  useEffect(() => {
    if (phase === 'submitted') return;
    const tick = () => {
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
      const next = Math.max(0, durationMinutes * 60 - elapsed);
      setRemaining(next);
      if (next === 0) finishExam();
    };
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [durationMinutes, finishExam, phase]);

  useEffect(() => {
    if (phase === 'submitted') return;

    const beforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };

    let wasHidden = false;
    const visibility = () => {
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
  }, [phase]);

  const timerDisplay = `${String(Math.floor(remaining / 60)).padStart(2, '0')}:${String(remaining % 60).padStart(2, '0')}`;

  const goToQuestion = (nextIndex: number) => {
    if (nextIndex < 0 || nextIndex >= questions.length) return;
    recordCurrentItemTime();
    setIdx(nextIndex);
    setPhase('item');
  };

  const toggleFlag = () => {
    if (!currentId) return;
    setFlags(previous => {
      const next = new Set(previous);
      if (next.has(currentId)) next.delete(currentId);
      else next.add(currentId);
      return next;
    });
  };

  if (phase === 'submitted' && scoreResult) {
    return (
      <div className="dark min-h-screen bg-slate-950 text-slate-100">
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

  if (phase === 'review') {
    const visibleQuestions = questions
      .map((question, index) => ({ question, index }))
      .filter(({ question }) => {
        if (reviewFilter === 'incomplete') return !isAnswered(question);
        if (reviewFilter === 'flagged') return flags.has(question.data.id);
        return true;
      });

    return (
      <div className="dark min-h-screen bg-slate-950 text-slate-100">
        <ExamTopBar timerDisplay={timerDisplay} examNumber={examNumber} />
        <main className="mx-auto max-w-5xl px-4 py-8 sm:px-8">
          <section className="overflow-hidden rounded-sm border border-slate-300 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <div className="border-b border-slate-300 bg-slate-100 px-5 py-3 dark:border-slate-700 dark:bg-slate-800">
              <h1 className="text-base font-semibold">Item Review</h1>
            </div>

            <div className="border-b border-slate-200 px-5 py-4 text-sm leading-6 text-slate-600 dark:border-slate-800 dark:text-slate-300">
              Review any item before ending the exam. Unanswered items are marked incomplete. Flagging an item does not change its score.
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-3 dark:border-slate-800">
              <div className="text-sm font-semibold">
                Items <span className="font-normal text-red-600">({incompleteCount} Unseen/Incomplete)</span>
              </div>
              <div className="text-xs text-slate-500">{flags.size} flagged</div>
            </div>

            <div className="grid gap-px bg-slate-200 p-px dark:bg-slate-800 sm:grid-cols-2 lg:grid-cols-3">
              {visibleQuestions.map(({ question, index }) => {
                const answered = isAnswered(question);
                const flagged = flags.has(question.data.id);
                return (
                  <button
                    key={question.data.id}
                    onClick={() => goToQuestion(index)}
                    className="flex min-h-14 items-center gap-3 bg-white px-4 py-3 text-left hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800"
                  >
                    <Flag className={`h-4 w-4 shrink-0 ${flagged ? 'fill-current text-amber-500' : 'text-slate-300 dark:text-slate-600'}`} />
                    <span className="font-mono text-sm font-semibold">Question {index + 1}</span>
                    {!answered && <span className="ml-auto text-[11px] font-semibold text-red-600">Incomplete</span>}
                  </button>
                );
              })}
            </div>

            {visibleQuestions.length === 0 && (
              <div className="px-5 py-10 text-center text-sm text-slate-500">
                No items match this review filter.
              </div>
            )}

            <div className="flex flex-wrap items-center justify-end gap-2 border-t border-slate-300 bg-slate-100 px-4 py-4 dark:border-slate-700 dark:bg-slate-800">
              <button
                onClick={() => setShowEndConfirm(true)}
                className="mr-auto rounded-sm border border-slate-400 bg-white px-4 py-2 text-sm font-semibold hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900"
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
                  className={`rounded-sm border px-4 py-2 text-sm font-semibold ${
                    reviewFilter === key
                      ? 'border-sky-700 bg-sky-700 text-white'
                      : 'border-slate-400 bg-white hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </section>
        </main>
        {showEndConfirm && <EndExamConfirm incompleteCount={incompleteCount} onCancel={() => setShowEndConfirm(false)} onConfirm={finishExam} />}
      </div>
    );
  }

  if (!current) return null;

  return (
    <div className="dark min-h-screen bg-slate-950 text-slate-100">
      <ExamTopBar timerDisplay={timerDisplay} examNumber={examNumber} />

      {focusNotice && (
        <div className="border-b border-amber-300 bg-amber-50 px-4 py-2 text-center text-xs font-medium text-amber-950 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-100">
          Exam condition notice: the test window lost focus. The timer continued running.
          <button onClick={() => setFocusNotice(false)} className="ml-3 underline">Dismiss</button>
        </div>
      )}

      <div className="mx-auto max-w-5xl px-4 py-5 sm:px-8">
        <div className="mb-4 flex items-center justify-between border-b border-slate-300 pb-3 dark:border-slate-700">
          <div>
            <div className="text-[11px] uppercase tracking-wide text-slate-500">Question</div>
            <div className="font-mono text-lg font-semibold">{idx + 1} of {questions.length}</div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleFlag}
              className={`flex items-center gap-2 rounded-sm border px-3 py-2 text-xs font-semibold ${
                flags.has(currentId)
                  ? 'border-amber-500 bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-200'
                  : 'border-slate-400 bg-white hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900'
              }`}
            >
              <Flag className={`h-4 w-4 ${flags.has(currentId) ? 'fill-current' : ''}`} />
              Flag for Review
            </button>
            <button
              onClick={() => {
                recordCurrentItemTime();
                setReviewFilter('all');
                setPhase('review');
              }}
              className="flex items-center gap-2 rounded-sm border border-slate-400 bg-white px-3 py-2 text-xs font-semibold hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900"
            >
              <ListChecks className="h-4 w-4" />
              Review
            </button>
          </div>
        </div>

        <section className="min-h-[520px] border border-slate-300 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:p-8">
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

        <footer className="mt-4 flex items-center justify-between border-t border-slate-300 pt-4 dark:border-slate-700">
          <button
            onClick={() => goToQuestion(idx - 1)}
            disabled={idx === 0}
            className="flex items-center gap-2 rounded-sm border border-slate-400 bg-white px-5 py-2.5 text-sm font-semibold disabled:opacity-30 dark:border-slate-600 dark:bg-slate-900"
          >
            <ChevronLeft className="h-4 w-4" /> Previous
          </button>

          <div className="hidden text-xs text-slate-500 sm:block">
            {focusViolations > 0 ? `Focus changes recorded: ${focusViolations}` : 'Exam timer continues until final submission'}
          </div>

          {idx < questions.length - 1 ? (
            <button
              onClick={() => goToQuestion(idx + 1)}
              className="flex items-center gap-2 rounded-sm bg-sky-700 px-6 py-2.5 text-sm font-semibold text-white hover:bg-sky-800"
            >
              Next <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={() => {
                recordCurrentItemTime();
                setReviewFilter('all');
                setPhase('review');
              }}
              className="flex items-center gap-2 rounded-sm bg-sky-700 px-6 py-2.5 text-sm font-semibold text-white hover:bg-sky-800"
            >
              Review Exam <ChevronRight className="h-4 w-4" />
            </button>
          )}
        </footer>
      </div>
    </div>
  );
}

function ExamTopBar({ timerDisplay, examNumber }: { timerDisplay: string; examNumber: number }) {
  return (
    <header className="border-b border-slate-300 bg-slate-900 text-white dark:border-slate-700">
      <div className="mx-auto flex h-14 max-w-6xl items-center px-4 sm:px-8">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-sky-300" />
          <span className="text-sm font-semibold">Security+ SY0-701 Simulation</span>
          <span className="hidden text-xs text-slate-400 sm:inline">Form {examNumber}</span>
        </div>
        <div className="ml-auto flex items-center gap-2 font-mono text-sm font-semibold">
          <Clock className="h-4 w-4 text-slate-400" />
          <span className="hidden text-xs font-normal text-slate-400 sm:inline">Time Remaining</span>
          {timerDisplay}
        </div>
      </div>
    </header>
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
        <div className="mb-4 text-sm font-semibold text-slate-700 dark:text-slate-300">
          Select TWO.
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
              className={`flex w-full items-start gap-3 rounded-sm border px-4 py-3 text-left text-sm leading-6 ${
                selected
                  ? 'border-sky-700 bg-sky-50 ring-1 ring-sky-700 dark:bg-sky-950'
                  : 'border-slate-300 bg-white hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800'
              }`}
            >
              <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-semibold ${
                selected
                  ? 'border-sky-700 bg-sky-700 text-white'
                  : 'border-slate-400 text-slate-600 dark:border-slate-600 dark:text-slate-300'
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4">
      <div className="w-full max-w-md rounded-sm border border-slate-300 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
        <div className="mb-3 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-600" />
          <h2 className="text-lg font-semibold">End exam?</h2>
        </div>
        <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
          {incompleteCount > 0
            ? `You still have ${incompleteCount} incomplete item${incompleteCount === 1 ? '' : 's'}. Ending the exam submits them unanswered.`
            : 'Once you end the exam, you cannot return to any question.'}
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <button onClick={onCancel} className="rounded-sm border border-slate-400 px-4 py-2 text-sm font-semibold">
            Continue Review
          </button>
          <button onClick={onConfirm} className="rounded-sm bg-red-700 px-4 py-2 text-sm font-semibold text-white hover:bg-red-800">
            End Exam
          </button>
        </div>
      </div>
    </div>
  );
}
