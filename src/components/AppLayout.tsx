import { Outlet } from 'react-router-dom';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Shield } from 'lucide-react';

export default function AppLayout() {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-12 flex items-center gap-3 border-b border-border px-3 sticky top-0 bg-background/80 backdrop-blur z-30">
            <SidebarTrigger />
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" />
              <span className="text-sm font-mono font-semibold">SecPlus Trainer</span>
              <span className="text-[10px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                SY0-701
              </span>
            </div>
            <span className="ml-auto hidden sm:inline-flex items-center gap-1 text-[10px] font-mono text-muted-foreground">
              Press <kbd className="bg-muted px-1.5 py-0.5 rounded border border-border">?</kbd> for shortcuts
            </span>
          </header>
          <main className="flex-1 min-w-0">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
