import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Clock,
  Flag,
  ListChecks,
  Shield,
} from 'lucide-react';
import { DOMAIN_LABELS, type Domain, type MCQuestion, type PBQuestion } from '@/data/questions';
import { getPBQCredit, isMCQCorrect } from '@/lib/examEngine';
import { PBQRenderer } from '@/components/PBQRenderer';
import {
  clearSimState,
  EXAM_DURATION_SECONDS,
  loadSimItems,
  loadSimState,
  saveSimItems,
  saveSimState,
  computeResult,
  saveSimResult,
  type SimConfig,
  type SimItem,
  type SimState,
} from '@/lib/simExam';
import { saveAttempt } from '@/lib/examHistory';

export default function ExamScreen() {
  const navigate = useNavigate();

  // ── Load session ───────────────────────────────────────────────
  const bootstrap = useMemo(() => {
    const state = loadSimState();
    if (!state) return null;
    const items = loadSimItems(state.order);
    if (!items) return null;
    return { state, items };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!bootstrap) {
      navigate('/sim', { replace: true });
      return;
    }
    saveSimItems(bootstrap.items);
  }, [bootstrap, navigate]);

  const [state, setState] = useState<SimState | null>(bootstrap?.state ?? null);
  const items: SimItem[] = bootstrap?.items ?? [];

  const [showSidebar, setShowSidebar] = useState(true);
  const [showEndModal, setShowEndModal] = useState(false);
  const [showTimeWarn, setShowTimeWarn] = useState(false);
  const [checkedPbqIds, setCheckedPbqIds] = useState<Set<string>>(new Set());
  const [remaining, setRemaining] = useState(EXAM_DURATION_SECONDS);
  const timeWarnedRef = useRef(false);

  const cfg: SimConfig | undefined = state?.cfg;
  const isExam = cfg?.mode === 'exam';
  const idx = state?.idx ?? 0;
  const flags = useMemo(() => new Set(state?.flags ?? []), [state]);
  const answers = state?.answers ?? {};
  const cur = items[idx];

  const patchState = useCallback((patch: Partial<SimState>) => {
    setState(prev => {
      if (!prev) return prev;
      const next = { ...prev, ...patch };
      saveSimState(next);
      return next;
    });
  }, []);

  const setAnswer = useCallback((id: string, a: any) => {
    setState(prev => {
      if (!prev) return prev;
      const next = { ...prev, answers: { ...prev.answers, [id]: a } };
      saveSimState(next);
      return next;
    });
  }, []);

  const toggleFlag = useCallback((id: string) => {
    setState(prev => {
      if (!prev) return prev;
      const has = prev.flags.includes(id);
      const nextFlags = has ? prev.flags.filter(f => f !== id) : [...prev.flags, id];
      const next = { ...prev, flags: nextFlags };
      saveSimState(next);
      return next;
    });
  }, []);

  const goTo = (i: number) => patchState({ idx: Math.max(0, Math.min(items.length - 1, i)) });

  // ── Timer (exam mode) ──────────────────────────────────────────
  useEffect(() => {
    if (!state || !isExam) return;
    const tick = () => {
      const elapsed = Math.floor((Date.now() - state.startedAt) / 1000);
      const r = Math.max(0, EXAM_DURATION_SECONDS - elapsed);
      setRemaining(r);
      if (r <= 60 && !timeWarnedRef.current) {
        timeWarnedRef.current = true;
        setShowTimeWarn(true);
      }
      if (r <= 0) submit();
    };
    const iv = setInterval(tick, 1000);
    tick();
    return () => clearInterval(iv);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, isExam]);

  // ── Submit ─────────────────────────────────────────────────────
  const submit = useCallback(() => {
    if (!state || items.length === 0) return;
    const result = computeResult(items, state);
    saveSimResult(result);
    try {
      saveAttempt(result.attempt);
    } catch (e) {
      console.warn('Failed to record attempt:', e);
    }
    clearSimState();
    navigate('/sim/results', { replace: true });
  }, [state, items, navigate]);

  const answeredCount = items.filter(i => hasAttempt(answers[i.id])).length;
  const unansweredCount = items.length - answeredCount;

  // ── Keyboard shortcuts ─────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;
      if (showEndModal || showTimeWarn) return;
      if (e.key === 'ArrowRight') goTo(idx + 1);
      else if (e.key === 'ArrowLeft') goTo(idx - 1);
      else if ((e.key === 'f' || e.key === 'F') && cur) toggleFlag(cur.id);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, cur, showEndModal, showTimeWarn]);

  if (!state || !cur || !cfg) return null;

  const domainLabel = DOMAIN_LABELS[(cur.q as any).domain as Domain] ?? '';
  const typeLabel = cur.kind === 'pbq'
    ? ({ firewall: 'Firewall', ordering: 'Sequence', 'log-analysis': 'Log Analysis', matching: 'Matching', placement: 'Placement' } as Record<string, string>)[(cur.q as PBQuestion).type]
    : ((cur.q as MCQuestion).type === 'select-two' ? 'Multiple Select — choose 2' : 'Single Choice');
  const curAnswer = answers[cur.id];
  const curFlagged = flags.has(cur.id);
  const pbqChecked = isExam ? false : checkedPbqIds.has(cur.id);

  const selectMcq = (i: number) => {
    const q = cur.q as MCQuestion;
    if (q.type === 'single') {
      setAnswer(cur.id, i);
    } else {
      const prev = Array.isArray(curAnswer) ? (curAnswer as number[]) : [];
      const next = prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i].slice(-2);
      setAnswer(cur.id, next);
    }
  };

  const pbqReveal = () => {
    setCheckedPbqIds(prev => new Set(prev).add(cur.id));
    const pbq = cur.q as PBQuestion;
    const credit = getPBQCredit(pbq, answers[cur.id]);
    if (credit.ratio < 1) {
      setState(prev => {
        if (!prev) return prev;
        if (prev.flags.includes(cur.id)) return prev;
        const next = { ...prev, flags: [...prev.flags, cur.id] };
        saveSimState(next);
        return next;
      });
    }
  };

  const timerMins = String(Math.floor(remaining / 60)).padStart(2, '0');
  const timerSecs = String(remaining % 60).padStart(2, '0');
  const isTimeCritical = remaining <= 60;

  return (
    <div className="flex h-screen flex-col bg-background text-foreground">
      {/* ── TOP BAR ── */}
      <header className="flex flex-wrap items-center gap-3 border-b border-border bg-card px-4 py-3 md:px-6">
        <div className="flex items-center gap-2 font-bold">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/25">
            <Shield className="h-4.5 w-4.5" />
          </div>
          <span className="hidden sm:inline">Security+</span>
        </div>
        <div className="hidden h-6 w-px bg-border md:block" />
        <div className="hidden max-w-[220px] truncate rounded-full border border-border bg-muted px-3 py-1 text-xs text-muted-foreground lg:block">
          {typeLabel} · {domainLabel}
        </div>
        <div className="text-sm font-semibold text-muted-foreground">
          Q {idx + 1} <span className="opacity-50">of {items.length}</span>
        </div>
        <div className="flex-1" />
        <button
          onClick={() => toggleFlag(cur.id)}
          aria-label="Flag question for review"
          className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-bold transition ${
            curFlagged
              ? 'border-amber-500/50 bg-amber-500/10 text-amber-500'
              : 'border-border text-muted-foreground hover:bg-muted'
          }`}
        >
          <Flag className={`h-3.5 w-3.5 ${curFlagged ? 'fill-amber-500' : ''}`} />
          <span className="hidden sm:inline">{curFlagged ? 'Flagged' : 'Flag'}</span>
        </button>
        {isExam && (
          <div
            aria-live="polite"
            className={`flex items-center gap-2 rounded-lg px-3 py-2 font-mono text-sm font-bold ${
              isTimeCritical
                ? 'animate-pulse border border-red-500/50 bg-red-500/10 text-red-500'
                : 'border border-border bg-muted text-foreground'
            }`}
          >
            <Clock className="h-4 w-4" />
            {timerMins}:{timerSecs}
          </div>
        )}
        <button
          onClick={() => setShowEndModal(true)}
          className="rounded-lg bg-foreground/10 px-3 py-2 text-xs font-bold text-foreground transition hover:bg-foreground/20"
        >
          {isExam ? 'End Exam' : 'Finish'}
        </button>
      </header>

      {/* ── BODY ── */}
      <div className="flex min-h-0 flex-1">
        {/* Sidebar navigator */}
        <aside
          className={`hidden flex-col overflow-y-auto border-r border-border bg-card transition-all md:flex ${
            showSidebar ? 'w-64 p-4' : 'w-0 overflow-hidden'
          }`}
        >
          <div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Navigator</div>
          <div className="grid grid-cols-7 gap-1.5">
            {items.map((it, i) => {
              const answered = hasAttempt(answers[it.id]);
              const flagged = flags.has(it.id);
              const isPbq = it.kind === 'pbq';
              const isCur = i === idx;
              return (
                <button
                  key={it.id}
                  onClick={() => goTo(i)}
                  className={`relative flex h-8 items-center justify-center rounded-md border text-[10px] font-bold transition ${
                    isCur
                      ? 'border-primary bg-primary text-white'
                      : answered
                        ? 'border-emerald-600/40 bg-emerald-600/15 text-emerald-500'
                        : 'border-border text-muted-foreground hover:bg-muted'
                  }`}
                  title={flagged ? 'Flagged' : undefined}
                >
                  {i + 1}
                  {flagged && (
                    <span className="absolute -right-0.5 -top-0.5 flex h-2.5 w-2.5 rounded-full bg-amber-500 ring-1 ring-card" />
                  )}
                  {isPbq && (
                    <span className={`absolute bottom-0.5 h-1 w-1 rounded-full ${isCur ? 'bg-white' : 'bg-primary'}`} />
                  )}
                </button>
              );
            })}
          </div>
          <hr className="my-3 border-border" />
          <div className="space-y-1 text-xs">
            <div className="flex justify-between"><span className="text-muted-foreground">Answered</span><span className="font-bold">{answeredCount}/{items.length}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Flagged</span><span className="font-bold">{flags.size}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Remaining</span><span className="font-bold">{unansweredCount}</span></div>
          </div>
          <hr className="my-3 border-border" />
          <div className="space-y-1.5 text-[11px] text-muted-foreground">
            <div className="flex items-center gap-2"><span className="h-3 w-3 rounded-sm border border-border" /> Unanswered</div>
            <div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-emerald-600" /> Answered</div>
            <div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-amber-500" /> Flagged</div>
            <div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-primary" /> Current</div>
            <div className="flex items-center gap-2"><span className="h-1 w-3 rounded-full bg-primary" /> PBQ</div>
          </div>
        </aside>

        {/* Sidebar toggle at the boundary */}
        <button
          onClick={() => setShowSidebar(v => !v)}
          className="hidden w-7 shrink-0 items-center justify-center border-r border-border bg-card text-muted-foreground transition hover:text-foreground md:flex md:bg-background"
          aria-label="Toggle question navigator"
          title="Toggle navigator"
        >
          <ChevronRight className={`h-4 w-4 transition-transform ${showSidebar ? '' : 'rotate-180'}`} />
        </button>

        {/* Content */}
        <main className="flex-1 overflow-y-auto px-4 py-6 md:px-10">
          {cur.kind === 'mcq' ? (
            <MCQContent
              q={cur.q as MCQuestion}
              answer={curAnswer as number | number[] | undefined}
              onSelect={selectMcq}
              index={idx}
              total={items.length}
              isExam={isExam}
            />
          ) : (
            <PBQContent
              pbq={cur.q as PBQuestion}
              answer={curAnswer}
              onAns={a => setAnswer(cur.id, a)}
              index={idx}
              total={items.length}
              isExam={isExam}
              revealed={pbqChecked}
              onReveal={pbqReveal}
            />
          )}
        </main>
      </div>

      {/* ── BOTTOM BAR ── */}
      <footer className="flex items-center justify-between border-t border-border bg-card px-4 py-3 md:px-6">
        <button
          onClick={() => goTo(idx - 1)}
          disabled={idx === 0}
          className="flex items-center gap-1 rounded-lg border border-border px-4 py-2.5 text-sm font-semibold text-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeft className="h-4 w-4" /> Prev
        </button>
        <button
          onClick={() => toggleFlag(cur.id)}
          className={`flex items-center gap-1.5 rounded-lg border px-4 py-2.5 text-sm font-semibold transition ${
            curFlagged
              ? 'border-amber-500/50 bg-amber-500/10 text-amber-500'
              : 'border-border text-foreground hover:bg-muted'
          }`}
        >
          <Flag className={`h-4 w-4 ${curFlagged ? 'fill-amber-500' : ''}`} /> Mark for Review
        </button>
        <button
          onClick={() => (idx === items.length - 1 ? setShowEndModal(true) : goTo(idx + 1))}
          className="flex items-center gap-1 rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-white transition hover:opacity-90"
        >
          {idx === items.length - 1 ? 'Submit' : 'Next'} <ChevronRight className="h-4 w-4" />
        </button>
      </footer>

      {/* ── END EXAM MODAL ── */}
      {showEndModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <div className="mb-2 flex items-center gap-2 text-lg font-bold">
              <ListChecks className="h-5 w-5 text-primary" /> Submit {isExam ? 'Exam' : 'Session'}?
            </div>
            <div className="mb-5 text-sm text-muted-foreground">
              Review your progress before submitting. You will not be able to change answers after submission.
            </div>
            <div className="mb-5 grid grid-cols-3 gap-3 text-center">
              <ModalStat n={answeredCount} label="Answered" toneClass="text-emerald-500" />
              <ModalStat n={unansweredCount} label="Unanswered" toneClass="text-red-500" />
              <ModalStat n={flags.size} label="Flagged" toneClass="text-amber-500" />
            </div>
            {unansweredCount > 0 && (
              <div className="mb-4 flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-600 dark:text-amber-500">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                {unansweredCount} question{unansweredCount > 1 ? 's' : ''} unanswered — they will be scored as incorrect.
              </div>
            )}
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowEndModal(false)}
                className="rounded-lg border border-border px-4 py-2.5 text-sm font-semibold text-foreground transition hover:bg-muted"
              >
                Continue {isExam ? 'Exam' : 'Session'}
              </button>
              <button
                onClick={submit}
                className="rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-white transition hover:opacity-90"
              >
                Submit &amp; Score
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 1-MINUTE WARNING MODAL ── */}
      {showTimeWarn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-2xl border border-amber-500/40 bg-card p-6 shadow-2xl">
            <div className="mb-2 flex items-center gap-2 text-lg font-bold text-amber-500">
              <Clock className="h-5 w-5" /> 1 Minute Remaining
            </div>
            <div className="mb-5 text-sm text-muted-foreground">
              Your exam will auto-submit when the timer reaches 0:00. Please review your answers and unanswered questions now.
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => setShowTimeWarn(false)}
                className="rounded-lg border border-border px-4 py-2.5 text-sm font-semibold transition hover:bg-muted"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── MCQ content ─────────────────────────────────────────────── */

function MCQContent({
  q,
  answer,
  onSelect,
  index,
  total,
  isExam,
}: {
  q: MCQuestion;
  answer: number | number[] | undefined;
  onSelect: (i: number) => void;
  index: number;
  total: number;
  isExam: boolean;
}) {
  const isMulti = q.type === 'select-two';
  const answered = answer !== undefined && (!Array.isArray(answer) || answer.length > 0);
  const reveal = !isExam && answered;
  const isCorrect = isMCQCorrect(q, answer);
  const correctSet = new Set<number>(isMulti ? (q.answer as number[]) : [q.answer as number]);

  const selected = (i: number) => (Array.isArray(answer) ? answer.includes(i) : answer === i);
  const tone = (i: number) => {
    if (!reveal || !selected(i)) return '';
    return isCorrect ? '' : 'border-red-500/60 bg-red-500/10';
  };
  const revealTone = (i: number) => {
    if (!reveal || !correctSet.has(i)) return '';
    return 'border-emerald-500/60 bg-emerald-500/10';
  };

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        <span className="rounded-full border border-border px-2.5 py-1">{isMulti ? 'Multiple select — choose 2' : 'Single choice'}</span>
        <span>Question {index + 1} of {total}</span>
      </div>
      <h2 className="mb-6 text-lg font-bold leading-relaxed md:text-xl">{q.question}</h2>
      <div className="space-y-2.5">
        {q.options.map((option, i) => (
          <button
            key={i}
            onClick={() => onSelect(i)}
            className={`flex w-full items-center gap-4 rounded-xl border px-4 py-3.5 text-left text-sm transition hover:border-foreground/20 hover:bg-muted/30 ${tone(i)} ${revealTone(i)} ${
              selected(i) && !reveal ? 'border-primary bg-primary/5 ring-1 ring-primary/50' : 'border-border'
            }`}
          >
            <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-xs font-bold ${selected(i) ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}>
              {String.fromCharCode(65 + i)}
            </span>
            <span className={selected(i) ? 'font-medium' : ''}>{option}</span>
            {isMulti ? (
              <span className={`ml-auto flex h-5 w-5 shrink-0 items-center justify-center rounded-sm border ${selected(i) ? 'border-primary bg-primary text-white' : 'border-border'}`}>
                {selected(i) && <span className="text-[10px] font-bold">✓</span>}
              </span>
            ) : (
              <span className={`ml-auto flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${selected(i) ? 'border-primary bg-primary text-white' : 'border-border'}`}>
                {selected(i) && <span className="h-2 w-2 rounded-full bg-white" />}
              </span>
            )}
          </button>
        ))}
      </div>
      {reveal && (
        <div className={`mt-5 rounded-xl border p-4 text-sm ${
          isCorrect ? 'border-emerald-500/40 bg-emerald-500/10' : 'border-red-500/40 bg-red-500/10'
        }`}>
          <div className="mb-1 font-bold">
            {isCorrect ? '✓ Correct' : '✕ Incorrect'}
          </div>
          <p className="text-muted-foreground">Correct answer: <span className="font-medium text-foreground">
            {correctSet.size > 0 ? [...correctSet].map(i => `${String.fromCharCode(65 + i)}. ${q.options[i]}`).join(' + ') : ''}
          </span></p>
          <p className="mt-2 leading-relaxed text-muted-foreground">{q.explanation}</p>
        </div>
      )}
    </div>
  );
}

/* ── PBQ content ─────────────────────────────────────────────── */

function PBQContent({
  pbq,
  answer,
  onAns,
  index,
  total,
  isExam,
  revealed,
  onReveal,
}: {
  pbq: PBQuestion;
  answer: any;
  onAns: (a: any) => void;
  index: number;
  total: number;
  isExam: boolean;
  revealed: boolean;
  onReveal: () => void;
}) {
  const credit = revealed ? getPBQCredit(pbq, answer) : null;
  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        <span className="rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-primary">PBQ · Interactive</span>
        <span>Question {index + 1} of {total}</span>
      </div>
      <PBQRenderer
        q={pbq}
        ans={answer}
        onAns={onAns}
        submitted={revealed}
        studyRevealed={revealed}
        examMode
      />
      {!isExam && (
        <div className="mt-5 flex items-center gap-3">
          <button
            onClick={onReveal}
            className="rounded-lg border border-border px-4 py-2.5 text-sm font-semibold transition hover:bg-muted"
          >
            Check Answer
          </button>
          {credit && (
            <span className={`text-sm font-bold ${credit.ratio === 1 ? 'text-emerald-500' : 'text-amber-500'}`}>
              {credit.earned}/{credit.total} subtasks met
            </span>
          )}
        </div>
      )}
    </div>
  );
}

function ModalStat({ n, label, toneClass }: { n: number; label: string; toneClass: string }) {
  return (
    <div className="rounded-lg border border-border bg-background px-2 py-3">
      <div className={`text-xl font-bold ${toneClass}`}>{n}</div>
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
    </div>
  );
}

function hasAttempt(answer: unknown): boolean {
  if (answer === undefined || answer === null) return false;
  if (Array.isArray(answer)) return answer.length > 0;
  if (typeof answer === 'string') return answer.trim().length > 0;
  if (typeof answer === 'object') return Object.keys(answer).length > 0;
  return true;
}
