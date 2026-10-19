import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Route, Routes } from "react-router-dom";
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
import WelcomeScreen from "./screens/WelcomeScreen";
import ExamScreen from "./screens/ExamScreen";
import ResultsScreen from "./screens/ResultsScreen";
import ReviewScreen from "./screens/ReviewScreen";
import { SettingsProvider } from "./lib/SettingsContext";
import { KeyboardShortcuts } from "./components/KeyboardShortcuts";

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
          {/* Reference-simulator flow (fullscreen screens, no app chrome) */}
          <Route path="/sim/welcome" element={<WelcomeScreen />} />
          <Route path="/sim/exam" element={<ExamScreen />} />
          <Route path="/sim/results" element={<ResultsScreen />} />
          <Route path="/sim/review" element={<ReviewScreen />} />

          <Route element={<AppLayout />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/study" element={<StudyPage />} />
            <Route path="/pbq" element={<PBQPage />} />
            <Route path="/exam" element={<ExamPage />} />
            <Route path="/review" element={<ReviewPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/sim" element={<WelcomeScreen />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </HashRouter>
      </SettingsProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
