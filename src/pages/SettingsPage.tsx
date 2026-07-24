import { useLiveQuery } from 'dexie-react-hooks';
import {
  AlertTriangle,
  Database,
  Download,
  Moon,
  RotateCcw,
  Sun,
  Trash2,
  Upload
} from 'lucide-react';
import { useRef, useState, type ChangeEvent } from 'react';
import packageJson from '../../package.json';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { LoadingState } from '../components/common/LoadingState';
import { Modal } from '../components/common/Modal';
import { PageHeader } from '../components/layout/PageHeader';
import {
  getSettings,
  updateSettings
} from '../db/repositories/settingsRepository';
import { loadDemoData, seedDatabase } from '../db/seed';
import {
  createBackupMergePreview,
  createBackup,
  deleteAllLocalData,
  mergeBackup,
  replaceWithBackup,
  summariseBackup
} from '../services/backupService';
import type { BackupMergePreview } from '../types/backup';
import type { ThemePreference, WeightUnit } from '../types/settings';
import { downloadJson } from '../utils/file';

export function SettingsPage() {
  const settings = useLiveQuery(() => getSettings());
  const inputRef = useRef<HTMLInputElement>(null);
  const [pendingImport, setPendingImport] = useState<BackupMergePreview>();
  const [message, setMessage] = useState<string>();
  if (!settings) return <LoadingState label="Loading settings" />;

  const handleExport = async () => {
    const backup = await createBackup(packageJson.version);
    downloadJson(
      backup,
      `fitness-tracker-backup-${backup.exportedAt.slice(0, 10)}.json`
    );
    setMessage('Backup exported. Keep it somewhere safe.');
  };

  const handleFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    try {
      setPendingImport(
        await createBackupMergePreview(JSON.parse(await file.text()))
      );
      setMessage(undefined);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : 'Unable to read this backup.'
      );
    }
  };

  return (
    <section className="page-stack">
      <PageHeader
        eyebrow="Preferences"
        title="Settings"
        description="Everything stays in this browser unless you export a backup."
      />
      <Card className="settings-section">
        <div className="settings-section__title">
          <Database size={20} />
          <div>
            <h2>Training preferences</h2>
            <p>Weights are always stored canonically in kilograms.</p>
          </div>
        </div>
        <label className="settings-row">
          <span>Weight unit</span>
          <select
            value={settings.weightUnit}
            onChange={(event) =>
              updateSettings({ weightUnit: event.target.value as WeightUnit })
            }
          >
            <option value="kg">Kilograms (kg)</option>
            <option value="lb">Pounds (lb)</option>
          </select>
        </label>
        <label className="settings-row">
          <span>Default rest timer</span>
          <div>
            <input
              aria-label="Default rest seconds"
              inputMode="numeric"
              type="number"
              min="0"
              max="3600"
              value={settings.defaultRestSeconds}
              onChange={(event) =>
                updateSettings({
                  defaultRestSeconds: Math.max(0, Number(event.target.value))
                })
              }
            />
            <small>seconds</small>
          </div>
        </label>
        <label className="settings-row">
          <span>Show warm-up sets</span>
          <input
            type="checkbox"
            checked={settings.showWarmupSets}
            onChange={(event) =>
              updateSettings({ showWarmupSets: event.target.checked })
            }
          />
        </label>
      </Card>
      <Card className="settings-section">
        <div className="settings-section__title">
          {settings.theme === 'dark' ? <Moon size={20} /> : <Sun size={20} />}
          <div>
            <h2>Appearance</h2>
            <p>System follows your device preference.</p>
          </div>
        </div>
        <div
          className="segmented-control settings-theme"
          role="group"
          aria-label="Theme"
        >
          {(['light', 'dark', 'system'] as ThemePreference[]).map((theme) => (
            <button
              key={theme}
              type="button"
              className={settings.theme === theme ? 'is-active' : ''}
              onClick={() => updateSettings({ theme })}
              aria-pressed={settings.theme === theme}
            >
              {theme}
            </button>
          ))}
        </div>
      </Card>
      <Card className="settings-section">
        <div className="settings-section__title">
          <RotateCcw size={20} />
          <div>
            <h2>Backup and restore</h2>
            <p>Export regularly, especially before clearing browser data.</p>
          </div>
        </div>
        <div className="settings-actions">
          <Button variant="secondary" onClick={handleExport}>
            <Download size={18} /> Export JSON
          </Button>
          <Button variant="secondary" onClick={() => inputRef.current?.click()}>
            <Upload size={18} /> Import JSON
          </Button>
          <input
            ref={inputRef}
            className="sr-only"
            type="file"
            accept="application/json,.json"
            onChange={handleFile}
          />
        </div>
      </Card>
      <div className="storage-warning">
        <AlertTriangle size={21} />
        <div>
          <strong>Your data lives on this device</strong>
          <p>
            Deleting browser or site data can permanently remove workout
            records. Repwise has no cloud account or server copy.
          </p>
        </div>
      </div>
      <Card className="settings-section">
        <div className="settings-section__title">
          <Database size={20} />
          <div>
            <h2>Local data</h2>
            <p>Demo data is optional and can be deleted at any time.</p>
          </div>
        </div>
        <div className="settings-actions">
          <Button
            variant="secondary"
            onClick={async () => {
              try {
                await loadDemoData();
                setMessage('Demo workouts loaded.');
              } catch (error) {
                setMessage(
                  error instanceof Error
                    ? error.message
                    : 'Unable to load demo data.'
                );
              }
            }}
          >
            Load demo data
          </Button>
          <Button
            variant="danger"
            onClick={async () => {
              if (
                window.confirm(
                  'Delete every workout, template, custom exercise and setting on this device? This cannot be undone.'
                )
              ) {
                await deleteAllLocalData();
                await seedDatabase();
                setMessage('Local data deleted. Default exercises restored.');
              }
            }}
          >
            <Trash2 size={18} /> Delete all data
          </Button>
        </div>
      </Card>
      <p className="app-version">Repwise version {packageJson.version}</p>
      {message && (
        <div className="inline-status" role="status">
          {message}
        </div>
      )}
      {pendingImport && (
        <Modal
          title="Preview backup import"
          onClose={() => setPendingImport(undefined)}
        >
          {(() => {
            const summary = pendingImport.backup
              ? summariseBackup(pendingImport.backup)
              : undefined;
            return (
              <div className="form-stack">
                {summary && (
                  <p className="notice">
                    Exported {new Date(summary.exportedAt).toLocaleString()}{' '}
                    with {summary.exercises} exercises, {summary.templates}{' '}
                    templates, {summary.workouts} workouts, and {summary.sets}{' '}
                    sets.
                  </p>
                )}
                <div
                  className="backup-merge-preview"
                  aria-label="Backup merge preview"
                >
                  {Object.entries(pendingImport.counts).map(
                    ([label, count]) => (
                      <div key={label}>
                        <strong>{count}</strong>
                        <span>{label}</span>
                      </div>
                    )
                  )}
                </div>
                {pendingImport.issues.length > 0 && (
                  <div className="form-error" role="alert">
                    {pendingImport.issues.map((issue) => (
                      <p key={issue}>{issue}</p>
                    ))}
                  </div>
                )}
                <p className="notice">
                  Merge keeps local-only records and uses the newest valid
                  updatedAt value for matching IDs. Equal-timestamp conflicts
                  must be resolved in the source backup first.
                </p>
                <div className="form-actions">
                  <Button
                    variant="secondary"
                    onClick={() => setPendingImport(undefined)}
                  >
                    Cancel
                  </Button>
                  <Button
                    disabled={!pendingImport.canMerge || !pendingImport.backup}
                    onClick={async () => {
                      try {
                        await mergeBackup(pendingImport.backup!);
                        setPendingImport(undefined);
                        setMessage('Backup merged successfully.');
                      } catch (error) {
                        setMessage(
                          error instanceof Error
                            ? error.message
                            : 'Merge failed. Current data was preserved.'
                        );
                      }
                    }}
                  >
                    Merge backup
                  </Button>
                  <Button
                    variant="danger"
                    disabled={!pendingImport.backup}
                    onClick={async () => {
                      if (!pendingImport.backup) return;
                      try {
                        await replaceWithBackup(pendingImport.backup);
                        setPendingImport(undefined);
                        setMessage('Backup replaced local data successfully.');
                      } catch (error) {
                        setMessage(
                          error instanceof Error
                            ? error.message
                            : 'Restore failed. Current data was preserved.'
                        );
                      }
                    }}
                  >
                    Replace all
                  </Button>
                </div>
              </div>
            );
          })()}
        </Modal>
      )}
    </section>
  );
}
