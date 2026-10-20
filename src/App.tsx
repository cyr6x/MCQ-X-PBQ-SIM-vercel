import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Navigate, Route, Routes } from "react-router-dom";
import { lazy } from "react";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import AppLayout from "./components/AppLayout";
import { SettingsProvider } from "./lib/SettingsContext";
import { KeyboardShortcuts } from "./components/KeyboardShortcuts";

// Route-level chunks: the shell paints immediately, each screen loads async.
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const StudyPage = lazy(() => import("./pages/StudyPage"));
const PBQPage = lazy(() => import("./pages/PBQPage"));
const ExamPage = lazy(() => import("./pages/ExamPage"));
const ReviewPage = lazy(() => import("./pages/ReviewPage"));
const AnalyticsPage = lazy(() => import("./pages/AnalyticsPage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const NotFoundLazy = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <SettingsProvider>
      <HashRouter>
        <KeyboardShortcuts />
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/study" element={<StudyPage />} />
            <Route path="/pbq" element={<PBQPage />} />
            <Route path="/exam" element={<ExamPage />} />
            <Route path="/review" element={<ReviewPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/sim" element={<Navigate to="/exam" replace />} />
            <Route path="*" element={<NotFoundLazy />} />
          </Route>
        </Routes>
      </HashRouter>
      </SettingsProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
