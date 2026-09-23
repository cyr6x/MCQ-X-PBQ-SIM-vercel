import { useMemo, useRef, useState } from 'react';
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Filter,
  Layers3,
  ListChecks,
  LogOut,
  RotateCcw,
  Target,
  Trophy,
  XCircle,
} from 'lucide-react';
import { pbqBank, DOMAIN_LABELS, type PBQuestion, type Domain } from '@/data/questions';
import { getPBQCredit, isPBQCorrect } from '@/lib/examEngine';
import { saveAttempt, type QuestionAttempt } from '@/lib/examHistory';
import { useSettings } from '@/lib/SettingsContext';
import { PBQRenderer } from '@/components/PBQRenderer';
import { MetricCard, PageHeader, Panel, StatusChip } from '@/components/product/ProductUI';

type PBQType = PBQuestion['type'];

const TYPE_LABELS: Record<PBQType, string> = {
  firewall: 'Firewall / ACL',
  ordering: 'Ordering / IR Steps',
  'log-analysis': 'Log Analysis',
  matching: 'Matching / Drag-Drop',
  placement: 'Network Placement',
  terminal: 'Terminal / CLI',
  'packet-analysis': 'Packet Analysis',
  topology: 'Network Topology',
};

const TYPE_DESCRIPTIONS: Record<PBQType, string> = {
  firewall: 'Apply traffic policy and reason through ALLOW/DENY decisions.',
  ordering: 'Sequence incident response, change or security workflow steps.',
  'log-analysis': 'Interpret event evidence, identify activity and choose the response.',
  matching: 'Map security concepts, technologies and controls to the right category.',
  placement: 'Place security components into appropriate network zones.',
  terminal: 'Interpret command-line evidence and choose safe investigation or containment actions.',
  'packet-analysis': 'Inspect packet rows, identify suspicious traffic and select a response.',
  topology: 'Build segmented architectures while preserving required flows.',
};

interface Props {
  onFinish: () => void;
}

function hasAttempt(answer: unknown): boolean {
  if (answer === undefined || answer === null) return false;
  if (Array.isArray(answer)) return answer.some((value) => value !== undefined && value !== '');
  if (typeof answer === 'object') return Object.keys(answer as Record<string, unknown>).length > 0;
  return true;
}

