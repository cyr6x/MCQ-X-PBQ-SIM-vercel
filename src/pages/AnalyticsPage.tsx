import { useEffect, useMemo, useState } from 'react';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
  BarChart, Bar, ReferenceLine, Legend,
} from 'recharts';
import { BarChart3, TrendingUp, TrendingDown, Minus, Brain, Clock, Target } from 'lucide-react';
import { loadHistory, loadQuestionStats } from '@/lib/examHistory';
import { PageHeader } from '@/components/product/ProductUI';
import { calculateReadiness } from '@/lib/readiness';
import { subscribeAttempts, subscribeStats } from '@/lib/cloudSync';
import { DOMAIN_LABELS, DOMAIN_WEIGHTS, type Domain } from '@/data/questions';

export default function AnalyticsPage() {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const offA = subscribeAttempts(() => setTick((t) => t + 1));
    const offS = subscribeStats(() => setTick((t) => t + 1));
    return () => { offA(); offS(); };
  }, []);

  const history = useMemo(() => loadHistory(), [tick]);
  const stats = useMemo(() => loadQuestionStats(), [tick]);
  const readiness = useMemo(() => (history.length > 0 ? calculateReadiness() : null), [tick, history.length]);

  const trendData = useMemo(() => {
    return history.slice(0, 15).reverse().map((a, i) => ({
      idx: i + 1,
      date: new Date(a.endTime).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      percentage: a.percentage,
      scaled: Math.round(100 + (a.percentage / 100) * 800),
    }));
  }, [history]);

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

  // Domain-weighted gap: how much each domain hurts your scaled score.
  // gap = examWeight% × (100 − accuracy%). Higher = more score left on the table.
  const gapData = useMemo(() => {
    const map: Record<string, { correct: number; total: number }> = {};
    Object.values(stats).forEach((s) => {
      if (!map[s.domain]) map[s.domain] = { correct: 0, total: 0 };
      map[s.domain].correct += s.timesCorrect;
      map[s.domain].total += s.timesAttempted;
    });
    return (Object.keys(DOMAIN_LABELS) as Domain[])
      .map((d) => {
        const m = map[DOMAIN_LABELS[d]] || map[d] || { correct: 0, total: 0 };
        const acc = m.total > 0 ? Math.round((m.correct / m.total) * 100) : null;
        const weightPct = Math.round(DOMAIN_WEIGHTS[d] * 100);
        const gap = acc !== null ? +(DOMAIN_WEIGHTS[d] * (100 - acc)).toFixed(1) : null;
        return {
          key: d,
          label: DOMAIN_LABELS[d],
          shortLabel: DOMAIN_LABELS[d].replace(/^[\d.]+\s*/, ''),
          acc,
          weightPct,
          gap,
          attempts: m.total,
        };
      })
      .sort((a, b) => {
        // unattempted domains sink to the bottom; among attempted sort by gap desc
        if (a.gap === null && b.gap === null) return 0;
        if (a.gap === null) return 1;
        if (b.gap === null) return -1;
        return b.gap - a.gap;
      });
  }, [stats]);

  const totalAnswered = Object.values(stats).reduce((s, q) => s + q.timesAttempted, 0);
  const correctAnswered = Object.values(stats).reduce((s, q) => s + q.timesCorrect, 0);
  const accuracy = totalAnswered > 0 ? Math.round((correctAnswered / totalAnswered) * 100) : 0;
  const avgTime = useMemo(() => {
    const times = Object.values(stats).map((s) => s.avgTimeSeconds).filter((t) => t > 0);
    if (!times.length) return 0;
    return Math.round(times.reduce((a, b) => a + b, 0) / times.length);
  }, [stats]);

  const trendIcon = readiness?.trend === 'improving'
    ? <TrendingUp className="h-4 w-4 text-success" />
    : readiness?.trend === 'declining'
    ? <TrendingDown className="h-4 w-4 text-destructive" />
    : <Minus className="h-4 w-4 text-muted-foreground" />;

  const download = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportCsv = () => {
    const rows = [['date', 'mode', 'totalQuestions', 'correct', 'percentage', 'passed']];
    history
      .slice()
      .sort((a, b) => a.endTime - b.endTime)
      .forEach((a) => {
        rows.push([
          new Date(a.endTime).toISOString(),
          a.mode,
          String(a.totalQuestions),
          String(a.correctAnswers),
          String(a.percentage),
          String(a.passed),
        ]);
      });
    download(rows.map((r) => r.join(',')).join('\n'), 'secplus-performance.csv', 'text/csv');
  };

  const exportJson = () => {
    download(JSON.stringify(history, null, 2), 'secplus-performance.json', 'application/json');
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      <div className="mb-6">
        <PageHeader
          eyebrow="Performance intelligence"
          title="See what transfers under pressure."
          description="Full simulations drive the readiness trend when available. Study and PBQ sessions still feed coverage, repetition and weak-area signals."
          icon={<BarChart3 className="h-4 w-4" />}
        />
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Stat label="Readiness" value={readiness ? `${readiness.overall}/100` : '—'} icon={<Brain className="w-4 h-4" />} trailing={readiness ? trendIcon : null} />
        <Stat label="Accuracy" value={`${accuracy}%`} icon={<Target className="w-4 h-4" />} />
        <Stat label="Attempts" value={String(history.length)} icon={<BarChart3 className="w-4 h-4" />} />
        <Stat label="Avg time / Q" value={avgTime ? `${avgTime}s` : '—'} icon={<Clock className="w-4 h-4" />} />
      </div>

      {/* Score trend */}
      <div className="bg-card border border-border rounded-xl p-5 mb-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">Score trend (last {trendData.length} attempts)</h2>
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
                <ReferenceLine y={75} stroke="hsl(var(--success))" strokeDasharray="4 2" label={{ value: 'Pass (~75%)', fontSize: 10, fill: 'hsl(var(--success))' }} />
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

      <div className="bg-card border border-border rounded-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Readiness breakdown</h2>
          <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Inputs</span>
        </div>
        {readiness ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <Breakdown label="Recent accuracy" value={readiness.recentAccuracy} />
            <Breakdown label="Consistency" value={readiness.consistency} />
            <Breakdown label="Domain coverage" value={readiness.domainCoverage} />
            <Breakdown label="Weak-domain strength" value={readiness.weakDomainStrength} />
            <Breakdown label="Time management" value={readiness.timeManagement} />
            <Breakdown label="Practice volume" value={readiness.volumePracticed} />
          </div>
        ) : (
          <Empty body="Readiness appears after your first tracked session." />
        )}
      </div>

      {readiness && readiness.recommendations.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-5 mb-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">Recommendations</h2>
          <ul className="space-y-2">
            {readiness.recommendations.map((r, i) => (
              <li key={i} className="text-sm flex items-start gap-2"><span className="text-primary font-mono text-xs mt-0.5">→</span>{r}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Attempt history */}
      <div className="bg-card border border-border rounded-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Attempt history</h2>
          <div className="flex gap-2">
            <button
              onClick={exportCsv}
              disabled={history.length === 0}
              className="rounded-lg border border-border px-3 py-1.5 text-[11px] font-semibold text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-40"
            >
              Export CSV
            </button>
            <button
              onClick={exportJson}
              disabled={history.length === 0}
              className="rounded-lg border border-border px-3 py-1.5 text-[11px] font-semibold text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-40"
            >
              Export JSON
            </button>
          </div>
        </div>
        {history.length === 0 ? (
          <Empty body="Finished sessions appear here with a one-click performance export." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                  <th className="py-2 pr-4 font-medium">Date</th>
                  <th className="py-2 pr-4 font-medium">Mode</th>
                  <th className="py-2 pr-4 font-medium">Score</th>
                  <th className="py-2 font-medium">Result</th>
                </tr>
              </thead>
              <tbody>
                {history.slice(0, 10).map((a) => (
                  <tr key={a.id} className="border-b border-border/50">
                    <td className="py-2 pr-4 text-muted-foreground">
                      {new Date(a.endTime).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                    </td>
                    <td className="py-2 pr-4 capitalize">{a.mode}</td>
                    <td className="py-2 pr-4 font-mono">{a.percentage}%</td>
                    <td className="py-2">
                      {a.mode === 'exam'
                        ? <span className={`text-xs font-bold ${a.passed ? 'text-success' : 'text-destructive'}`}>{a.passed ? 'Pass' : 'Below 750'}</span>
                        : <span className="text-xs text-muted-foreground">{a.correctAnswers}/{a.totalQuestions}</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Attempt history ends */}
    </div>
  );
}

function Breakdown({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-mono font-semibold">{value}</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${value}%` }} />
      </div>
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
