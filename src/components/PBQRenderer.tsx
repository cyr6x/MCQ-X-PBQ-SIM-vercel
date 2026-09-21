import { useState, useMemo } from 'react';
import { CheckCircle2, ChevronDown, ChevronUp, XCircle, GripVertical, ListChecks, MousePointer2 } from 'lucide-react';
import type { PBQuestion, PBQFirewall, PBQOrdering, PBQLogAnalysis, PBQMatching, PBQPlacement, PBQTerminal, PBQPacketAnalysis, PBQTopology } from '@/data/questions';
import { objectiveLabel } from '@/lib/sy0701Objectives';

/**
 * Shared Performance-Based Question renderer.
 *
 * Extracted into its own module so it can be imported both by the live exam
 * flow (NewExamEngine -> PBQRenderer) and by the results/review screen
 * (ExamResults -> PBQRenderer, in read-only/`show` mode) without creating a
 * circular import between those two components.
 */
export function PBQRenderer({
  q,
  ans,
  onAns,
  submitted,
  studyRevealed,
  compact = false,
}: {
  q: PBQuestion;
  ans: any;
  onAns: (a: any) => void;
  submitted: boolean;
  studyRevealed: boolean;
  compact?: boolean;
}) {
  const showFeedback = submitted || studyRevealed;
  const typeLabel = {
    firewall: 'Firewall policy',
    ordering: 'Sequence / workflow',
    'log-analysis': 'SIEM / log analysis',
    matching: 'Matching',
    placement: 'Topology placement',
    terminal: 'Terminal / CLI',
    'packet-analysis': 'Packet analysis',
    topology: 'Network topology',
  }[q.type];

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className={compact ? 'space-y-4' : 'grid gap-5 lg:grid-cols-[minmax(240px,0.72fr)_minmax(0,1.55fr)]'}>
        <aside className={`rounded-2xl border border-border bg-muted/20 ${compact ? 'p-4' : 'p-5 lg:sticky lg:top-24 lg:self-start'}`}>
          <div className="mb-4 flex flex-wrap gap-2">
            <span className="rounded-full border border-accent/30 bg-accent/10 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.12em] text-accent">
              {typeLabel}
            </span>
            <span className="rounded-full border border-border bg-card px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.12em] text-muted-foreground">
              Difficulty {q.difficulty}/3
            </span>
          </div>
          <h3 className={`font-bold leading-snug ${compact ? 'text-base' : 'text-xl'}`}>{q.title}</h3>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">{q.scenario}</p>
          <div className="mt-5 border-t border-border pt-4 text-[10px] leading-5 text-muted-foreground">
            <div className="font-mono font-bold text-foreground">Objective {q.objective || '—'}</div>
            <div>{objectiveLabel(q.objective)}</div>
          </div>
        </aside>

        <section className={`min-w-0 rounded-2xl border border-border bg-background/30 ${compact ? 'p-3' : 'p-4 sm:p-5'}`}>
          <div className="mb-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground">
            <MousePointer2 className="h-3.5 w-3.5" />
            Interactive workspace
          </div>
          {q.type === 'firewall' && <FirewallPBQ q={q} ans={ans} onAns={onAns} show={showFeedback} />}
          {q.type === 'ordering' && <OrderingPBQ q={q} ans={ans} onAns={onAns} show={showFeedback} />}
          {q.type === 'log-analysis' && <LogAnalysisPBQ q={q} ans={ans} onAns={onAns} show={showFeedback} />}
          {q.type === 'matching' && <MatchingPBQ q={q} ans={ans} onAns={onAns} show={showFeedback} />}
          {q.type === 'placement' && <PlacementPBQ q={q} ans={ans} onAns={onAns} show={showFeedback} />}
          {q.type === 'terminal' && <TerminalPBQ q={q} ans={ans} onAns={onAns} show={showFeedback} />}
          {q.type === 'packet-analysis' && <PacketAnalysisPBQ q={q} ans={ans} onAns={onAns} show={showFeedback} />}
          {q.type === 'topology' && <TopologyPBQ q={q} ans={ans} onAns={onAns} show={showFeedback} />}
        </section>
      </div>

      {showFeedback && !compact && (
        <div className="mt-6 rounded-2xl border border-border bg-muted/30 p-6 animate-in zoom-in-95 duration-500">
          <div className="mb-3 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary">
            <ListChecks className="h-4 w-4" />
            Explanation
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground">{q.explanation}</p>
        </div>
      )}
    </div>
  );
}

