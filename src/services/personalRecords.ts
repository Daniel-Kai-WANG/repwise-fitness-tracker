import type { PersonalRecords, WorkoutSet } from '../types/workout';
import {
  calculateEstimatedOneRepMax,
  calculateExercisePerformance,
  calculateSetVolume,
  getCompletedWorkingSets
} from './workoutCalculations';

export function calculatePersonalRecords(sets: WorkoutSet[]): PersonalRecords {
  const workingSets = getCompletedWorkingSets(sets);
  const highestRepsByWeight: Record<string, number> = {};

  for (const set of workingSets) {
    const key = String(set.weight ?? 0);
    highestRepsByWeight[key] = Math.max(
      highestRepsByWeight[key] ?? 0,
      set.reps ?? 0
    );
  }

  return {
    highestWeight: Math.max(0, ...workingSets.map((set) => set.weight ?? 0)),
    highestEstimatedOneRepMax: Math.max(
      0,
      ...workingSets.map((set) => calculateEstimatedOneRepMax(set) ?? 0)
    ),
    highestSingleSetVolume: Math.max(0, ...workingSets.map(calculateSetVolume)),
    highestExerciseVolume: calculateExercisePerformance(workingSets).volume,
    highestRepsByWeight
  };
}

export function findRecordLabels(
  currentSets: WorkoutSet[],
  previousSets: WorkoutSet[]
) {
  const current = calculatePersonalRecords(currentSets);
  const previous = calculatePersonalRecords(previousSets);
  const labels: string[] = [];
  if (current.highestWeight > previous.highestWeight)
    labels.push('Highest weight');
  if (current.highestEstimatedOneRepMax > previous.highestEstimatedOneRepMax) {
    labels.push('Estimated 1RM');
  }
  if (current.highestSingleSetVolume > previous.highestSingleSetVolume) {
    labels.push('Single-set volume');
  }
  if (current.highestExerciseVolume > previous.highestExerciseVolume) {
    labels.push('Exercise volume');
  }
  for (const [weight, reps] of Object.entries(current.highestRepsByWeight)) {
    if (reps > (previous.highestRepsByWeight[weight] ?? 0)) {
      labels.push(`Repetitions at ${weight} kg`);
      break;
    }
  }
  return labels;
}
