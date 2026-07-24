import { describe, expect, it } from 'vitest';
import type { WorkoutSet } from '../types/workout';
import { comparePerformance } from './progressionAnalysis';
import { calculatePersonalRecords } from './personalRecords';
import {
  calculateEstimatedOneRepMax,
  calculateExercisePerformance,
  calculateSetVolume,
  calculateWorkoutVolume
} from './workoutCalculations';

function set(overrides: Partial<WorkoutSet> = {}): WorkoutSet {
  return {
    id: crypto.randomUUID(),
    workoutId: 'workout',
    workoutExerciseId: 'workout-exercise',
    exerciseId: 'exercise',
    setNumber: 1,
    weight: 100,
    reps: 10,
    isWarmup: false,
    isCompleted: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides
  };
}

describe('workout calculations', () => {
  it('calculates set and workout volume while excluding warm-ups', () => {
    expect(calculateSetVolume(set())).toBe(1000);
    expect(
      calculateWorkoutVolume([
        set(),
        set({ weight: 50, reps: 5, isWarmup: true })
      ])
    ).toBe(1000);
  });

  it('uses the Epley formula only for supported repetitions', () => {
    expect(calculateEstimatedOneRepMax(set())).toBe(133.3);
    expect(calculateEstimatedOneRepMax(set({ reps: 16 }))).toBeNull();
    expect(calculateEstimatedOneRepMax(set({ weight: 0 }))).toBeNull();
  });

  it('summarises completed working sets', () => {
    expect(
      calculateExercisePerformance([set(), set({ weight: 105, reps: 8 })])
    ).toEqual({
      bestWeight: 105,
      bestEstimatedOneRepMax: 133.3,
      volume: 1840,
      completedSets: 2,
      totalReps: 18
    });
  });

  it('detects personal records without warm-up sets', () => {
    const records = calculatePersonalRecords([
      set(),
      set({ weight: 130, reps: 1, isWarmup: true })
    ]);
    expect(records.highestWeight).toBe(100);
    expect(records.highestRepsByWeight['100']).toBe(10);
  });

  it('compares current and previous sessions neutrally', () => {
    const previous = calculateExercisePerformance([set()]);
    const current = calculateExercisePerformance([
      set({ weight: 95, reps: 10 })
    ]);
    expect(comparePerformance(current, previous)).toMatchObject({
      bestWeightChange: -5,
      volumePercentChange: -5,
      isFirstSession: false
    });
  });
});
