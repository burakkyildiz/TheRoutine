"use client";

import { useEffect, useRef, type FormEvent } from "react";
import { ArrowUpRight, X } from "lucide-react";
import { MAX_NAME_LENGTH, type RoutineItem } from "@/lib/routine";

export type DialogAction = { type: "add" } | { type: "edit" | "delete"; item: RoutineItem };

export function RoutineDialog({ action, onClose, onSave, onDelete }: {
  action: DialogAction;
  onClose: () => void;
  onSave: (name: string) => void;
  onDelete: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isDelete = action.type === "delete";
  const title = isDelete ? "Let this one go?" : action.type === "edit" ? "Make it yours." : "One small commitment.";

  useEffect(() => {
    const dialog = dialogRef.current;
    dialog?.showModal();
    inputRef.current?.select();
    return () => dialog?.close();
  }, []);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isDelete) { onDelete(); return; }
    const name = inputRef.current?.value.trim() ?? "";
    if (!name) {
      inputRef.current?.setCustomValidity("Give your routine a name.");
      inputRef.current?.reportValidity();
      return;
    }
    onSave(name);
  }

  return (
    <dialog ref={dialogRef} className="routine-dialog" aria-labelledby="dialog-title" aria-describedby="dialog-description" onCancel={onClose}>
      <form onSubmit={handleSubmit}>
        <button type="button" className="icon-button dialog-close" aria-label="Close dialog" onClick={onClose}><X size={18} /></button>
        <p className="eyebrow">{isDelete ? "REMOVE ROUTINE" : action.type === "edit" ? "EDIT ROUTINE" : "A NEW ROUTINE"}</p>
        <h2 id="dialog-title">{title}</h2>
        <p id="dialog-description" className="dialog-description">
          {isDelete ? <>Remove <strong>“{action.item.name}”</strong> from your daily routine? This cannot be undone.</> : "Keep it simple. Something you can show up for."}
        </p>
        {!isDelete && <label className="input-label">Routine name
          <input ref={inputRef} name="routine" type="text" placeholder="e.g. read a few pages" defaultValue={action.type === "edit" ? action.item.name : ""}
            required maxLength={MAX_NAME_LENGTH} autoComplete="off" onInput={() => inputRef.current?.setCustomValidity("")} />
        </label>}
        <div className="dialog-actions">
          <button type="button" className="secondary-button" onClick={onClose} autoFocus={isDelete}>Keep {isDelete ? "it" : "as is"}</button>
          <button type="submit" className={isDelete ? "primary-button delete-button" : "primary-button"}>
            {isDelete ? "Remove routine" : action.type === "edit" ? "Save changes" : "Add routine"}
            {!isDelete && <ArrowUpRight size={16} aria-hidden="true" />}
          </button>
        </div>
      </form>
    </dialog>
  );
}
