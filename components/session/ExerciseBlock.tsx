"use client";

import { useState } from "react";
import { Plus, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { ActiveSet } from "@/stores/activeSession";
import type { Exercise } from "@/lib/supabase/types";
import { SetRow } from "./SetRow";
import { cn } from "@/lib/utils";

interface LastTime {
  weightKg: number | null;
  reps: number | null;
}

interface ExerciseBlockProps {
  exercise: Exercise;
  sets: ActiveSet[];
  targetSets: number;
  lastTime?: LastTime;
  noBorder?: boolean;
  onAddSet: () => void;
  onUpdateSet: (localId: string, updates: Partial<ActiveSet>) => void;
  onRemoveSet: (localId: string) => void;
}

export function ExerciseBlock({
  exercise,
  sets,
  targetSets,
  lastTime,
  noBorder = false,
  onAddSet,
  onUpdateSet,
  onRemoveSet,
}: ExerciseBlockProps) {
  const [isOpen, setIsOpen] = useState(true);
  const completedCount = sets.filter((s) => s.isCompleted).length;
  const hasLastTime = lastTime?.weightKg != null;
  const isFull = completedCount >= targetSets && targetSets > 0;

  return (
    <div
      className={cn(
        "bg-surface overflow-hidden",
        noBorder ? "" : "border border-border rounded-[18px]"
      )}
      style={{ boxShadow: "var(--shadow)" }}
    >
      {/* ── Exercise header / toggle ──────────────────────────────────── */}
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className="w-full flex items-center gap-2.5 px-4 py-[15px] text-left"
      >
        <div className="flex-1 min-w-0">
          <p className="font-display font-semibold text-[16px] text-foreground leading-tight">
            {exercise.name}
          </p>
          {hasLastTime && (
            <p className="text-[11.5px] text-muted font-medium mt-0.5">
              Últ.: {lastTime!.weightKg} kg × {lastTime!.reps} reps
            </p>
          )}
        </div>

        {/* Done / target badge */}
        <span
          className={cn(
            "font-display text-[12.5px] font-semibold px-2.5 py-[3px] rounded-full shrink-0",
            isFull
              ? "bg-accent-soft text-accent-soft-ink"
              : "bg-surface-3 text-foreground-2"
          )}
        >
          {completedCount}/{targetSets}
        </span>

        {/* Chevron */}
        <ChevronDown
          size={18}
          className={cn(
            "text-muted shrink-0 transition-transform duration-200",
            !isOpen && "-rotate-90"
          )}
        />
      </button>

      {/* ── Sets (collapsible) ──────────────────────────────────────────── */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="sets"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            style={{ overflow: "hidden" }}
          >
            {/* Column headers */}
            {sets.length > 0 && (
              <div className="grid gap-2 px-4 pb-2 pt-0 border-t border-border/50"
                style={{ gridTemplateColumns: "34px 1fr 1fr 44px" }}>
                <span className="text-[11px] font-bold tracking-[.04em] uppercase text-muted text-left pt-2">
                  #
                </span>
                <span className="text-[11px] font-bold tracking-[.04em] uppercase text-muted text-center pt-2">
                  kg
                </span>
                <span className="text-[11px] font-bold tracking-[.04em] uppercase text-muted text-center pt-2">
                  reps
                </span>
                <span className="pt-2" />
              </div>
            )}

            {/* Set rows */}
            <div className="px-4">
              {sets.map((s) => (
                <SetRow
                  key={s.localId}
                  set={s}
                  onUpdate={(updates) => onUpdateSet(s.localId, updates)}
                  onRemove={() => onRemoveSet(s.localId)}
                />
              ))}
            </div>

            {/* Add set */}
            <div className="px-4 pb-3.5 pt-1">
              <button
                type="button"
                onClick={onAddSet}
                className="inline-flex items-center gap-1.5 text-accent font-semibold text-[13.5px] py-1.5 active:opacity-70 transition-opacity"
              >
                <Plus size={16} strokeWidth={2.5} />
                Añadir serie
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
