import { Timer } from 'lucide-react';
import { updateSettings } from '../../db/repositories/settingsRepository';
import { useI18n } from '../../i18n/useI18n';
import { playRestAlert } from '../../services/restAlert';
import type { AppSettings, WeightUnit } from '../../types/settings';
import { Button } from '../common/Button';
import { Card } from '../common/Card';

interface TrainingPreferencesCardProps {
  settings: AppSettings;
  onAlertTest: () => void;
}

export function TrainingPreferencesCard({
  settings,
  onAlertTest
}: TrainingPreferencesCardProps) {
  const { t } = useI18n();
  const automaticRestEnabled = settings.autoRestEnabled ?? true;

  return (
    <Card className="settings-section">
      <div className="settings-section__title">
        <Timer size={20} />
        <div>
          <h2>{t('Training preferences')}</h2>
          <p>
            {t('Choose your units and how Repwise handles rest between sets.')}
          </p>
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
        <span>{t('Automatic rest after each set')}</span>
        <input
          aria-label={t('Automatic rest after each set')}
          type="checkbox"
          checked={automaticRestEnabled}
          onChange={(event) =>
            updateSettings({ autoRestEnabled: event.target.checked })
          }
        />
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
            disabled={!automaticRestEnabled}
            value={settings.defaultRestSeconds}
            onChange={(event) =>
              updateSettings({
                defaultRestSeconds: Math.min(
                  3600,
                  Math.max(0, Number(event.target.value))
                )
              })
            }
          />
          <small>{t('seconds')}</small>
        </div>
      </label>
      <div className="settings-actions">
        <Button
          variant="secondary"
          disabled={!automaticRestEnabled}
          onClick={() => {
            playRestAlert();
            onAlertTest();
          }}
        >
          {t('Test rest alert')}
        </Button>
      </div>
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
  );
}
