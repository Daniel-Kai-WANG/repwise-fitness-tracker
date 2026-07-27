import { Plus, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { Exercise, ExerciseDraft } from '../../types/exercise';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';
import { SearchInput } from '../common/SearchInput';
import { useI18n } from '../../i18n/useI18n';
import { translateExerciseName } from '../../i18n/translations';
import { ExerciseForm } from '../exercises/ExerciseForm';

interface AddExerciseSheetProps {
  exercises: Exercise[];
  excludedIds?: string[];
  title?: string;
  onSelect: (exercise: Exercise) => void;
  onCreate?: (draft: ExerciseDraft) => Promise<void>;
  onClose: () => void;
}

export function AddExerciseSheet({
  exercises,
  excludedIds = [],
  title = 'Add exercise',
  onSelect,
  onCreate,
  onClose
}: AddExerciseSheetProps) {
  const { language, t } = useI18n();
  const [search, setSearch] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const visible = useMemo(() => {
    const query = search.trim().toLowerCase();
    return exercises.filter(
      (exercise) =>
        !exercise.isArchived &&
        !excludedIds.includes(exercise.id) &&
        (!query ||
          exercise.name.toLowerCase().includes(query) ||
          translateExerciseName(language, exercise.name)
            .toLowerCase()
            .includes(query))
    );
  }, [excludedIds, exercises, language, search]);

  return (
    <Modal
      title={t(isCreating ? 'Create custom exercise' : title)}
      onClose={onClose}
    >
      {isCreating && onCreate ? (
        <ExerciseForm
          initialName={search.trim()}
          onSubmit={onCreate}
          onCancel={() => setIsCreating(false)}
        />
      ) : (
        <div className="page-stack">
          <SearchInput
            label={t('Search exercise library')}
            placeholder={t('Search exercises')}
            value={search}
            onChange={setSearch}
          />
          {onCreate && (
            <Button
              type="button"
              variant="secondary"
              fullWidth
              onClick={() => setIsCreating(true)}
            >
              <Plus size={18} /> {t('Create custom exercise')}
            </Button>
          )}
          {visible.length > 0 ? (
            <div className="picker-list">
              {visible.map((exercise) => (
                <button
                  key={exercise.id}
                  type="button"
                  onClick={() => onSelect(exercise)}
                >
                  <span>
                    <strong>
                      {translateExerciseName(language, exercise.name)}
                    </strong>
                    <small>
                      {t(exercise.category)} · {t(exercise.equipment)}
                    </small>
                  </span>
                  <Search size={18} />
                </button>
              ))}
            </div>
          ) : (
            <p className="notice">
              {t('No matching exercises. Create your own movement instead.')}
            </p>
          )}
        </div>
      )}
    </Modal>
  );
}
