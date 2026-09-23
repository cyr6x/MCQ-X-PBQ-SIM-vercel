import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { CalendarDays, Settings2 } from 'lucide-react';
import { useSettings } from '@/lib/SettingsContext';

const ROUTE_META: Record<string, { title: string; kicker: string }> = {
  '/': { title: 'Command Center', kicker: 'Training overview' },
  '/study': { title: 'Study', kicker: 'Adaptive practice' },
  '/pbq': { title: 'PBQ Lab', kicker: 'Applied security tasks' },
  '/exam': { title: 'Exam Simulation', kicker: 'Full-length rehearsal' },
  '/review': { title: 'Review', kicker: 'Remediation queue' },
  '/analytics': { title: 'Analytics', kicker: 'Performance intelligence' },
  '/settings': { title: 'Settings', kicker: 'Training controls' },
};

function daysUntil(date: string | null) {
  if (!date) return null;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(`${date}T00:00:00`);
  return Math.ceil((target.getTime() - now.getTime()) / 86_400_000);
}

export default function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { settings } = useSettings();
  const meta = ROUTE_META[location.pathname] || { title: 'SecPlus Trainer', kicker: 'SY0-701' };
  const examDays = daysUntil(settings.target_exam_date);

  return (
    <SidebarProvider defaultOpen>
      <div className="flex min-h-screen w-full bg-background text-foreground">
        <AppSidebar />
        <div className="relative flex min-w-0 flex-1 flex-col">
          <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(circle_at_20%_-10%,hsl(var(--primary)/0.08),transparent_32%),radial-gradient(circle_at_100%_0%,hsl(var(--accent)/0.05),transparent_28%)]" />
          <header className="sticky top-0 z-40 flex min-h-14 items-center gap-3 border-b border-border/75 bg-background/90 px-3 backdrop-blur-xl sm:px-5">
            <SidebarTrigger className="shrink-0" />
            <div className="h-5 w-px bg-border" />
            <div className="min-w-0">
              <div className="truncate text-[9px] font-bold uppercase tracking-[0.18em] text-muted-foreground">{meta.kicker}</div>
              <div className="truncate text-sm font-semibold">{meta.title}</div>
            </div>

            <div className="ml-auto flex items-center gap-2">
              {examDays !== null && examDays >= 0 && (
                <button
                  onClick={() => navigate('/settings')}
                  className="hidden items-center gap-2 rounded-lg border border-border bg-card/70 px-2.5 py-1.5 text-[10px] text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground sm:flex"
                >
                  <CalendarDays className="h-3.5 w-3.5 text-primary" />
                  <span>{examDays === 0 ? 'Exam today' : `${examDays}d to target`}</span>
                </button>
              )}
              <button
                onClick={() => navigate('/settings')}
                className="hidden h-8 w-8 items-center justify-center rounded-lg border border-border bg-card/70 text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground sm:flex"
                aria-label="Open training settings"
              >
                <Settings2 className="h-4 w-4" />
              </button>
            </div>
          </header>
          <main className="relative z-10 min-w-0 flex-1">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