function FirewallPBQ({ q, ans, onAns, show }: { q: PBQFirewall; ans: string[]; onAns: (a: string[]) => void; show: boolean }) {
  const curr = ans?.length ? ans : q.rules.map(() => '');
  const set = (i: number, v: string) => {
    const n = [...curr];
    n[i] = v;
    onAns(n);
  };

  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
      <table className="w-full text-left border-collapse">
        <thead className="bg-muted/50 border-b border-border">
          <tr>
            {['Rule','Source','Dest','Port','Proto','Action'].map(h => (
              <th key={h} className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {q.rules.map((r, i) => {
            const ok = show && curr[i] === q.correctActions[i];
            const bad = show && curr[i] && curr[i] !== q.correctActions[i];
            return (
              <tr key={i} className="hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3 font-mono text-xs">{r.ruleId}</td>
                <td className="px-4 py-3 font-mono text-xs">{r.sourceIP}</td>
                <td className="px-4 py-3 font-mono text-xs">{r.destIP}</td>
                <td className="px-4 py-3 font-mono text-xs">{r.port}</td>
                <td className="px-4 py-3 font-mono text-xs">{r.protocol}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    {['ALLOW','DENY'].map(a => (
                      <button
                        key={a}
                        onClick={() => !show && set(i, a)}
                        className={`px-3 py-1 rounded-md text-[10px] font-black transition-all ${
                          curr[i] === a
                            ? (a === 'ALLOW' ? 'bg-success text-success-foreground shadow-md' : 'bg-destructive text-destructive-foreground shadow-md')
                            : 'bg-muted text-muted-foreground hover:bg-muted/80'
                        }`}
                      >
                        {a}
                      </button>
                    ))}
                    {ok && <CheckCircle2 className="ml-2 h-4 w-4 text-success" />}
                    {bad && <div className="ml-2 flex flex-col">
                      <XCircle className="h-4 w-4 text-destructive" />
                      <span className="text-[8px] font-bold text-success uppercase">{q.correctActions[i]}</span>
                    </div>}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function OrderingPBQ({ q, ans, onAns, show }: { q: PBQOrdering; ans: string[]; onAns: (a: string[]) => void; show: boolean }) {
  const [dragIdx, setDragIdx] = useState<number | null>(null);
    const [dropTargetIdx, setDropTargetIdx] = useState<number | null>(null);
    const initialOrder = useMemo(() => q.steps.map(s => s.label).sort(() => Math.random() - 0.5), [q.id]);

    const currentOrder: string[] = ans?.length > 0 ? ans : initialOrder;
  if (!ans?.length && q.steps.length > 0) {
    setTimeout(() => onAns(currentOrder), 0);
  }

  const move = (from: number, to: number) => {
    if (show || to < 0 || to >= currentOrder.length) return;
    const next = [...currentOrder];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    onAns(next);
  };

  const handleDrop = (targetIdx: number) => {
    if (dragIdx === null || show) return;
    move(dragIdx, targetIdx);
    setDragIdx(null);
    setDropTargetIdx(null);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-4">
        <GripVertical className="h-4 w-4 text-muted-foreground" />
        <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Drag to reorder, or use the arrow controls</span>
      </div>
      {currentOrder.map((step, i) => {
        const ci = q.steps.find(s => s.label === step);
        const ok = show && ci && ci.correctPosition === i;
        const bad = show && ci && ci.correctPosition !== i;

        return (
          <div
            key={step}
            draggable={!show}
            onDragStart={e => { setDragIdx(i); e.dataTransfer.setData('text/plain', step); e.dataTransfer.effectAllowed = 'move'; }}
                        onDragEnd={() => { setDragIdx(null); setDropTargetIdx(null); }}
                        onDragOver={e => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; setDropTargetIdx(i); }}
                        onDragLeave={() => setDropTargetIdx(null)}
            onDrop={e => { e.preventDefault(); handleDrop(i); }}
            className={`flex items-center gap-4 px-5 py-4 rounded-2xl border text-sm transition-all shadow-sm ${
              ok ? 'bg-success/10 border-success text-success' :
              bad ? 'bg-destructive/10 border-destructive text-destructive' :
                              dropTargetIdx === i && dragIdx !== i ? 'border-accent bg-accent/20 scale-[1.02]' :
              dragIdx === i ? 'border-primary bg-primary/5 opacity-50 scale-95' :
              'border-border bg-card text-foreground hover:border-primary/40'
            } ${!show ? 'cursor-grab active:cursor-grabbing hover:shadow-md' : ''}`}
          >
            <div className={`w-6 h-6 rounded-lg flex items-center justify-center font-mono font-black text-xs ${
              ok ? 'bg-success text-success-foreground' : 'bg-muted text-muted-foreground'
            }`}>
              {i+1}
            </div>
            <span className="flex-1 font-medium">{step}</span>
            {!show && (
              <div className="flex shrink-0 gap-1">
                <button
                  type="button"
                  onClick={() => move(i, i - 1)}
                  disabled={i === 0}
                  aria-label={`Move ${step} up`}
                  className="rounded-md border border-border p-2 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-25"
                >
                  <ChevronUp className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => move(i, i + 1)}
                  disabled={i === currentOrder.length - 1}
                  aria-label={`Move ${step} down`}
                  className="rounded-md border border-border p-2 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-25"
                >
                  <ChevronDown className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
            <GripVertical className="hidden h-4 w-4 text-muted-foreground opacity-30 sm:block" />
            {ok && <CheckCircle2 className="h-4 w-4 text-success" />}
            {bad && ci && <div className="text-right flex flex-col">
              <XCircle className="h-4 w-4 text-destructive ml-auto" />
              <span className="text-[10px] font-black text-success uppercase">Correct: #{ci.correctPosition+1}</span>
            </div>}
          </div>
        );
      })}
    </div>
  );
}

function LogAnalysisPBQ({ q, ans, onAns, show }: { q: PBQLogAnalysis; ans: any; onAns: (a: any) => void; show: boolean }) {
  const current = ans || {};
  const update = (key: string, value: any) => onAns({ ...current, [key]: value });

  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-border bg-[#1e1e1e] p-6 shadow-xl">
        <div className="flex items-center gap-2 mb-4 border-b border-white/10 pb-2">
          <div className="w-3 h-3 rounded-full bg-destructive" />
          <div className="w-3 h-3 rounded-full bg-warning" />
          <div className="w-3 h-3 rounded-full bg-success" />
          <span className="ml-2 text-[10px] font-mono text-white/40 font-bold uppercase tracking-widest">system_audit.log</span>
        </div>
        <div className="font-mono text-xs space-y-1 max-h-[250px] overflow-auto custom-scrollbar">
          {q.logEntries.map((entry, i) => (
            <div key={i} className="flex gap-4 hover:bg-white/5 py-0.5 group px-2 rounded">
              <span className="text-white/20 select-none w-6 text-right group-hover:text-white/40">{i+1}</span>
              <span className={`${entry.type === 'error' ? 'text-destructive' : entry.type === 'warning' ? 'text-warning' : 'text-white/70'}`}>
                {entry.line}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="p-6 rounded-2xl bg-card border border-border shadow-sm">
          <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-3 block">1. Attack Identification</label>
          <select
            value={current.attackType || ''}
            onChange={e => update('attackType', e.target.value)}
            disabled={show}
            className="w-full px-4 py-3 text-sm bg-muted border border-border rounded-xl text-foreground focus:ring-2 focus:ring-primary/20 outline-none transition-all font-medium"
          >
            <option value="">Select attack type...</option>
            {q.attackTypeOptions.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
          {show && (
            <div className={`mt-3 text-xs font-black uppercase tracking-tighter ${current.attackType === q.correctAttackType ? 'text-success' : 'text-destructive'}`}>
              {current.attackType === q.correctAttackType ? '✓ Correct Identification' : `✗ Correct: ${q.correctAttackType}`}
            </div>
          )}
        </div>

        <div className="p-6 rounded-2xl bg-card border border-border shadow-sm">
          <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-3 block">2. Source of Threat</label>
          <select
            value={current.sourceIP || ''}
            onChange={e => update('sourceIP', e.target.value)}
            disabled={show}
            className="w-full px-4 py-3 text-sm bg-muted border border-border rounded-xl text-foreground focus:ring-2 focus:ring-primary/20 outline-none transition-all font-medium"
          >
            <option value="">Select source IP...</option>
            {q.sourceIPOptions.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
          {show && (
            <div className={`mt-3 text-xs font-black uppercase tracking-tighter ${current.sourceIP === q.correctSourceIP ? 'text-success' : 'text-destructive'}`}>
              {current.sourceIP === q.correctSourceIP ? '✓ Correct IP' : `✗ Correct: ${q.correctSourceIP}`}
            </div>
          )}
        </div>
      </div>

      <div className="p-6 rounded-2xl bg-card border border-border shadow-sm">
        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-4 block">3. Immediate Mitigation Action</label>
        <div className="grid gap-3">
          {q.responseOptions.map((opt, i) => {
            const sel = current.response === i;
            const correct = i === q.correctResponse;
            let cls = 'bg-muted/50 border-border text-foreground hover:border-primary/40';

            if (show && sel && correct) cls = 'bg-success/10 border-success text-success';
            else if (show && sel && !correct) cls = 'bg-destructive/10 border-destructive text-destructive';
            else if (show && !sel && correct) cls = 'bg-success/5 border-success/50 text-success';
            else if (sel) cls = 'bg-primary/10 border-primary text-foreground';

            return (
              <button
                key={i}
                onClick={() => !show && update('response', i)}
                disabled={show}
                className={`flex items-center gap-4 px-5 py-4 rounded-xl border text-sm text-left transition-all font-medium ${cls}`}
              >
                <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center font-mono font-black text-xs ${sel ? 'bg-primary border-primary text-primary-foreground' : 'border-muted-foreground/20 text-muted-foreground'}`}>
                  {String.fromCharCode(65+i)}
                </div>
                {opt}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function MatchingPBQ({ q, ans, onAns, show }: { q: PBQMatching; ans: Record<string, string>; onAns: (a: Record<string, string>) => void; show: boolean }) {
  const [dragItem, setDragItem] = useState<string | null>(null);
  const handleDrop = (right: string) => {
    if (!dragItem || show) return;
    onAns({...ans, [dragItem]: right});
    setDragItem(null);
  };

  const unassigned = q.items.filter(it => !Object.keys(ans || {}).includes(it.left));

  return (
    <div className="space-y-10">
      <div>
        <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-4 flex items-center gap-2">
          <GripVertical className="h-3 w-3" />
          Available Items — drag, or tap an item then tap a destination
        </h4>
        <div className="flex flex-wrap gap-3 p-6 rounded-2xl bg-muted/30 border-2 border-dashed border-border min-h-[80px]">
          {unassigned.map(it => (
            <div
              key={it.left}
              draggable={!show}
              onDragStart={e => { setDragItem(it.left); e.dataTransfer.setData('text/plain', it.left); e.dataTransfer.effectAllowed = 'move'; }}
              onDragEnd={() => setDragItem(null)}
              onClick={() => !show && setDragItem(dragItem === it.left ? null : it.left)}
              role={!show ? 'button' : undefined}
              tabIndex={!show ? 0 : undefined}
              className={`px-4 py-2 rounded-xl border bg-card text-xs font-bold text-foreground shadow-sm transition-all ${
                !show ? 'cursor-grab active:cursor-grabbing hover:border-primary/50 hover:shadow-md' : ''
              } ${dragItem === it.left ? 'border-accent ring-2 ring-accent/20' : 'border-border'}`}
            >
              {it.left}
            </div>
          ))}
          {unassigned.length === 0 && !show && <div className="text-xs font-bold text-success uppercase tracking-widest m-auto">All items assigned ✓</div>}
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        {q.rightOptions.map(right => {
          const assigned = q.items.filter(it => ans?.[it.left] === right);
          return (
            <div
              key={right}
              onDragOver={e => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; e.currentTarget.classList.add('bg-primary/5', 'border-primary/50'); }}
              onDragLeave={e => { e.currentTarget.classList.remove('bg-primary/5', 'border-primary/50'); }}
              onDrop={e => { e.preventDefault(); e.currentTarget.classList.remove('bg-primary/5', 'border-primary/50'); handleDrop(right); }}
              onClick={() => { if (dragItem && !show) handleDrop(right); }}
              className={`group rounded-2xl border-2 p-5 min-h-[120px] transition-all bg-card hover:shadow-lg ${dragItem && !show ? 'border-accent/50 cursor-pointer' : 'border-border'}`}
            >
              <h5 className="text-xs font-black uppercase tracking-widest text-primary mb-4 border-b border-primary/10 pb-2">{right}</h5>
              <div className="space-y-2">
                {assigned.map(it => {
                  const ok = show && it.correctRight === right;
                  const bad = show && it.correctRight !== right;
                  return (
                    <div key={it.left} className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
                      ok ? 'bg-success/10 border-success/50 text-success' :
                      bad ? 'bg-destructive/10 border-destructive/50 text-destructive' :
                      'bg-muted/50 border-border'
                    }`}>
                      {it.left}
                      {!show && (
                        <button
                          onClick={() => {
                            const n = {...ans};
                            delete n[it.left];
                            onAns(n);
                          }}
                          className="p-1 hover:bg-destructive/10 rounded-lg text-muted-foreground hover:text-destructive transition-colors"
                        >
                          <XCircle className="h-3.5 w-3.5" />
                        </button>
                      )}
                      {ok && <CheckCircle2 className="h-3.5 w-3.5" />}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PlacementPBQ({ q, ans, onAns, show }: { q: PBQPlacement; ans: Record<string, string>; onAns: (a: Record<string, string>) => void; show: boolean }) {
  const [dragItem, setDragItem] = useState<string | null>(null);
  const handleDrop = (zone: string) => {
    if (!dragItem || show) return;
    onAns({...ans, [dragItem]: zone});
    setDragItem(null);
  };

  const unassigned = q.items.filter(it => !Object.keys(ans || {}).includes(it.label));

  return (
    <div className="space-y-10">
      <div>
        <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-4 flex items-center gap-2">
          <GripVertical className="h-3 w-3" />
          Components to Place — drag, or tap a component then tap a zone
        </h4>
        <div className="flex flex-wrap gap-2 p-6 rounded-2xl bg-muted/30 border-2 border-dashed border-border min-h-[80px]">
          {unassigned.map(it => (
            <div
              key={it.label}
              draggable={!show}
              onDragStart={e => { setDragItem(it.label); e.dataTransfer.setData('text/plain', it.label); e.dataTransfer.effectAllowed = 'move'; }}
              onDragEnd={() => setDragItem(null)}
              onClick={() => !show && setDragItem(dragItem === it.label ? null : it.label)}
              role={!show ? 'button' : undefined}
              tabIndex={!show ? 0 : undefined}
              className={`px-3 py-2 rounded-lg border bg-card text-[10px] font-black text-foreground shadow-sm transition-all ${
                !show ? 'cursor-grab active:cursor-grabbing hover:border-primary/50' : ''
              } ${dragItem === it.label ? 'border-accent ring-2 ring-accent/20' : 'border-border'}`}
            >
              {it.label}
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
        {q.zones.map(zone => {
          const here = q.items.filter(it => ans?.[it.label] === zone);
          return (
            <div
              key={zone}
              onDragOver={e => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; e.currentTarget.classList.add('bg-primary/5', 'border-primary/50'); }}
              onDragLeave={e => { e.currentTarget.classList.remove('bg-primary/5', 'border-primary/50'); }}
              onDrop={e => { e.preventDefault(); e.currentTarget.classList.remove('bg-primary/5', 'border-primary/50'); handleDrop(zone); }}
              onClick={() => { if (dragItem && !show) handleDrop(zone); }}
              className={`flex min-h-[140px] flex-col rounded-2xl border-2 border-dashed p-5 transition-all bg-card/50 ${dragItem && !show ? 'border-accent/50 cursor-pointer' : 'border-border'}`}
            >
              <h5 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-4 border-b border-border pb-2 text-center">{zone}</h5>
              <div className="flex-1 flex flex-col gap-2">
                {here.map(it => {
                  const ok = show && it.correctZone === zone;
                  const bad = show && it.correctZone !== zone;
                  return (
                    <div key={it.label} className={`flex items-center justify-between px-3 py-2 rounded-xl text-[10px] font-black border transition-all ${
                      ok ? 'bg-success/10 border-success/50 text-success' :
                      bad ? 'bg-destructive/10 border-destructive/50 text-destructive' :
                      'bg-card border-border shadow-sm'
                    }`}>
                      {it.label}
                      {!show && (
                        <button onClick={() => {
                          const n = {...ans};
                          delete n[it.label];
                          onAns(n);
                        }} className="text-muted-foreground hover:text-destructive">
                          <XCircle className="h-3 w-3" />
                        </button>
                      )}
                      {ok && <CheckCircle2 className="h-3 w-3" />}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}


function TerminalPBQ({ q, ans, onAns, show }: { q: PBQTerminal; ans: number[]; onAns: (a: number[]) => void; show: boolean }) {
  const current = Array.isArray(ans) ? ans : [];
  const setAnswer = (taskIndex: number, optionIndex: number) => {
    if (show) return;
    const next = [...current];
    next[taskIndex] = optionIndex;
    onAns(next);
  };

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#071018] shadow-xl">
        <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
          <span className="h-2.5 w-2.5 rounded-full bg-destructive" />
          <span className="h-2.5 w-2.5 rounded-full bg-warning" />
          <span className="h-2.5 w-2.5 rounded-full bg-success" />
          <span className="ml-2 font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-white/40">incident-terminal</span>
        </div>
        <pre className="max-h-[260px] overflow-auto whitespace-pre-wrap p-5 font-mono text-xs leading-6 text-slate-200">
          {q.transcript.join('\n')}
        </pre>
      </div>

      <div className="space-y-4">
        {q.tasks.map((task, taskIndex) => {
          const selected = current[taskIndex];
          const correct = selected === task.correctIndex;
          return (
            <div key={taskIndex} className="rounded-2xl border border-border bg-card p-4 sm:p-5">
              <div className="mb-3 flex items-start gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-muted font-mono text-xs font-black text-muted-foreground">
                  {taskIndex + 1}
                </span>
                <p className="text-sm font-semibold leading-6">{task.prompt}</p>
              </div>
              <div className="grid gap-2">
                {task.options.map((option, optionIndex) => {
                  const isSelected = selected === optionIndex;
                  const isCorrect = optionIndex === task.correctIndex;
                  const cls = show
                    ? isCorrect
                      ? 'border-success/50 bg-success/10 text-success'
                      : isSelected
                        ? 'border-destructive/50 bg-destructive/10 text-destructive'
                        : 'border-border bg-muted/20 text-muted-foreground'
                    : isSelected
                      ? 'border-primary bg-primary/10 text-foreground'
                      : 'border-border bg-background/40 text-foreground hover:border-primary/40';

                  return (
                    <button
                      key={optionIndex}
                      onClick={() => setAnswer(taskIndex, optionIndex)}
                      disabled={show}
                      className={`rounded-xl border px-4 py-3 text-left font-mono text-[11px] leading-5 transition-all ${cls}`}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>
              {show && (
                <div className={`mt-3 rounded-lg border-l-2 px-3 py-2 text-xs leading-5 ${correct ? 'border-success bg-success/5 text-success' : 'border-warning bg-warning/5 text-muted-foreground'}`}>
                  {correct ? 'Correct. ' : `Correct command: ${task.options[task.correctIndex]}. `}
                  {task.feedback}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PacketAnalysisPBQ({ q, ans, onAns, show }: { q: PBQPacketAnalysis; ans: any; onAns: (a: any) => void; show: boolean }) {
  const current = ans || { packetIds: [] };
  const packetIds: string[] = Array.isArray(current.packetIds) ? current.packetIds : [];

  const update = (patch: Record<string, any>) => {
    if (show) return;
    onAns({ ...current, ...patch });
  };

  const togglePacket = (id: string) => {
    if (show) return;
    update({
      packetIds: packetIds.includes(id)
        ? packetIds.filter(packetId => packetId !== id)
        : [...packetIds, id],
    });
  };

  const samePackets =
    packetIds.length === q.suspiciousPacketIds.length &&
    [...packetIds].sort().join('|') === [...q.suspiciousPacketIds].sort().join('|');

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border bg-muted/40 px-4 py-3">
          <span className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground">Packet list</span>
          <span className="font-mono text-[10px] text-muted-foreground">Select suspicious rows</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse text-left">
            <thead className="bg-background/40">
              <tr>
                {['Sel', 'No.', 'Time', 'Source', 'Destination', 'Proto', 'Info'].map(h => (
                  <th key={h} className="border-b border-border px-3 py-2 text-[9px] font-black uppercase tracking-wider text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {q.packets.map(packet => {
                const selected = packetIds.includes(packet.id);
                const shouldSelect = q.suspiciousPacketIds.includes(packet.id);
                const rowClass = show
                  ? shouldSelect
                    ? 'bg-success/5'
                    : selected
                      ? 'bg-destructive/5'
                      : ''
                  : selected
                    ? 'bg-primary/10'
                    : 'hover:bg-muted/20';
                return (
                  <tr key={packet.id} onClick={() => togglePacket(packet.id)} className={`transition-colors ${!show ? 'cursor-pointer' : ''} ${rowClass}`}>
                    <td className="px-3 py-2">
                      <input type="checkbox" readOnly checked={selected} className="h-4 w-4 accent-current" />
                    </td>
                    <td className="px-3 py-2 font-mono text-[10px]">{packet.id}</td>
                    <td className="px-3 py-2 font-mono text-[10px] text-muted-foreground">{packet.time}</td>
                    <td className="px-3 py-2 font-mono text-[10px]">{packet.source}</td>
                    <td className="px-3 py-2 font-mono text-[10px]">{packet.destination}</td>
                    <td className="px-3 py-2 font-mono text-[10px] font-bold text-accent">{packet.protocol}</td>
                    <td className="px-3 py-2 font-mono text-[10px] text-muted-foreground">{packet.summary}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {show && (
          <div className={`border-t border-border px-4 py-3 text-xs font-bold ${samePackets ? 'text-success' : 'text-warning'}`}>
            {samePackets ? 'Packet selection correct.' : `Model selection: packets ${q.suspiciousPacketIds.join(', ')}.`}
          </div>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-4">
          <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-muted-foreground">Attack pattern</label>
          <select
            value={current.attackType || ''}
            onChange={e => update({ attackType: e.target.value })}
            disabled={show}
            className="w-full rounded-xl border border-border bg-muted px-3 py-3 text-sm"
          >
            <option value="">Select...</option>
            {q.attackOptions.map(option => <option key={option} value={option}>{option}</option>)}
          </select>
          {show && (
            <p className={`mt-2 text-xs font-bold ${current.attackType === q.correctAttackType ? 'text-success' : 'text-destructive'}`}>
              {current.attackType === q.correctAttackType ? 'Correct' : `Correct: ${q.correctAttackType}`}
            </p>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-card p-4">
          <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-muted-foreground">Best response</label>
          <div className="grid gap-2">
            {q.responseOptions.map((option, index) => {
              const selected = current.response === index;
              const correct = index === q.correctResponse;
              return (
                <button
                  key={index}
                  onClick={() => update({ response: index })}
                  disabled={show}
                  className={`rounded-xl border px-3 py-3 text-left text-xs leading-5 ${
                    show
                      ? correct
                        ? 'border-success/50 bg-success/10 text-success'
                        : selected
                          ? 'border-destructive/50 bg-destructive/10 text-destructive'
                          : 'border-border bg-muted/20 text-muted-foreground'
                      : selected
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/40'
                  }`}
                >
                  {option}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function TopologyPBQ({ q, ans, onAns, show }: { q: PBQTopology; ans: Record<string, string>; onAns: (a: Record<string, string>) => void; show: boolean }) {
  const current = ans || {};
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  const place = (zone: string) => {
    if (show || !selectedNode) return;
    onAns({ ...current, [selectedNode]: zone });
    setSelectedNode(null);
  };

  const unassigned = q.nodes.filter(node => !current[node.id]);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border bg-muted/20 p-4">
        <div className="mb-3 text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground">Required flows</div>
        <div className="flex flex-wrap gap-2">
          {q.connections.map(([from, to], index) => (
            <span key={index} className="rounded-full border border-border bg-card px-3 py-1.5 font-mono text-[10px] text-muted-foreground">
              {from} → {to}
            </span>
          ))}
        </div>
      </div>

      {!show && (
        <div className="rounded-2xl border-2 border-dashed border-border bg-background/40 p-4">
          <div className="mb-3 text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground">Unplaced components — select one, then select a zone</div>
          <div className="flex flex-wrap gap-2">
            {unassigned.map(node => (
              <button
                key={node.id}
                onClick={() => setSelectedNode(selectedNode === node.id ? null : node.id)}
                className={`rounded-xl border px-3 py-2 text-left text-xs transition-all ${
                  selectedNode === node.id ? 'border-accent bg-accent/10 text-accent ring-2 ring-accent/20' : 'border-border bg-card hover:border-primary/40'
                }`}
              >
                <span className="block font-bold">{node.label}</span>
                <span className="mt-0.5 block text-[10px] text-muted-foreground">{node.role}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {q.zones.map(zone => {
          const nodes = q.nodes.filter(node => current[node.id] === zone || (show && node.correctZone === zone && !current[node.id]));
          return (
            <section
              key={zone}
              onClick={() => place(zone)}
              className={`min-h-[180px] rounded-2xl border-2 p-4 transition-all ${
                selectedNode && !show ? 'cursor-pointer border-accent/40 bg-accent/5' : 'border-border bg-card'
              }`}
            >
              <div className="mb-4 border-b border-border pb-2 text-center text-[10px] font-black uppercase tracking-[0.12em] text-muted-foreground">
                {zone}
              </div>
              <div className="space-y-2">
                {nodes.map(node => {
                  const assigned = current[node.id] === zone;
                  const correct = node.correctZone === zone;
                  return (
                    <div
                      key={node.id}
                      className={`rounded-xl border p-3 text-xs ${
                        show
                          ? assigned && correct
                            ? 'border-success/40 bg-success/10 text-success'
                            : assigned && !correct
                              ? 'border-destructive/40 bg-destructive/10 text-destructive'
                              : 'border-success/20 bg-success/5 text-success'
                          : 'border-border bg-background/50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="font-bold">{node.label}</div>
                          <div className="mt-1 text-[10px] leading-4 text-muted-foreground">{node.role}</div>
                        </div>
                        {!show && assigned && (
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              const next = { ...current };
                              delete next[node.id];
                              onAns(next);
                            }}
                            className="text-muted-foreground hover:text-destructive"
                            aria-label={`Remove ${node.label}`}
                          >
                            <XCircle className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                      {show && assigned && !correct && (
                        <div className="mt-2 text-[10px] font-black uppercase text-success">Correct zone: {node.correctZone}</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
