"use client";

import { useRef, useState, type CSSProperties } from "react";
import { ArrowDown, ArrowUpRight, Check, HardDrive, Infinity, Link2, Plus, RotateCcw, Trophy } from "lucide-react";
import { routineActions, useRoutineStore } from "@/lib/routine-store";
import { CHAIN_TARGETS, currentStreak, longestStreak } from "@/lib/routine";
import { RoutineDialog, type DialogAction } from "./routine-dialog";
import { RoutineRow } from "./routine-row";

export function RoutineTracker() {
  const snapshot = useRoutineStore();
  const [action, setAction] = useState<DialogAction | null>(null);
  const addRef = useRef<HTMLButtonElement>(null);
  const items = snapshot?.data.items ?? [];
  const completed = items.filter((item) => item.completed).length;
  const allDone = items.length > 0 && completed === items.length;
  const progress = items.length ? (completed / items.length) * 100 : 0;
  const streak = snapshot ? currentStreak(snapshot.data) : 0;
  const bestStreak = snapshot ? longestStreak(snapshot.data) : 0;
  const chainTarget = snapshot?.data.chainTarget ?? 7;
  const targetComplete = chainTarget !== null && streak >= chainTarget;
  const visibleLinks = chainTarget === null ? 6 : Math.min(chainTarget, 7);
  const date = snapshot ? new Date(`${snapshot.data.date}T12:00:00`) : null;
  const formattedDate = date?.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });

  return <div className="app-shell">
    <a href="#daily-routine" className="skip-link">Skip to your routine</a>
    <header className="site-header flex items-center justify-between">
      <a className="brand" href="/" aria-label="The Routine home"><span className="brand-mark" aria-hidden="true" /><span>the routine<span className="muted-dot">.</span></span></a>
      <span className="local-note" title="Saved in this browser. No account, no sync."><HardDrive size={13} aria-hidden="true" /><span>your space. your pace.</span></span>
    </header>

    <main id="daily-routine" className="tracker" tabIndex={-1}>
      <div className="intro">
        <p className="eyebrow intro-eyebrow"><span className="status-dot" />A LITTLE, EVERY DAY</p>
        <h1>the routine<span className="title-period">.</span></h1>
        <p className="subtitle">show up. every day.</p>
        <div className="date-line"><span className="date-rule" /><time dateTime={snapshot?.data.date}>{formattedDate ?? "A fresh start, every day."}</time></div>
      </div>

      <section className="routine-section" aria-label="Your daily routine" aria-busy={!snapshot}>
        <div className="progress-heading flex items-center justify-between">
          <span className="eyebrow">TODAY’S PROGRESS</span>
          <span className="progress-count" aria-live="polite" aria-atomic="true"><span>{snapshot ? completed : "—"}</span> / {snapshot ? items.length : "—"} <span className="completed-label">completed</span></span>
        </div>
        <div className="progress-track" role="progressbar" aria-label="Daily progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress)} aria-valuetext={`${completed} of ${items.length} routines completed`}>
          <span style={{ width: `${progress}%` }} />
        </div>

        <section className={`chain-card${allDone ? " chain-complete-today" : ""}`} aria-label="Your consistency chain">
          <div className="chain-heading">
            <div><p className="eyebrow">DON’T BREAK THE CHAIN</p><p className="chain-caption">{allDone ? "Today’s link is in place." : "Finish today to add the next link."}</p></div>
            <span className="chain-streak"><Link2 size={15} aria-hidden="true" />{streak} <span>day{streak === 1 ? "" : "s"}</span></span>
          </div>
          <div className="chain-links" aria-hidden="true">
            {Array.from({ length: visibleLinks }, (_, index) => <span key={index} className={index < streak ? "is-linked" : ""} style={{ "--link-index": index } as CSSProperties} />)}
            {chainTarget === null && <Infinity size={22} />}
          </div>
          <div className="chain-meta">
            <span>{chainTarget === null ? "no finish line" : targetComplete ? "goal reached" : `${streak} / ${chainTarget} day goal`}</span>
            <span>{bestStreak > streak ? `best: ${bestStreak} days` : streak > 0 ? "keep showing up" : "your first link awaits"}</span>
          </div>
          <div className="chain-goals" role="group" aria-label="Choose a chain goal">
            {CHAIN_TARGETS.map((target) => <button key={target} type="button" className={chainTarget === target ? "is-selected" : ""} onClick={() => routineActions.setChainTarget(target)} aria-pressed={chainTarget === target}>{target} days</button>)}
            <button type="button" className={chainTarget === null ? "is-selected" : ""} onClick={() => routineActions.setChainTarget(null)} aria-pressed={chainTarget === null}>∞</button>
          </div>
          {targetComplete && <p className="chain-achievement"><Trophy size={13} aria-hidden="true" />You kept your promise to yourself.</p>}
        </section>

        {!snapshot ? <div className="loading-routines" aria-label="Loading your routine">{Array.from({ length: 6 }, (_, index) => <div className="loading-row" key={index}><span /><span /></div>)}</div> :
          items.length ? <ul className="routine-list">{items.map((item, index) => <RoutineRow key={item.id} item={item} index={index}
            onToggle={() => routineActions.toggle(item.id)} onEdit={() => setAction({ type: "edit", item })} onDelete={() => setAction({ type: "delete", item })} />)}</ul> :
            <div className="empty-state"><span className="empty-icon"><Plus size={22} strokeWidth={1.4} /></span><h2>A little room to begin.</h2><p>Start with one small thing you want to do every day.</p><ArrowDown size={18} aria-hidden="true" /></div>}

        <button ref={addRef} type="button" className="add-routine" onClick={() => setAction({ type: "add" })} disabled={!snapshot}><Plus size={17} strokeWidth={1.6} aria-hidden="true" />add routine<ArrowUpRight className="add-arrow" size={16} aria-hidden="true" /></button>

        <p className={`daily-note${allDone ? " all-done" : ""}`} aria-live="polite">
          {allDone ? <><Check size={13} aria-hidden="true" />you showed up. see you tomorrow.</> : <><RotateCcw size={12} aria-hidden="true" />a fresh start at midnight.</>}
        </p>
        {snapshot?.warning && <div className="storage-warning" role="status"><p>{snapshot.warning}</p><button type="button" onClick={routineActions.retrySave}>Try saving again</button></div>}
      </section>

      <footer className="tracker-footer"><span className="footer-rule" /><p>small steps. <span>quiet progress.</span></p></footer>
    </main>

    <footer className="site-footer flex items-center justify-between"><span>BUILT AROUND YOUR EVERYDAY.</span><span>ONE DAY AT A TIME<span className="footer-dot">●</span></span></footer>

    {action && <RoutineDialog action={action} onClose={() => setAction(null)} onSave={(name) => {
      if (action.type === "add") routineActions.add(name);
      if (action.type === "edit") routineActions.rename(action.item.id, name);
      setAction(null);
    }} onDelete={() => {
      if (action.type === "delete") routineActions.remove(action.item.id);
      setAction(null);
      requestAnimationFrame(() => addRef.current?.focus());
    }} />}
  </div>;
}
