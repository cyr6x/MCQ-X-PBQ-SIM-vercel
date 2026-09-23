import { useMemo, useState } from 'react';
import { AlertTriangle, BookOpenCheck, ChevronDown, RotateCcw, Target } from 'lucide-react';
import { NewExamEngine } from '@/components/NewExamEngine';
import {
  mcqSingle,
  mcqSelectTwo,
  pbqBank,
  shuffleOptions,
  type MCQuestion,
  type PBQuestion,
} from '@/data/questions';
import type { QuestionStats } from '@/lib/examHistory';
import { useSettings } from '@/lib/SettingsContext';
import { useProgressSnapshot } from '@/hooks/useProgressSnapshot';
import { MetricCard, PageHeader, Panel, StatusChip } from '@/components/product/ProductUI';

type ReviewFilter = 'needs' | 'all' | 'mcq' | 'pbq';

type RetestSet = {
  mcqs: MCQuestion[];
  pbqs: PBQuestion[];
};

const mcqById = new Map([...mcqSingle, ...mcqSelectTwo].map((question) => [question.id, question]));
const pbqById = new Map(pbqBank.map((question) => [question.id, question]));

function buildRetest(stats: QuestionStats[]): RetestSet {
  const mcqs = stats
    .filter((item) => item.type === 'mcq')
    .map((item) => mcqById.get(item.questionId))
    .filter((question): question is MCQuestion => Boolean(question))
    .map(shuffleOptions);

  const pbqs = stats
    .filter((item) => item.type === 'pbq')
    .map((item) => pbqById.get(item.questionId))
    .filter((question): question is PBQuestion => Boolean(question));

  return { mcqs, pbqs };
}

function formatLatestAnswer(stat: QuestionStats): string {
  if (stat.type === 'pbq') return 'Interactive PBQ response saved — retry the item to work it again.';

  const question = mcqById.get(stat.questionId);
  if (!question) return stat.userAnswer || 'No answer saved';

  try {
    const parsed = JSON.parse(stat.userAnswer);
    const indices = Array.isArray(parsed) ? parsed : [parsed];
    const labels = indices
      .filter((index) => typeof index === 'number' && question.options[index] !== undefined)
      .map((index) => `${String.fromCharCode(65 + index)}. ${question.options[index]}`);
    if (labels.length) return labels.join(' · ');
  } catch {
    const numeric = Number(stat.userAnswer);
    if (Number.isInteger(numeric) && question.options[numeric] !== undefined) {
      return `${String.fromCharCode(65 + numeric)}. ${question.options[numeric]}`;
    }
  }

  return stat.userAnswer || 'No answer saved';
}

