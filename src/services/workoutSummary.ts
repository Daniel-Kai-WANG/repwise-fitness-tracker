import type { WorkoutExercise, WorkoutSet } from '../types/workout';
import {
  calculateExercisePerformance,
  calculateTotalRepetitions,
  calculateWorkoutVolume,
  getCompletedWorkingSets
} from './workoutCalculations';

export interface WorkoutSummaryMetrics {
  volume: number;
  completedSets: number;
  totalRepetitions: number;
  exerciseCount: number;
}

export function createWorkoutSummary(
  workoutExercises: WorkoutExercise[],
  sets: WorkoutSet[]
): WorkoutSummaryMetrics {
  const completed = sets.filter((set) => set.isCompleted);
  return {
    volume: calculateWorkoutVolume(completed),
    completedSets: completed.length,
    totalRepetitions: calculateTotalRepetitions(completed),
    exerciseCount: workoutExercises.filter((exercise) =>
      completed.some((set) => set.workoutExerciseId === exercise.id)
    ).length
  };
}

export function getExerciseSummary(
  workoutExerciseId: string,
  sets: WorkoutSet[]
) {
  return calculateExercisePerformance(
    sets.filter((set) => set.workoutExerciseId === workoutExerciseId)
  );
}

export function getBestSet(sets: WorkoutSet[]) {
  return getCompletedWorkingSets(sets).sort(
    (a, b) => (b.weight ?? 0) * (b.reps ?? 0) - (a.weight ?? 0) * (a.reps ?? 0)
  )[0];
}
