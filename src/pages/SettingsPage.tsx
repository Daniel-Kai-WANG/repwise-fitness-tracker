import { useLiveQuery } from 'dexie-react-hooks';
import {
  AlertTriangle,
  CircleHelp,
  Database,
  Download,
  Moon,
  RotateCcw,
  Sun,
  Trash2,
  Upload
} from 'lucide-react';
import { useRef, useState, type ChangeEvent } from 'react';
import { Link } from 'react-router-dom';
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
import type {
  LanguagePreference,
  ThemePreference,
  WeightUnit
} from '../types/settings';
import { downloadJson } from '../utils/file';
import { useI18n } from '../i18n/useI18n';

export function SettingsPage() {
  const { language, t } = useI18n();
  const settings = useLiveQuery(() => getSettings());
  const inputRef = useRef<HTMLInputElement>(null);
  const [pendingImport, setPendingImport] = useState<BackupMergePreview>();
  const [message, setMessage] = useState<string>();
  if (!settings) return <LoadingState label={t('Loading settings')} />;

  const handleExport = async () => {
    const backup = await createBackup(packageJson.version);
    downloadJson(
      backup,
      `fitness-tracker-backup-${backup.exportedAt.slice(0, 10)}.json`
    );
    setMessage(t('Backup exported. Keep it somewhere safe.'));
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
        error instanceof Error
          ? t(error.message)
          : t('Unable to read this backup.')
      );
    }
  };

  return (
    <section className="page-stack">
      <PageHeader
        eyebrow={t('Preferences')}
        title={t('Settings')}
        description={t(
          'Everything stays in this browser unless you export a backup.'
        )}
      />
      <Card className="settings-section">
        <div className="settings-section__title">
          <Database size={20} />
          <div>
            <h2>{t('Training preferences')}</h2>
            <p>{t('Weights are always stored canonically in kilograms.')}</p>
          </div>
        </div>
        <label className="settings-row">
          <span>{t('Weight unit')}</span>
          <select
            value={settings.weightUnit}
            onChange={(event) =>
              updateSettings({ weightUnit: event.target.value as WeightUnit })
            }
          >
            <option value="kg">{t('Kilograms (kg)')}</option>
            <option value="lb">{t('Pounds (lb)')}</option>
          </select>
        </label>
        <label className="settings-row">
          <span>{t('Default rest timer')}</span>
          <div>
            <input
              aria-label={t('Default rest seconds')}
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
            <small>{t('seconds')}</small>
          </div>
        </label>
        <label className="settings-row">
          <span>{t('Show warm-up sets')}</span>
          <input
            type="checkbox"
            checked={settings.showWarmupSets}
            onChange={(event) =>
              updateSettings({ showWarmupSets: event.target.checked })
            }
          />
        </label>
      </Card>
      <Card className="settings-section settings-link-card">
        <Link to="/guide">
          <CircleHelp size={22} />
          <div>
            <h2>{t('How to use Repwise')}</h2>
            <p>{t('Installation, daily training, progress, and backups.')}</p>
          </div>
          <span aria-hidden="true">›</span>
        </Link>
      </Card>
      <Card className="settings-section">
        <div className="settings-section__title">
          {settings.theme === 'dark' ? <Moon size={20} /> : <Sun size={20} />}
          <div>
            <h2>{t('Appearance')}</h2>
            <p>{t('System follows your device preference.')}</p>
          </div>
        </div>
        <div
          className="segmented-control settings-theme"
          role="group"
          aria-label={t('Theme')}
        >
          {(['light', 'dark', 'system'] as ThemePreference[]).map((theme) => (
            <button
              key={theme}
              type="button"
              className={settings.theme === theme ? 'is-active' : ''}
              onClick={() => updateSettings({ theme })}
              aria-pressed={settings.theme === theme}
            >
              {t(theme)}
            </button>
          ))}
        </div>
      </Card>
      <Card className="settings-section">
        <div className="settings-section__title">
          <Database size={20} />
          <div>
            <h2>{t('Language')}</h2>
            <p>{t('Follow device language')}</p>
          </div>
        </div>
        <label className="settings-row">
          <span>{t('Language')}</span>
          <select
            value={settings.language ?? 'system'}
            onChange={(event) =>
              updateSettings({
                language: event.target.value as LanguagePreference
              })
            }
          >
            <option value="system">{t('Follow device language')}</option>
            <option value="en">{t('English')}</option>
            <option value="zh">{t('Chinese')}</option>
          </select>
        </label>
      </Card>
      <Card className="settings-section">
        <div className="settings-section__title">
          <RotateCcw size={20} />
          <div>
            <h2>{t('Backup and restore')}</h2>
            <p>
              {t('Export regularly, especially before clearing browser data.')}
            </p>
          </div>
        </div>
        <div className="settings-actions">
          <Button variant="secondary" onClick={handleExport}>
            <Download size={18} /> {t('Export JSON')}
          </Button>
          <Button variant="secondary" onClick={() => inputRef.current?.click()}>
            <Upload size={18} /> {t('Import JSON')}
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
          <strong>{t('Your data lives on this device')}</strong>
          <p>
            {t(
              'Deleting browser or site data can permanently remove workout records. Repwise has no cloud account or server copy.'
            )}
          </p>
        </div>
      </div>
      <Card className="settings-section">
        <div className="settings-section__title">
          <Database size={20} />
          <div>
            <h2>{t('Local data')}</h2>
            <p>{t('Demo data is optional and can be deleted at any time.')}</p>
          </div>
        </div>
        <div className="settings-actions">
          <Button
            variant="secondary"
            onClick={async () => {
              try {
                await loadDemoData();
                setMessage(t('Demo workouts loaded.'));
              } catch (error) {
                setMessage(
                  error instanceof Error
                    ? t(error.message)
                    : t('Unable to load demo data.')
                );
              }
            }}
          >
            {t('Load demo data')}
          </Button>
          <Button
            variant="danger"
            onClick={async () => {
              if (
                window.confirm(
                  t(
                    'Delete every workout, template, custom exercise and setting on this device? This cannot be undone.'
                  )
                )
              ) {
                await deleteAllLocalData();
                await seedDatabase();
                setMessage(
                  t('Local data deleted. Default exercises restored.')
                );
              }
            }}
          >
            <Trash2 size={18} /> {t('Delete all data')}
          </Button>
        </div>
      </Card>
      <p className="app-version">
        {t('Repwise version {{version}}', { version: packageJson.version })}
      </p>
      {message && (
        <div className="inline-status" role="status">
          {message}
        </div>
      )}
      {pendingImport && (
        <Modal
          title={t('Preview backup import')}
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
                    {t(
                      'Exported {{date}} with {{exercises}} exercises, {{templates}} templates, {{workouts}} workouts, and {{sets}} sets.',
                      {
                        date: new Date(summary.exportedAt).toLocaleString(
                          language === 'zh' ? 'zh-CN' : 'en'
                        ),
                        exercises: summary.exercises,
                        templates: summary.templates,
                        workouts: summary.workouts,
                        sets: summary.sets
                      }
                    )}
                  </p>
                )}
                <div
                  className="backup-merge-preview"
                  aria-label={t('Backup merge preview')}
                >
                  {Object.entries(pendingImport.counts).map(
                    ([label, count]) => (
                      <div key={label}>
                        <strong>{count}</strong>
                        <span>{t(label)}</span>
                      </div>
                    )
                  )}
                </div>
                {pendingImport.issues.length > 0 && (
                  <div className="form-error" role="alert">
                    {pendingImport.issues.map((issue) => (
                      <p key={issue}>{t(issue)}</p>
                    ))}
                  </div>
                )}
                <p className="notice">
                  {t(
                    'Merge keeps local-only records and uses the newest valid updatedAt value for matching IDs. Equal-timestamp conflicts must be resolved in the source backup first.'
                  )}
                </p>
                <div className="form-actions">
                  <Button
                    variant="secondary"
                    onClick={() => setPendingImport(undefined)}
                  >
                    {t('Cancel')}
                  </Button>
                  <Button
                    disabled={!pendingImport.canMerge || !pendingImport.backup}
                    onClick={async () => {
                      try {
                        await mergeBackup(pendingImport.backup!);
                        setPendingImport(undefined);
                        setMessage(t('Backup merged successfully.'));
                      } catch (error) {
                        setMessage(
                          error instanceof Error
                            ? t(error.message)
                            : t('Merge failed. Current data was preserved.')
                        );
                      }
                    }}
                  >
                    {t('Merge backup')}
                  </Button>
                  <Button
                    variant="danger"
                    disabled={!pendingImport.backup}
                    onClick={async () => {
                      if (!pendingImport.backup) return;
                      try {
                        await replaceWithBackup(pendingImport.backup);
                        setPendingImport(undefined);
                        setMessage(
                          t('Backup replaced local data successfully.')
                        );
                      } catch (error) {
                        setMessage(
                          error instanceof Error
                            ? t(error.message)
                            : t('Restore failed. Current data was preserved.')
                        );
                      }
                    }}
                  >
                    {t('Replace all')}
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
