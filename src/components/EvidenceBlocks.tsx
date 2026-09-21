import { useState } from 'react';
import { ChevronDown, FileText, Network, ScrollText, Table2, TerminalSquare } from 'lucide-react';
import type { EvidenceBlock } from '@/data/questions';

const ICONS = {
  log: ScrollText,
  terminal: TerminalSquare,
  packet: Network,
  table: Table2,
  note: FileText,
} as const;

export function EvidenceBlocks({ evidence, defaultOpen = false }: { evidence?: EvidenceBlock[]; defaultOpen?: boolean }) {
  const [open, setOpen] = useState<Set<number>>(
    new Set(defaultOpen && evidence ? evidence.map((_, index) => index) : []),
  );

  if (!evidence?.length) return null;

  const toggle = (index: number) => {
    setOpen(prev => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  return (
    <div className="mb-6 space-y-3">
      {evidence.map((block, index) => {
        const Icon = ICONS[block.type];
        const expanded = open.has(index);
        return (
          <section key={`${block.title}-${index}`} className="overflow-hidden rounded-xl border border-border bg-background/50">
            <button
              type="button"
              onClick={() => toggle(index)}
              className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-muted/40"
              aria-expanded={expanded}
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border bg-card text-primary">
                <Icon className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-[10px] font-black uppercase tracking-[0.14em] text-muted-foreground">
                  {block.type === 'packet' ? 'Packet capture' : block.type}
                </div>
                <div className="truncate text-sm font-bold">{block.title}</div>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                {expanded ? 'Hide' : 'Open'}
              </span>
              <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${expanded ? 'rotate-180' : ''}`} />
            </button>

            {expanded && (
              <div className="border-t border-border">
                {block.type === 'table' ? (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[520px] border-collapse text-left text-xs">
                      <thead className="bg-muted/40">
                        <tr>
                          {block.headers.map(header => (
                            <th key={header} className="border-b border-border px-4 py-2.5 text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {block.rows.map((row, rowIndex) => (
                          <tr key={rowIndex} className="hover:bg-muted/20">
                            {row.map((cell, cellIndex) => (
                              <td key={cellIndex} className="px-4 py-2.5 font-mono text-[11px] leading-5 text-foreground/85">
                                {cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className={`overflow-x-auto p-4 ${
                    block.type === 'terminal' || block.type === 'packet' || block.type === 'log'
                      ? 'bg-[#0b0f14]'
                      : 'bg-muted/20'
                  }`}>
                    <pre className={`whitespace-pre-wrap break-words font-mono text-[11px] leading-6 ${
                      block.type === 'terminal' || block.type === 'packet' || block.type === 'log'
                        ? 'text-slate-200'
                        : 'text-foreground'
                    }`}>
                      {block.lines.join('\n')}
                    </pre>
                  </div>
                )}

                {block.caption && (
                  <div className="border-t border-border bg-muted/20 px-4 py-2.5 text-[10px] leading-4 text-muted-foreground">
                    {block.caption}
                  </div>
                )}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
