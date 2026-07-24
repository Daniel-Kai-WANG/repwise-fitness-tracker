import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { FitnessDatabase } from '../database';
import {
  createExercise,
  setExerciseArchived,
  updateExercise
} from './exerciseRepository';

let database: FitnessDatabase;

beforeEach(() => {
  database = new FitnessDatabase(`exercise-test-${crypto.randomUUID()}`);
});

afterEach(async () => {
  await database.delete();
});

describe('exercise repository', () => {
  it('creates, edits, archives, and restores a custom exercise', async () => {
    const exercise = await createExercise(
      {
        name: '  Belt Squat  ',
        category: 'legs',
        equipment: 'machine',
        trackingType: 'weight-reps'
      },
      database
    );
    expect(exercise.name).toBe('Belt Squat');
    await updateExercise(exercise.id, { notes: 'Controlled tempo' }, database);
    await setExerciseArchived(exercise.id, true, database);
    expect(await database.exercises.get(exercise.id)).toMatchObject({
      notes: 'Controlled tempo',
      isArchived: true
    });
    await setExerciseArchived(exercise.id, false, database);
    expect((await database.exercises.get(exercise.id))?.isArchived).toBe(false);
  });

  it('rejects duplicate names regardless of casing', async () => {
    const draft = {
      name: 'Belt Squat',
      category: 'legs' as const,
      equipment: 'machine' as const,
      trackingType: 'weight-reps' as const
    };
    await createExercise(draft, database);
    await expect(
      createExercise({ ...draft, name: 'belt squat' }, database)
    ).rejects.toThrow('already exists');
  });
});
