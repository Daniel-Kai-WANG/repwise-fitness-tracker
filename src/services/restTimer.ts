export function calculateRestSecondsRemaining(
  restTimerEndsAt: string | undefined,
  now = Date.now()
) {
  if (!restTimerEndsAt) return 0;
  const endTime = new Date(restTimerEndsAt).getTime();
  if (!Number.isFinite(endTime)) return 0;
  return Math.max(0, Math.ceil((endTime - now) / 1000));
}

export function createRestTimerEnd(
  defaultRestSeconds: number,
  now = Date.now()
) {
  const durationSeconds = Math.max(0, Math.floor(defaultRestSeconds));
  return durationSeconds > 0
    ? new Date(now + durationSeconds * 1000).toISOString()
    : undefined;
}
