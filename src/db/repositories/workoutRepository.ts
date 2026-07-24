import type { TemplateExercise } from '../../types/template';
import type {
  WorkoutBundle,
  WorkoutExercise,
  WorkoutSession,
  WorkoutSet
} from '../../types/workout';
import type { CompletedWorkoutEditDraft } from '../../types/workoutEdit';
import {
  normaliseCompletedWorkoutDraft,
  validateCompletedWorkoutDraft
} from '../../services/completedWorkoutEditing';
import { nowIso } from '../../utils/date';
import { createId } from '../../utils/ids';
import { db, type FitnessDatabase } from '../database';

export async function getActiveWorkouts(database: FitnessDatabase = db) {
  return database.workouts.where('status').equals('active').sortBy('startedAt');
}

export async function createWorkout(
  name: string,
  templateId?: string,
  templateExercises: TemplateExercise[] = [],
  database: FitnessDatabase = db
) {
  const timestamp = nowIso();
  return database.transaction(
    'rw',
    database.workouts,
    database.workoutExercises,
    database.workoutSets,
    async () => {
      if ((await getActiveWorkouts(database)).length > 0) {
        throw new Error(
          'Finish or cancel the active workout before starting another.'
        );
      }
      const workout: WorkoutSession = {
        id: createId(),
        templateId,
        name: name.trim(),
        status: 'active',
        startedAt: timestamp,
        createdAt: timestamp,
        updatedAt: timestamp
      };
      await database.workouts.add(workout);
      for (const item of [...templateExercises].sort(
        (a, b) => a.order - b.order
      )) {
        const workoutExercise = await addExerciseToWorkout(
          workout.id,
          item.exerciseId,
          database
        );
        const targetSets = item.targetSets ?? 3;
        for (let index = 0; index < targetSets; index += 1) {
          await addSet(workoutExercise, database, {
            weight: item.targetWeight,
            reps: item.targetRepsMin
          });
        }
      }
      return workout;
    }
  );
}

export async function addExerciseToWorkout(
  workoutId: string,
  exerciseId: string,
  database: FitnessDatabase = db
) {
  const timestamp = nowIso();
  const count = await database.workoutExercises
    .where('workoutId')
    .equals(workoutId)
    .count();
  const workoutExercise: WorkoutExercise = {
    id: createId(),
    workoutId,
    exerciseId,
    order: count,
    createdAt: timestamp,
    updatedAt: timestamp
  };
  await database.workoutExercises.add(workoutExercise);
  return workoutExercise;
}

export async function addSet(
  workoutExercise: WorkoutExercise,
  database: FitnessDatabase = db,
  values: Pick<WorkoutSet, 'weight' | 'reps' | 'durationSeconds'> = {}
) {
  const timestamp = nowIso();
  const count = await database.workoutSets
    .where('workoutExerciseId')
    .equals(workoutExercise.id)
    .count();
  const set: WorkoutSet = {
    id: createId(),
    workoutId: workoutExercise.workoutId,
    workoutExerciseId: workoutExercise.id,
    exerciseId: workoutExercise.exerciseId,
    setNumber: count + 1,
    ...values,
    isWarmup: false,
    isCompleted: false,
    createdAt: timestamp,
    updatedAt: timestamp
  };
  await database.workoutSets.add(set);
  return set;
}

export async function updateWorkoutSet(
  id: string,
  changes: Partial<
    Pick<
      WorkoutSet,
      'weight' | 'reps' | 'durationSeconds' | 'isWarmup' | 'isCompleted'
    >
  >,
  database: FitnessDatabase = db
) {
  const completedAt = changes.isCompleted
    ? nowIso()
    : changes.isCompleted === false
      ? undefined
      : undefined;
  await database.workoutSets.update(id, {
    ...changes,
    ...(changes.isCompleted !== undefined ? { completedAt } : {}),
    updatedAt: nowIso()
  });
}

export async function deleteWorkoutSet(
  id: string,
  database: FitnessDatabase = db
) {
  const set = await database.workoutSets.get(id);
  if (!set) return;
  await database.transaction('rw', database.workoutSets, async () => {
    await database.workoutSets.delete(id);
    const remaining = await database.workoutSets
      .where('workoutExerciseId')
      .equals(set.workoutExerciseId)
      .sortBy('setNumber');
    await database.workoutSets.bulkPut(
      remaining.map((item, index) => ({
        ...item,
        setNumber: index + 1,
        updatedAt: nowIso()
      }))
    );
  });
}

export async function removeWorkoutExercise(
  workoutExerciseId: string,
  database: FitnessDatabase = db
) {
  const workoutExercise =
    await database.workoutExercises.get(workoutExerciseId);
  if (!workoutExercise) return;
  await database.transaction(
    'rw',
    database.workoutExercises,
    database.workoutSets,
    async () => {
      await database.workoutSets
        .where('workoutExerciseId')
        .equals(workoutExerciseId)
        .delete();
      await database.workoutExercises.delete(workoutExerciseId);
      const remaining = await database.workoutExercises
        .where('workoutId')
        .equals(workoutExercise.workoutId)
        .sortBy('order');
      await database.workoutExercises.bulkPut(
        remaining.map((item, order) => ({
          ...item,
          order,
          updatedAt: nowIso()
        }))
      );
    }
  );
}

