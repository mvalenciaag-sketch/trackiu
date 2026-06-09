"use client";

import { ChevronUp, ChevronDown, Minus, Plus, X } from "lucide-react";
import type { RoutineDayExercise, Exercise } from "@/lib/supabase/types";

interface DayExerciseRowProps {
  item: RoutineDayExercise & { exercises: Exercise };
  isFirst: boolean;
  isLast: boolean;
  supersetGroup?: number | null;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
  onChangeSets: (sets: number) => void;
}

export function DayExerciseRow({
  item,
  isFirst,
  isLast,
  supersetGroup,
  onMoveUp,
  onMoveDown,
  onRemove,
  onChangeSets,
}: DayExerciseRowProps) {
  const sets = item.target_sets ?? 3;

  return (
    <div
      className={`bg-surface border border-border rounded-2xl flex items-center gap-1.5 px-2 py-2.5 ${
        supersetGroup != null ? "border-accent/30" : ""
      }`}
    >
      {/* Superset badge */}
      {supersetGroup != null && (
        <span className="w-4 h-4 rounded bg-accent/20 text-accent text-[10px] flex items-center justify-center font-bold shrink-0">
          S
        </span>
      )}

      {/* Reorder arrows */}
      <div className="flex flex-col shrink-0">
        <button
          onClick={onMoveUp}
          disabled={isFirst}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-muted disabled:opacity-20 active:bg-surface-2 transition-colors"
          aria-label="Subir"
        >
          <ChevronUp size={17} />
        </button>
        <button
          onClick={onMoveDown}
          disabled={isLast}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-muted disabled:opacity-20 active:bg-surface-2 transition-colors"
          aria-label="Bajar"
        >
          <ChevronDown size={17} />
        </button>
      </div>

      {/* Exercise name */}
      <div className="flex-1 min-w-0 px-1">
        <p className="text-sm font-medium leading-tight truncate">
          {item.exercises.name}
        </p>
        {item.notes && (
          <p className="text-xs text-muted truncate mt-0.5">{item.notes}</p>
        )}
      </div>

      {/* Sets stepper */}
      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={() => onChangeSets(Math.max(1, sets - 1))}
          className="w-7 h-7 flex items-center justify-center rounded-lg bg-surface-2 text-muted active:bg-border transition-colors"
          aria-label="Reducir series"
        >
          <Minus size={13} />
        </button>
        <span className="w-5 text-center text-sm font-semibold tabular-nums">
          {sets}
        </span>
        <button
          onClick={() => onChangeSets(sets + 1)}
          className="w-7 h-7 flex items-center justify-center rounded-lg bg-surface-2 text-muted active:bg-border transition-colors"
          aria-label="Aumentar series"
        >
          <Plus size={13} />
        </button>
        <span className="text-[11px] text-muted ml-0.5 w-8">
          {sets === 1 ? "serie" : "series"}
        </span>
      </div>

      {/* Remove */}
      <button
        onClick={onRemove}
        className="w-8 h-8 flex items-center justify-center rounded-full text-muted active:bg-surface-2 shrink-0"
        aria-label="Quitar ejercicio"
      >
        <X size={15} />
      </button>
    </div>
  );
}
