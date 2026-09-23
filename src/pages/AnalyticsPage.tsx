import { useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  ReferenceLine,
} from 'recharts';
import { BarChart3, Brain, Clock, Target, RotateCcw, Layers3 } from 'lucide-react';
import { DOMAIN_LABELS, DOMAIN_WEIGHTS, type Domain } from '@/data/questions';
import { useSettings } from '@/lib/SettingsContext';
import { useProgressSnapshot } from '@/hooks/useProgressSnapshot';
import { MetricCard, PageHeader, Panel, ProgressMeter, StatusChip } from '@/components/product/ProductUI';

export default function AnalyticsPage() {
  const { settings } = useSettings();
  const progress = useProgressSnapshot(settings);
  const trendSource = progress.fullExamHistory.length ? progress.fullExamHistory : progress.history;

  const trendData = useMemo(
    () => trendSource.slice(0, 15).reverse().map((attempt, index) => ({
      idx: index + 1,
      date: new Date(attempt.endTime).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      percentage: attempt.percentage,
    })),
    [trendSource],
  );

  const domainData = useMemo(() => {
    const values = Object.values(progress.stats);
    return (Object.keys(DOMAIN_LABELS) as Domain[]).map((domain) => {
      const matching = values.filter((item) => item.domain === domain || item.domain === DOMAIN_LABELS[domain]);
      const attempts = matching.reduce((sum, item) => sum + item.timesAttempted, 0);
      const correct = matching.reduce((sum, item) => sum + item.timesCorrect, 0);
      return {
        key: domain,
        domain: DOMAIN_LABELS[domain].replace(/^\d+\.\d+\s*/, '').slice(0, 24),
        accuracy: attempts ? Math.round((correct / attempts) * 100) : 0,
        weight: Math.round(DOMAIN_WEIGHTS[domain] * 100),
        attempts,
      };
    });
  }, [progress.stats]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <PageHeader
        eyebrow="Performance intelligence"
        title="See what transfers under pressure."
        description="Full simulations drive the readiness trend when available. Study and PBQ sessions still feed coverage, repetition and weak-area signals."
        icon={<BarChart3 className="h-4 w-4" />}
        actions={
          progress.readiness && (
            <StatusChip tone={progress.readiness.readyForExam ? 'success' : 'warning'}>
              <Brain className="h-3.5 w-3.5" />
              {progress.readiness.readyForExam ? 'Readiness gate met' : 'Readiness building'}
            </StatusChip>
          )
        }
      />

      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricCard label="Readiness" value={progress.readiness ? `${progress.readiness.overall}/100` : '—'} note="weighted training signal" icon={<Brain className="h-4 w-4" />} tone={progress.readiness?.readyForExam ? 'success' : 'default'} />
        <MetricCard label="Full exam avg" value={progress.fullExamAverage === null ? '—' : `${progress.fullExamAverage}%`} note={`${progress.fullExamHistory.length} full simulations`} icon={<Target className="h-4 w-4" />} tone={progress.fullExamAverage !== null && progress.fullExamAverage >= 80 ? 'success' : 'default'} />
        <MetricCard label="Needs review" value={progress.unresolved.length} note="negative latest streak" icon={<RotateCcw className="h-4 w-4" />} tone={progress.unresolved.length ? 'warning' : 'success'} />
        <MetricCard label="PBQ reps" value={progress.pbqReps} note="applied-task attempts" icon={<Layers3 className="h-4 w-4" />} tone="primary" />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.3fr)_minmax(320px,0.7fr)]">
        <Panel
          title={progress.fullExamHistory.length ? 'Full exam trend' : 'Practice trend'}
          eyebrow="Trajectory"
          description={progress.fullExamHistory.length
            ? 'Only 80+ question exam simulations are plotted here so easier tutor sets cannot inflate the trend.'
            : 'Until you complete a full simulation, your available practice attempts are shown as a provisional trend.'}
        >
          <div className="h-[300px] w-full">
            {trendData.length === 0 ? (
              <Empty body="Complete a training session to create your first performance signal." />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData} margin={{ top: 12, right: 16, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 12, fontSize: 12 }} formatter={(value: number) => [`${value}%`, 'Accuracy']} />
                  <ReferenceLine y={80} stroke="hsl(var(--success))" strokeDasharray="4 3" label={{ value: '80% training target', fontSize: 9, fill: 'hsl(var(--success))' }} />
                  <Line type="monotone" dataKey="percentage" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={{ r: 3, fill: 'hsl(var(--primary))' }} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </Panel>

        <Panel title="Readiness breakdown" eyebrow="Inputs">
          {progress.readiness ? (
            <div className="space-y-4">
              <Breakdown label="Recent accuracy" value={progress.readiness.recentAccuracy} />
              <Breakdown label="Consistency" value={progress.readiness.consistency} />
              <Breakdown label="Domain coverage" value={progress.readiness.domainCoverage} />
              <Breakdown label="Weak-domain strength" value={progress.readiness.weakDomainStrength} />
              <Breakdown label="Time management" value={progress.readiness.timeManagement} />
              <Breakdown label="Practice volume" value={progress.readiness.volumePracticed} />
            </div>
          ) : (
            <Empty body="Readiness appears after your first tracked session." />
          )}
        </Panel>
      </div>

      <Panel className="mt-4" title="Domain accuracy vs exam weight" eyebrow="Coverage">
        {progress.totalAnswered === 0 ? (
          <Empty body="Answer questions in any training mode to populate domain performance." />
        ) : (
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={domainData} margin={{ top: 10, right: 12, left: -10, bottom: 68 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="domain" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} angle={-28} textAnchor="end" interval={0} height={78} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 12, fontSize: 12 }}
                  formatter={(value: number, name: string) => [`${value}%`, name === 'accuracy' ? 'Your accuracy' : 'Exam weight']}
                />
                <Bar dataKey="accuracy" name="accuracy" fill="hsl(var(--primary))" radius={[5, 5, 0, 0]} />
                <Bar dataKey="weight" name="weight" fill="hsl(var(--accent))" radius={[5, 5, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </Panel>

      {progress.readiness && (
        <Panel className="mt-4" title="What to do next" eyebrow="Recommendations">
          <div className="grid gap-2 lg:grid-cols-2">
            {progress.readiness.recommendations.map((recommendation) => (
              <div key={recommendation} className="rounded-xl border border-border bg-muted/20 p-3 text-xs leading-5 text-foreground/80">
                <span className="mr-2 font-mono text-primary">→</span>{recommendation}
              </div>
            ))}
          </div>
        </Panel>
      )}

      <div className="mt-4 text-[10px] leading-5 text-muted-foreground">
        Pace modeling uses separate training targets for MCQs and PBQs. The 80% reference is a trainer target, not a conversion of CompTIA’s proprietary score formula.
      </div>
    </div>
  );
}

function Breakdown({ label, value }: { label: string; value: number }) {
  const tone = value >= 80 ? 'success' : value >= 60 ? 'warning' : 'danger';
  return (
    <ProgressMeter
      value={value}
      left={label}
      right={`${value}%`}
      tone={tone}
    />
  );
}

function Empty({ body }: { body: string }) {
  return (
    <div className="flex min-h-40 flex-col items-center justify-center px-4 text-center text-muted-foreground">
      <Clock className="mb-2 h-6 w-6 opacity-60" />
      <p className="max-w-sm text-xs leading-5">{body}</p>
    </div>
  );
}
