import assert from "node:assert/strict";
import { test, type TestContext } from "node:test";
import { defaultRoutine, localDateKey, STORAGE_KEY } from "../lib/routine.ts";

class MemoryStorage implements Storage {
  values = new Map<string, string>();
  failWrites = false;
  get length() { return this.values.size; }
  clear() { this.values.clear(); }
  getItem(key: string) { return this.values.get(key) ?? null; }
  key(index: number) { return [...this.values.keys()][index] ?? null; }
  removeItem(key: string) { this.values.delete(key); }
  setItem(key: string, value: string) {
    if (this.failWrites) throw new Error("Storage quota exceeded");
    this.values.set(key, value);
  }
}

let instance = 0;
async function setup(context: TestContext, raw?: string, failWrites = false) {
  context.mock.timers.enable({ apis: ["Date", "setTimeout"], now: new Date(2026, 10, 3, 23, 59, 59).getTime() });
  const storage = new MemoryStorage();
  if (raw !== undefined) storage.setItem(STORAGE_KEY, raw);
  storage.failWrites = failWrites;
  const browser = Object.assign(new EventTarget(), { localStorage: storage });
  const document = Object.assign(new EventTarget(), { visibilityState: "visible" });
  const previousWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
  const previousDocument = Object.getOwnPropertyDescriptor(globalThis, "document");
  Object.defineProperty(globalThis, "window", { value: browser, configurable: true });
  Object.defineProperty(globalThis, "document", { value: document, configurable: true });
  const module: typeof import("../lib/routine-store.ts") = await import(new URL(`../lib/routine-store.ts?instance=${instance++}`, import.meta.url).href);
  const unsubscribe = module.routineStore.subscribe(() => {});
  context.after(() => {
    unsubscribe();
    if (previousWindow) Object.defineProperty(globalThis, "window", previousWindow);
    else Reflect.deleteProperty(globalThis, "window");
    if (previousDocument) Object.defineProperty(globalThis, "document", previousDocument);
    else Reflect.deleteProperty(globalThis, "document");
    context.mock.timers.reset();
  });
  const data = () => {
    const snapshot = module.routineStore.getSnapshot();
    assert.ok(snapshot);
    return snapshot.data;
  };
  return { ...module, storage, browser, document, data };
}

test("CRUD persists stable IDs and order; toggling again undoes completion", async (context) => {
  const { routineActions: actions, storage, data } = await setup(context);
  actions.add("  read 10 pages  ");
  const added = data().items.at(-1)!;
  assert.equal(added.name, "read 10 pages");
  actions.toggle(added.id);
  assert.equal(data().items.at(-1)?.completed, true);
  actions.toggle(added.id);
  actions.rename(added.id, "read 20 pages");
  assert.deepEqual(data().items.at(-1), { ...added, name: "read 20 pages" });
  assert.deepEqual(JSON.parse(storage.getItem(STORAGE_KEY)!).items, data().items);
  actions.remove(added.id);
  assert.deepEqual(data().items.map((item) => item.name), ["pray", "train", "eat", "study", "sleep", "repeat"]);
});

test("an open app resets at midnight without losing custom routines", async (context) => {
  const { routineActions: actions, data, storage } = await setup(context);
  actions.add("journal");
  const id = data().items.at(-1)!.id;
  actions.toggle(id);
  const before = data();
  context.mock.timers.tick(1100);
  assert.notEqual(data().date, before.date);
  assert.equal(data().date, localDateKey());
  assert.deepEqual(data().items, before.items.map((item) => ({ ...item, completed: false })));
  assert.equal(JSON.parse(storage.getItem(STORAGE_KEY)!).date, localDateKey());
});

test("opening after several days preserves edited names, order, and deletions", async (context) => {
  const saved = { version: 1, date: "2026-10-27", items: [
    { id: "custom", name: "write", completed: true },
    { id: "old", name: "read", completed: true },
  ] };
  const { data } = await setup(context, JSON.stringify(saved));
  assert.deepEqual(data().items, saved.items.map((item) => ({ ...item, completed: false })));
  assert.equal(data().date, localDateKey());
});

test("a deliberately empty saved list does not repopulate", async (context) => {
  const { data } = await setup(context, JSON.stringify({ version: 1, date: "2026-10-27", items: [] }));
  assert.deepEqual(data().items, []);
});

test("a focus event catches up after sleep even before the timer fires", async (context) => {
  const { data, routineActions: actions, browser } = await setup(context);
  actions.toggle(data().items[0].id);
  context.mock.timers.setTime(new Date(2026, 10, 7, 9).getTime());
  browser.dispatchEvent(new Event("focus"));
  assert.equal(data().date, "2026-11-07");
  assert.ok(data().items.every((item) => !item.completed));
});

test("a change made after midnight checks the date before applying", async (context) => {
  const { data, routineActions: actions } = await setup(context);
  actions.toggle(data().items[0].id);
  context.mock.timers.setTime(new Date(2026, 10, 4, 1).getTime());
  actions.toggle(data().items[1].id);
  assert.equal(data().items[0].completed, false);
  assert.equal(data().items[1].completed, true);
  assert.equal(data().date, "2026-11-04");
});

test("failed writes keep working in memory and can be retried", async (context) => {
  const { routineActions: actions, routineStore, storage, data } = await setup(context, undefined, true);
  actions.add("read");
  actions.rename(data().items.at(-1)!.id, "read more");
  assert.match(routineStore.getSnapshot()!.warning!, /only saved for this session/);
  assert.equal(data().items.at(-1)!.name, "read more");
  assert.equal(storage.getItem(STORAGE_KEY), null);
  storage.failWrites = false;
  actions.retrySave();
  assert.equal(routineStore.getSnapshot()!.warning, null);
  assert.deepEqual(JSON.parse(storage.getItem(STORAGE_KEY)!), data());
});

test("malformed storage is backed up and recovered without crashing", async (context) => {
  const { storage, routineStore, routineActions: actions, data } = await setup(context, "{broken");
  assert.equal(storage.getItem(`${STORAGE_KEY}:recovery`), "{broken");
  assert.match(routineStore.getSnapshot()!.warning!, /recovery copy/);
  actions.toggle(data().items[0].id);
  assert.equal(data().items[0].completed, true);
  assert.equal(JSON.parse(storage.getItem(STORAGE_KEY)!).version, 2);
});

test("storage events update an open tab and later edits preserve the other tab's changes", async (context) => {
  const { storage, browser, data, routineActions: actions } = await setup(context);
  const external = defaultRoutine(localDateKey());
  external.items = [{ id: "external", name: "walk", completed: true }];
  storage.setItem(STORAGE_KEY, JSON.stringify(external));
  const event = new Event("storage");
  Object.defineProperties(event, { key: { value: STORAGE_KEY }, storageArea: { value: storage } });
  browser.dispatchEvent(event);
  assert.deepEqual(data().items, external.items);
  actions.add("read");
  assert.equal(data().items[0].name, "walk");
  assert.equal(data().items[0].completed, true);
  assert.equal(data().items[1].name, "read");
});
