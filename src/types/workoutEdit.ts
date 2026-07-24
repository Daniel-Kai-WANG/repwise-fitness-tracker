import type { WorkoutExercise, WorkoutSet } from './workout';

export interface CompletedWorkoutExerciseDraft extends WorkoutExercise {
  sets: WorkoutSet[];
}

export interface CompletedWorkoutEditDraft {
  workoutId: string;
  name: string;
  notes?: string;
  startedAt: string;
  completedAt: string;
  exercises: CompletedWorkoutExerciseDraft[];
}
