"use client";

import { Plus } from "lucide-react";
import type { ActiveSet } from "@/stores/activeSession";
import type { Exercise } from "@/lib/supabase/types";
import { SetRow } from "./SetRow";

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
  const completedCount = sets.filter((s) => s.isCompleted).length;
  const hasLastTime = lastTime?.weightKg != null;

  return (
    <div className={`bg-surface overflow-hidden ${noBorder ? "" : "border border-border rounded-2xl"}`}>
      {/* Exercise header */}
      <div className="px-4 py-3 flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="font-semibold leading-tight">{exercise.name}</p>
          {hasLastTime && (
            <p className="text-xs text-muted mt-0.5">
              Últ.: {lastTime!.weightKg} kg × {lastTime!.reps} reps
            </p>
          )}
        </div>
        <span className="text-xs text-muted shrink-0 mt-0.5 tabular-nums">
          {completedCount}/{targetSets} series
        </span>
      </div>

      {/* Column headers */}
      {sets.length > 0 && (
        <div className="flex items-center gap-2 px-3 pb-1.5 border-t border-border/50">
          <div className="w-7" />
          <p className="flex-1 text-[11px] text-muted text-center">kg</p>
          <div className="w-4" />
          <p className="w-14 text-[11px] text-muted text-center">reps</p>
          <div className="w-11" />
          <div className="w-8" />
        </div>
      )}

      {/* Set rows */}
      <div className="divide-y divide-border/40">
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
      <div className="px-3 py-2 border-t border-border/50">
        <button
          onClick={onAddSet}
          className="flex items-center gap-1.5 text-sm text-accent font-medium py-1 px-1 active:opacity-70 transition-opacity"
        >
          <Plus size={15} strokeWidth={2.5} />
          Añadir serie
        </button>
      </div>
    </div>
  );
}
