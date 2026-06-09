"use client";

import { useState } from "react";
import { Check, ChevronDown, X } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import type { ActiveSet } from "@/stores/activeSession";
import { AdvancedSetOptions } from "./AdvancedSetOptions";
import { cn } from "@/lib/utils";

interface SetRowProps {
  set: ActiveSet;
  onUpdate: (updates: Partial<ActiveSet>) => void;
  onRemove: () => void;
}

export function SetRow({ set, onUpdate, onRemove }: SetRowProps) {
  const [weightStr, setWeightStr] = useState(
    set.weightKg != null ? String(set.weightKg) : ""
  );
  const [repsStr, setRepsStr] = useState(
    set.reps != null ? String(set.reps) : ""
  );
  const [expanded, setExpanded] = useState(false);

  function commitWeight() {
    const v = weightStr.replace(",", ".").trim();
    const parsed = v === "" ? null : parseFloat(v);
    const value = parsed != null && !isNaN(parsed) ? parsed : null;
    if (value !== set.weightKg) onUpdate({ weightKg: value });
    setWeightStr(value != null ? String(value) : "");
  }

  function commitReps() {
    const parsed = parseInt(repsStr.trim());
    const value = isNaN(parsed) ? null : parsed;
    if (value !== set.reps) onUpdate({ reps: value });
    setRepsStr(value != null ? String(value) : "");
  }

  return (
    <div className="mb-2">
      {/* ── Main row (design grid: 34px | 1fr | 1fr | 44px) ──────────── */}
      <div
        className="grid items-center gap-2"
        style={{ gridTemplateColumns: "34px 1fr 1fr 44px" }}
      >
        {/* Set number pill */}
        <div className="flex items-center justify-center">
          <span
            className={cn(
              "w-6 h-6 rounded-lg font-display font-semibold text-[13px] flex items-center justify-center",
              set.isCompleted
                ? "bg-accent-soft text-accent-soft-ink"
                : "bg-surface-3 text-foreground-2"
            )}
          >
            {set.setNumber}
          </span>
        </div>

        {/* Weight input */}
        <input
          type="text"
          inputMode="decimal"
          value={weightStr}
          onChange={(e) => setWeightStr(e.target.value)}
          onBlur={commitWeight}
          placeholder="0"
          aria-label="Peso (kg)"
          className={cn(
            "h-[42px] w-full rounded-xl text-center font-display text-base font-semibold",
            "bg-surface-2 border border-border",
            "placeholder:text-muted text-foreground",
            "focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent focus:bg-surface",
            "[appearance:textfield] transition-colors",
            set.isCompleted && "opacity-70"
          )}
        />

        {/* Reps input */}
        <input
          type="text"
          inputMode="numeric"
          value={repsStr}
          onChange={(e) => setRepsStr(e.target.value)}
          onBlur={commitReps}
          placeholder="0"
          aria-label="Repeticiones"
          className={cn(
            "h-[42px] w-full rounded-xl text-center font-display text-base font-semibold",
            "bg-surface-2 border border-border",
            "placeholder:text-muted text-foreground",
            "focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent focus:bg-surface",
            "[appearance:textfield] transition-colors",
            set.isCompleted && "opacity-70"
          )}
        />

        {/* Check button — outer wrapper is 44px wide */}
        <div className="flex items-center gap-1 justify-end">
          <button
            onClick={() => onUpdate({ isCompleted: !set.isCompleted })}
            aria-label={set.isCompleted ? "Marcar como incompleta" : "Marcar como completada"}
            className={cn(
              "h-[42px] flex-1 rounded-xl flex items-center justify-center shrink-0 transition-all",
              set.isCompleted
                ? "bg-accent border-accent text-on-accent"
                : "bg-surface-3 border border-border text-muted"
            )}
          >
            <Check size={16} strokeWidth={2.5} />
          </button>
        </div>
      </div>

      {/* Expand/collapse advanced options */}
      <div className="flex items-center justify-between mt-0.5">
        <button
          onClick={() => setExpanded((v) => !v)}
          aria-label="Opciones avanzadas"
          className={cn(
            "flex items-center gap-1 text-[11px] text-muted py-0.5 px-0.5 active:opacity-70 transition-opacity",
            expanded && "text-accent"
          )}
        >
          <ChevronDown
            size={12}
            className={cn(
              "transition-transform duration-200",
              expanded && "rotate-180"
            )}
          />
          {expanded ? "Menos" : "Opciones"}
        </button>

        {expanded && (
          <button
            onClick={onRemove}
            className="flex items-center gap-1 text-[11px] text-red-400 py-0.5 px-0.5"
          >
            <X size={11} />
            Eliminar
          </button>
        )}
      </div>

      {/* Advanced options (collapsible) */}
      <AnimatePresence initial={false}>
        {expanded && (
          <AdvancedSetOptions
            set={set}
            onUpdate={(updates) => {
              onUpdate(updates);
              if (updates.weightKg !== undefined) {
                setWeightStr(updates.weightKg != null ? String(updates.weightKg) : "");
              }
              if (updates.reps !== undefined) {
                setRepsStr(updates.reps != null ? String(updates.reps) : "");
              }
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
