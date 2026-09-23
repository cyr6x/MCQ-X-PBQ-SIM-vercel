import { NavLink, useLocation } from 'react-router-dom';
import {
  BarChart3,
  BookOpen,
  Gauge,
  History,
  Layers3,
  Settings,
  ShieldCheck,
  Target,
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  useSidebar,
} from '@/components/ui/sidebar';

const groups = [
  {
    label: 'Train',
    items: [
      { title: 'Command Center', url: '/', icon: Gauge },
      { title: 'Study', url: '/study', icon: BookOpen },
      { title: 'PBQ Lab', url: '/pbq', icon: Layers3 },
      { title: 'Exam Simulation', url: '/exam', icon: Target },
    ],
  },
  {
    label: 'Improve',
    items: [
      { title: 'Review', url: '/review', icon: History },
      { title: 'Analytics', url: '/analytics', icon: BarChart3 },
    ],
  },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const { pathname } = useLocation();

  const isActive = (url: string) => url === '/' ? pathname === '/' : pathname.startsWith(url);

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border/80">
      <SidebarHeader className="p-3">
        <NavLink to="/" className="flex min-h-11 items-center gap-3 rounded-xl px-1">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-primary/25 bg-primary/10 text-primary">
            <ShieldCheck className="h-5 w-5" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <div className="truncate text-sm font-bold tracking-tight">SecPlus Trainer</div>
              <div className="mt-0.5 font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground">SY0-701 · Training OS</div>
            </div>
          )}
        </NavLink>
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent className="px-1 py-2">
        {groups.map((group) => (
          <SidebarGroup key={group.label} className="py-2">
            <SidebarGroupLabel className="text-[9px] font-bold uppercase tracking-[0.18em] text-muted-foreground/70">
              {group.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive(item.url)}
                      tooltip={item.title}
                      className="h-10 rounded-lg data-[active=true]:bg-primary/10 data-[active=true]:text-primary"
                    >
                      <NavLink to={item.url} end={item.url === '/'} className="flex items-center gap-3">
                        <item.icon className="h-4 w-4" />
                        {!collapsed && <span className="text-sm">{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarSeparator />

      <SidebarFooter className="p-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={isActive('/settings')}
              tooltip="Settings"
              className="h-10 rounded-lg data-[active=true]:bg-primary/10 data-[active=true]:text-primary"
            >
              <NavLink to="/settings" className="flex items-center gap-3">
                <Settings className="h-4 w-4" />
                {!collapsed && <span className="text-sm">Settings</span>}
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        {!collapsed && (
          <div className="mt-2 rounded-xl border border-sidebar-border bg-sidebar-accent/50 px-3 py-2.5">
            <div className="text-[9px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Training principle</div>
            <p className="mt-1 text-[11px] leading-4 text-sidebar-foreground/75">
              Learn the miss. Retest it. Then prove it under time.
            </p>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
