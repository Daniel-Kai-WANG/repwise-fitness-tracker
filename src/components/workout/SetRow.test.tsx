import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { db } from '../../db/database';
import type { WorkoutSet } from '../../types/workout';
import { SetRow } from './SetRow';

afterEach(async () => {
  await db.workoutSets.clear();
});

describe('SetRow', () => {
  it('validates required values and persists set completion', async () => {
    const user = userEvent.setup();
    const set: WorkoutSet = {
      id: crypto.randomUUID(),
      workoutId: 'workout',
      workoutExerciseId: 'workout-exercise',
      exerciseId: 'bench',
      setNumber: 1,
      isWarmup: false,
      isCompleted: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    await db.workoutSets.add(set);
    const onCompleted = vi.fn();
    render(
      <SetRow
        set={set}
        trackingType="weight-reps"
        unit="kg"
        onDelete={vi.fn()}
        onCompleted={onCompleted}
      />
    );
    await user.click(screen.getByRole('button', { name: 'Complete set 1' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Enter a weight');
    await user.type(screen.getByLabelText('Set 1 weight'), '82.5');
    await user.type(screen.getByLabelText('Set 1 repetitions'), '10');
    await user.click(screen.getByRole('button', { name: 'Complete set 1' }));
    await waitFor(() => expect(onCompleted).toHaveBeenCalledOnce());
    expect(await db.workoutSets.get(set.id)).toMatchObject({
      weight: 82.5,
      reps: 10,
      isCompleted: true
    });
  });
});
