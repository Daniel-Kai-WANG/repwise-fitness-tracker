import type { Exercise } from './exercise';
import type { AppSettings } from './settings';
import type { WorkoutTemplate } from './template';
import type { WorkoutExercise, WorkoutSession, WorkoutSet } from './workout';

export interface FitnessTrackerBackup {
  schemaVersion: 1;
  appVersion: string;
  exportedAt: string;
  data: {
    exercises: Exercise[];
    templates: WorkoutTemplate[];
    workouts: WorkoutSession[];
    workoutExercises: WorkoutExercise[];
    workoutSets: WorkoutSet[];
    settings: AppSettings[];
  };
}

export interface BackupSummary {
  exercises: number;
  templates: number;
  workouts: number;
  sets: number;
  exportedAt: string;
}

export interface BackupMergeCounts {
  add: number;
  update: number;
  conflicts: number;
  invalid: number;
  skipped: number;
}

export interface BackupMergePreview {
  backup?: FitnessTrackerBackup;
  counts: BackupMergeCounts;
  issues: string[];
  canMerge: boolean;
}
