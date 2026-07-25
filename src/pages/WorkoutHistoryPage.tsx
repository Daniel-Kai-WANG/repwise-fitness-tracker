import { useLiveQuery } from 'dexie-react-hooks';
import { ChevronRight, Clock, Dumbbell, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../components/common/Card';
import { EmptyState } from '../components/common/EmptyState';
import { LoadingState } from '../components/common/LoadingState';
import { SearchInput } from '../components/common/SearchInput';
import { PageHeader } from '../components/layout/PageHeader';
import { db } from '../db/database';
import { deleteWorkout } from '../db/repositories/workoutRepository';
import { createWorkoutSummary } from '../services/workoutSummary';
import {
  formatDuration,
  formatShortDate,
  groupByLocalDate
} from '../utils/date';
import { formatVolume } from '../utils/number';
import { getSettings } from '../db/repositories/settingsRepository';
import { useI18n } from '../i18n/useI18n';

export function WorkoutHistoryPage() {
  const { t } = useI18n();
  const [search, setSearch] = useState('');
  const data = useLiveQuery(async () => ({
    workouts: await db.workouts
      .where('status')
      .equals('completed')
      .reverse()
      .sortBy('startedAt'),
    workoutExercises: await db.workoutExercises.toArray(),
    sets: await db.workoutSets.toArray(),
    settings: await getSettings()
  }));
  const visible = useMemo(
    () =>
      data?.workouts.filter((workout) =>
        workout.name.toLowerCase().includes(search.trim().toLowerCase())
      ) ?? [],
    [data?.workouts, search]
  );
  if (!data) return <LoadingState label={t('Loading workout history')} />;
  const dateGroups = groupByLocalDate(
    visible,
    (workout) => workout.completedAt ?? workout.startedAt
  );
  return (
    <section className="page-stack">
      <PageHeader
        eyebrow={t('Logbook')}
        title={t('History')}
        description={t('Every completed session stored on this device.')}
      />
      <SearchInput
        label={t('Search workout history')}
        placeholder={t('Search workout name')}
        value={search}
        onChange={setSearch}
      />
      {visible.length ? (
        <div className="history-groups">
          {dateGroups.map((group) => (
            <section className="history-group" key={group.date}>
              <h2>{formatShortDate(`${group.date}T12:00:00`)}</h2>
              <div className="card-list">
                {group.items.map((workout) => {
                  const workoutExercises = data.workoutExercises.filter(
                    (item) => item.workoutId === workout.id
                  );
                  const sets = data.sets.filter(
                    (set) => set.workoutId === workout.id
                  );
                  const summary = createWorkoutSummary(workoutExercises, sets);
                  return (
                    <Card className="history-card" key={workout.id}>
                      <Link to={`/history/${workout.id}`}>
                        <div>
                          <p className="eyebrow">
                            {formatShortDate(
                              workout.completedAt ?? workout.startedAt
                            )}
                          </p>
                          <h2>{t(workout.name)}</h2>
                          <div className="history-card__metrics">
                            <span>
                              <Clock size={15} />{' '}
                              {formatDuration(workout.durationSeconds)}
                            </span>
                            <span>
                              <Dumbbell size={15} /> {summary.exerciseCount}{' '}
                              {t('exercises')}
                            </span>
                            <span>
                              {t('{{count}} sets', {
                                count: summary.completedSets
                              })}
                            </span>
                            <span>
                              {formatVolume(
                                summary.volume,
                                data.settings.weightUnit
                              )}
                            </span>
                          </div>
                        </div>
                        <ChevronRight size={20} />
                      </Link>
                      <button
                        type="button"
                        onClick={() =>
                          window.confirm(
                            t('Delete {{name}}? This cannot be undone.', {
                              name: workout.name
                            })
                          ) && deleteWorkout(workout.id)
                        }
                        aria-label={t('Delete {{name}}', {
                          name: workout.name
                        })}
                      >
                        <Trash2 size={17} /> {t('Delete')}
                      </button>
                    </Card>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <EmptyState
          title={t(search ? 'No matching workouts' : 'No completed workouts')}
          description={
            search
              ? t('Try a different workout name.')
              : t(
                  'Finish your first workout to begin a private training history.'
                )
          }
          action={
            !search && (
              <Link className="button button--primary" to="/workout/start">
                {t('Start workout')}
              </Link>
            )
          }
        />
      )}
    </section>
  );
}
