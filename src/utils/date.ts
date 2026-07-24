export function nowIso() {
  return new Date().toISOString();
}

export function formatShortDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }).format(new Date(value));
}

export function formatWeekdayDate(value: string | Date) {
  return new Intl.DateTimeFormat(undefined, {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  }).format(new Date(value));
}

export function startOfLocalWeek(value = new Date()) {
  const start = new Date(value);
  const day = start.getDay();
  start.setDate(start.getDate() - ((day + 6) % 7));
  start.setHours(0, 0, 0, 0);
  return start;
}

export function formatDuration(totalSeconds = 0) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return hours > 0
    ? `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
    : `${minutes}:${String(seconds).padStart(2, '0')}`;
}

export function getLocalDateKey(value: string) {
  const date = new Date(value);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function groupByLocalDate<T>(items: T[], getDate: (item: T) => string) {
  return items.reduce<Array<{ date: string; items: T[] }>>((groups, item) => {
    const date = getLocalDateKey(getDate(item));
    const existing = groups.find((group) => group.date === date);
    if (existing) existing.items.push(item);
    else groups.push({ date, items: [item] });
    return groups;
  }, []);
}
