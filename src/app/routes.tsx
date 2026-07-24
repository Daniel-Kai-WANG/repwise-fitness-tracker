import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { LoadingState } from '../components/common/LoadingState';
import { AppShell } from '../components/layout/AppShell';

const DashboardPage = lazy(() =>
  import('../pages/DashboardPage').then((module) => ({
    default: module.DashboardPage
  }))
);
const StartWorkoutPage = lazy(() =>
  import('../pages/StartWorkoutPage').then((module) => ({
    default: module.StartWorkoutPage
  }))
);
const ActiveWorkoutPage = lazy(() =>
  import('../pages/ActiveWorkoutPage').then((module) => ({
    default: module.ActiveWorkoutPage
  }))
);
const WorkoutSummaryPage = lazy(() =>
  import('../pages/WorkoutSummaryPage').then((module) => ({
    default: module.WorkoutSummaryPage
  }))
);
const WorkoutHistoryPage = lazy(() =>
  import('../pages/WorkoutHistoryPage').then((module) => ({
    default: module.WorkoutHistoryPage
  }))
);
const WorkoutDetailPage = lazy(() =>
  import('../pages/WorkoutDetailPage').then((module) => ({
    default: module.WorkoutDetailPage
  }))
);
const ExercisesPage = lazy(() =>
  import('../pages/ExercisesPage').then((module) => ({
    default: module.ExercisesPage
  }))
);
const ExerciseDetailPage = lazy(() =>
  import('../pages/ExerciseDetailPage').then((module) => ({
    default: module.ExerciseDetailPage
  }))
);
const TemplatesPage = lazy(() =>
  import('../pages/TemplatesPage').then((module) => ({
    default: module.TemplatesPage
  }))
);
const TemplateEditorPage = lazy(() =>
  import('../pages/TemplateEditorPage').then((module) => ({
    default: module.TemplateEditorPage
  }))
);
const SettingsPage = lazy(() =>
  import('../pages/SettingsPage').then((module) => ({
    default: module.SettingsPage
  }))
);

export function AppRoutes() {
  return (
    <Suspense fallback={<LoadingState label="Opening page" />}>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<DashboardPage />} />
          <Route path="workout/start" element={<StartWorkoutPage />} />
          <Route
            path="workout/active/:workoutId"
            element={<ActiveWorkoutPage />}
          />
          <Route
            path="workout/summary/:workoutId"
            element={<WorkoutSummaryPage />}
          />
          <Route path="history" element={<WorkoutHistoryPage />} />
          <Route path="history/:workoutId" element={<WorkoutDetailPage />} />
          <Route path="exercises" element={<ExercisesPage />} />
          <Route
            path="exercises/:exerciseId"
            element={<ExerciseDetailPage />}
          />
          <Route path="templates" element={<TemplatesPage />} />
          <Route path="templates/new" element={<TemplateEditorPage />} />
          <Route
            path="templates/:templateId/edit"
            element={<TemplateEditorPage />}
          />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
