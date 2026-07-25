import { Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { Exercise } from '../../types/exercise';
import { Modal } from '../common/Modal';
import { SearchInput } from '../common/SearchInput';
import { useI18n } from '../../i18n/useI18n';
import { translateExerciseName } from '../../i18n/translations';

interface AddExerciseSheetProps {
  exercises: Exercise[];
  excludedIds?: string[];
  title?: string;
  onSelect: (exercise: Exercise) => void;
  onClose: () => void;
}

export function AddExerciseSheet({
  exercises,
  excludedIds = [],
  title = 'Add exercise',
  onSelect,
  onClose
}: AddExerciseSheetProps) {
  const { language, t } = useI18n();
  const [search, setSearch] = useState('');
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
    <Modal title={t(title)} onClose={onClose}>
      <div className="page-stack">
        <SearchInput
          label={t('Search exercise library')}
          placeholder={t('Search exercises')}
          value={search}
          onChange={setSearch}
        />
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
      </div>
    </Modal>
  );
}
