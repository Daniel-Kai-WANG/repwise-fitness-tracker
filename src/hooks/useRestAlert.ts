import { useEffect, useRef } from 'react';
import { playRestAlert, prepareRestAlert } from '../services/restAlert';

export function useRestAlert(
  enabled: boolean,
  restTimerEndsAt: string | undefined,
  restRemaining: number,
  onAlert: () => void
) {
  const previousRestRemaining = useRef(0);
  const onAlertRef = useRef(onAlert);

  useEffect(() => {
    onAlertRef.current = onAlert;
  }, [onAlert]);

  useEffect(() => {
    if (!enabled) return;
    const prepare = () => prepareRestAlert();
    window.addEventListener('pointerdown', prepare, { once: true });
    window.addEventListener('keydown', prepare, { once: true });
    return () => {
      window.removeEventListener('pointerdown', prepare);
      window.removeEventListener('keydown', prepare);
    };
  }, [enabled]);

  useEffect(() => {
    if (!enabled) {
      previousRestRemaining.current = 0;
      return;
    }
    if (!restTimerEndsAt) {
      previousRestRemaining.current = 0;
      return;
    }
    if (restRemaining > 0) {
      previousRestRemaining.current = restRemaining;
      return;
    }
    if (previousRestRemaining.current <= 0) return;

    previousRestRemaining.current = 0;
    playRestAlert();
    onAlertRef.current();
  }, [enabled, restRemaining, restTimerEndsAt]);
}
