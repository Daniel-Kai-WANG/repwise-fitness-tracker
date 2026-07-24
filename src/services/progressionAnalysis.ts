import type { ExercisePerformance } from '../types/workout';
import { roundTo } from '../utils/number';

export interface PerformanceComparison {
  bestWeightChange: number;
  bestEstimatedOneRepMaxChange: number;
  volumePercentChange: number | null;
  completedSetsChange: number;
  totalRepsChange: number;
  isFirstSession: boolean;
}

export function comparePerformance(
  current: ExercisePerformance,
  previous?: ExercisePerformance
): PerformanceComparison {
  if (!previous) {
    return {
      bestWeightChange: 0,
      bestEstimatedOneRepMaxChange: 0,
      volumePercentChange: null,
      completedSetsChange: 0,
      totalRepsChange: 0,
      isFirstSession: true
    };
  }

  return {
    bestWeightChange: roundTo(current.bestWeight - previous.bestWeight),
    bestEstimatedOneRepMaxChange: roundTo(
      current.bestEstimatedOneRepMax - previous.bestEstimatedOneRepMax
    ),
    volumePercentChange:
      previous.volume > 0
        ? roundTo(((current.volume - previous.volume) / previous.volume) * 100)
        : null,
    completedSetsChange: current.completedSets - previous.completedSets,
    totalRepsChange: current.totalReps - previous.totalReps,
    isFirstSession: false
  };
}

export function formatPerformanceChange(value: number, suffix: string) {
  if (value === 0) return 'No change';
  return value > 0
    ? `+${value}${suffix}`
    : `${Math.abs(value)}${suffix} below previous session`;
}
