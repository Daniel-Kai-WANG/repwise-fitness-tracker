import { describe, expect, it } from 'vitest';
import type { WorkoutSession, WorkoutSet } from '../types/workout';
import { buildExerciseProgress } from './exerciseProgress';

function workout(id: string, startedAt: string): WorkoutSession {
  return {
    id,
    name: id,
    status: 'completed',
    startedAt,
    completedAt: startedAt,
    createdAt: startedAt,
    updatedAt: startedAt
  };
}

function set(
  workoutId: string,
  overrides: Partial<WorkoutSet> = {}
): WorkoutSet {
  return {
    id: crypto.randomUUID(),
    workoutId,
    workoutExerciseId: `${workoutId}-exercise`,
    exerciseId: 'bench',
    setNumber: 1,
    weight: 100,
    reps: 10,
    isWarmup: false,
    isCompleted: true,
    completedAt: '2026-01-01T00:00:00.000Z',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides
  };
}

describe('exercise progress', () => {
  it('aggregates sessions chronologically and excludes warm-ups from primary metrics', () => {
    const points = buildExerciseProgress(
      [
        workout('new', '2026-02-01T00:00:00.000Z'),
        workout('old', '2026-01-01T00:00:00.000Z')
      ],
      [
        set('new', { weight: 110 }),
        set('old'),
        set('new', { weight: 150, reps: 1, isWarmup: true })
      ],
      'bench'
    );
    expect(points.map((point) => point.workoutId)).toEqual(['old', 'new']);
    expect(points[1].bestWeight).toBe(110);
    expect(points[1].volume).toBe(1100);
  });

  it('omits unrelated and incomplete sessions', () => {
    const points = buildExerciseProgress(
      [workout('one', '2026-01-01T00:00:00.000Z')],
      [set('one', { exerciseId: 'row' }), set('one', { isCompleted: false })],
      'bench'
    );
    expect(points).toEqual([]);
  });
});