export function PBQPractice({ onFinish }: Props) {
  const { settings } = useSettings();
  const [view, setView] = useState<'menu' | 'practice' | 'summary'>('menu');
  const [filterType, setFilterType] = useState<PBQType | 'all'>('all');
  const [filterDomain, setFilterDomain] = useState<Domain | 'all'>('all');
  const [questions, setQuestions] = useState<PBQuestion[]>([]);
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [revealed, setRevealed] = useState<Set<string>>(new Set());
  const questionTimesRef = useRef<Record<string, number>>({});
  const questionStartedAtRef = useRef(Date.now());
  const sessionStartedAtRef = useRef(Date.now());

  const pool = useMemo(
    () => pbqBank.filter((question) =>
      (filterType === 'all' || question.type === filterType) &&
      (filterDomain === 'all' || question.domain === filterDomain)
    ),
    [filterType, filterDomain],
  );

  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = { all: pbqBank.length };
    pbqBank.forEach((question) => {
      counts[question.type] = (counts[question.type] || 0) + 1;
    });
    return counts;
  }, []);

  const selectedCount = Math.min(pool.length, settings.pbq_set_size);

  const resetTiming = () => {
    questionTimesRef.current = {};
    questionStartedAtRef.current = Date.now();
    sessionStartedAtRef.current = Date.now();
  };

  const recordCurrentTime = () => {
    const question = questions[idx];
    if (!question) return;
    const elapsed = Math.max(0, Math.round((Date.now() - questionStartedAtRef.current) / 1000));
    questionTimesRef.current[question.id] = (questionTimesRef.current[question.id] || 0) + elapsed;
    questionStartedAtRef.current = Date.now();
  };

  const startPractice = () => {
    if (!pool.length) return;
    setQuestions([...pool].sort(() => Math.random() - 0.5).slice(0, settings.pbq_set_size));
    setIdx(0);
    setAnswers({});
    setRevealed(new Set());
    resetTiming();
    setView('practice');
  };

  const goTo = (nextIndex: number) => {
    if (nextIndex < 0 || nextIndex >= questions.length) return;
    recordCurrentTime();
    setIdx(nextIndex);
  };

  const finishPractice = () => {
    if (!questions.length) return;
    recordCurrentTime();
    const endedAt = Date.now();
    const credits = questions.map((question) => getPBQCredit(question, answers[question.id]).ratio);
    const practicePoints = credits.reduce((sum, value) => sum + value, 0);
    const domainScores: Record<string, { correct: number; total: number }> = {};

    const attempts: QuestionAttempt[] = questions.map((question, index) => {
      const domain = DOMAIN_LABELS[question.domain];
      if (!domainScores[domain]) domainScores[domain] = { correct: 0, total: 0 };
      domainScores[domain].correct += credits[index];
      domainScores[domain].total += 1;

      return {
        questionId: question.id,
        questionText: question.title,
        domain,
        type: 'pbq' as const,
        isCorrect: isPBQCorrect(question, answers[question.id]),
        userAnswer: JSON.stringify(answers[question.id] ?? {}),
        correctAnswer: '',
        explanation: question.explanation,
        timeSpentSeconds: questionTimesRef.current[question.id] || 0,
        timestamp: endedAt,
      };
    });

    saveAttempt({
      id: `pbq-lab-${endedAt}`,
      mode: 'practice',
      startTime: sessionStartedAtRef.current,
      endTime: endedAt,
      totalQuestions: questions.length,
      correctAnswers: practicePoints,
      percentage: Math.round((practicePoints / questions.length) * 100),
      passed: practicePoints / questions.length >= 0.75,
      questions: attempts,
      domainScores,
    });
    setView('summary');
  };

  if (view === 'menu') {
    return (
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <PageHeader
          eyebrow="Applied security tasks"
          title="PBQ Lab"
          description="Build fluency with eight original simulator interaction families. Filter the task mix, work untimed, reveal model feedback when needed, then let the results feed the same remediation and analytics loop."
          icon={<Layers3 className="h-4 w-4" />}
          actions={<StatusChip tone="primary">{pbqBank.length} PBQs in bank</StatusChip>}
        />

        <div className="mt-6 grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
          <Panel
            title="Task family"
            eyebrow="Filter"
            description="Choose one interaction family or keep the full mix."
          >
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              <FilterCard
                active={filterType === 'all'}
                title="All task families"
                count={typeCounts.all}
                description="Random mix across every current PBQ interaction."
                onClick={() => setFilterType('all')}
              />
              {(Object.keys(TYPE_LABELS) as PBQType[]).map((type) => (
                <FilterCard
                  key={type}
                  active={filterType === type}
                  title={TYPE_LABELS[type]}
                  count={typeCounts[type] || 0}
                  description={TYPE_DESCRIPTIONS[type]}
                  onClick={() => setFilterType(type)}
                />
              ))}
            </div>
          </Panel>

          <div className="space-y-4">
            <Panel title="Domain focus" eyebrow="Scope">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <select
                  value={filterDomain}
                  onChange={(event) => setFilterDomain(event.target.value as Domain | 'all')}
                  className="min-w-0 flex-1 rounded-lg border border-border bg-muted/60 px-3 py-2.5 text-sm"
                >
                  <option value="all">All domains</option>
                  {(Object.entries(DOMAIN_LABELS) as [Domain, string][]).map(([domain, label]) => (
                    <option key={domain} value={domain}>{domain} · {label}</option>
                  ))}
                </select>
              </div>
            </Panel>

            <Panel title="Next PBQ set" eyebrow="Launch">
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-xl bg-muted/25 p-3">
                  <div className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Set size</div>
                  <div className="mt-1 font-mono text-2xl font-semibold">{selectedCount}</div>
                </div>
                <div className="rounded-xl bg-muted/25 p-3">
                  <div className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Available</div>
                  <div className="mt-1 font-mono text-2xl font-semibold">{pool.length}</div>
                </div>
              </div>
              <p className="mt-3 text-[11px] leading-5 text-muted-foreground">
                Untimed · explanations on demand · partial-credit feedback · real per-task timing captured for analytics.
              </p>
              <button
                onClick={startPractice}
                disabled={!pool.length}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Begin PBQ set
                <ChevronRight className="h-4 w-4" />
              </button>
            </Panel>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'summary') {
    const results = questions.map((question) => ({
      question,
      credit: getPBQCredit(question, answers[question.id]),
      correct: isPBQCorrect(question, answers[question.id]),
    }));
    const fullCredit = results.filter((result) => result.correct).length;
    const partial = results.filter((result) => result.credit.ratio > 0 && result.credit.ratio < 1).length;
    const earned = results.reduce((sum, result) => sum + result.credit.ratio, 0);
    const pct = Math.round((earned / Math.max(1, results.length)) * 100);

    return (
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <PageHeader
          eyebrow="PBQ set complete"
          title="Applied-task review"
          description="Use the breakdown to identify which interaction families need another repetition. Partial credit is an equal-weight training estimate, not CompTIA’s proprietary PBQ scoring."
          icon={<Trophy className="h-4 w-4" />}
          actions={<StatusChip tone={pct >= 75 ? 'success' : 'warning'}>{pct}% practice credit</StatusChip>}
        />

        <div className="mt-6 grid grid-cols-3 gap-3">
          <MetricCard label="Practice credit" value={`${pct}%`} tone={pct >= 75 ? 'success' : 'warning'} />
          <MetricCard label="Full credit" value={fullCredit} note={`of ${results.length}`} tone="success" />
          <MetricCard label="Partial" value={partial} note="some subtasks right" tone={partial ? 'warning' : 'default'} />
        </div>

        <Panel className="mt-4" title="Set breakdown" eyebrow="Items">
          <div className="space-y-2">
            {results.map((result, index) => {
              const percent = Math.round(result.credit.ratio * 100);
              return (
                <div
                  key={result.question.id}
                  className="flex items-center gap-3 rounded-xl border border-border bg-muted/20 px-3 py-3"
                >
                  {result.correct
                    ? <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />
                    : result.credit.ratio > 0
                      ? <Target className="h-4 w-4 shrink-0 text-warning" />
                      : <XCircle className="h-4 w-4 shrink-0 text-destructive" />}
                  <span className="font-mono text-[10px] text-muted-foreground">#{index + 1}</span>
                  <StatusChip tone="primary">{TYPE_LABELS[result.question.type]}</StatusChip>
                  <span className="min-w-0 flex-1 truncate text-sm">{result.question.title}</span>
                  <span className="font-mono text-xs font-semibold">{percent}%</span>
                </div>
              );
            })}
          </div>
        </Panel>

        <div className="mt-4 flex flex-wrap justify-end gap-2">
          <button
            onClick={() => {
              setQuestions([...questions].sort(() => Math.random() - 0.5));
              setIdx(0);
              setAnswers({});
              setRevealed(new Set());
              resetTiming();
              setView('practice');
            }}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-xs font-semibold hover:bg-muted"
          >
            <RotateCcw className="h-4 w-4" />
            Retry set
          </button>
          <button onClick={() => setView('menu')} className="rounded-lg border border-border bg-card px-4 py-2.5 text-xs font-semibold hover:bg-muted">
            New set
          </button>
          <button onClick={onFinish} className="rounded-lg bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground hover:opacity-90">
            Command Center
          </button>
        </div>
      </div>
    );
  }

  const current = questions[idx];
  if (!current) return null;
  const isRevealed = revealed.has(current.id);
  const correct = isPBQCorrect(current, answers[current.id]);
  const attempted = questions.filter((question) => hasAttempt(answers[question.id])).length;

  return (
    <div className="fixed inset-0 z-[80] flex min-h-screen flex-col overflow-hidden bg-background text-foreground">
      <header className="z-40 flex min-h-14 items-center justify-between gap-3 border-b border-border bg-card/95 px-4 backdrop-blur-xl sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <div>
            <div className="text-[9px] font-bold uppercase tracking-[0.16em] text-muted-foreground">PBQ Lab</div>
            <div className="font-mono text-sm font-semibold">{idx + 1} / {questions.length}</div>
          </div>
          <div className="hidden h-7 w-px bg-border sm:block" />
          <StatusChip tone="primary">{TYPE_LABELS[current.type]}</StatusChip>
          <span className="hidden truncate text-[10px] text-muted-foreground md:inline">{DOMAIN_LABELS[current.domain]}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setRevealed((previous) => {
              const next = new Set(previous);
              if (next.has(current.id)) next.delete(current.id);
              else next.add(current.id);
              return next;
            })}
            className={`flex h-9 items-center gap-2 rounded-lg border px-3 text-xs font-semibold ${
              isRevealed
                ? 'border-accent bg-accent text-accent-foreground'
                : 'border-border bg-card text-muted-foreground hover:text-foreground'
            }`}
          >
            {isRevealed ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            <span className="hidden sm:inline">{isRevealed ? 'Hide feedback' : 'Reveal feedback'}</span>
          </button>
          <button
            onClick={() => {
              if (confirm('Exit PBQ practice? This unfinished set will not be saved.')) onFinish();
            }}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground hover:border-destructive/40 hover:text-destructive"
            aria-label="Exit PBQ practice"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </header>

      <main className="min-h-0 flex-1 overflow-auto">
        <div className="mx-auto max-w-5xl p-4 sm:p-6">
          <div className="min-h-[520px] rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-8">
            <PBQRenderer
              q={current}
              ans={answers[current.id]}
              onAns={(answer) => setAnswers((previous) => ({ ...previous, [current.id]: answer }))}
              submitted={false}
              studyRevealed={isRevealed}
            />
            {isRevealed && (
              <div className={`mt-5 rounded-xl border px-4 py-3 text-center text-xs font-semibold ${
                correct
                  ? 'border-success/30 bg-success/10 text-success'
                  : 'border-warning/30 bg-warning/10 text-warning'
              }`}>
                {correct ? 'All subtasks correct.' : 'Review the highlighted model feedback, then work the task again.'}
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="z-40 flex items-center justify-between gap-3 border-t border-border bg-card/95 px-4 py-3 backdrop-blur-xl sm:px-6">
        <button
          onClick={() => goTo(idx - 1)}
          disabled={idx === 0}
          className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-xs font-semibold hover:bg-muted disabled:opacity-30"
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Previous</span>
        </button>

        <div className="hidden items-center gap-2 text-[10px] text-muted-foreground sm:flex">
          <ListChecks className="h-4 w-4" />
          <span className="font-mono">{attempted} / {questions.length} attempted</span>
        </div>

        {idx < questions.length - 1 ? (
          <button
            onClick={() => goTo(idx + 1)}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-xs font-semibold text-primary-foreground hover:opacity-90"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </button>
        ) : (
          <button
            onClick={finishPractice}
            className="rounded-lg bg-primary px-5 py-2.5 text-xs font-semibold text-primary-foreground hover:opacity-90"
          >
            Finish set
          </button>
        )}
      </footer>
    </div>
  );
}

function FilterCard({
  active,
  title,
  count,
  description,
  onClick,
}: {
  active: boolean;
  title: string;
  count: number;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`min-h-32 rounded-xl border p-3 text-left transition-colors ${
        active
          ? 'border-primary bg-primary/10'
          : 'border-border bg-muted/20 hover:border-primary/40 hover:bg-muted/25'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-xs font-semibold">{title}</span>
        <span className="font-mono text-[10px] text-muted-foreground">{count}</span>
      </div>
      <p className="mt-2 text-[10px] leading-4 text-muted-foreground">{description}</p>
    </button>
  );
}
