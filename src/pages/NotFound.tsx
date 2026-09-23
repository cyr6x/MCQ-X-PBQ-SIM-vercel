import { Link } from 'react-router-dom';
import { ArrowLeft, ShieldAlert } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg rounded-2xl border border-border bg-card/90 p-7 text-center shadow-sm">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
          <ShieldAlert className="h-6 w-6" />
        </div>
        <div className="mt-5 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">404 · Route not found</div>
        <h1 className="mt-2 text-xl font-semibold">This training route does not exist.</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Return to the command center and continue from your current training state.
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground hover:opacity-90"
        >
          <ArrowLeft className="h-4 w-4" />
          Command Center
        </Link>
      </div>
    </div>
  );
}
