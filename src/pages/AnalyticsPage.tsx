import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
  BarChart, Bar, ReferenceLine, Legend,
} from 'recharts';
import { ArrowLeft, BarChart3, TrendingUp, TrendingDown, Minus, Brain, Clock, Target } from 'lucide-react';
import { loadHistory, loadQuestionStats } from '@/lib/examHistory';
import { calculateReadiness } from '@/lib/readiness';
import { subscribeAttempts, subscribeStats } from '@/lib/cloudSync';
import { DOMAIN_LABELS, DOMAIN_WEIGHTS, type Domain } from '@/data/questions';

export default function AnalyticsPage() {
  const navigate = useNavigate();
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const offA = subscribeAttempts(() => setTick((t) => t + 1));
    const offS = subscribeStats(() => setTick((t) => t + 1));
    return () => { offA(); offS(); };
  }, []);

  const history = useMemo(() => loadHistory(), [tick]);
  const stats = useMemo(() => loadQuestionStats(), [tick]);
  const readiness = useMemo(() => (history.length > 0 ? calculateReadiness() : null), [tick, history.length]);
  const examHistory = useMemo(() => history.filter((attempt) => attempt.mode === 'exam' && attempt.totalQuestions >= 80), [history]);
  const trendSource = examHistory.length > 0 ? examHistory : history;

  const trendData = useMemo(() => {
    return trendSource.slice(0, 15).reverse().map((a, i) => ({
      idx: i + 1,
      date: new Date(a.endTime).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      percentage: a.percentage,
      scaled: Math.round(100 + (a.percentage / 100) * 800),
    }));
  }, [trendSource]);

  const domainData = useMemo(() => {
    const map: Record<string, { correct: number; total: number }> = {};
    Object.values(stats).forEach((s) => {
      if (!map[s.domain]) map[s.domain] = { correct: 0, total: 0 };
      map[s.domain].correct += s.timesCorrect;
      map[s.domain].total += s.timesAttempted;
    });
    return (Object.keys(DOMAIN_LABELS) as Domain[]).map((d) => {
      const m = map[DOMAIN_LABELS[d]] || map[d] || { correct: 0, total: 0 };
      return {
        domain: DOMAIN_LABELS[d].replace(/^[\d.]+\s*/, '').slice(0, 22),
        accuracy: m.total > 0 ? Math.round((m.correct / m.total) * 100) : 0,
        weight: Math.round(DOMAIN_WEIGHTS[d] * 100),
        attempts: m.total,
      };
    });
  }, [stats]);

  const totalAnswered = Object.values(stats).reduce((s, q) => s + q.timesAttempted, 0);
  const correctAnswered = Object.values(stats).reduce((s, q) => s + q.timesCorrect, 0);
  const accuracy = totalAnswered > 0 ? Math.round((correctAnswered / totalAnswered) * 100) : 0;
  const unresolved = Object.values(stats).filter((item) => item.streak < 0).length;
  const pbqReps = Object.values(stats)
    .filter((item) => item.type === 'pbq')
    .reduce((sum, item) => sum + item.timesAttempted, 0);
  const fullExamAverage = examHistory.length
    ? Math.round(examHistory.reduce((sum, attempt) => sum + attempt.percentage, 0) / examHistory.length)
    : null;

  const trendIcon = readiness?.trend === 'improving'
    ? <TrendingUp className="h-4 w-4 text-success" />
    : readiness?.trend === 'declining'
    ? <TrendingDown className="h-4 w-4 text-destructive" />
    : <Minus className="h-4 w-4 text-muted-foreground" />;

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/')} className="p-2 rounded-md border border-border text-muted-foreground hover:text-foreground hover:bg-muted">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><BarChart3 className="w-5 h-5 text-primary" />Analytics</h1>
          <p className="text-xs text-muted-foreground">Live performance breakdown across every attempt on this device.</p>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Stat label="Readiness" value={readiness ? `${readiness.overall}/100` : '—'} icon={<Brain className="w-4 h-4" />} trailing={readiness ? trendIcon : null} />
        <Stat label="Full exam avg" value={fullExamAverage !== null ? `${fullExamAverage}%` : '—'} icon={<Target className="w-4 h-4" />} />
        <Stat label="Needs review" value={String(unresolved)} icon={<BarChart3 className="w-4 h-4" />} />
        <Stat label="PBQ reps" value={String(pbqReps)} icon={<Clock className="w-4 h-4" />} />
      </div>

      {/* Score trend */}
      <div className="bg-card border border-border rounded-xl p-5 mb-6">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            {examHistory.length ? 'Full exam trend' : 'Practice trend'} (last {trendData.length})
          </h2>
          <span className="text-[10px] text-muted-foreground">All-practice accuracy: {accuracy}% · {totalAnswered} tracked responses</span>
        </div>
        <div style={{ width: '100%', minHeight: 260 }}>
          {trendData.length === 0 ? (
            <Empty body="Take a practice exam or study set — your score trajectory will appear here." />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={trendData} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip
                  contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', fontSize: 12 }}
                  formatter={(v: number, n) => n === 'percentage' ? [`${v}%`, 'Accuracy'] : [v, 'Scaled']}
                />
                <ReferenceLine y={80} stroke="hsl(var(--success))" strokeDasharray="4 2" label={{ value: 'Training target 80%', fontSize: 10, fill: 'hsl(var(--success))' }} />
                <Line type="monotone" dataKey="percentage" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Domain accuracy vs exam weight */}
      <div className="bg-card border border-border rounded-xl p-5 mb-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">Domain accuracy vs exam weight</h2>
        <div style={{ width: '100%', minHeight: 320 }}>
          {totalAnswered === 0 ? (
            <Empty body="Answer questions in any mode to see your per-domain accuracy here." />
          ) : (
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={domainData} margin={{ top: 10, right: 16, left: 0, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="domain" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} angle={-30} textAnchor="end" interval={0} height={70} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="accuracy" name="Your accuracy %" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="weight" name="Exam weight %" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {readiness && (
        <div className="bg-card border border-border rounded-xl p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">Recommendations</h2>
          <ul className="space-y-2">
            {readiness.recommendations.map((r, i) => (
              <li key={i} className="text-sm flex items-start gap-2"><span className="text-primary font-mono text-xs mt-0.5">→</span>{r}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, icon, trailing }: { label: string; value: string; icon: React.ReactNode; trailing?: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 text-muted-foreground mb-1">
        {icon}
        <span className="text-[11px] uppercase tracking-wide">{label}</span>
        {trailing && <span className="ml-auto">{trailing}</span>}
      </div>
      <div className="text-2xl font-bold font-mono">{value}</div>
    </div>
  );
}

function Empty({ body }: { body: string }) {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center py-10 px-4 text-muted-foreground">
      <BarChart3 className="w-8 h-8 mb-2 opacity-60" />
      <p className="text-sm max-w-sm">{body}</p>
    </div>
  );
}
