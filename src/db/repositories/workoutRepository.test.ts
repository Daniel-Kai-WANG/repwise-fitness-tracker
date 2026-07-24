import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { buildExerciseProgress } from '../../services/exerciseProgress';
import { createCompletedWorkoutDraft } from '../../services/completedWorkoutEditing';
import { createWorkoutSummary } from '../../services/workoutSummary';
import { FitnessDatabase } from '../database';
import {
  addExerciseToWorkout,
  addSet,
  createWorkout,
  deleteWorkout,
  finishWorkout,
  getWorkoutBundle,
  getPreviousExerciseSets,
  removeWorkoutExercise,
  repeatWorkout,
  saveCompletedWorkoutEdit,
  updateWorkoutSet
} from './workoutRepository';

let database: FitnessDatabase;

beforeEach(() => {
  database = new FitnessDatabase(`test-${crypto.randomUUID()}`);
});

afterEach(async () => {
  await database.delete();
});

describe('workout repository', () => {
  const addBenchPress = () =>
    database.exercises.add({
      id: 'bench',
      name: 'Bench Press',
      category: 'chest',
      equipment: 'barbell',
      trackingType: 'weight-reps',
      isArchived: false,
      isCustom: true,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z'
    });

  it('creates, updates, and completes a workout transactionally', async () => {
    const workout = await createWorkout('Push', undefined, [], database);
    const workoutExercise = await addExerciseToWorkout(
      workout.id,
      'bench',
      database
    );
    const completedSet = await addSet(workoutExercise, database, {
      weight: 80,
      reps: 10
    });
    await addSet(workoutExercise, database, { weight: 80, reps: 8 });
    await updateWorkoutSet(completedSet.id, { isCompleted: true }, database);
    await finishWorkout(workout.id, 1800, database);

    const bundle = await getWorkoutBundle(workout.id, database);
    expect(bundle?.workout.status).toBe('completed');
    expect(bundle?.workout.durationSeconds).toBe(1800);
    expect(bundle?.sets).toHaveLength(1);
    expect(bundle?.sets[0].completedAt).toBeTruthy();
  });

  it('prevents duplicate active workouts', async () => {
    await createWorkout('First', undefined, [], database);
    await expect(
      createWorkout('Second', undefined, [], database)
    ).rejects.toThrow('active workout');
  });

  it('deletes workout children without deleting exercise definitions', async () => {
    const workout = await createWorkout('Pull', undefined, [], database);
    const workoutExercise = await addExerciseToWorkout(
      workout.id,
      'row',
      database
    );
    await addSet(workoutExercise, database, { weight: 70, reps: 12 });
    await deleteWorkout(workout.id, database);
    expect(await database.workouts.count()).toBe(0);
    expect(await database.workoutExercises.count()).toBe(0);
    expect(await database.workoutSets.count()).toBe(0);
  });

  it('creates an independent workout snapshot from template exercises', async () => {
    const templateExercises = [
      {
        exerciseId: 'bench',
        order: 0,
        targetSets: 2,
        targetRepsMin: 8,
        targetWeight: 75
      }
    ];
    const workout = await createWorkout(
      'Push',
      'template-id',
      templateExercises,
      database
    );
    templateExercises[0].targetSets = 5;
    const bundle = await getWorkoutBundle(workout.id, database);
    expect(bundle?.exercises).toHaveLength(1);
    expect(bundle?.sets).toHaveLength(2);
    expect(bundle?.sets[0]).toMatchObject({ weight: 75, reps: 8 });
  });

  it('loads the latest prior session that contains the requested exercise', async () => {
    const older = await createWorkout('Older', undefined, [], database);
    const olderExercise = await addExerciseToWorkout(
      older.id,
      'bench',
      database
    );
    const olderSet = await addSet(olderExercise, database, {
      weight: 80,
      reps: 10
    });
    await updateWorkoutSet(olderSet.id, { isCompleted: true }, database);
    await finishWorkout(older.id, 1200, database);
    await database.workouts.update(older.id, {
      startedAt: '2026-01-01T00:00:00.000Z'
    });

    const newer = await createWorkout(
      'Newer without bench',
      undefined,
      [],
      database
    );
    await finishWorkout(newer.id, 600, database);
    await database.workouts.update(newer.id, {
      startedAt: '2026-01-02T00:00:00.000Z'
    });

    const previous = await getPreviousExerciseSets(
      'bench',
      '2026-01-03T00:00:00.000Z',
      database
    );
    expect(previous).toHaveLength(1);
    expect(previous[0].weight).toBe(80);
  });

  it('removes an exercise and its sets without touching the workout', async () => {
    const workout = await createWorkout('Legs', undefined, [], database);
    const workoutExercise = await addExerciseToWorkout(
      workout.id,
      'squat',
      database
    );
    await addSet(workoutExercise, database, { weight: 100, reps: 5 });
    await removeWorkoutExercise(workoutExercise.id, database);
    expect(await database.workouts.get(workout.id)).toBeTruthy();
    expect(await database.workoutExercises.count()).toBe(0);
    expect(await database.workoutSets.count()).toBe(0);
  });

  it('repeats completed history into a new editable active workout', async () => {
    const source = await createWorkout('Upper', undefined, [], database);
    const sourceExercise = await addExerciseToWorkout(
      source.id,
      'row',
      database
    );
    const sourceSet = await addSet(sourceExercise, database, {
      weight: 70,
      reps: 10
    });
    await updateWorkoutSet(sourceSet.id, { isCompleted: true }, database);
    await finishWorkout(source.id, 900, database);
    const repeated = await repeatWorkout(source.id, database);
    const bundle = await getWorkoutBundle(repeated.id, database);
    expect(bundle?.workout.status).toBe('active');
    expect(bundle?.workout.id).not.toBe(source.id);
    expect(bundle?.sets[0]).toMatchObject({
      weight: 70,
      reps: 10,
      isCompleted: false
    });
  });

  it('saves completed edits and recalculates summaries from the edited sets', async () => {
    await addBenchPress();
    const workout = await createWorkout(
      'Original push',
      undefined,
      [],
      database
    );
    const workoutExercise = await addExerciseToWorkout(
      workout.id,
      'bench',
      database
    );
    const firstSet = await addSet(workoutExercise, database, {
      weight: 80,
      reps: 10
    });
    const secondSet = await addSet(workoutExercise, database, {
      weight: 80,
      reps: 8
    });
    await updateWorkoutSet(firstSet.id, { isCompleted: true }, database);
    await updateWorkoutSet(secondSet.id, { isCompleted: true }, database);
    await finishWorkout(workout.id, 1200, database);

    const original = await getWorkoutBundle(workout.id, database);
    const draft = createCompletedWorkoutDraft(original!);
    draft.name = 'Edited push';
    draft.notes = '  Strong finish  ';
    draft.exercises[0].sets[0].weight = 100;
    draft.exercises[0].sets[0].reps = 5;
    draft.exercises[0].sets[0].isWarmup = true;
    draft.exercises[0].sets[1].weight = 90;
    draft.exercises[0].sets[1].reps = 8;

    const saved = await saveCompletedWorkoutEdit(draft, database);
    const summary = createWorkoutSummary(saved!.exercises, saved!.sets);
    const progress = buildExerciseProgress(
      [saved!.workout],
      saved!.sets,
      'bench'
    );

    expect(saved?.workout).toMatchObject({
      name: 'Edited push',
      notes: 'Strong finish'
    });
    expect(summary).toMatchObject({
      volume: 720,
      completedSets: 2,
      totalRepetitions: 8
    });
    expect(progress[0]).toMatchObject({
      bestWeight: 90,
      volume: 720,
      totalRepetitions: 8
    });
  });

  it('rolls back every completed-workout change when the edit is invalid', async () => {
    await addBenchPress();
    const workout = await createWorkout(
      'Original push',
      undefined,
      [],
      database
    );
    const workoutExercise = await addExerciseToWorkout(
      workout.id,
      'bench',
      database
    );
    const set = await addSet(workoutExercise, database, {
      weight: 80,
      reps: 10
    });
    await updateWorkoutSet(set.id, { isCompleted: true }, database);
    await finishWorkout(workout.id, 1200, database);

    const original = await getWorkoutBundle(workout.id, database);
    const draft = createCompletedWorkoutDraft(original!);
    draft.name = 'This must roll back';
    draft.exercises[0].exerciseId = 'missing-exercise';

    await expect(saveCompletedWorkoutEdit(draft, database)).rejects.toThrow(
      'no longer exists'
    );
    const persisted = await getWorkoutBundle(workout.id, database);
    expect(persisted?.workout.name).toBe('Original push');
    expect(persisted?.exercises).toEqual(original?.exercises);
    expect(persisted?.sets).toEqual(original?.sets);
  });
});
