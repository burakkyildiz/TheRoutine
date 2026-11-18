"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowUp, Check, GripVertical, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import type { RoutineItem } from "@/lib/routine";

export type DragState = "dragging" | "settling" | "shifting";

export function RoutineRow({ item, index, dragState, offset, rowRef, onPointerDown, onMoveUp, onMoveDown, onToggle, onEdit, onDelete }: {
  item: RoutineItem;
  index: number;
  dragState?: DragState;
  offset: number;
  rowRef: (node: HTMLLIElement | null) => void;
  onPointerDown: (event: React.PointerEvent<HTMLElement>) => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    function onPointerDown(event: PointerEvent) {
      if (!menuRef.current?.contains(event.target as Node)) setMenuOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") { setMenuOpen(false); triggerRef.current?.focus(); }
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

  function run(action: () => void) {
    setMenuOpen(false);
    triggerRef.current?.focus();
    action();
  }

  const lifted = dragState === "dragging" || dragState === "settling";
  const transform = lifted ? `translateY(${offset}px)${dragState === "dragging" ? " scale(1.02)" : ""}` : offset ? `translateY(${offset}px)` : undefined;

  return <li ref={rowRef} style={{ transform }}
    className={`routine-row${item.completed ? " is-completed" : ""}${dragState ? ` is-${dragState}` : ""}${lifted ? " is-lifted" : ""}`}>
    <button type="button" className="drag-handle" aria-label={`Drag to reorder ${item.name}`} title="Drag to reorder" onPointerDown={onPointerDown}>
      <GripVertical size={20} aria-hidden="true" />
    </button>
    <button type="button" role="checkbox" aria-checked={item.completed} aria-label={item.name} className="routine-toggle" onClick={onToggle}>
      <span className="completion-circle" aria-hidden="true"><Check size={17} strokeWidth={2.5} /></span>
      <span className="routine-name">{item.name}</span>
    </button>
    <span className="routine-number" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
    <div className="row-options" ref={menuRef} onBlur={(event) => {
      if (!event.currentTarget.contains(event.relatedTarget)) setMenuOpen(false);
    }}>
      <button ref={triggerRef} type="button" className={`icon-button options-trigger${menuOpen ? " is-open" : ""}`} aria-label={`Options for ${item.name}`} aria-expanded={menuOpen} aria-controls={`options-${item.id}`} onClick={() => setMenuOpen(!menuOpen)}>
        <MoreHorizontal size={20} />
      </button>
      {menuOpen && <div className="options-popover" id={`options-${item.id}`}>
        {onMoveUp && <button type="button" onClick={() => run(onMoveUp)}><ArrowUp size={15} aria-hidden="true" />Move up</button>}
        {onMoveDown && <button type="button" onClick={() => run(onMoveDown)}><ArrowDown size={15} aria-hidden="true" />Move down</button>}
        <button type="button" onClick={() => run(onEdit)}><Pencil size={15} aria-hidden="true" />Edit name</button>
        <button type="button" onClick={() => run(onDelete)}><Trash2 size={15} aria-hidden="true" />Remove</button>
      </div>}
    </div>
  </li>;
}
