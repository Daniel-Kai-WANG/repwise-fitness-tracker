export interface TemplateExercise {
  exerciseId: string;
  order: number;
  targetSets?: number;
  targetRepsMin?: number;
  targetRepsMax?: number;
  targetWeight?: number;
  restSeconds?: number;
  notes?: string;
}

export interface WorkoutTemplate {
  id: string;
  name: string;
  description?: string;
  exercises: TemplateExercise[];
  createdAt: string;
  updatedAt: string;
}

export type WorkoutTemplateDraft = Pick<
  WorkoutTemplate,
  'name' | 'description' | 'exercises'
>;
