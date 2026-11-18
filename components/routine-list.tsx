"use client";

import { useEffect, useRef, useState } from "react";
import type { RoutineItem } from "@/lib/routine";
import { RoutineRow, type DragState } from "./routine-row";

const EDGE = 72; // distance from the screen edge where the page auto-scrolls
const SETTLE_MS = 180;

type Rect = { top: number; height: number };
type Drag = { id: string; from: number; to: number; dy: number; height: number; settling: boolean };
type Session = {
  id: string; from: number; startY: number; startScroll: number; pointerY: number;
  rects: Rect[]; active: boolean; timer: ReturnType<typeof setTimeout> | undefined; frame: number; stop: () => void;
};

export function RoutineList({ items, onToggle, onEdit, onDelete, onMove }: {
  items: RoutineItem[];
  onToggle: (item: RoutineItem) => void;
  onEdit: (item: RoutineItem) => void;
  onDelete: (item: RoutineItem) => void;
  onMove: (id: string, toIndex: number) => void;
}) {
  const [drag, setDrag] = useState<Drag | null>(null);
  const rows = useRef(new Map<string, HTMLLIElement>());
  const latest = useRef({ items, onMove });
  const session = useRef<Session | null>(null);
  const settleTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => { latest.current = { items, onMove }; });
  useEffect(() => () => { session.current?.stop(); clearTimeout(settleTimer.current); }, []);

  function position(s: Session) {
    const { rects, from } = s;
    const own = rects[from];
    const last = rects[rects.length - 1];
    const raw = s.pointerY - s.startY + (window.scrollY - s.startScroll);
    const dy = Math.max(rects[0].top - own.top, Math.min(last.top + last.height - own.height - own.top, raw));
    // Decide the slot from the unclamped position so the first and last slots are reachable.
    const center = own.top + raw + own.height / 2;
    let to = from;
    rects.forEach((rect, index) => {
      const middle = rect.top + rect.height / 2;
      if (index > from && center > middle) to = Math.max(to, index);
      if (index < from && center < middle) to = Math.min(to, index);
    });
    return { dy, to };
  }

  function refresh(s: Session) {
    const { dy, to } = position(s);
    setDrag((current) => current && current.id === s.id && !current.settling ? { ...current, dy, to } : current);
  }

  function begin(event: React.PointerEvent<HTMLElement>, index: number) {
    if (event.button !== 0 || !event.isPrimary || session.current || settleTimer.current) return;
    event.preventDefault();
    const id = latest.current.items[index].id;
    const s: Session = {
      id, from: index, startY: event.clientY, startScroll: window.scrollY, pointerY: event.clientY,
      rects: [], active: false, timer: undefined, frame: 0, stop: () => {},
    };
    const keepStill = (e: Event) => e.preventDefault();

    const onMoveEvent = (e: PointerEvent) => {
      if (e.pointerId !== event.pointerId) return;
      s.pointerY = e.clientY;
      if (s.active) refresh(s);
    };
    const onEnd = (e: PointerEvent) => {
      if (e.pointerId === event.pointerId) finish(e.type === "pointerup");
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") finish(false); };

    function scrollLoop() {
      if (!s.active) return;
      const speed = s.pointerY < EDGE ? -14 : s.pointerY > window.innerHeight - EDGE ? 14 : 0;
      if (speed) { window.scrollBy(0, speed); refresh(s); }
      s.frame = requestAnimationFrame(scrollLoop);
    }

    function activate() {
      s.timer = undefined;
      const list = latest.current.items;
      s.rects = list.map((item) => {
        const box = rows.current.get(item.id)?.getBoundingClientRect();
        return { top: (box?.top ?? 0) + window.scrollY, height: box?.height ?? 0 };
      });
      s.active = true;
      s.startScroll = window.scrollY;
      navigator.vibrate?.(8);
      // Once lifted, the finger must drag the row instead of scrolling the page.
      window.addEventListener("touchmove", keepStill, { passive: false });
      setDrag({ id, from: index, to: index, dy: 0, height: s.rects[index].height, settling: false });
      s.frame = requestAnimationFrame(scrollLoop);
    }

    function cleanup() {
      clearTimeout(s.timer);
      cancelAnimationFrame(s.frame);
      window.removeEventListener("pointermove", onMoveEvent);
      window.removeEventListener("pointerup", onEnd);
      window.removeEventListener("pointercancel", onEnd);
      window.removeEventListener("touchmove", keepStill);
      window.removeEventListener("contextmenu", keepStill);
      window.removeEventListener("keydown", onKey);
      if (session.current === s) session.current = null;
    }

    function finish(commit: boolean) {
      const wasActive = s.active;
      s.active = false;
      cleanup();
      if (!wasActive) return;
      // The browser fires a click after the drop; swallow it so the row is not toggled.
      const swallow = (e: Event) => { e.stopPropagation(); e.preventDefault(); };
      window.addEventListener("click", swallow, { capture: true, once: true });
      setTimeout(() => window.removeEventListener("click", swallow, { capture: true }), 80);

      const { to } = commit ? position(s) : { to: s.from };
      const own = s.rects[s.from];
      const target = s.rects[to];
      const slotTop = to > s.from ? target.top + target.height - own.height : target.top;
      setDrag({ id, from: s.from, to, dy: slotTop - own.top, height: own.height, settling: true });
      settleTimer.current = setTimeout(() => {
        settleTimer.current = undefined;
        if (to !== s.from) latest.current.onMove(id, to);
        setDrag(null);
      }, SETTLE_MS);
    }

    s.stop = () => { s.active = false; cleanup(); };
    session.current = s;
    window.addEventListener("pointermove", onMoveEvent);
    window.addEventListener("pointerup", onEnd);
    window.addEventListener("pointercancel", onEnd);
    window.addEventListener("keydown", onKey);
    if (event.pointerType !== "mouse") window.addEventListener("contextmenu", keepStill);
    activate();
  }

  function stateFor(index: number): { state?: DragState; offset: number } {
    if (!drag) return { offset: 0 };
    if (index === drag.from) return { state: drag.settling ? "settling" : "dragging", offset: drag.dy };
    const height = drag.height;
    if (drag.from < drag.to && index > drag.from && index <= drag.to) return { state: "shifting", offset: -height };
    if (drag.from > drag.to && index < drag.from && index >= drag.to) return { state: "shifting", offset: height };
    return { state: "shifting", offset: 0 };
  }

  return <ul className={`routine-list${drag ? " is-reordering" : ""}`}>{items.map((item, index) => {
    const { state, offset } = stateFor(index);
    return <RoutineRow key={item.id} item={item} index={index} dragState={state} offset={offset}
      rowRef={(node) => { if (node) rows.current.set(item.id, node); else rows.current.delete(item.id); }}
      onPointerDown={(event) => begin(event, index)}
      onToggle={() => onToggle(item)} onEdit={() => onEdit(item)} onDelete={() => onDelete(item)}
      onMoveUp={index > 0 ? () => onMove(item.id, index - 1) : undefined}
      onMoveDown={index < items.length - 1 ? () => onMove(item.id, index + 1) : undefined} />;
  })}</ul>;
}
