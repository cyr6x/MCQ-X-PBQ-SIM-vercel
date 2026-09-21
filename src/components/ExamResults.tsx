import {
  AlertTriangle,
  BookOpenCheck,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Flag,
  Grid3X3,
  Layers3,
  ListFilter,
  RotateCcw,
  Target,
  Trophy,
  XCircle,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import type { ScoreResult } from '@/lib/examEngine';
import { getPBQCredit, isMCQCorrect } from '@/lib/examEngine';
import type { MCQuestion, PBQuestion } from '@/data/questions';
import { DOMAIN_LABELS } from '@/data/questions';
import { objectiveLabel } from '@/lib/sy0701Objectives';
import { PBQRenderer } from '@/components/PBQRenderer';

interface ExamResultsProps {
  score: ScoreResult;
  pbqs: PBQuestion[];
  mcqs: MCQuestion[];
  pbqAnswers: Record<string, any>;
  mcqAnswers: Record<string, number | number[]>;
  flags?: Set<string>;
  onRestart: () => void;
  onBackToMenu: () => void;
}

type ReviewFilter = 'all' | 'incorrect' | 'flagged' | 'pbq';
type ReviewStatus = 'correct' | 'partial' | 'incorrect';

type ReviewItem =
  | {
      id: string;
      num: number;
      type: 'pbq';
      status: ReviewStatus;
      title: string;
      domain: string;
      objective?: string;
      explanation: string;
      raw: PBQuestion;
      flagged: boolean;
      credit: ReturnType<typeof getPBQCredit>;
    }
  | {
      id: string;
      num: number;
      type: 'mcq';
      status: ReviewStatus;
      title: string;
      domain: string;
      objective?: string;
      explanation: string;
      raw: MCQuestion;
      flagged: boolean;
      userAnswer?: number | number[];
    };

const formatPoints = (value: number) =>
  Number.isInteger(value) ? String(value) : value.toFixed(1).replace(/\.0$/, '');

function statusStyles(status: ReviewStatus) {
  if (status === 'correct') return {
    label: 'Correct',
    card: 'border-success/30',
    badge: 'bg-success/10 text-success border-success/30',
    icon: <CheckCircle2 className="h-4 w-4 text-success" />,
  };
  if (status === 'partial') return {
    label: 'Partial credit',
    card: 'border-warning/40',
    badge: 'bg-warning/10 text-warning border-warning/30',
    icon: <AlertTriangle className="h-4 w-4 text-warning" />,
  };
  return {
    label: 'Incorrect',
    card: 'border-destructive/30',
    badge: 'bg-destructive/10 text-destructive border-destructive/30',
    icon: <XCircle className="h-4 w-4 text-destructive" />,
  };
}

function pbqModelAnswer(q: PBQuestion): any {
  switch (q.type) {
    case 'firewall':
      return [...q.correctActions];
    case 'ordering':
      return [...q.steps]
        .sort((a, b) => a.correctPosition - b.correctPosition)
        .map(step => step.label);
    case 'log-analysis':
      return {
        attackType: q.correctAttackType,
        sourceIP: q.correctSourceIP,
        response: q.correctResponse,
      };
    case 'matching':
      return Object.fromEntries(q.items.map(item => [item.left, item.correctRight]));
    case 'placement':
      return Object.fromEntries(q.items.map(item => [item.label, item.correctZone]));
  }
}

export function ExamResults({
  score,
  pbqs,
  mcqs,
  pbqAnswers,
  mcqAnswers,
  flags = new Set<string>(),
  onRestart,
  onBackToMenu,
}: ExamResultsProps) {
  const [filter, setFilter] = useState<ReviewFilter>('incorrect');
  const [showJumpGrid, setShowJumpGrid] = useState(false);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const reviewItems = useMemo<ReviewItem[]>(() => {
    const pbqItems: ReviewItem[] = pbqs.map((q, i) => {
      const credit = getPBQCredit(q, pbqAnswers[q.id]);
      const status: ReviewStatus = credit.ratio === 1 ? 'correct' : credit.ratio > 0 ? 'partial' : 'incorrect';
      return {
        id: q.id,
        num: i + 1,
        type: 'pbq',
        status,
        title: q.title,
        domain: DOMAIN_LABELS[q.domain],
        objective: q.objective,
        explanation: q.explanation,
        raw: q,
        flagged: flags.has(q.id),
        credit,
      };
    });

    const mcqItems: ReviewItem[] = mcqs.map((q, i) => ({
      id: q.id,
      num: pbqs.length + i + 1,
      type: 'mcq',
      status: isMCQCorrect(q, mcqAnswers[q.id]) ? 'correct' : 'incorrect',
      title: q.question,
      domain: DOMAIN_LABELS[q.domain],
      objective: q.objective,
      explanation: q.explanation,
      raw: q,
      flagged: flags.has(q.id),
      userAnswer: mcqAnswers[q.id],
    }));

    return [...pbqItems, ...mcqItems];
  }, [pbqs, mcqs, pbqAnswers, mcqAnswers, flags]);

  const counts = useMemo(() => ({
    correct: reviewItems.filter(item => item.status === 'correct').length,
    partial: reviewItems.filter(item => item.status === 'partial').length,
    incorrect: reviewItems.filter(item => item.status === 'incorrect').length,
    flagged: reviewItems.filter(item => item.flagged).length,
    pbq: reviewItems.filter(item => item.type === 'pbq').length,
  }), [reviewItems]);

  const filtered = reviewItems.filter(item => {
    if (filter === 'all') return true;
    if (filter === 'incorrect') return item.status !== 'correct';
    if (filter === 'flagged') return item.flagged;
    return item.type === 'pbq';
  });

  const toggleCollapsed = (id: string) => {
    setCollapsed(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const jumpTo = (item: ReviewItem) => {
    setShowJumpGrid(false);
    document.getElementById(`review-${item.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <section className="border-b border-border bg-card/80 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 py-6 lg:px-6">
          <div className="grid gap-4 lg:grid-cols-[1.1fr_1.9fr]">
            <div className={`rounded-2xl border p-5 sm:p-6 ${score.passed ? 'border-success/30 bg-success/5' : 'border-destructive/30 bg-destructive/5'}`}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-muted-foreground">
                    <Trophy className="h-4 w-4" />
                    Practice result
                  </div>
                  <div className="flex items-end gap-3">
                    <span className={`font-mono text-5xl font-black ${score.passed ? 'text-success' : 'text-destructive'}`}>
                      {score.scaledScore}
                    </span>
                    <span className="pb-1 text-sm text-muted-foreground">/ 900 practice scale</span>
                  </div>
                </div>
                <span className={`rounded-full border px-3 py-1 text-xs font-black uppercase tracking-wider ${score.passed ? 'border-success/30 bg-success/10 text-success' : 'border-destructive/30 bg-destructive/10 text-destructive'}`}>
                  {score.passed ? 'Pass' : 'Needs work'}
                </span>
              </div>
              <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
                <span>{formatPoints(score.rawCorrect)}/{score.rawTotal} practice points</span>
                <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{score.timeUsedMinutes} min</span>
                <span>{counts.partial} PBQ partial</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: 'Correct', value: counts.correct, cls: 'text-success', border: 'border-success/25' },
                { label: 'Incorrect', value: counts.incorrect, cls: 'text-destructive', border: 'border-destructive/25' },
                { label: 'Partial', value: counts.partial, cls: 'text-warning', border: 'border-warning/25' },
                { label: 'Flagged', value: counts.flagged, cls: 'text-accent', border: 'border-accent/25' },
              ].map(stat => (
                <div key={stat.label} className={`rounded-2xl border bg-card p-4 ${stat.border}`}>
                  <div className={`font-mono text-3xl font-black ${stat.cls}`}>{stat.value}</div>
                  <div className="mt-1 text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-border bg-card p-4">
            <div className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-muted-foreground">
              <Target className="h-4 w-4" />
              Domain performance
            </div>
            <div className="grid gap-3 md:grid-cols-5">
              {Object.entries(score.domainScores).filter(([, data]) => data.total > 0).map(([domain, data]) => (
                <div key={domain} className="rounded-xl bg-muted/35 p-3">
                  <div className="mb-2 line-clamp-2 min-h-8 text-[10px] font-semibold leading-4 text-muted-foreground">{domain}</div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-lg font-black">{data.percentage}%</span>
                    <span className="text-[10px] text-muted-foreground">{formatPoints(data.correct)}/{data.total}</span>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${data.percentage}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center gap-2 overflow-x-auto px-4 py-3 lg:px-6">
          <div className="mr-1 hidden items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-muted-foreground sm:flex">
            <ListFilter className="h-4 w-4" />
            Review
          </div>
          {([
            { key: 'all', label: `All ${reviewItems.length}` },
            { key: 'incorrect', label: `Incorrect / Partial ${counts.incorrect + counts.partial}` },
            { key: 'flagged', label: `Flagged ${counts.flagged}` },
            { key: 'pbq', label: `PBQs ${counts.pbq}` },
          ] as { key: ReviewFilter; label: string }[]).map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`whitespace-nowrap rounded-lg border px-3 py-2 text-xs font-bold transition-all ${
                filter === tab.key
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
          <button
            onClick={() => setShowJumpGrid(v => !v)}
            className="ml-auto flex items-center gap-2 whitespace-nowrap rounded-lg border border-border bg-card px-3 py-2 text-xs font-bold text-muted-foreground hover:text-foreground lg:hidden"
          >
            <Grid3X3 className="h-4 w-4" />
            Jump grid
          </button>
        </div>
        {showJumpGrid && (
          <div className="border-t border-border bg-card px-4 py-4 lg:hidden">
            <QuestionGrid items={reviewItems} onJump={jumpTo} />
          </div>
        )}
      </div>

      <main className="mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:grid-cols-[minmax(0,1fr)_260px] lg:px-6">
        <div className="space-y-5">
          {filtered.length === 0 && (
            <div className="rounded-2xl border border-border bg-card p-10 text-center text-sm text-muted-foreground">
              No questions match this filter.
            </div>
          )}

          {filtered.map(item => {
            const style = statusStyles(item.status);
            const isCollapsed = collapsed.has(item.id);
            return (
              <article
                id={`review-${item.id}`}
                key={item.id}
                className={`scroll-mt-24 overflow-hidden rounded-2xl border bg-card shadow-sm ${style.card}`}
              >
                <button
                  onClick={() => toggleCollapsed(item.id)}
                  className="flex w-full items-start gap-3 p-4 text-left sm:p-5"
                >
                  <div className="mt-0.5">{style.icon}</div>
                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-black text-muted-foreground">Q{item.num}</span>
                      <span className={`rounded-full border px-2 py-0.5 text-[9px] font-black uppercase tracking-wider ${style.badge}`}>{style.label}</span>
                      <span className={`rounded-full border px-2 py-0.5 text-[9px] font-black uppercase tracking-wider ${item.type === 'pbq' ? 'border-accent/30 bg-accent/10 text-accent' : 'border-primary/30 bg-primary/10 text-primary'}`}>
                        {item.type === 'pbq' ? 'PBQ' : 'MCQ'}
                      </span>
                      {item.flagged && (
                        <span className="flex items-center gap-1 rounded-full border border-warning/30 bg-warning/10 px-2 py-0.5 text-[9px] font-black uppercase text-warning">
                          <Flag className="h-3 w-3 fill-current" /> Flagged
                        </span>
                      )}
                    </div>
                    <h2 className="text-sm font-semibold leading-6 sm:text-base">{item.title}</h2>
                    <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-muted-foreground">
                      <span>{item.domain}</span>
                      <span>•</span>
                      <span>Objective {item.objective || '—'}: {objectiveLabel(item.objective)}</span>
                    </div>
                  </div>
                  {isCollapsed ? <ChevronDown className="mt-1 h-4 w-4 text-muted-foreground" /> : <ChevronUp className="mt-1 h-4 w-4 text-muted-foreground" />}
                </button>

                {!isCollapsed && (
                  <div className="border-t border-border p-4 sm:p-5">
                    {item.type === 'mcq' ? (
                      <MCQReview item={item} />
                    ) : (
                      <PBQReview item={item} answer={pbqAnswers[item.id]} />
                    )}
                  </div>
                )}
              </article>
            );
          })}
        </div>

        <aside className="hidden lg:block">
          <div className="sticky top-20 space-y-4">
            <div className="rounded-2xl border border-border bg-card p-4">
              <div className="mb-3 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground">
                <Grid3X3 className="h-4 w-4" />
                Question jump
              </div>
              <QuestionGrid items={reviewItems} onJump={jumpTo} />
            </div>
            <div className="rounded-2xl border border-border bg-card p-4">
              <div className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground">
                <BookOpenCheck className="h-4 w-4" />
                Review workflow
              </div>
              <p className="text-xs leading-5 text-muted-foreground">
                Start with incorrect and partial-credit items. Retest them in place, then use the objective tag to target the exact SY0-701 topic.
              </p>
            </div>
          </div>
        </aside>
      </main>

      <div className="sticky bottom-0 z-30 border-t border-border bg-card/95 px-4 py-3 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-end gap-2">
          <button onClick={onBackToMenu} className="rounded-lg border border-border px-4 py-2.5 text-xs font-bold hover:bg-muted">
            Back to dashboard
          </button>
          <button onClick={onRestart} className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-xs font-black text-primary-foreground hover:opacity-90">
            <RotateCcw className="h-4 w-4" />
            New exam
          </button>
        </div>
      </div>
    </div>
  );
}

function QuestionGrid({ items, onJump }: { items: ReviewItem[]; onJump: (item: ReviewItem) => void }) {
  return (
    <div className="grid grid-cols-8 gap-1.5 lg:grid-cols-6">
      {items.map(item => {
        const style = statusStyles(item.status);
        return (
          <button
            key={item.id}
            onClick={() => onJump(item)}
            title={`Q${item.num} — ${style.label}${item.flagged ? ' — flagged' : ''}`}
            className={`relative aspect-square rounded-md border text-[10px] font-mono font-black transition-transform hover:scale-105 ${style.badge}`}
          >
            {item.num}
            {item.flagged && <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-warning ring-2 ring-card" />}
          </button>
        );
      })}
    </div>
  );
}

function MCQReview({ item }: { item: Extract<ReviewItem, { type: 'mcq' }> }) {
  const q = item.raw;
  const selected = (index: number) => {
    if (item.userAnswer === undefined) return false;
    return q.type === 'single'
      ? item.userAnswer === index
      : (item.userAnswer as number[]).includes(index);
  };
  const correct = (index: number) =>
    q.type === 'single'
      ? q.answer === index
      : (q.answer as number[]).includes(index);

  return (
    <div className="space-y-5">
      <div className="grid gap-3">
        {q.options.map((option, index) => {
          const isSelected = selected(index);
          const isCorrect = correct(index);
          const rationale = isCorrect
            ? q.explanation
            : q.whyWrong?.[index] || 'This option is a real security concept, but it does not best satisfy the scenario and objective being tested.';
          return (
            <div
              key={index}
              className={`rounded-xl border p-4 ${
                isCorrect
                  ? 'border-success/30 bg-success/5'
                  : isSelected
                    ? 'border-destructive/30 bg-destructive/5'
                    : 'border-border bg-muted/20'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border font-mono text-[10px] font-black ${
                  isCorrect
                    ? 'border-success/40 bg-success/10 text-success'
                    : isSelected
                      ? 'border-destructive/40 bg-destructive/10 text-destructive'
                      : 'border-border text-muted-foreground'
                }`}>
                  {String.fromCharCode(65 + index)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm leading-6">{option}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {isCorrect && <span className="text-[9px] font-black uppercase tracking-wider text-success">Correct option</span>}
                    {isSelected && <span className="text-[9px] font-black uppercase tracking-wider text-primary">Your selection</span>}
                  </div>
                  <p className="mt-2 text-xs leading-5 text-muted-foreground">
                    <strong className={isCorrect ? 'text-success' : 'text-foreground'}>{isCorrect ? 'Why this is right: ' : 'Why this is not the best answer: '}</strong>
                    {rationale}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
        <div className="mb-1 text-[10px] font-black uppercase tracking-[0.15em] text-primary">Exam logic</div>
        <p className="text-xs leading-5 text-muted-foreground">{q.explanation}</p>
      </div>

      <RetestMCQ q={q} />
    </div>
  );
}

function RetestMCQ({ q }: { q: MCQuestion }) {
  const [open, setOpen] = useState(false);
  const [answer, setAnswer] = useState<number | number[] | undefined>();
  const [checked, setChecked] = useState(false);

  const toggle = (index: number) => {
    if (checked) return;
    if (q.type === 'single') {
      setAnswer(index);
      return;
    }
    const current = Array.isArray(answer) ? answer : [];
    if (current.includes(index)) setAnswer(current.filter(i => i !== index));
    else if (current.length < 2) setAnswer([...current, index]);
  };

  const isSelected = (index: number) =>
    q.type === 'single' ? answer === index : Array.isArray(answer) && answer.includes(index);

  const reset = () => {
    setAnswer(undefined);
    setChecked(false);
  };

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs font-bold hover:border-primary/40 hover:bg-primary/5">
        <RotateCcw className="h-3.5 w-3.5" />
        Retest this question
      </button>
    );
  }

  const correct = checked && isMCQCorrect(q, answer);

  return (
    <div className="rounded-xl border border-border bg-background/50 p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <div className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground">Quick retest</div>
          {q.type === 'select-two' && <div className="mt-1 text-[10px] text-accent">Select exactly two.</div>}
        </div>
        <button onClick={() => { setOpen(false); reset(); }} className="text-[10px] font-bold text-muted-foreground hover:text-foreground">Close</button>
      </div>
      <div className="grid gap-2">
        {q.options.map((option, index) => (
          <button
            key={index}
            onClick={() => toggle(index)}
            className={`rounded-lg border px-3 py-2.5 text-left text-xs ${
              isSelected(index) ? 'border-primary bg-primary/10 text-foreground' : 'border-border bg-card text-muted-foreground'
            }`}
          >
            {String.fromCharCode(65 + index)}. {option}
          </button>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-2">
        <button
          onClick={() => setChecked(true)}
          disabled={answer === undefined || (q.type === 'select-two' && (!Array.isArray(answer) || answer.length !== 2))}
          className="rounded-lg bg-primary px-3 py-2 text-xs font-black text-primary-foreground disabled:opacity-40"
        >
          Check answer
        </button>
        {checked && (
          <>
            <span className={`text-xs font-black ${correct ? 'text-success' : 'text-destructive'}`}>{correct ? 'Correct' : 'Not yet'}</span>
            <button onClick={reset} className="text-xs font-bold text-muted-foreground hover:text-foreground">Try again</button>
          </>
        )}
      </div>
    </div>
  );
}

function PBQReview({ item, answer }: { item: Extract<ReviewItem, { type: 'pbq' }>; answer: any }) {
  const q = item.raw;
  const model = pbqModelAnswer(q);
  const percent = Math.round(item.credit.ratio * 100);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-lg border border-border bg-muted/30 px-3 py-2 text-xs font-bold">
          Practice credit: {item.credit.earned}/{item.credit.total} subtasks ({percent}%)
        </span>
        <span className="text-[10px] text-muted-foreground">Training estimate only; CompTIA does not publish PBQ subtask weights.</span>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <div className="rounded-xl border border-border bg-background/40 p-3">
          <div className="mb-3 text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground">Your attempt</div>
          <PBQRenderer q={q} ans={answer} onAns={() => {}} submitted studyRevealed={false} compact />
        </div>
        <div className="rounded-xl border border-success/25 bg-success/5 p-3">
          <div className="mb-3 text-[10px] font-black uppercase tracking-[0.15em] text-success">Model solution</div>
          <PBQRenderer q={q} ans={model} onAns={() => {}} submitted studyRevealed={false} compact />
        </div>
      </div>

      <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
        <div className="mb-1 text-[10px] font-black uppercase tracking-[0.15em] text-primary">Why this solution works</div>
        <p className="text-xs leading-5 text-muted-foreground">{q.explanation}</p>
      </div>

      <RetestPBQ q={q} />
    </div>
  );
}

function RetestPBQ({ q }: { q: PBQuestion }) {
  const [open, setOpen] = useState(false);
  const [answer, setAnswer] = useState<any>(undefined);
  const [checked, setChecked] = useState(false);

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs font-bold hover:border-accent/40 hover:bg-accent/5">
        <Layers3 className="h-3.5 w-3.5" />
        Retest this PBQ
      </button>
    );
  }

  const credit = checked ? getPBQCredit(q, answer) : null;

  return (
    <div className="rounded-xl border border-accent/25 bg-accent/5 p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="text-[10px] font-black uppercase tracking-[0.15em] text-accent">PBQ retest</div>
        <button onClick={() => { setOpen(false); setAnswer(undefined); setChecked(false); }} className="text-[10px] font-bold text-muted-foreground hover:text-foreground">Close</button>
      </div>
      <PBQRenderer q={q} ans={answer} onAns={setAnswer} submitted={checked} studyRevealed={false} compact />
      <div className="mt-4 flex items-center gap-3">
        {!checked ? (
          <button onClick={() => setChecked(true)} className="rounded-lg bg-accent px-3 py-2 text-xs font-black text-accent-foreground">
            Check PBQ
          </button>
        ) : (
          <>
            <span className={`text-xs font-black ${credit?.ratio === 1 ? 'text-success' : credit && credit.ratio > 0 ? 'text-warning' : 'text-destructive'}`}>
              {credit ? `${credit.earned}/${credit.total} subtasks correct` : 'No credit yet'}
            </span>
            <button onClick={() => { setAnswer(undefined); setChecked(false); }} className="text-xs font-bold text-muted-foreground hover:text-foreground">Try again</button>
          </>
        )}
      </div>
    </div>
  );
}
