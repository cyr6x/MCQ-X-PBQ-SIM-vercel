import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Target, BookOpen, Layers, History, RotateCcw, ChevronRight, TrendingUp, TrendingDown, Minus, Zap, AlertTriangle } from 'lucide-react';
import { loadHistory, loadQuestionStats } from '@/lib/examHistory';
import { calculateReadiness } from '@/lib/readiness';
import { fetchAttempts, subscribeAttempts, subscribeStats } from '@/lib/cloudSync';
import { DOMAIN_LABELS, DOMAIN_WEIGHTS, type Domain } from '@/data/questions';

export default function DashboardPage() {
  const navigate = useNavigate();
  const [tick, setTick] = useState(0); // re-render on cloud changes
  const [cloudCount, setCloudCount] = useState<number | null>(null);
  const [cloudOk, setCloudOk] = useState<boolean | null>(null);

  // Initial pull + realtime subscription
  useEffect(() => {
    let mounted = true;
    fetchAttempts()
      .then((rows) => { if (mounted) { setCloudCount(rows.length); setCloudOk(true); } })
      .catch(() => mounted && setCloudOk(false));
    const offA = subscribeAttempts(() => setTick((t) => t + 1));
    const offS = subscribeStats(() => setTick((t) => t + 1));
    return () => { mounted = false; offA(); offS(); };
  }, []);

  const history = useMemo(() => loadHistory(), [tick]);
  const stats = useMemo(() => loadQuestionStats(), [tick]);
  const readiness = useMemo(() => (history.length > 0 ? calculateReadiness() : null), [tick, history.length]);

  const totalAnswered = useMemo(
    () => Object.values(stats).reduce((s, q) => s + q.timesAttempted, 0),
    [stats]
  );
  const needsReview = useMemo(
    () => Object.values(stats).filter((q) => q.streak < 0).length,
    [stats]
  );
  const pbqReps = useMemo(
    () => Object.values(stats).filter((q) => q.type === 'pbq').reduce((s, q) => s + q.timesAttempted, 0),
    [stats]
  );

  const overallAccuracy = useMemo(() => {
    const correct = Object.values(stats).reduce((s, q) => s + q.timesCorrect, 0);
    return totalAnswered > 0 ? Math.round((correct / totalAnswered) * 100) : 0;
  }, [stats, totalAnswered]);

  const domainPerf = useMemo(() => {
    const map: Record<string, { correct: number; total: number }> = {};
    Object.values(stats).forEach((s) => {
      if (!map[s.domain]) map[s.domain] = { correct: 0, total: 0 };
      map[s.domain].correct += s.timesCorrect;
      map[s.domain].total += s.timesAttempted;
    });
    return (Object.keys(DOMAIN_LABELS) as Domain[]).map((d) => {
      const m = map[d] || { correct: 0, total: 0 };
      return {
        domain: d,
        label: DOMAIN_LABELS[d],
        weight: DOMAIN_WEIGHTS[d],
        accuracy: m.total > 0 ? Math.round((m.correct / m.total) * 100) : null,
        attempts: m.total,
      };
    });
  }, [stats]);

  const trendIcon = readiness?.trend === 'improving'
    ? <TrendingUp className="h-4 w-4 text-success" />
    : readiness?.trend === 'declining'
    ? <TrendingDown className="h-4 w-4 text-destructive" />
    : <Minus className="h-4 w-4 text-muted-foreground" />;

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      {/* Hero */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Shield className="w-5 h-5 text-primary" />
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <span className="ml-auto inline-flex items-center gap-1.5 text-[10px] font-mono px-2 py-0.5 rounded border border-border bg-card">
            <span className={`w-1.5 h-1.5 rounded-full ${cloudOk === true ? 'bg-success animate-pulse' : cloudOk === false ? 'bg-destructive' : 'bg-muted-foreground'}`} />
            {cloudOk === true ? 'CLOUD SYNCED' : cloudOk === false ? 'OFFLINE' : 'CONNECTING…'}
            {cloudCount !== null && <span className="text-muted-foreground">· {cloudCount} cloud attempts</span>}
          </span>
        </div>
        <p className="text-sm text-muted-foreground">
          Live progress for your SY0-701 prep. Stats update in realtime as you answer questions on any device using this browser identity.
        </p>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <KPI
          label="Readiness"
          value={readiness ? `${readiness.overall}` : '—'}
          suffix={readiness ? '/100' : ''}
          icon={<Zap className="w-4 h-4" />}
          tone={readiness && readiness.overall >= 75 ? 'success' : readiness && readiness.overall >= 50 ? 'warning' : 'muted'}
          trailing={readiness ? trendIcon : null}
          onClick={() => navigate('/analytics')}
        />
        <KPI
          label="Attempts"
          value={String(history.length)}
          icon={<History className="w-4 h-4" />}
          tone="muted"
          onClick={() => navigate('/review')}
        />
        <KPI
          label="Accuracy"
          value={totalAnswered > 0 ? `${overallAccuracy}%` : '—'}
          icon={<Target className="w-4 h-4" />}
          tone={overallAccuracy >= 75 ? 'success' : overallAccuracy >= 50 ? 'warning' : 'muted'}
          onClick={() => navigate('/review')}
        />
        <KPI
          label="Questions answered"
          value={String(totalAnswered)}
          icon={<BookOpen className="w-4 h-4" />}
          tone="muted"
          onClick={() => navigate('/study')}
        />
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 mb-6">
        <ActionTile
          title="Start Exam Simulation"
          desc="90 questions · 90 minutes · no pause · final review"
          icon={<Target className="w-5 h-5" />}
          onClick={() => navigate('/exam')}
          accent="primary"
        />
        <ActionTile
          title="Study Mode"
          desc="Untimed · instant feedback · filter by domain"
          icon={<BookOpen className="w-5 h-5" />}
          onClick={() => navigate('/study')}
          accent="accent"
        />
        <ActionTile
          title="PBQ Lab"
          desc={pbqReps ? `${pbqReps} PBQ reps tracked · drill applied tasks` : 'Drill applied PBQ tasks with feedback'}
          icon={<Layers className="w-5 h-5" />}
          onClick={() => navigate('/pbq')}
          accent="accent"
        />
        <ActionTile
          title={needsReview ? `Review Misses (${needsReview})` : 'Review Misses'}
          desc={needsReview ? 'Close unresolved mistakes before the next full form' : 'No unresolved misses right now'}
          icon={<RotateCcw className="w-5 h-5" />}
          onClick={() => navigate('/review')}
          accent={needsReview ? 'primary' : 'accent'}
        />
      </div>

      {/* Domain performance */}
      <div className="bg-card border border-border rounded-xl p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Domain performance
          </h2>
          <button
            onClick={() => navigate('/analytics')}
            className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
          >
            Full analytics <ChevronRight className="w-3 h-3" />
          </button>
        </div>
        <div className="space-y-3">
          {domainPerf.map((d) => (
            <div key={d.domain}>
              <div className="flex items-baseline justify-between mb-1 text-xs">
                <span className="font-mono text-foreground truncate pr-3">{d.label}</span>
                <span className="text-muted-foreground tabular-nums shrink-0">
                  {d.accuracy === null ? <span className="italic">no data</span> : `${d.accuracy}%`}
                  <span className="ml-2 opacity-60">weight {Math.round(d.weight * 100)}%</span>
                </span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden relative">
                {d.accuracy !== null && (
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      d.accuracy >= 75 ? 'bg-success' : d.accuracy >= 50 ? 'bg-warning' : 'bg-destructive'
                    }`}
                    style={{ width: `${Math.max(2, d.accuracy)}%` }}
                  />
                )}
                {/* exam weight indicator */}
                <div
                  className="absolute top-0 bottom-0 w-px bg-foreground/40"
                  style={{ left: `${d.weight * 100}%` }}
                  title={`Exam weight: ${Math.round(d.weight * 100)}%`}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent attempts */}
      <div className="bg-card border border-border rounded-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Recent attempts
          </h2>
          <button
            onClick={() => navigate('/review')}
            className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
          >
            View all <ChevronRight className="w-3 h-3" />
          </button>
        </div>
        {history.length === 0 ? (
          <EmptyState
            title="No attempts yet"
            body="Take your first full exam simulation or run through a study set — your scores will appear here."
            ctaLabel="Start exam simulation"
            onCta={() => navigate('/exam')}
          />
        ) : (
          <div className="divide-y divide-border">
            {history.slice(0, 5).map((a) => (
              <div key={a.id} className="py-2.5 flex items-center gap-3">
                <span className={`w-2 h-2 rounded-full ${a.passed ? 'bg-success' : 'bg-destructive'}`} />
                <span className="text-xs font-mono text-muted-foreground w-28 shrink-0">
                  {new Date(a.endTime).toLocaleDateString()}
                </span>
                <span className="text-xs uppercase tracking-wide text-muted-foreground w-20 shrink-0">
                  {a.mode}
                </span>
                <span className="text-sm flex-1 truncate">
                  {a.correctAnswers}/{a.totalQuestions} correct
                </span>
                <span className={`text-sm font-mono font-bold ${a.passed ? 'text-success' : 'text-destructive'}`}>
                  {a.percentage}%
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function KPI({
  label, value, suffix, icon, tone, trailing, onClick,
}: {
  label: string; value: string; suffix?: string;
  icon: React.ReactNode;
  tone: 'success' | 'warning' | 'muted';
  trailing?: React.ReactNode;
  onClick?: () => void;
}) {
  const toneColor = tone === 'success' ? 'text-success' : tone === 'warning' ? 'text-warning' : 'text-foreground';
  return (
    <button
      onClick={onClick}
      className="text-left rounded-xl border border-border bg-card p-4 hover:border-primary/40 transition-colors"
    >
      <div className="flex items-center gap-2 text-muted-foreground mb-1">
        {icon}
        <span className="text-[11px] uppercase tracking-wide">{label}</span>
        {trailing && <span className="ml-auto">{trailing}</span>}
      </div>
      <div className="flex items-baseline gap-1">
        <span className={`text-2xl font-bold font-mono ${toneColor}`}>{value}</span>
        {suffix && <span className="text-xs text-muted-foreground font-mono">{suffix}</span>}
      </div>
    </button>
  );
}

function ActionTile({
  title, desc, icon, onClick, accent,
}: { title: string; desc: string; icon: React.ReactNode; onClick: () => void; accent: 'primary' | 'accent'; }) {
  const ring = accent === 'primary' ? 'hover:border-primary/60' : 'hover:border-accent/60';
  const iconBg = accent === 'primary' ? 'bg-primary/15 text-primary' : 'bg-accent/15 text-accent';
  return (
    <button
      onClick={onClick}
      className={`text-left rounded-xl border border-border bg-card p-4 transition-colors ${ring} flex items-start gap-3`}
    >
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${iconBg}`}>{icon}</div>
      <div className="min-w-0">
        <div className="text-sm font-semibold mb-0.5">{title}</div>
        <div className="text-xs text-muted-foreground leading-snug">{desc}</div>
      </div>
      <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto self-center" />
    </button>
  );
}

function EmptyState({ title, body, ctaLabel, onCta }: { title: string; body: string; ctaLabel: string; onCta: () => void; }) {
  return (
    <div className="flex flex-col items-center text-center py-8 px-4">
      <AlertTriangle className="w-8 h-8 text-muted-foreground mb-2" />
      <div className="text-sm font-semibold mb-1">{title}</div>
      <div className="text-xs text-muted-foreground mb-3 max-w-sm">{body}</div>
      <button onClick={onCta} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md bg-primary text-primary-foreground font-semibold hover:opacity-90">
        {ctaLabel} <ChevronRight className="w-3 h-3" />
      </button>
    </div>
  );
}
