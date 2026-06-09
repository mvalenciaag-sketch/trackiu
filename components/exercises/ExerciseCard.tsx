"use client";

import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ExerciseWithMuscles } from "@/lib/supabase/types";

const ROLE_STYLE: Record<string, string> = {
  principal:
    "bg-indigo-500/15 text-indigo-400 border border-indigo-500/25",
  secundario:
    "bg-violet-500/15 text-violet-400 border border-violet-500/25",
  accesorio:
    "bg-zinc-500/15 text-zinc-400 border border-zinc-500/25",
};

const ROLE_LABEL: Record<string, string> = {
  principal: "Principal",
  secundario: "Secundario",
  accesorio: "Accesorio",
};

const MECHANICS_STYLE: Record<string, string> = {
  compuesto: "bg-blue-500/15 text-blue-400 border border-blue-500/25",
  aislado: "bg-amber-500/15 text-amber-400 border border-amber-500/25",
};

interface ExerciseCardProps {
  exercise: ExerciseWithMuscles;
  onEdit: () => void;
}

export function ExerciseCard({ exercise, onEdit }: ExerciseCardProps) {
  const primaryMuscles = exercise.exercise_muscle_groups
    .filter((emg) => emg.relation === "primary")
    .map((emg) => emg.muscle_groups);

  const secondaryMuscles = exercise.exercise_muscle_groups
    .filter((emg) => emg.relation === "secondary")
    .map((emg) => emg.muscle_groups);

  return (
    <motion.button
      whileTap={{ scale: 0.985 }}
      transition={{ duration: 0.1 }}
      onClick={onEdit}
      className="w-full text-left bg-surface border border-border rounded-2xl p-4 flex items-start gap-3 active:bg-surface-2"
    >
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-foreground mb-2 leading-tight">
          {exercise.name}
        </p>

        {/* Role + Mechanics */}
        <div className="flex flex-wrap gap-1.5 mb-2">
          <span
            className={cn(
              "text-xs px-2 py-0.5 rounded-full font-medium",
              ROLE_STYLE[exercise.role] ?? ROLE_STYLE.accesorio
            )}
          >
            {ROLE_LABEL[exercise.role] ?? exercise.role}
          </span>
          <span
            className={cn(
              "text-xs px-2 py-0.5 rounded-full font-medium",
              MECHANICS_STYLE[exercise.mechanics] ?? MECHANICS_STYLE.aislado
            )}
          >
            {exercise.mechanics === "compuesto" ? "Compuesto" : "Aislado"}
          </span>
          {exercise.equipment && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-surface-2 text-muted border border-border">
              {exercise.equipment}
            </span>
          )}
        </div>

        {/* Muscle groups */}
        {(primaryMuscles.length > 0 || secondaryMuscles.length > 0) && (
          <div className="flex flex-wrap gap-1">
            {primaryMuscles.map((mg) => (
              <span
                key={mg.id}
                className="text-xs bg-surface-2 text-foreground px-2 py-0.5 rounded-full"
              >
                {mg.name}
              </span>
            ))}
            {secondaryMuscles.map((mg) => (
              <span
                key={mg.id}
                className="text-xs bg-surface-2 text-muted px-2 py-0.5 rounded-full"
              >
                {mg.name}
              </span>
            ))}
          </div>
        )}
      </div>

      <ChevronRight size={18} className="text-muted shrink-0 mt-0.5" />
    </motion.button>
  );
}