export async function updateWorkoutExercise(
  id: string,
  changes: Partial<Pick<WorkoutExercise, 'exerciseId' | 'order' | 'notes'>>,
  database: FitnessDatabase = db
) {
  await database.transaction(
    'rw',
    database.workoutExercises,
    database.workoutSets,
    async () => {
      await database.workoutExercises.update(id, {
        ...changes,
        updatedAt: nowIso()
      });
      if (changes.exerciseId) {
        await database.workoutSets
          .where('workoutExerciseId')
          .equals(id)
          .modify({ exerciseId: changes.exerciseId, updatedAt: nowIso() });
      }
    }
  );
}

export async function reorderWorkoutExercise(
  workoutId: string,
  workoutExerciseId: string,
  direction: -1 | 1,
  database: FitnessDatabase = db
) {
  await database.transaction('rw', database.workoutExercises, async () => {
    const exercises = await database.workoutExercises
      .where('workoutId')
      .equals(workoutId)
      .sortBy('order');
    const index = exercises.findIndex((item) => item.id === workoutExerciseId);
    const destination = index + direction;
    if (index < 0 || destination < 0 || destination >= exercises.length) return;
    [exercises[index], exercises[destination]] = [
      exercises[destination],
      exercises[index]
    ];
    await database.workoutExercises.bulkPut(
      exercises.map((item, order) => ({ ...item, order, updatedAt: nowIso() }))
    );
  });
}

export async function getWorkoutBundle(
  workoutId: string,
  database: FitnessDatabase = db
): Promise<WorkoutBundle | undefined> {
  const workout = await database.workouts.get(workoutId);
  if (!workout) return undefined;
  const [exercises, sets] = await Promise.all([
    database.workoutExercises
      .where('workoutId')
      .equals(workoutId)
      .sortBy('order'),
    database.workoutSets
      .where('workoutId')
      .equals(workoutId)
      .sortBy('setNumber')
  ]);
  return { workout, exercises, sets };
}

export async function finishWorkout(
  workoutId: string,
  durationSeconds: number,
  database: FitnessDatabase = db
) {
  await database.transaction(
    'rw',
    database.workouts,
    database.workoutSets,
    async () => {
      const incompleteIds = await database.workoutSets
        .where('workoutId')
        .equals(workoutId)
        .filter((set) => !set.isCompleted)
        .primaryKeys();
      await database.workoutSets.bulkDelete(incompleteIds);
      const timestamp = nowIso();
      await database.workouts.update(workoutId, {
        status: 'completed',
        completedAt: timestamp,
        durationSeconds,
        restTimerEndsAt: undefined,
        updatedAt: timestamp
      });
    }
  );
}

export async function cancelWorkout(
  workoutId: string,
  database: FitnessDatabase = db
) {
  await database.workouts.update(workoutId, {
    status: 'cancelled',
    restTimerEndsAt: undefined,
    updatedAt: nowIso()
  });
}

export async function updateWorkoutNotes(
  workoutId: string,
  notes: string,
  database: FitnessDatabase = db
) {
  await database.workouts.update(workoutId, {
    notes: notes.trim() || undefined,
    updatedAt: nowIso()
  });
}

export async function saveCompletedWorkoutEdit(
  draft: CompletedWorkoutEditDraft,
  database: FitnessDatabase = db
) {
  validateCompletedWorkoutDraft(draft);
  const normalised = normaliseCompletedWorkoutDraft(draft);
  await database.transaction(
    'rw',
    database.workouts,
    database.workoutExercises,
    database.workoutSets,
    database.exercises,
    async () => {
      const workout = await database.workouts.get(normalised.workoutId);
      if (!workout || workout.status !== 'completed') {
        throw new Error('Only completed workouts can be edited.');
      }
      await database.workouts.update(workout.id, {
        name: normalised.name,
        notes: normalised.notes,
        startedAt: normalised.startedAt,
        completedAt: normalised.completedAt,
        updatedAt: nowIso()
      });
      const referencedExerciseIds = [
        ...new Set(normalised.exercises.map((exercise) => exercise.exerciseId))
      ];
      const referencedExerciseCount = await database.exercises
        .where('id')
        .anyOf(referencedExerciseIds)
        .count();
      if (referencedExerciseCount !== referencedExerciseIds.length) {
        throw new Error(
          'The edit references an exercise that no longer exists.'
        );
      }
      const exerciseDefinitions = await database.exercises.bulkGet(
        referencedExerciseIds
      );
      const definitionMap = new Map(
        exerciseDefinitions
          .filter((exercise) => exercise !== undefined)
          .map((exercise) => [exercise.id, exercise])
      );
      for (const workoutExercise of normalised.exercises) {
        const definition = definitionMap.get(workoutExercise.exerciseId);
        for (const set of workoutExercise.sets) {
          if (
            definition?.trackingType === 'weight-reps' &&
            (set.weight === undefined || set.reps === undefined)
          ) {
            throw new Error(
              'Weight and repetitions are required for every completed set.'
            );
          }
          if (
            definition?.trackingType === 'reps-only' &&
            set.reps === undefined
          ) {
            throw new Error(
              'Repetitions are required for every completed set.'
            );
          }
          if (
            definition?.trackingType === 'duration' &&
            set.durationSeconds === undefined
          ) {
            throw new Error('Duration is required for every completed set.');
          }
        }
      }
      await database.workoutSets.where('workoutId').equals(workout.id).delete();
      await database.workoutExercises
        .where('workoutId')
        .equals(workout.id)
        .delete();
      await database.workoutExercises.bulkAdd(
        normalised.exercises.map((exercise) => ({
          id: exercise.id,
          workoutId: workout.id,
          exerciseId: exercise.exerciseId,
          order: exercise.order,
          notes: exercise.notes,
          createdAt: exercise.createdAt,
          updatedAt: nowIso()
        }))
      );
      await database.workoutSets.bulkAdd(
        normalised.exercises.flatMap((exercise) =>
          exercise.sets.map((set) => ({
            ...set,
            workoutId: workout.id,
            workoutExerciseId: exercise.id,
            exerciseId: exercise.exerciseId,
            completedAt: set.completedAt ?? normalised.completedAt,
            updatedAt: nowIso()
          }))
        )
      );
    }
  );
  return getWorkoutBundle(normalised.workoutId, database);
}

