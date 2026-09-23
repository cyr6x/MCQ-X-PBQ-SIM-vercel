import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function PageHeader({
  eyebrow,
  title,
  description,
  icon,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  icon?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <header className="flex flex-col gap-4 border-b border-border/70 pb-5 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow && (
          <div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
            {icon}
            <span>{eyebrow}</span>
          </div>
        )}
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
        {description && (
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">{description}</p>
        )}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}

export function Panel({
  title,
  eyebrow,
  description,
  action,
  children,
  className,
}: {
  title?: string;
  eyebrow?: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn('rounded-2xl border border-border/80 bg-card/90 p-4 shadow-sm sm:p-5', className)}>
      {(title || eyebrow || action) && (
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            {eyebrow && <div className="mb-1 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">{eyebrow}</div>}
            {title && <h2 className="text-sm font-semibold">{title}</h2>}
            {description && <p className="mt-1 text-xs leading-5 text-muted-foreground">{description}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function MetricCard({
  label,
  value,
  note,
  icon,
  tone = 'default',
  onClick,
}: {
  label: string;
  value: ReactNode;
  note?: ReactNode;
  icon?: ReactNode;
  tone?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
  onClick?: () => void;
}) {
  const toneClass = {
    default: 'text-foreground',
    primary: 'text-primary',
    success: 'text-success',
    warning: 'text-warning',
    danger: 'text-destructive',
  }[tone];

  const content = (
    <>
      <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
        {icon}
        <span>{label}</span>
      </div>
      <div className={cn('mt-2 font-mono text-2xl font-semibold tracking-tight', toneClass)}>{value}</div>
      {note && <div className="mt-1 text-[11px] leading-4 text-muted-foreground">{note}</div>}
    </>
  );

  if (onClick) {
    return (
      <button
        onClick={onClick}
        className="w-full rounded-2xl border border-border/80 bg-card/90 p-4 text-left shadow-sm transition-colors hover:border-primary/40 hover:bg-muted/20"
      >
        {content}
      </button>
    );
  }

  return <div className="rounded-2xl border border-border/80 bg-card/90 p-4 shadow-sm">{content}</div>;
}

export function ProgressMeter({
  value,
  left,
  right,
  tone = 'primary',
}: {
  value: number;
  left?: ReactNode;
  right?: ReactNode;
  tone?: 'primary' | 'success' | 'warning' | 'danger';
}) {
  const width = Math.min(100, Math.max(0, value));
  const barClass = {
    primary: 'bg-primary',
    success: 'bg-success',
    warning: 'bg-warning',
    danger: 'bg-destructive',
  }[tone];
  return (
    <div>
      {(left || right) && (
        <div className="mb-1.5 flex items-center justify-between gap-3 text-[11px] text-muted-foreground">
          <span>{left}</span>
          <span className="font-mono">{right}</span>
        </div>
      )}
      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
        <div className={cn('h-full rounded-full transition-[width] duration-500', barClass)} style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}

export function StatusChip({
  children,
  tone = 'muted',
}: {
  children: ReactNode;
  tone?: 'muted' | 'primary' | 'success' | 'warning' | 'danger';
}) {
  const classes = {
    muted: 'border-border bg-muted/40 text-muted-foreground',
    primary: 'border-primary/30 bg-primary/10 text-primary',
    success: 'border-success/30 bg-success/10 text-success',
    warning: 'border-warning/30 bg-warning/10 text-warning',
    danger: 'border-destructive/30 bg-destructive/10 text-destructive',
  }[tone];
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold', classes)}>
      {children}
    </span>
  );
}
