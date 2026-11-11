export const STORAGE_KEY = "the-routine:v1";
export const MAX_NAME_LENGTH = 120;

export type RoutineItem = {
  id: string;
  name: string;
  completed: boolean;
};

export type RoutineData = {
  version: 1;
  date: string;
  items: RoutineItem[];
};

// Calendar components intentionally use the browser's timezone, never UTC.
export function localDateKey(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function defaultRoutine(date = localDateKey()): RoutineData {
  return {
    version: 1,
    date,
    items: ["pray", "train", "eat", "study", "sleep", "repeat"].map((name) => ({
      id: `default-${name}`,
      name,
      completed: false,
    })),
  };
}

export function resetForDate(data: RoutineData, date: string): RoutineData {
  if (data.date === date) return data;
  return {
    ...data,
    date,
    items: data.items.map((item) => ({ ...item, completed: false })),
  };
}

export function parseRoutine(raw: string): RoutineData | null {
  try {
    const data: unknown = JSON.parse(raw);
    if (!data || typeof data !== "object") return null;
    const candidate = data as Partial<RoutineData>;
    if (
      candidate.version !== 1 ||
      typeof candidate.date !== "string" ||
      !/^\d{4}-\d{2}-\d{2}$/.test(candidate.date) ||
      !Array.isArray(candidate.items)
    ) return null;

    const ids = new Set<string>();
    for (const item of candidate.items) {
      if (
        !item || typeof item !== "object" ||
        typeof item.id !== "string" || !item.id || ids.has(item.id) ||
        typeof item.name !== "string" || !item.name.trim() ||
        item.name.length > MAX_NAME_LENGTH || typeof item.completed !== "boolean"
      ) return null;
      ids.add(item.id);
    }
    return {
      version: 1,
      date: candidate.date,
      items: candidate.items.map(({ id, name, completed }) => ({ id, name, completed })),
    };
  } catch {
    return null;
  }
}

export function millisecondsUntilMidnight(now = new Date()): number {
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  return Math.max(1, midnight.getTime() - now.getTime());
}
