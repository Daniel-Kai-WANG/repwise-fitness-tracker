import Dexie, { type EntityTable } from 'dexie';
import type { Exercise } from '../types/exercise';
import type { AppSettings } from '../types/settings';
import type { WorkoutTemplate } from '../types/template';
import type {
  WorkoutExercise,
  WorkoutSession,
  WorkoutSet
} from '../types/workout';
import { databaseName, databaseStores } from './schema';

export class FitnessDatabase extends Dexie {
  exercises!: EntityTable<Exercise, 'id'>;
  templates!: EntityTable<WorkoutTemplate, 'id'>;
  workouts!: EntityTable<WorkoutSession, 'id'>;
  workoutExercises!: EntityTable<WorkoutExercise, 'id'>;
  workoutSets!: EntityTable<WorkoutSet, 'id'>;
  settings!: EntityTable<AppSettings, 'id'>;

  constructor(name = databaseName) {
    super(name);
    this.version(1).stores(databaseStores);
  }
}

export const db = new FitnessDatabase();
