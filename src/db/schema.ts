export const databaseName = 'fitnessTrackerDB';

export const databaseStores = {
  exercises: 'id, name, category, equipment, isArchived, createdAt',
  templates: 'id, name, createdAt, updatedAt',
  workouts: 'id, status, startedAt, completedAt, templateId',
  workoutExercises: 'id, workoutId, exerciseId, [workoutId+order]',
  workoutSets:
    'id, workoutId, workoutExerciseId, exerciseId, completedAt, [exerciseId+completedAt]',
  settings: 'id'
};
