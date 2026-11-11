"use client";

import { useSyncExternalStore } from "react";
import {
  defaultRoutine, localDateKey, MAX_NAME_LENGTH, millisecondsUntilMidnight,
  parseRoutine, resetForDate, STORAGE_KEY,
  type ChainTarget, type RoutineData, type RoutineItem,
} from "./routine.ts";

type Snapshot = { data: RoutineData; warning: string | null } | null;
let snapshot: Snapshot = null;
const listeners = new Set<() => void>();
let stopWatching: (() => void) | undefined;
let unsaved = false;

function publish(data: RoutineData, warning: string | null) {
  snapshot = { data, warning };
  listeners.forEach((listener) => listener());
}

function save(data: RoutineData) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    unsaved = false;
    publish(data, null);
  } catch {
    unsaved = true;
    publish(data, "Changes are only saved for this session. Browser storage is unavailable.");
  }
}

function read(): { data: RoutineData; warning: string | null } {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === null) return { data: defaultRoutine(), warning: null };
    const parsed = parseRoutine(raw);
    if (parsed) return { data: resetForDate(parsed, localDateKey()), warning: null };
    // Retain a recovery copy before replacing malformed data.
    window.localStorage.setItem(`${STORAGE_KEY}:recovery`, raw);
    return {
      data: snapshot?.data ?? defaultRoutine(),
      warning: "Saved data could not be read. A recovery copy has been kept in this browser.",
    };
  } catch {
    return {
      data: snapshot?.data ?? defaultRoutine(),
      warning: "Changes are only saved for this session. Browser storage is unavailable.",
    };
  }
}

function checkDay() {
  if (!snapshot || snapshot.data.date === localDateKey()) return;
  const latest = unsaved ? snapshot.data : read().data;
  save(resetForDate(latest, localDateKey()));
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (listeners.size === 1) {
    if (!snapshot) {
      const loaded = read();
      if (loaded.warning) publish(loaded.data, loaded.warning);
      else save(loaded.data);
    }
    checkDay();
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      checkDay();
      // A bounded interval also catches timezone/clock changes while open.
      timer = setTimeout(tick, Math.min(millisecondsUntilMidnight() + 50, 60_000));
    };
    const onVisible = () => {
      if (document.visibilityState === "visible") checkDay();
    };
    const onStorage = (event: StorageEvent) => {
      if (event.storageArea !== window.localStorage || (event.key !== STORAGE_KEY && event.key !== null)) return;
      if (unsaved) return;
      const loaded = read();
      publish(loaded.data, loaded.warning);
    };
    tick();
    window.addEventListener("focus", checkDay);
    window.addEventListener("pageshow", checkDay);
    window.addEventListener("storage", onStorage);
    document.addEventListener("visibilitychange", onVisible);
    stopWatching = () => {
      clearTimeout(timer);
      window.removeEventListener("focus", checkDay);
      window.removeEventListener("pageshow", checkDay);
      window.removeEventListener("storage", onStorage);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) stopWatching?.();
  };
}

function mutate(change: (items: RoutineItem[]) => RoutineItem[]) {
  if (!snapshot) return;
  // Read before every change so an inactive tab does not overwrite newer work.
  const current = resetForDate(unsaved ? snapshot.data : read().data, localDateKey());
  save({ ...current, items: change(current.items) });
}

const getSnapshot = () => snapshot;
const getServerSnapshot = () => null;

export const routineStore = { subscribe, getSnapshot, getServerSnapshot };

export function useRoutineStore() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export const routineActions = {
  toggle(id: string) {
    mutate((items) => items.map((item) => item.id === id ? { ...item, completed: !item.completed } : item));
  },
  add(name: string) {
    const clean = name.trim().slice(0, MAX_NAME_LENGTH);
    if (!clean) return;
    mutate((items) => [...items, { id: crypto.randomUUID(), name: clean, completed: false }]);
  },
  rename(id: string, name: string) {
    const clean = name.trim().slice(0, MAX_NAME_LENGTH);
    if (!clean) return;
    mutate((items) => items.map((item) => item.id === id ? { ...item, name: clean } : item));
  },
  remove(id: string) {
    mutate((items) => items.filter((item) => item.id !== id));
  },
  setChainTarget(chainTarget: ChainTarget) {
    if (!snapshot) return;
    const current = resetForDate(unsaved ? snapshot.data : read().data, localDateKey());
    save({ ...current, chainTarget });
  },
  retrySave() {
    if (snapshot) save(resetForDate(snapshot.data, localDateKey()));
  },
};
