import type { Exercise, ExerciseCategory, Equipment } from '../types/exercise';
import type { AppSettings } from '../types/settings';
import { nowIso } from '../utils/date';
import { createId } from '../utils/ids';
import { db, type FitnessDatabase } from './database';

const exerciseGroups: Array<[ExerciseCategory, Equipment, string[]]> = [
  ['chest', 'barbell', ['Barbell Bench Press', 'Incline Barbell Bench Press']],
  [
    'chest',
    'dumbbell',
    ['Dumbbell Bench Press', 'Incline Dumbbell Bench Press']
  ],
  ['chest', 'machine', ['Machine Chest Press', 'Pec Deck']],
  ['chest', 'cable', ['Cable Fly']],
  [
    'back',
    'cable',
    ['Lat Pulldown', 'Seated Cable Row', 'Straight-Arm Pulldown']
  ],
  ['back', 'bodyweight', ['Pull-Up']],
  ['back', 'barbell', ['Barbell Row']],
  ['back', 'machine', ['Chest-Supported Row']],
  ['back', 'dumbbell', ['One-Arm Dumbbell Row']],
  ['shoulders', 'barbell', ['Barbell Overhead Press']],
  [
    'shoulders',
    'dumbbell',
    ['Dumbbell Shoulder Press', 'Dumbbell Lateral Raise']
  ],
  ['shoulders', 'machine', ['Machine Shoulder Press', 'Reverse Pec Deck']],
  ['shoulders', 'cable', ['Cable Lateral Raise', 'Face Pull']],
  ['biceps', 'barbell', ['Barbell Curl']],
  ['biceps', 'dumbbell', ['Dumbbell Curl', 'Hammer Curl']],
  ['biceps', 'machine', ['Preacher Curl']],
  ['biceps', 'cable', ['Cable Curl']],
  ['triceps', 'cable', ['Cable Pushdown', 'Overhead Cable Extension']],
  ['triceps', 'barbell', ['Skull Crusher', 'Close-Grip Bench Press']],
  ['triceps', 'machine', ['Assisted Dip']],
  ['legs', 'barbell', ['Back Squat', 'Front Squat', 'Romanian Deadlift']],
  [
    'legs',
    'machine',
    [
      'Leg Press',
      'Leg Extension',
      'Seated Leg Curl',
      'Lying Leg Curl',
      'Standing Calf Raise',
      'Seated Calf Raise'
    ]
  ],
  ['legs', 'dumbbell', ['Walking Lunge']],
  ['core', 'cable', ['Cable Crunch']],
  ['core', 'bodyweight', ['Hanging Leg Raise', 'Ab Wheel Rollout', 'Plank']]
];

export const defaultExercises: Exercise[] = exerciseGroups.flatMap(
  ([category, equipment, names]) =>
    names.map((name) => ({
      id: `default-${name.toLowerCase().replaceAll(/[^a-z0-9]+/g, '-')}`,
      name,
      category,
      equipment,
      trackingType:
        name === 'Plank'
          ? 'duration'
          : name === 'Pull-Up'
            ? 'reps-only'
            : 'weight-reps',
      isArchived: false,
      isCustom: false,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z'
    }))
);

export function createDefaultSettings(): AppSettings {
  const timestamp = nowIso();
  return {
    id: 'app-settings',
    weightUnit: 'kg',
    theme: 'system',
    language: 'system',
    defaultRestSeconds: 90,
    showWarmupSets: true,
    hasCompletedOnboarding: false,
    createdAt: timestamp,
    updatedAt: timestamp
  };
}

export async function seedDatabase(database: FitnessDatabase = db) {
  await database.transaction(
    'rw',
    database.exercises,
    database.settings,
    async () => {
      const existingExerciseCount = await database.exercises.count();
      if (existingExerciseCount === 0)
        await database.exercises.bulkAdd(defaultExercises);
      if (!(await database.settings.get('app-settings'))) {
        await database.settings.add(createDefaultSettings());
      }
    }
  );
}

export async function loadDemoData(database: FitnessDatabase = db) {
  if (
    await database.workouts
      .filter((workout) => workout.name.startsWith('Demo ·'))
      .count()
  )
    throw new Error('Demo data is already loaded.');
  const exerciseId = 'default-barbell-bench-press';
  const sessions = [
    { daysAgo: 7, weight: 70, reps: 10 },
    { daysAgo: 2, weight: 75, reps: 9 }
  ];
  await database.transaction(
    'rw',
    database.workouts,
    database.workoutExercises,
    database.workoutSets,
    async () => {
      for (const session of sessions) {
        const completed = new Date(Date.now() - session.daysAgo * 86400000);
        const started = new Date(completed.getTime() - 2700000);
        const workoutId = createId();
        const workoutExerciseId = createId();
        await database.workouts.add({
          id: workoutId,
          name: 'Demo · Push',
          status: 'completed',
          startedAt: started.toISOString(),
          completedAt: completed.toISOString(),
          durationSeconds: 2700,
          createdAt: started.toISOString(),
          updatedAt: completed.toISOString()
        });
        await database.workoutExercises.add({
          id: workoutExerciseId,
          workoutId,
          exerciseId,
          order: 0,
          createdAt: started.toISOString(),
          updatedAt: completed.toISOString()
        });
        await database.workoutSets.bulkAdd(
          [0, 1, 2].map((index) => ({
            id: createId(),
            workoutId,
            workoutExerciseId,
            exerciseId,
            setNumber: index + 1,
            weight: session.weight,
            reps: session.reps - index,
            isWarmup: false,
            isCompleted: true,
            completedAt: completed.toISOString(),
            createdAt: started.toISOString(),
            updatedAt: completed.toISOString()
          }))
        );
      }
    }
  );
}