export default function ReviewPage() {
  const { settings } = useSettings();
  const progress = useProgressSnapshot(settings);
  const [filter, setFilter] = useState<ReviewFilter>('needs');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [retest, setRetest] = useState<RetestSet | null>(null);

  const missed = useMemo(
    () => Object.values(progress.stats)
      .filter((item) => item.timesFailed > 0)
      .sort((a, b) => b.lastAttempt - a.lastAttempt),
    [progress.stats],
  );
  const needsReview = progress.unresolved;

  const visible = useMemo(() => {
    if (filter === 'needs') return needsReview;
    if (filter === 'mcq') return missed.filter((item) => item.type === 'mcq');
    if (filter === 'pbq') return missed.filter((item) => item.type === 'pbq');
    return missed;
  }, [filter, missed, needsReview]);

  if (retest) {
    return (
      <div className="fixed inset-0 z-[80] overflow-auto bg-background">
        <NewExamEngine
          pbqs={retest.pbqs}
          mcqs={retest.mcqs}
          durationMinutes={0}
          isStudyMode
          onFinish={() => setRetest(null)}
        />
      </div>
    );
  }

  const retry = (stats: QuestionStats[]) => {
    const next = buildRetest(stats);
    if (next.mcqs.length || next.pbqs.length) setRetest(next);
  };

  const toggle = (id: string) => {
    setExpanded((previous) => {
      const next = new Set(previous);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <PageHeader
        eyebrow="Remediation queue"
        title="Turn misses into closed loops."
        description="Needs Review shows items whose latest streak is still negative. Ever Missed keeps the historical archive so recurring patterns remain visible."
        icon={<BookOpenCheck className="h-4 w-4" />}
        actions={
          <button
            onClick={() => retry(needsReview.length ? needsReview : missed)}
            disabled={missed.length === 0}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <RotateCcw className="h-4 w-4" />
            Retry {needsReview.length ? 'needs review' : 'missed items'}
          </button>
        }
      />

      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricCard label="Needs review" value={needsReview.length} note="Latest streak negative" tone={needsReview.length ? 'warning' : 'success'} />
        <MetricCard label="Ever missed" value={missed.length} note="Historical archive" />
        <MetricCard label="MCQs missed" value={missed.filter((item) => item.type === 'mcq').length} note="Knowledge / judgment" />
        <MetricCard label="PBQs missed" value={missed.filter((item) => item.type === 'pbq').length} note="Applied tasks" tone="primary" />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {([
          ['needs', `Needs Review (${needsReview.length})`],
          ['all', `Ever Missed (${missed.length})`],
          ['mcq', 'MCQs'],
          ['pbq', 'PBQs'],
        ] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`rounded-lg border px-3 py-2 text-xs font-semibold transition-colors ${
              filter === key
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border bg-card text-muted-foreground hover:border-primary/30 hover:text-foreground'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mt-4">
        {visible.length === 0 ? (
          <Panel className="py-12">
            <div className="flex flex-col items-center justify-center text-center">
              <Target className="mb-3 h-8 w-8 text-success" />
              <h2 className="font-semibold">Nothing to repair in this view.</h2>
              <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
                Complete another training session, or switch to Ever Missed to inspect older patterns.
              </p>
            </div>
          </Panel>
        ) : (
          <div className="space-y-3">
            {visible.map((stat, index) => {
              const isOpen = expanded.has(stat.questionId);
              const failRate = stat.timesAttempted
                ? Math.round((stat.timesFailed / stat.timesAttempted) * 100)
                : 0;
              const actualQuestion =
                stat.type === 'mcq'
                  ? mcqById.get(stat.questionId)?.question
                  : pbqById.get(stat.questionId)?.scenario;

              return (
                <article key={stat.questionId} className="overflow-hidden rounded-2xl border border-border/80 bg-card/90 shadow-sm">
                  <button
                    onClick={() => toggle(stat.questionId)}
                    className="flex w-full items-center gap-3 px-4 py-4 text-left hover:bg-muted/25 sm:px-5"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border bg-muted/40 font-mono text-xs font-semibold">
                      {index + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusChip tone={stat.type === 'pbq' ? 'primary' : 'muted'}>{stat.type.toUpperCase()}</StatusChip>
                        <span className="text-[10px] text-muted-foreground">{stat.domain}</span>
                        {stat.streak < 0 && <StatusChip tone="danger">Needs review</StatusChip>}
                      </div>
                      <div className="mt-2 line-clamp-2 text-sm font-medium leading-5">
                        {actualQuestion || stat.questionText}
                      </div>
                    </div>
                    <div className="hidden shrink-0 text-right text-[10px] text-muted-foreground sm:block">
                      <div>{stat.timesFailed}/{stat.timesAttempted} failed</div>
                      <div className="mt-0.5 font-mono">{failRate}% miss rate</div>
                    </div>
                    <ChevronDown className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isOpen && (
                    <div className="border-t border-border px-4 py-4 sm:px-5">
                      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px]">
                        <div className="space-y-4">
                          <section>
                            <div className="mb-1 text-[9px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Question</div>
                            <p className="text-sm leading-6">{actualQuestion || stat.questionText}</p>
                          </section>
                          <section>
                            <div className="mb-1 text-[9px] font-bold uppercase tracking-[0.16em] text-destructive">Latest answer</div>
                            <p className="text-sm leading-6 text-foreground/80">{formatLatestAnswer(stat)}</p>
                          </section>
                          <section>
                            <div className="mb-1 text-[9px] font-bold uppercase tracking-[0.16em] text-success">Why</div>
                            <p className="text-sm leading-6 text-foreground/80">{stat.explanation || 'Explanation will be captured on the next retest.'}</p>
                          </section>
                        </div>

                        <aside className="rounded-xl border border-border bg-background/50 p-4">
                          <div className="space-y-2 text-xs">
                            <Row label="Attempts" value={String(stat.timesAttempted)} />
                            <Row label="Failed" value={String(stat.timesFailed)} valueClass="text-destructive" />
                            <Row label="Correct" value={String(stat.timesCorrect)} valueClass="text-success" />
                            <Row label="Avg. time" value={`${Math.round(stat.avgTimeSeconds)}s`} />
                          </div>
                          <button
                            onClick={() => retry([stat])}
                            className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-primary/40 bg-primary/10 px-3 py-2.5 text-xs font-semibold text-primary hover:bg-primary/20"
                          >
                            <RotateCcw className="h-3.5 w-3.5" />
                            Retest this item
                          </button>
                        </aside>
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </div>

      {missed.length > 0 && (
        <div className="mt-4 flex items-start gap-2 rounded-xl border border-border bg-card/70 px-4 py-3 text-xs leading-5 text-muted-foreground">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
          <span>Review is deliberately transparent: explanations and domain context are visible here, while full Exam Simulation keeps them hidden until submission.</span>
        </div>
      )}
    </div>
  );
}

function Row({ label, value, valueClass = '' }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <strong className={valueClass}>{value}</strong>
    </div>
  );
}
