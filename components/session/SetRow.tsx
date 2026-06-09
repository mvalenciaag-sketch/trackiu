"use client";

import { useState } from "react";
import { Check, ChevronDown, X } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import type { ActiveSet } from "@/stores/activeSession";
import { AdvancedSetOptions } from "./AdvancedSetOptions";
import { cn } from "@/lib/utils";

const TYPE_COLORS: Record<string, string> = {
  warmup:  "bg-amber-500",
  working: "bg-accent",
  drop:    "bg-orange-500",
  failure: "bg-red-500",
};

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
    <div>
      {/* Main row */}
      <div
        className={cn(
          "flex items-center gap-2 px-3 py-2 transition-opacity",
          set.isCompleted && "opacity-50"
        )}
      >
        {/* Set number + type dot */}
        <div className="flex items-center gap-1.5 shrink-0 w-7">
          <span
            className={cn(
              "w-2 h-2 rounded-full shrink-0",
              TYPE_COLORS[set.setType] ?? "bg-accent"
            )}
          />
          <span className="text-xs text-muted tabular-nums">{set.setNumber}</span>
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
            "flex-1 min-w-0 h-11 rounded-xl text-center text-base font-semibold",
            "bg-surface-2 border border-border",
            "placeholder:text-muted text-foreground",
            "focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent",
            "[appearance:textfield] transition-colors"
          )}
        />

        <span className="text-xs text-muted shrink-0">×</span>

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
            "w-14 h-11 rounded-xl text-center text-base font-semibold",
            "bg-surface-2 border border-border",
            "placeholder:text-muted text-foreground",
            "focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent",
            "[appearance:textfield] transition-colors"
          )}
        />

        {/* Check button */}
        <button
          onClick={() => onUpdate({ isCompleted: !set.isCompleted })}
          aria-label={set.isCompleted ? "Marcar como incompleta" : "Marcar como completada"}
          className={cn(
            "w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-all",
            set.isCompleted
              ? "bg-green-500/20 border border-green-500/40 text-green-400"
              : "bg-surface-2 border border-border text-muted"
          )}
        >
          <Check size={16} strokeWidth={2.5} />
        </button>

        {/* Expand / remove toggle */}
        <button
          onClick={() => setExpanded((v) => !v)}
          aria-label="Opciones avanzadas"
          className={cn(
            "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-muted transition-colors",
            expanded ? "bg-surface-2 text-foreground" : "active:bg-surface-2"
          )}
        >
          <ChevronDown
            size={15}
            className={cn(
              "transition-transform duration-200",
              expanded && "rotate-180"
            )}
          />
        </button>
      </div>

      {/* Advanced options (collapsible) */}
      <AnimatePresence initial={false}>
        {expanded && (
          <AdvancedSetOptions
            set={set}
            onUpdate={(updates) => {
              onUpdate(updates);
              // Keep local strings in sync with steppers
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

      {/* Remove button when expanded */}
      <AnimatePresence initial={false}>
        {expanded && (
          <div className="px-3 pb-2">
            <button
              onClick={onRemove}
              className="flex items-center gap-1.5 text-xs text-red-400 py-1"
            >
              <X size={12} />
              Eliminar serie
            </button>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
