import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';
import { useMemo, useState, type FormEvent } from 'react';
import { validateName } from '../../services/validation';
import type { Exercise } from '../../types/exercise';
import type {
  WorkoutTemplate,
  WorkoutTemplateDraft
} from '../../types/template';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';
import { SearchInput } from '../common/SearchInput';

interface TemplateFormProps {
  template?: WorkoutTemplate;
  exercises: Exercise[];
  onSave: (draft: WorkoutTemplateDraft) => Promise<void>;
  onCancel: () => void;
}

export function TemplateForm({
  template,
  exercises,
  onSave,
  onCancel
}: TemplateFormProps) {
  const [draft, setDraft] = useState<WorkoutTemplateDraft>({
    name: template?.name ?? '',
    description: template?.description ?? '',
    exercises: template?.exercises ?? []
  });
  const [showPicker, setShowPicker] = useState(false);
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string>();
  const [isSaving, setIsSaving] = useState(false);
  const exerciseMap = useMemo(
    () => new Map(exercises.map((item) => [item.id, item])),
    [exercises]
  );
  const availableExercises = exercises.filter(
    (exercise) =>
      !exercise.isArchived &&
      exercise.name.toLowerCase().includes(search.toLowerCase()) &&
      !draft.exercises.some((item) => item.exerciseId === exercise.id)
  );

  const updateItem = (
    index: number,
    changes: Partial<WorkoutTemplateDraft['exercises'][number]>
  ) => {
    setDraft({
      ...draft,
      exercises: draft.exercises.map((item, itemIndex) =>
        itemIndex === index ? { ...item, ...changes } : item
      )
    });
  };

  const moveItem = (index: number, direction: -1 | 1) => {
    const destination = index + direction;
    if (destination < 0 || destination >= draft.exercises.length) return;
    const next = [...draft.exercises];
    [next[index], next[destination]] = [next[destination], next[index]];
    setDraft({
      ...draft,
      exercises: next.map((item, order) => ({ ...item, order }))
    });
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const validationError = validateName(draft.name);
    if (validationError) return setError(validationError);
    if (!draft.exercises.length) return setError('Add at least one exercise.');
    setError(undefined);
    setIsSaving(true);
    try {
      await onSave(draft);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'Unable to save template.'
      );
      setIsSaving(false);
    }
  };

  return (
    <form className="form-stack" onSubmit={handleSubmit}>
      <label className="field">
        <span>Template name</span>
        <input
          autoFocus
          maxLength={80}
          value={draft.name}
          onChange={(event) => setDraft({ ...draft, name: event.target.value })}
        />
      </label>
      <label className="field">
        <span>Description (optional)</span>
        <textarea
          rows={2}
          value={draft.description}
          onChange={(event) =>
            setDraft({ ...draft, description: event.target.value })
          }
        />
      </label>
      <div className="section-heading">
        <div>
          <h2>Exercises</h2>
          <p>Targets are copied into each new workout.</p>
        </div>
        <Button
          type="button"
          variant="secondary"
          onClick={() => setShowPicker(true)}
        >
          <Plus size={17} /> Add
        </Button>
      </div>
      <div className="template-exercise-list">
        {draft.exercises.map((item, index) => (
          <article className="template-exercise" key={item.exerciseId}>
            <div className="template-exercise__header">
              <h3>
                {exerciseMap.get(item.exerciseId)?.name ?? 'Missing exercise'}
              </h3>
              <div className="compact-actions">
                <button
                  type="button"
                  disabled={index === 0}
                  onClick={() => moveItem(index, -1)}
                  aria-label="Move exercise up"
                >
                  <ArrowUp size={17} />
                </button>
                <button
                  type="button"
                  disabled={index === draft.exercises.length - 1}
                  onClick={() => moveItem(index, 1)}
                  aria-label="Move exercise down"
                >
                  <ArrowDown size={17} />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setDraft({
                      ...draft,
                      exercises: draft.exercises.filter(
                        (_, itemIndex) => itemIndex !== index
                      )
                    })
                  }
                  aria-label="Remove exercise"
                >
                  <Trash2 size={17} />
                </button>
              </div>
            </div>
            <div className="target-grid">
              <label>
                <span>Sets</span>
                <input
                  inputMode="numeric"
                  type="number"
                  min="1"
                  max="20"
                  value={item.targetSets ?? 3}
                  onChange={(event) =>
                    updateItem(index, {
                      targetSets: Number(event.target.value)
                    })
                  }
                />
              </label>
              <label>
                <span>Reps min</span>
                <input
                  inputMode="numeric"
                  type="number"
                  min="0"
                  max="1000"
                  value={item.targetRepsMin ?? 8}
                  onChange={(event) =>
                    updateItem(index, {
                      targetRepsMin: Number(event.target.value)
                    })
                  }
                />
              </label>
              <label>
                <span>Reps max</span>
                <input
                  inputMode="numeric"
                  type="number"
                  min="0"
                  max="1000"
                  value={item.targetRepsMax ?? 12}
                  onChange={(event) =>
                    updateItem(index, {
                      targetRepsMax: Number(event.target.value)
                    })
                  }
                />
              </label>
              <label>
                <span>Rest sec</span>
                <input
                  inputMode="numeric"
                  type="number"
                  min="0"
                  max="3600"
                  value={item.restSeconds ?? 90}
                  onChange={(event) =>
                    updateItem(index, {
                      restSeconds: Number(event.target.value)
                    })
                  }
                />
              </label>
            </div>
          </article>
        ))}
      </div>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <div className="form-actions">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSaving}>
          {isSaving ? 'Saving…' : 'Save template'}
        </Button>
      </div>
      {showPicker && (
        <Modal title="Add exercises" onClose={() => setShowPicker(false)}>
          <div className="page-stack">
            <SearchInput
              label="Search available exercises"
              placeholder="Search exercises"
              value={search}
              onChange={setSearch}
            />
            <div className="picker-list">
              {availableExercises.map((exercise) => (
                <button
                  key={exercise.id}
                  type="button"
                  onClick={() => {
                    setDraft({
                      ...draft,
                      exercises: [
                        ...draft.exercises,
                        {
                          exerciseId: exercise.id,
                          order: draft.exercises.length,
                          targetSets: 3,
                          targetRepsMin: 8,
                          targetRepsMax: 12,
                          restSeconds: 90
                        }
                      ]
                    });
                    setSearch('');
                  }}
                >
                  {exercise.name}
                  <Plus size={18} />
                </button>
              ))}
            </div>
          </div>
        </Modal>
      )}
    </form>
  );
}
