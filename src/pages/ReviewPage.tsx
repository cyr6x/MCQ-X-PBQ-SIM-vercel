import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, BookOpenCheck, ChevronDown, ChevronLeft, RotateCcw, Target } from 'lucide-react';
import { NewExamEngine } from '@/components/NewExamEngine';
import {
  mcqSingle,
  mcqSelectTwo,
  pbqBank,
  shuffleOptions,
  type MCQuestion,
  type PBQuestion,
} from '@/data/questions';
import { getMissedQuestions, type QuestionStats } from '@/lib/examHistory';

type ReviewFilter = 'needs' | 'all' | 'mcq' | 'pbq';

type RetestSet = {
  mcqs: MCQuestion[];
  pbqs: PBQuestion[];
};

const mcqById = new Map([...mcqSingle, ...mcqSelectTwo].map(question => [question.id, question]));
const pbqById = new Map(pbqBank.map(question => [question.id, question]));

function buildRetest(stats: QuestionStats[]): RetestSet {
  const mcqs = stats
    .filter(item => item.type === 'mcq')
    .map(item => mcqById.get(item.questionId))
    .filter((question): question is MCQuestion => Boolean(question))
    .map(shuffleOptions);

  const pbqs = stats
    .filter(item => item.type === 'pbq')
    .map(item => pbqById.get(item.questionId))
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
      .filter(index => typeof index === 'number' && question.options[index] !== undefined)
      .map(index => `${String.fromCharCode(65 + index)}. ${question.options[index]}`);
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
  const navigate = useNavigate();
  const [filter, setFilter] = useState<ReviewFilter>('needs');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [retest, setRetest] = useState<RetestSet | null>(null);

  const missed = useMemo(() => getMissedQuestions(), []);
  const needsReview = useMemo(() => missed.filter(item => item.streak < 0), [missed]);

  const visible = useMemo(() => {
    if (filter === 'needs') return needsReview;
    if (filter === 'mcq') return missed.filter(item => item.type === 'mcq');
    if (filter === 'pbq') return missed.filter(item => item.type === 'pbq');
    return missed;
  }, [filter, missed, needsReview]);

  if (retest) {
    return (
      <div className="min-h-screen bg-background text-foreground">
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
    setExpanded(previous => {
      const next = new Set(previous);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-6xl px-4 py-7 sm:px-8">
        <button
          onClick={() => navigate('/')}
          className="mb-5 inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-white"
        >
          <ChevronLeft className="h-4 w-4" />
          Dashboard
        </button>

        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.15em] text-primary">
              <BookOpenCheck className="h-4 w-4" />
              Missed-question review
            </div>
            <h1 className="text-2xl font-semibold">Review failed questions</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Questions you miss are retained here after the exam. “Needs Review” means your most recent streak on that item is still negative; “Ever Missed” keeps the full history.
            </p>
          </div>

          <button
            onClick={() => retry(needsReview.length ? needsReview : missed)}
            disabled={missed.length === 0}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-600 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <RotateCcw className="h-4 w-4" />
            Retry {needsReview.length ? 'Needs Review' : 'Missed Questions'}
          </button>
        </div>

        <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Metric label="Needs Review" value={needsReview.length} />
          <Metric label="Ever Missed" value={missed.length} />
          <Metric label="MCQs Missed" value={missed.filter(item => item.type === 'mcq').length} />
          <Metric label="PBQs Missed" value={missed.filter(item => item.type === 'pbq').length} />
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          {([
            ['needs', `Needs Review (${needsReview.length})`],
            ['all', `Ever Missed (${missed.length})`],
            ['mcq', 'MCQs'],
            ['pbq', 'PBQs'],
          ] as const).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`rounded-md border px-3 py-2 text-xs font-semibold ${
                filter === key
                  ? 'border-primary bg-primary/15 text-primary'
                  : 'border-slate-700 bg-card text-muted-foreground hover:border-slate-500 hover:text-white'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {visible.length === 0 ? (
          <div className="rounded-lg border border-border bg-card p-10 text-center">
            <Target className="mx-auto mb-3 h-8 w-8 text-success" />
            <h2 className="font-semibold">No failed questions in this view.</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Complete an exam or switch to “Ever Missed” to see older mistakes.
            </p>
          </div>
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
                <article key={stat.questionId} className="overflow-hidden rounded-lg border border-border bg-card">
                  <button
                    onClick={() => toggle(stat.questionId)}
                    className="flex w-full items-center gap-3 px-4 py-4 text-left hover:bg-muted/50"
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted font-mono text-xs font-bold text-foreground/80">
                      {index + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase ${
                          stat.type === 'pbq'
                            ? 'bg-warning/15 text-warning'
                            : 'bg-primary/15 text-primary'
                        }`}>
                          {stat.type}
                        </span>
                        <span className="text-[11px] text-muted-foreground">{stat.domain}</span>
                        {stat.streak < 0 && (
                          <span className="rounded bg-destructive/15 px-2 py-0.5 text-[10px] font-bold text-destructive">
                            Needs Review
                          </span>
                        )}
                      </div>
                      <div className="mt-1 truncate text-sm font-medium">
                        {actualQuestion || stat.questionText}
                      </div>
                    </div>
                    <div className="hidden text-right text-xs text-muted-foreground sm:block">
                      <div>{stat.timesFailed}/{stat.timesAttempted} failed</div>
                      <div>{failRate}% miss rate</div>
                    </div>
                    <ChevronDown className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isOpen && (
                    <div className="border-t border-border px-4 py-4">
                      <div className="grid gap-4 lg:grid-cols-[1fr_260px]">
                        <div className="space-y-4">
                          <section>
                            <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Question</div>
                            <p className="text-sm leading-6 text-foreground">{actualQuestion || stat.questionText}</p>
                          </section>

                          <section>
                            <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-destructive">Your latest answer</div>
                            <p className="text-sm leading-6 text-foreground/80">{formatLatestAnswer(stat)}</p>
                          </section>

                          <section>
                            <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-success">Why</div>
                            <p className="text-sm leading-6 text-foreground/80">{stat.explanation || 'Explanation available after the next retest.'}</p>
                          </section>
                        </div>

                        <aside className="rounded-md border border-border bg-background p-4">
                          <div className="space-y-2 text-xs">
                            <div className="flex justify-between"><span className="text-muted-foreground">Attempts</span><strong>{stat.timesAttempted}</strong></div>
                            <div className="flex justify-between"><span className="text-muted-foreground">Failed</span><strong className="text-destructive">{stat.timesFailed}</strong></div>
                            <div className="flex justify-between"><span className="text-muted-foreground">Correct</span><strong className="text-success">{stat.timesCorrect}</strong></div>
                            <div className="flex justify-between"><span className="text-muted-foreground">Avg. time</span><strong>{Math.round(stat.avgTimeSeconds)}s</strong></div>
                          </div>
                          <button
                            onClick={() => retry([stat])}
                            className="mt-4 flex w-full items-center justify-center gap-2 rounded-md border border-primary bg-primary/10 px-3 py-2 text-xs font-semibold text-primary hover:bg-primary/20"
                          >
                            <RotateCcw className="h-3.5 w-3.5" />
                            Retry this question
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

        {missed.length > 0 && (
          <div className="mt-5 flex items-start gap-2 rounded-md border border-border bg-card px-4 py-3 text-xs leading-5 text-muted-foreground">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
            The review bank is for remediation, not exam simulation. Domain labels and explanations are intentionally shown here but remain hidden during strict exam mode.
          </div>
        )}
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-border bg-card px-4 py-3">
      <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 font-mono text-2xl font-semibold">{value}</div>
    </div>
  );
}
