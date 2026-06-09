"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { RoutineDay } from "@/lib/supabase/types";

interface RoutineDayCardProps {
  day: RoutineDay;
  exerciseCount: number;
}

export function RoutineDayCard({ day, exerciseCount }: RoutineDayCardProps) {
  return (
    <Link href={`/dias/${day.id}`} className="flex bg-surface border border-border rounded-2xl overflow-hidden active:bg-surface-2 transition-colors">
      {/* Color stripe */}
      <div
        className="w-1.5 shrink-0"
        style={{ backgroundColor: day.color ?? "#6366f1" }}
      />

      <div className="flex-1 p-4 flex items-center gap-3 min-w-0">
        <div className="flex-1 min-w-0">
          <p className="font-semibold leading-tight">{day.name}</p>
          {day.description && (
            <p className="text-sm text-muted truncate mt-0.5">
              {day.description}
            </p>
          )}
          <p className="text-xs text-muted mt-1">
            {exerciseCount === 0
              ? "Sin ejercicios"
              : `${exerciseCount} ejercicio${exerciseCount === 1 ? "" : "s"}`}
          </p>
        </div>
        <ChevronRight size={18} className="text-muted shrink-0" />
      </div>
    </Link>
  );
}
