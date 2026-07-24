import type { ExercisePerformance, WorkoutSet } from '../types/workout';
import { roundTo } from '../utils/number';

export function calculateSetVolume(set: Pick<WorkoutSet, 'weight' | 'reps'>) {
  return roundTo((set.weight ?? 0) * (set.reps ?? 0), 3);
}

export function calculateEstimatedOneRepMax(
  set: Pick<WorkoutSet, 'weight' | 'reps'>
): number | null {
  const weight = set.weight ?? 0;
  const reps = set.reps ?? 0;
  if (weight <= 0 || reps <= 0 || reps > 15) return null;
  return roundTo(weight * (1 + reps / 30), 1);
}

export function getCompletedWorkingSets(sets: WorkoutSet[]) {
  return sets.filter((set) => set.isCompleted && !set.isWarmup);
}

export function calculateExercisePerformance(
  sets: WorkoutSet[]
): ExercisePerformance {
  const workingSets = getCompletedWorkingSets(sets);
  return workingSets.reduce<ExercisePerformance>(
    (summary, set) => ({
      bestWeight: Math.max(summary.bestWeight, set.weight ?? 0),
      bestEstimatedOneRepMax: Math.max(
        summary.bestEstimatedOneRepMax,
        calculateEstimatedOneRepMax(set) ?? 0
      ),
      volume: roundTo(summary.volume + calculateSetVolume(set), 3),
      completedSets: summary.completedSets + 1,
      totalReps: summary.totalReps + (set.reps ?? 0)
    }),
    {
      bestWeight: 0,
      bestEstimatedOneRepMax: 0,
      volume: 0,
      completedSets: 0,
      totalReps: 0
    }
  );
}

export function calculateWorkoutVolume(sets: WorkoutSet[]) {
  return calculateExercisePerformance(sets).volume;
}

export function calculateTotalRepetitions(sets: WorkoutSet[]) {
  return getCompletedWorkingSets(sets).reduce(
    (total, set) => total + (set.reps ?? 0),
    0
  );
}