export async function setWorkoutRestTimer(
  workoutId: string,
  restTimerEndsAt: string | undefined,
  database: FitnessDatabase = db
) {
  const workout = await database.workouts.get(workoutId);
  if (!workout || workout.status !== 'active') return;
  await database.workouts.update(workoutId, {
    restTimerEndsAt,
    updatedAt: nowIso()
  });
}

export async function repeatWorkout(
  sourceWorkoutId: string,
  database: FitnessDatabase = db
) {
  const source = await getWorkoutBundle(sourceWorkoutId, database);
  if (!source) throw new Error('The source workout is no longer available.');
  const timestamp = nowIso();
  return database.transaction(
    'rw',
    database.workouts,
    database.workoutExercises,
    database.workoutSets,
    async () => {
      if ((await getActiveWorkouts(database)).length > 0)
        throw new Error(
          'Finish or cancel the active workout before repeating another.'
        );
      const workout: WorkoutSession = {
        id: createId(),
        templateId: source.workout.templateId,
        name: source.workout.name,
        status: 'active',
        startedAt: timestamp,
        createdAt: timestamp,
        updatedAt: timestamp
      };
      await database.workouts.add(workout);
      for (const sourceExercise of source.exercises) {
        const copiedExercise: WorkoutExercise = {
          ...sourceExercise,
          id: createId(),
          workoutId: workout.id,
          notes: sourceExercise.notes,
          createdAt: timestamp,
          updatedAt: timestamp
        };
        await database.workoutExercises.add(copiedExercise);
        const sourceSets = source.sets
          .filter((set) => set.workoutExerciseId === sourceExercise.id)
          .sort((a, b) => a.setNumber - b.setNumber);
        const setsToCopy = sourceSets.length
          ? sourceSets
          : [
              {
                setNumber: 1,
                isWarmup: false,
                weight: undefined,
                reps: undefined,
                durationSeconds: undefined
              }
            ];
        await database.workoutSets.bulkAdd(
          setsToCopy.map((set) => ({
            id: createId(),
            workoutId: workout.id,
            workoutExerciseId: copiedExercise.id,
            exerciseId: copiedExercise.exerciseId,
            setNumber: set.setNumber,
            weight: set.weight,
            reps: set.reps,
            durationSeconds: set.durationSeconds,
            isWarmup: set.isWarmup,
            isCompleted: false,
            createdAt: timestamp,
            updatedAt: timestamp
          }))
        );
      }
      return workout;
    }
  );
}

export async function deleteWorkout(
  workoutId: string,
  database: FitnessDatabase = db
) {
  await database.transaction(
    'rw',
    database.workouts,
    database.workoutExercises,
    database.workoutSets,
    async () => {
      await database.workoutSets.where('workoutId').equals(workoutId).delete();
      await database.workoutExercises
        .where('workoutId')
        .equals(workoutId)
        .delete();
      await database.workouts.delete(workoutId);
    }
  );
}

export async function getPreviousExerciseSets(
  exerciseId: string,
  beforeStartedAt: string,
  database: FitnessDatabase = db
) {
  const completedWorkouts = await database.workouts
    .where('status')
    .equals('completed')
    .filter((workout) => workout.startedAt < beforeStartedAt)
    .sortBy('startedAt');
  for (const workout of completedWorkouts.reverse()) {
    const sets = await database.workoutSets
      .where('workoutId')
      .equals(workout.id)
      .filter((set) => set.exerciseId === exerciseId && set.isCompleted)
      .sortBy('setNumber');
    if (sets.length) return sets;
  }
  return [];
}
