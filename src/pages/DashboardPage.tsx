import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Cloud,
  Gauge,
  History,
  Layers3,
  RotateCcw,
  ShieldCheck,
  Target,
  Zap,
} from 'lucide-react';
import { fetchAttempts } from '@/lib/cloudSync';
import { DOMAIN_LABELS, DOMAIN_WEIGHTS, type Domain } from '@/data/questions';
import { useSettings } from '@/lib/SettingsContext';
import { useProgressSnapshot } from '@/hooks/useProgressSnapshot';
import { MetricCard, PageHeader, Panel, ProgressMeter, StatusChip } from '@/components/product/ProductUI';

type Recommendation = {
  title: string;
  description: string;
  action: string;
  route: string;
  tone: 'primary' | 'warning' | 'success';
};

export default function DashboardPage() {
  const navigate = useNavigate();
  const { settings } = useSettings();
  const progress = useProgressSnapshot(settings);
  const [cloudState, setCloudState] = useState<'checking' | 'available' | 'offline'>('checking');
  const [cloudCount, setCloudCount] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    fetchAttempts()
      .then((rows) => {
        if (!active) return;
        setCloudCount(rows.length);
        setCloudState('available');
      })
      .catch(() => active && setCloudState('offline'));
    return () => { active = false; };
  }, [progress.history.length]);

  const domainPerformance = useMemo(() => {
    const values = Object.values(progress.stats);
    return (Object.keys(DOMAIN_LABELS) as Domain[]).map((domain) => {
      const matching = values.filter(
        (item) => item.domain === domain || item.domain === DOMAIN_LABELS[domain],
      );
      const attempts = matching.reduce((sum, item) => sum + item.timesAttempted, 0);
      const correct = matching.reduce((sum, item) => sum + item.timesCorrect, 0);
      return {
        domain,
        label: DOMAIN_LABELS[domain],
        weight: Math.round(DOMAIN_WEIGHTS[domain] * 100),
        attempts,
        accuracy: attempts ? Math.round((correct / attempts) * 100) : null,
      };
    });
  }, [progress.stats]);

  const recommendation = useMemo<Recommendation>(() => {
    if (progress.totalAnswered === 0) {
      return {
        title: 'Build your baseline',
        description: 'Start with a short tutor session so the trainer can identify weak domains before you burn a full form.',
        action: 'Start tutor session',
        route: '/study?mode=tutor',
        tone: 'primary',
      };
    }
    if (progress.unresolved.length >= 5) {
      return {
        title: 'Close your unresolved misses',
        description: `${progress.unresolved.length} items are still on a negative streak. Clear those patterns before another full exam.`,
        action: 'Open remediation queue',
        route: '/review',
        tone: 'warning',
      };
    }
    if (progress.pbqReps < 8) {
      return {
        title: 'Build PBQ fluency',
        description: 'Your MCQ work is ahead of applied-task repetition. Drill PBQs before the next full simulation.',
        action: 'Open PBQ Lab',
        route: '/pbq',
        tone: 'primary',
      };
    }
    if (progress.fullExamHistory.length === 0) {
      return {
        title: 'Establish an exam-condition baseline',
        description: 'You have enough tracked practice to make a 90-question form useful now.',
        action: 'Start full simulation',
        route: '/exam',
        tone: 'primary',
      };
    }
    if (progress.weakestDomain && progress.weakestDomain.accuracy < 75) {
      return {
        title: `Repair ${progress.weakestDomain.domain}`,
        description: `${progress.weakestDomain.label} is currently your weakest attempted domain at ${progress.weakestDomain.accuracy}%.`,
        action: 'Run focused drill',
        route: `/study?domain=${progress.weakestDomain.domain}&mode=weakest`,
        tone: 'warning',
      };
    }
    return {
      title: 'Prove the gains under time',
      description: 'Your current remediation queue is controlled. Use a full form to validate retention, pacing and format switching.',
      action: 'Start full simulation',
      route: '/exam',
      tone: 'success',
    };
  }, [progress]);

  const defaultRoute =
    settings.default_mode === 'exam'
      ? '/exam'
      : settings.default_mode === 'sprint'
        ? '/study?mode=sprint'
        : '/study?mode=tutor';

  const weeklyPct = Math.round((progress.weeklyQuestions / Math.max(1, settings.weekly_question_target)) * 100);
  const dailyPct = Math.round((progress.todayMinutes / Math.max(1, settings.daily_minutes_goal)) * 100);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <PageHeader
        eyebrow="SY0-701 training command center"
        title="Train the weak points. Prove the result."
        description="One loop for knowledge, applied PBQs, remediation and full exam rehearsal. Every metric below comes from your tracked sessions on this browser identity."
        icon={<ShieldCheck className="h-4 w-4" />}
        actions={
          <StatusChip tone={cloudState === 'available' ? 'success' : cloudState === 'offline' ? 'danger' : 'muted'}>
            <Cloud className="h-3.5 w-3.5" />
            {cloudState === 'available'
              ? `Cloud backup available${cloudCount !== null ? ` · ${cloudCount}` : ''}`
              : cloudState === 'offline'
                ? 'Local-first · cloud unavailable'
                : 'Checking backup'}
          </StatusChip>
        }
      />

      <div className="mt-6 grid gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.55fr)]">
        <Panel className="relative overflow-hidden p-0">
          <div className="pointer-events-none absolute inset-0 surface-grid opacity-30" />
          <div className="relative grid gap-6 p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_220px] lg:items-center">
            <div>
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <StatusChip tone={recommendation.tone}>{recommendation.tone === 'success' ? <CheckCircle2 className="h-3 w-3" /> : <Zap className="h-3 w-3" />}Next best session</StatusChip>
                {progress.daysToExam !== null && (
                  <StatusChip tone={progress.daysToExam <= 14 ? 'warning' : 'muted'}>
                    <CalendarDays className="h-3 w-3" />
                    {progress.daysToExam < 0 ? 'Target date passed' : progress.daysToExam === 0 ? 'Target exam today' : `${progress.daysToExam} days to target`}
                  </StatusChip>
                )}
              </div>
              <h2 className="text-xl font-semibold sm:text-2xl">{recommendation.title}</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{recommendation.description}</p>
              <div className="mt-5 flex flex-wrap gap-2">
                <button
                  onClick={() => navigate(recommendation.route)}
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90"
                >
                  {recommendation.action}
                  <ArrowRight className="h-4 w-4" />
                </button>
                <button
                  onClick={() => navigate(defaultRoute)}
                  className="rounded-lg border border-border bg-background/50 px-4 py-2.5 text-sm font-semibold text-muted-foreground hover:border-primary/40 hover:text-foreground"
                >
                  Quick start: {settings.default_mode}
                </button>
              </div>
            </div>

            <div className="mx-auto flex h-44 w-44 items-center justify-center rounded-full border border-border bg-background/70 p-3 shadow-inner">
              <div
                className="flex h-full w-full items-center justify-center rounded-full"
                style={{
                  background: `conic-gradient(hsl(var(--primary)) ${progress.readiness?.overall ?? 0}%, hsl(var(--muted)) 0)`,
                }}
              >
                <div className="flex h-[82%] w-[82%] flex-col items-center justify-center rounded-full bg-card text-center">
                  <Gauge className="mb-1 h-4 w-4 text-primary" />
                  <div className="font-mono text-4xl font-semibold">{progress.readiness?.overall ?? '—'}</div>
                  <div className="mt-1 text-[9px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Readiness / 100</div>
                </div>
              </div>
            </div>
          </div>
        </Panel>

        <Panel title="Training goals" eyebrow="This week">
          <div className="space-y-5">
            <ProgressMeter
              value={weeklyPct}
              left="Questions"
              right={`${progress.weeklyQuestions} / ${settings.weekly_question_target}`}
              tone={weeklyPct >= 100 ? 'success' : 'primary'}
            />
            <ProgressMeter
              value={dailyPct}
              left="Active minutes today"
              right={`${progress.todayMinutes} / ${settings.daily_minutes_goal}`}
              tone={dailyPct >= 100 ? 'success' : 'primary'}
            />
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="rounded-xl bg-muted/30 p-3">
                <div className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Needs review</div>
                <div className={`mt-1 font-mono text-xl font-semibold ${progress.unresolved.length ? 'text-warning' : 'text-success'}`}>{progress.unresolved.length}</div>
              </div>
              <div className="rounded-xl bg-muted/30 p-3">
                <div className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">PBQ reps</div>
                <div className="mt-1 font-mono text-xl font-semibold">{progress.pbqReps}</div>
              </div>
            </div>
          </div>
        </Panel>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricCard
          label="Full exam average"
          value={progress.fullExamAverage === null ? '—' : `${progress.fullExamAverage}%`}
          note={progress.fullExamHistory.length ? `${progress.fullExamHistory.length} full form${progress.fullExamHistory.length === 1 ? '' : 's'}` : 'No full baseline yet'}
          icon={<Target className="h-4 w-4" />}
          tone={progress.fullExamAverage !== null && progress.fullExamAverage >= 80 ? 'success' : 'default'}
          onClick={() => navigate('/analytics')}
        />
        <MetricCard
          label="All-practice accuracy"
          value={progress.totalAnswered ? `${progress.overallAccuracy}%` : '—'}
          note={`${progress.totalAnswered} tracked responses`}
          icon={<Gauge className="h-4 w-4" />}
          tone={progress.overallAccuracy >= 80 ? 'success' : progress.overallAccuracy >= 65 ? 'warning' : 'default'}
          onClick={() => navigate('/analytics')}
        />
        <MetricCard
          label="Unresolved"
          value={progress.unresolved.length}
          note="Latest streak still negative"
          icon={<RotateCcw className="h-4 w-4" />}
          tone={progress.unresolved.length ? 'warning' : 'success'}
          onClick={() => navigate('/review')}
        />
        <MetricCard
          label="PBQ repetitions"
          value={progress.pbqReps}
          note="Applied-task attempts"
          icon={<Layers3 className="h-4 w-4" />}
          tone="primary"
          onClick={() => navigate('/pbq')}
        />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.3fr)_minmax(320px,0.7fr)]">
        <Panel
          title="Domain performance"
          eyebrow="Coverage"
          description="Accuracy is shown against the official domain weight so weak high-weight areas are easy to spot."
          action={
            <button onClick={() => navigate('/analytics')} className="text-xs font-semibold text-primary hover:underline">
              Full analytics
            </button>
          }
        >
          <div className="space-y-4">
            {domainPerformance.map((domain) => {
              const tone = domain.accuracy === null
                ? 'primary'
                : domain.accuracy >= 80
                  ? 'success'
                  : domain.accuracy >= 65
                    ? 'warning'
                    : 'danger';
              return (
                <div key={domain.domain} className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_92px] sm:items-center">
                  <div>
                    <div className="mb-1.5 flex items-start justify-between gap-3 text-xs">
                      <div className="min-w-0">
                        <span className="mr-2 font-mono font-semibold text-primary">{domain.domain}</span>
                        <span className="text-foreground/90">{domain.label.replace(/^\d+\.\d+\s*/, '')}</span>
                      </div>
                      <span className="shrink-0 font-mono text-muted-foreground">{domain.accuracy === null ? '—' : `${domain.accuracy}%`}</span>
                    </div>
                    <ProgressMeter
                      value={domain.accuracy ?? 0}
                      right={domain.attempts ? `${domain.attempts} reps` : 'not attempted'}
                      tone={tone}
                    />
                  </div>
                  <div className="rounded-lg border border-border bg-muted/25 px-3 py-2 text-center">
                    <div className="font-mono text-lg font-semibold">{domain.weight}%</div>
                    <div className="text-[9px] uppercase tracking-wider text-muted-foreground">exam weight</div>
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>

        <Panel title="Recent sessions" eyebrow="History">
          {progress.history.length === 0 ? (
            <div className="flex min-h-52 flex-col items-center justify-center rounded-xl border border-dashed border-border px-5 text-center">
              <BookOpen className="mb-3 h-6 w-6 text-muted-foreground" />
              <div className="text-sm font-semibold">No tracked sessions yet</div>
              <p className="mt-1 max-w-xs text-xs leading-5 text-muted-foreground">Start a tutor drill or full simulation to establish your baseline.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {progress.history.slice(0, 6).map((attempt) => (
                <button
                  key={attempt.id}
                  onClick={() => navigate('/review')}
                  className="flex w-full items-center gap-3 rounded-xl border border-transparent px-2 py-2.5 text-left hover:border-border hover:bg-muted/25"
                >
                  <div className={`h-2.5 w-2.5 shrink-0 rounded-full ${attempt.passed ? 'bg-success' : 'bg-destructive'}`} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold capitalize">{attempt.mode}</span>
                      <span className={`font-mono text-xs font-semibold ${attempt.passed ? 'text-success' : 'text-destructive'}`}>{attempt.percentage}%</span>
                    </div>
                    <div className="mt-0.5 flex items-center justify-between gap-2 text-[10px] text-muted-foreground">
                      <span>{new Date(attempt.endTime).toLocaleDateString()}</span>
                      <span>{attempt.totalQuestions} items</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
          <button
            onClick={() => navigate('/review')}
            className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-primary hover:underline"
          >
            <History className="h-3.5 w-3.5" />
            Open review queue
          </button>
        </Panel>
      </div>
    </div>
  );
}
