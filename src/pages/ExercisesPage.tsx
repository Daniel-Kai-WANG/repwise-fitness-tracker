import { useLiveQuery } from 'dexie-react-hooks';
import { Plus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Button } from '../components/common/Button';
import { EmptyState } from '../components/common/EmptyState';
import { LoadingState } from '../components/common/LoadingState';
import { Modal } from '../components/common/Modal';
import { SearchInput } from '../components/common/SearchInput';
import { ExerciseCard } from '../components/exercises/ExerciseCard';
import { ExerciseForm } from '../components/exercises/ExerciseForm';
import { PageHeader } from '../components/layout/PageHeader';
import { db } from '../db/database';
import {
  createExercise,
  setExerciseArchived,
  updateExercise
} from '../db/repositories/exerciseRepository';
import {
  equipmentTypes,
  exerciseCategories,
  type Equipment,
  type Exercise,
  type ExerciseCategory,
  type ExerciseDraft
} from '../types/exercise';

export function ExercisesPage() {
  const exercises = useLiveQuery(() => db.exercises.orderBy('name').toArray());
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<ExerciseCategory | 'all'>('all');
  const [equipment, setEquipment] = useState<Equipment | 'all'>('all');
  const [showArchived, setShowArchived] = useState(false);
  const [editingExercise, setEditingExercise] = useState<
    Exercise | null | undefined
  >();

  const visibleExercises = useMemo(() => {
    const query = search.trim().toLowerCase();
    return (exercises ?? []).filter(
      (exercise) =>
        exercise.isArchived === showArchived &&
        (category === 'all' || exercise.category === category) &&
        (equipment === 'all' || exercise.equipment === equipment) &&
        (!query || exercise.name.toLowerCase().includes(query))
    );
  }, [category, equipment, exercises, search, showArchived]);

  const handleSubmit = async (draft: ExerciseDraft) => {
    if (editingExercise) await updateExercise(editingExercise.id, draft);
    else await createExercise(draft);
    setEditingExercise(undefined);
  };

  return (
    <section className="page-stack">
      <PageHeader
        eyebrow="Library"
        title="Exercises"
        description="Build a focused library for the movements you train."
        action={
          <Button
            className="button--icon-text"
            onClick={() => setEditingExercise(null)}
          >
            <Plus size={18} /> Add
          </Button>
        }
      />
      <SearchInput
        label="Search exercises"
        placeholder="Search exercises"
        value={search}
        onChange={setSearch}
      />
      <div className="filter-row" aria-label="Exercise filters">
        <select
          value={category}
          onChange={(event) =>
            setCategory(event.target.value as typeof category)
          }
        >
          <option value="all">All categories</option>
          {exerciseCategories.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
        <select
          value={equipment}
          onChange={(event) =>
            setEquipment(event.target.value as typeof equipment)
          }
        >
          <option value="all">All equipment</option>
          {equipmentTypes.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
        <button
          className={showArchived ? 'filter-toggle is-active' : 'filter-toggle'}
          type="button"
          onClick={() => setShowArchived((value) => !value)}
          aria-pressed={showArchived}
        >
          Archived
        </button>
      </div>
      {exercises === undefined ? (
        <LoadingState label="Loading exercises" />
      ) : visibleExercises.length ? (
        <div className="card-list">
          {visibleExercises.map((exercise) => (
            <ExerciseCard
              key={exercise.id}
              exercise={exercise}
              onEdit={setEditingExercise}
              onToggleArchive={(item) =>
                setExerciseArchived(item.id, !item.isArchived)
              }
            />
          ))}
        </div>
      ) : (
        <EmptyState
          title={showArchived ? 'No archived exercises' : 'No exercises found'}
          description="Try changing the filters or add a custom exercise."
        />
      )}
      {editingExercise !== undefined && (
        <Modal
          title={editingExercise ? 'Edit exercise' : 'Add exercise'}
          onClose={() => setEditingExercise(undefined)}
        >
          <ExerciseForm
            exercise={editingExercise ?? undefined}
            onSubmit={handleSubmit}
            onCancel={() => setEditingExercise(undefined)}
          />
        </Modal>
      )}
    </section>
  );
}
