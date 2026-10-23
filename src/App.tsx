import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createHashRouter,
  RouterProvider,
  useBlocker,
} from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import AppLayout from "./components/AppLayout";
import DashboardPage from "./pages/DashboardPage";
import StudyPage from "./pages/StudyPage";
import PBQPage from "./pages/PBQPage";
import ExamPage from "./pages/ExamPage";
import ReviewPage from "./pages/ReviewPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import SettingsPage from "./pages/SettingsPage";
import NotFound from "./pages/NotFound.tsx";
import { SettingsProvider } from "./lib/SettingsContext";
import { KeyboardShortcuts } from "./components/KeyboardShortcuts";
import { confirmLeaveExam, isSessionActive } from "@/lib/examSession";

const queryClient = new QueryClient();

/**
 * Single navigation guard for live sessions:
 *  - Exam in progress: the user is asked once; leaving NEVER ends the exam —
 *    it is saved (answers, flags, remaining time, pause state) and resumable
 *    from the Exams page, so they can always go back. Covers the Settings
 *    link, every other nav target, keyboard shortcuts, the browser back
 *    button and manual URL changes alike.
 *  - Study / PBQ practice in progress: the user is warned the session is lost.
 */
export function LeaveGuard() {
  const blocker = useBlocker(() => isSessionActive());

  useEffect(() => {
    if (blocker.state !== "blocked") return;
    if (confirmLeaveExam()) blocker.proceed();
    else blocker.reset();
  }, [blocker]);

  return null;
}

/** Trainer shell: shortcuts + navigation guard wrap the routed layout. */
function AppShell() {
  return (
    <>
      <KeyboardShortcuts />
      <LeaveGuard />
      <AppLayout />
    </>
  );
}

const router = createHashRouter([
  {
    element: <AppShell />,
    children: [
      { path: "/", element: <DashboardPage /> },
      { path: "/study", element: <StudyPage /> },
      { path: "/pbq", element: <PBQPage /> },
      { path: "/exam", element: <ExamPage /> },
      { path: "/review", element: <ReviewPage /> },
      { path: "/analytics", element: <AnalyticsPage /> },
      { path: "/settings", element: <SettingsPage /> },
      { path: "*", element: <NotFound /> },
    ],
  },
]);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <SettingsProvider>
        <RouterProvider router={router} />
      </SettingsProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
