import { useState, type FormEvent } from 'react';
import {
  equipmentTypes,
  exerciseCategories,
  type Exercise,
  type ExerciseDraft
} from '../../types/exercise';
import { validateName } from '../../services/validation';
import { Button } from '../common/Button';

interface ExerciseFormProps {
  exercise?: Exercise;
  onSubmit: (draft: ExerciseDraft) => Promise<void>;
  onCancel: () => void;
}

export function ExerciseForm({
  exercise,
  onSubmit,
  onCancel
}: ExerciseFormProps) {
  const [draft, setDraft] = useState<ExerciseDraft>({
    name: exercise?.name ?? '',
    category: exercise?.category ?? 'other',
    equipment: exercise?.equipment ?? 'other',
    trackingType: exercise?.trackingType ?? 'weight-reps',
    notes: exercise?.notes ?? ''
  });
  const [error, setError] = useState<string>();
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const nameError = validateName(draft.name);
    if (nameError) return setError(nameError);
    setIsSaving(true);
    setError(undefined);
    try {
      await onSubmit(draft);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'Unable to save exercise.'
      );
      setIsSaving(false);
    }
  };

  return (
    <form className="form-stack" onSubmit={handleSubmit}>
      <label className="field">
        <span>Name</span>
        <input
          autoFocus
          value={draft.name}
          maxLength={80}
          onChange={(event) => setDraft({ ...draft, name: event.target.value })}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? 'exercise-form-error' : undefined}
        />
      </label>
      <div className="field-grid">
        <label className="field">
          <span>Category</span>
          <select
            value={draft.category}
            onChange={(event) =>
              setDraft({
                ...draft,
                category: event.target.value as ExerciseDraft['category']
              })
            }
          >
            {exerciseCategories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Equipment</span>
          <select
            value={draft.equipment}
            onChange={(event) =>
              setDraft({
                ...draft,
                equipment: event.target.value as ExerciseDraft['equipment']
              })
            }
          >
            {equipmentTypes.map((equipment) => (
              <option key={equipment} value={equipment}>
                {equipment}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className="field">
        <span>Tracking</span>
        <select
          value={draft.trackingType}
          onChange={(event) =>
            setDraft({
              ...draft,
              trackingType: event.target.value as ExerciseDraft['trackingType']
            })
          }
        >
          <option value="weight-reps">Weight and repetitions</option>
          <option value="reps-only">Repetitions only</option>
          <option value="duration">Duration</option>
        </select>
      </label>
      <label className="field">
        <span>Notes (optional)</span>
        <textarea
          rows={3}
          value={draft.notes}
          onChange={(event) =>
            setDraft({ ...draft, notes: event.target.value })
          }
        />
      </label>
      {error && (
        <p className="form-error" id="exercise-form-error" role="alert">
          {error}
        </p>
      )}
      <div className="form-actions">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSaving}>
          {isSaving ? 'Saving…' : exercise ? 'Save changes' : 'Add exercise'}
        </Button>
      </div>
    </form>
  );
}
