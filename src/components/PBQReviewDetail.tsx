/**
 * Shared PBQ review card: renders the candidate's attempt and the model
 * solution side by side with per-subtask credit, so it is always possible to
 * see the EXACT answers that were missed — in the PBQ Lab summary and from the
 * Review page's saved attempts.
 */
import { getPBQCredit } from '@/lib/examEngine';
import type { PBQuestion } from '@/data/questions';
import { PBQRenderer } from '@/components/PBQRenderer';

function pbqModelAnswer(q: PBQuestion): unknown {
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
        response: q.responseOptions[q.correctResponse],
      };
    case 'packet-analysis':
      return {
        packetIds: [...q.suspiciousPacketIds],
        attackType: q.correctAttackType,
        response: q.correctResponse,
      };
    case 'terminal':
      return q.tasks.map(task => task.correctIndex);
    case 'matching':
      return Object.fromEntries(q.items.map(item => [item.left, item.correctRight]));
    case 'placement':
      return Object.fromEntries(q.items.map(item => [item.label, item.correctZone]));
    case 'topology':
      return Object.fromEntries(q.nodes.map(node => [node.id, node.correctZone]));
  }
}

export function PBQReviewDetail({ q, answer }: { q: PBQuestion; answer: unknown }) {
  const credit = getPBQCredit(q, answer);
  const percent = Math.round(credit.ratio * 100);
  const hasAttempt = answer !== undefined && answer !== null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`rounded-lg border px-3 py-2 text-xs font-bold ${
            credit.ratio === 1
              ? 'border-success/30 bg-success/10 text-success'
              : credit.ratio > 0
                ? 'border-warning/40 bg-warning/10 text-warning'
                : 'border-destructive/30 bg-destructive/10 text-destructive'
          }`}
        >
          Credit: {credit.earned}/{credit.total} subtasks ({percent}%)
        </span>
        {!hasAttempt && <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Not attempted</span>}
        <span className="text-[10px] text-muted-foreground">Training estimate only; CompTIA does not publish PBQ subtask weights.</span>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <div className="rounded-xl border border-border bg-background/40 p-3">
          <div className="mb-3 text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground">Your attempt</div>
          <PBQRenderer q={q} ans={answer} onAns={() => {}} submitted studyRevealed={false} compact />
        </div>
        <div className="rounded-xl border border-success/25 bg-success/5 p-3">
          <div className="mb-3 text-[10px] font-black uppercase tracking-[0.15em] text-success">Model solution</div>
          <PBQRenderer q={q} ans={pbqModelAnswer(q)} onAns={() => {}} submitted studyRevealed={false} compact />
        </div>
      </div>

      <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
        <div className="mb-1 text-[10px] font-black uppercase tracking-[0.15em] text-primary">Why this solution works</div>
        <p className="text-xs leading-5 text-muted-foreground">{q.explanation}</p>
      </div>
    </div>
  );
}
