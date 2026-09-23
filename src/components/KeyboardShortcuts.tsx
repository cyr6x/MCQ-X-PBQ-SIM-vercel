/**
 * Global keyboard shortcuts:
 *   g d → Dashboard,  g s → Study,  g p → PBQ,
 *   g e → Exam,       g r → Review, g a → Analytics,  g , → Settings
 *   ?   → Help dialog
 *
 * Shortcuts are ignored while typing inside form fields.
 */
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Keyboard } from 'lucide-react';

const ROUTES: Record<string, string> = {
  d: '/', s: '/study', p: '/pbq', e: '/exam', r: '/review', a: '/analytics', ',': '/settings',
};

export function KeyboardShortcuts() {
  const navigate = useNavigate();
  const location = useLocation();
  const [helpOpen, setHelpOpen] = useState(false);

  useEffect(() => {
    // Global trainer shortcuts would let a candidate escape the strict exam
    // shell, which is the opposite of the test environment being simulated.
    if (location.pathname === '/exam') {
      setHelpOpen(false);
      return;
    }
    let lastG = 0;
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      if (e.key === '?') { e.preventDefault(); setHelpOpen((v) => !v); return; }
      if (e.key === 'g') { lastG = Date.now(); return; }
      if (Date.now() - lastG < 1200 && ROUTES[e.key]) {
        e.preventDefault();
        navigate(ROUTES[e.key]);
        lastG = 0;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [navigate, location.pathname]);

  return (
    <Dialog open={helpOpen} onOpenChange={setHelpOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="w-4 h-4" /> Keyboard shortcuts
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-2 text-sm">
          {[
            ['g d', 'Dashboard'],
            ['g s', 'Study Mode'],
            ['g p', 'PBQ Lab'],
            ['g e', 'Practice Exams'],
            ['g r', 'Review'],
            ['g a', 'Analytics'],
            ['g ,', 'Settings'],
            ['?', 'Toggle this help'],
          ].map(([keys, label]) => (
            <div key={keys} className="flex items-center justify-between border-b border-border/50 pb-1.5">
              <span className="text-muted-foreground">{label}</span>
              <kbd className="font-mono text-xs bg-muted px-2 py-0.5 rounded border border-border">{keys}</kbd>
            </div>
          ))}
        </div>
        <p className="text-[11px] text-muted-foreground mt-2">Shortcuts are disabled while typing in inputs.</p>
      </DialogContent>
    </Dialog>
  );
}
