"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Plus, LayoutGrid, Download } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { RoutineDay } from "@/lib/supabase/types";
import { Button } from "@/components/ui/Button";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { EmptyState } from "@/components/ui/EmptyState";
import { RoutineDayCard } from "@/components/routine-days/RoutineDayCard";
import { RoutineDayForm } from "@/components/routine-days/RoutineDayForm";

type RoutineDayWithCount = RoutineDay & {
  routine_day_exercises: { id: string }[];
};

export default function DiasPage() {
  const [days, setDays] = useState<RoutineDayWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const supabase = useMemo(() => createClient(), []);

  const fetchDays = useCallback(async () => {
    const { data } = await supabase
      .from("routine_days")
      .select("*, routine_day_exercises(id)")
      .order("position")
      .order("created_at");
    if (data) setDays(data as RoutineDayWithCount[]);
  }, [supabase]);

  useEffect(() => {
    fetchDays().finally(() => setLoading(false));
  }, [fetchDays]);

  function handleSaved(day: RoutineDay) {
    setIsFormOpen(false);
    fetchDays();
  }

  return (
    <div className="flex flex-col min-h-full">
      {/* Header */}
      <div className="px-4 pt-6 pb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">Días</h1>
        <div className="flex items-center gap-2">
          <Link
            href="/importar"
            className="h-8 px-3 flex items-center gap-1.5 rounded-full bg-surface-2 border border-border text-xs text-muted font-medium active:bg-border"
          >
            <Download size={13} />
            Importar
          </Link>
          <Button size="sm" onClick={() => setIsFormOpen(true)} className="gap-1.5">
            <Plus size={15} strokeWidth={2.5} />
            Crear
          </Button>
        </div>
      </div>

      {/* List */}
      <div className="px-4 flex flex-col gap-3 pb-6">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-20 rounded-2xl bg-surface border border-border animate-pulse"
            />
          ))
        ) : days.length === 0 ? (
          <EmptyState
            icon={LayoutGrid}
            title="Sin días creados"
            description='Crea tu primera plantilla, por ejemplo "Push", "Pull" o "Legs".'
            action={{ label: "Crear día", onClick: () => setIsFormOpen(true) }}
          />
        ) : (
          days.map((day) => (
            <RoutineDayCard
              key={day.id}
              day={day}
              exerciseCount={day.routine_day_exercises.length}
            />
          ))
        )}
      </div>

      {/* Create form sheet */}
      <BottomSheet
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title="Nuevo día"
      >
        <RoutineDayForm
          key={isFormOpen ? "open" : "closed"}
          position={days.length}
          onSaved={handleSaved}
          onClose={() => setIsFormOpen(false)}
        />
      </BottomSheet>
    </div>
  );
}
