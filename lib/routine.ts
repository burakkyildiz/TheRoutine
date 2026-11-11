export const STORAGE_KEY = "the-routine:v1";
export const MAX_NAME_LENGTH = 120;
export const CHAIN_TARGETS = [7, 14, 30, 60] as const;

export type ChainTarget = (typeof CHAIN_TARGETS)[number] | null;
export type RoutineItem = { id: string; name: string; completed: boolean };
export type ChainDay = { date: string; completed: boolean };
export type RoutineData = { version: 2; date: string; items: RoutineItem[]; chainTarget: ChainTarget; chainHistory: ChainDay[] };
type LegacyRoutineData = { version: 1; date: string; items: RoutineItem[] };

// Calendar components intentionally use the browser's timezone, never UTC.
export function localDateKey(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function defaultRoutine(date = localDateKey()): RoutineData {
  return { version: 2, date, items: ["pray", "train", "eat", "study", "sleep", "repeat"].map((name) => ({ id: `default-${name}`, name, completed: false })), chainTarget: 7, chainHistory: [] };
}

export function isDayComplete(items: RoutineItem[]): boolean { return items.length > 0 && items.every((item) => item.completed); }

function dateAfter(date: string): string {
  const next = new Date(`${date}T12:00:00`);
  next.setDate(next.getDate() + 1);
  return localDateKey(next);
}

function appendHistory(history: ChainDay[], day: ChainDay): ChainDay[] {
  return [...history.filter((entry) => entry.date !== day.date), day].sort((a, b) => a.date.localeCompare(b.date));
}

export function resetForDate(data: RoutineData, date: string): RoutineData {
  if (data.date === date) return data;
  let history = appendHistory(data.chainHistory, { date: data.date, completed: isDayComplete(data.items) });
  let missingDate = dateAfter(data.date);
  while (missingDate < date) { history = appendHistory(history, { date: missingDate, completed: false }); missingDate = dateAfter(missingDate); }
  return { ...data, date, chainHistory: history, items: data.items.map((item) => ({ ...item, completed: false })) };
}

export function currentStreak(data: RoutineData): number {
  const days = appendHistory(data.chainHistory, { date: data.date, completed: isDayComplete(data.items) });
  let streak = 0;
  let expected = data.date;
  for (let index = days.length - 1; index >= 0; index -= 1) {
    const day = days[index];
    if (day.date !== expected || !day.completed) break;
    streak += 1;
    const previous = new Date(`${expected}T12:00:00`);
    previous.setDate(previous.getDate() - 1);
    expected = localDateKey(previous);
  }
  return streak;
}

export function longestStreak(data: RoutineData): number {
  const days = [...data.chainHistory].sort((a, b) => a.date.localeCompare(b.date));
  let longest = 0; let running = 0; let previous: string | null = null;
  for (const day of days) { running = day.completed && (!previous || dateAfter(previous) === day.date) ? running + 1 : day.completed ? 1 : 0; longest = Math.max(longest, running); previous = day.date; }
  return longest;
}

function validItems(items: unknown): items is RoutineItem[] {
  if (!Array.isArray(items)) return false;
  const ids = new Set<string>();
  return items.every((item) => { if (!item || typeof item !== "object") return false; const candidate = item as Partial<RoutineItem>; if (typeof candidate.id !== "string" || !candidate.id || ids.has(candidate.id) || typeof candidate.name !== "string" || !candidate.name.trim() || candidate.name.length > MAX_NAME_LENGTH || typeof candidate.completed !== "boolean") return false; ids.add(candidate.id); return true; });
}

export function parseRoutine(raw: string): RoutineData | null {
  try {
    const data: unknown = JSON.parse(raw);
    if (!data || typeof data !== "object") return null;
    const candidate = data as { version?: number; date?: unknown; items?: unknown; chainTarget?: unknown; chainHistory?: unknown };
    if (typeof candidate.date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(candidate.date) || !validItems(candidate.items)) return null;
    const items = candidate.items.map(({ id, name, completed }: RoutineItem) => ({ id, name, completed }));
    if (candidate.version === 1) return { version: 2, date: candidate.date, items, chainTarget: 7, chainHistory: [] };
    if (candidate.version !== 2 || (candidate.chainTarget !== null && !CHAIN_TARGETS.includes(candidate.chainTarget as (typeof CHAIN_TARGETS)[number])) || !Array.isArray(candidate.chainHistory)) return null;
    const dates = new Set<string>();
    for (const day of candidate.chainHistory) { if (!day || typeof day !== "object" || typeof (day as Partial<ChainDay>).date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test((day as ChainDay).date) || typeof (day as Partial<ChainDay>).completed !== "boolean" || dates.has((day as ChainDay).date)) return null; dates.add((day as ChainDay).date); }
    return { version: 2, date: candidate.date, items, chainTarget: candidate.chainTarget as ChainTarget, chainHistory: candidate.chainHistory.map(({ date, completed }: ChainDay) => ({ date, completed })) };
  } catch { return null; }
}

export function millisecondsUntilMidnight(now = new Date()): number {
  const midnight = new Date(now); midnight.setHours(24, 0, 0, 0); return Math.max(1, midnight.getTime() - now.getTime());
}
