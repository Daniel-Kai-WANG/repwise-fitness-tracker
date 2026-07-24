import { Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { Exercise } from '../../types/exercise';
import { Modal } from '../common/Modal';
import { SearchInput } from '../common/SearchInput';

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
  const [search, setSearch] = useState('');
  const visible = useMemo(() => {
    const query = search.trim().toLowerCase();
    return exercises.filter(
      (exercise) =>
        !exercise.isArchived &&
        !excludedIds.includes(exercise.id) &&
        (!query || exercise.name.toLowerCase().includes(query))
    );
  }, [excludedIds, exercises, search]);
  return (
    <Modal title={title} onClose={onClose}>
      <div className="page-stack">
        <SearchInput
          label="Search exercise library"
          placeholder="Search exercises"
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
                <strong>{exercise.name}</strong>
                <small>
                  {exercise.category} · {exercise.equipment}
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
