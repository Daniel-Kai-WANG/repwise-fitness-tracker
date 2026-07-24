import type { WorkoutSession, WorkoutSet } from '../types/workout';
import {
  calculateExercisePerformance,
  getCompletedWorkingSets
} from './workoutCalculations';

export type ProgressMetric =
  'estimatedOneRepMax' | 'bestWeight' | 'volume' | 'totalRepetitions';

export interface ExerciseProgressPoint {
  workoutId: string;
  date: string;
  estimatedOneRepMax: number;
  bestWeight: number;
  volume: number;
  totalRepetitions: number;
  sets: WorkoutSet[];
}

export function buildExerciseProgress(
  workouts: WorkoutSession[],
  sets: WorkoutSet[],
  exerciseId: string
) {
  return workouts
    .filter((workout) => workout.status === 'completed')
    .sort((a, b) => a.startedAt.localeCompare(b.startedAt))
    .map((workout): ExerciseProgressPoint | null => {
      const sessionSets = sets.filter(
        (set) =>
          set.workoutId === workout.id &&
          set.exerciseId === exerciseId &&
          set.isCompleted
      );
      if (!sessionSets.length) return null;
      const performance = calculateExercisePerformance(sessionSets);
      return {
        workoutId: workout.id,
        date: workout.completedAt ?? workout.startedAt,
        estimatedOneRepMax: performance.bestEstimatedOneRepMax,
        bestWeight: performance.bestWeight,
        volume: performance.volume,
        totalRepetitions: performance.totalReps,
        sets: sessionSets
      };
    })
    .filter((point): point is ExerciseProgressPoint => point !== null);
}

export function getLatestWorkingWeight(points: ExerciseProgressPoint[]) {
  const latest = points.at(-1);
  if (!latest) return 0;
  const workingSets = getCompletedWorkingSets(latest.sets);
  return workingSets.at(-1)?.weight ?? 0;
}

export function getAllTimeBest(
  points: ExerciseProgressPoint[],
  metric: ProgressMetric
) {
  return Math.max(0, ...points.map((point) => point[metric]));
}
