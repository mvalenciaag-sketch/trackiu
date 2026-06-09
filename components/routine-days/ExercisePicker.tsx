"use client";

import { useState, useMemo } from "react";
import { Search, Check } from "lucide-react";
import type { Exercise } from "@/lib/supabase/types";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

interface ExercisePickerProps {
  exercises: Exercise[];
  excludedIds: string[];
  onConfirm: (selectedIds: string[]) => void;
}

export function ExercisePicker({
  exercises,
  excludedIds,
  onConfirm,
}: ExercisePickerProps) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string[]>([]);

  const available = useMemo(
    () => exercises.filter((ex) => !excludedIds.includes(ex.id)),
    [exercises, excludedIds]
  );

  const filtered = useMemo(
    () =>
      available.filter((ex) =>
        ex.name.toLowerCase().includes(search.toLowerCase())
      ),
    [available, search]
  );

  function toggle(id: string) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  return (
    <div className="flex flex-col gap-3 px-4 pt-2 pb-8">
      {/* Search */}
      <div className="relative">
        <Search
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
        />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar ejercicio..."
          className="h-11 w-full rounded-xl bg-surface-2 border border-border pl-9 pr-4 text-base text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-colors"
        />
      </div>

      {/* Exercise list */}
      <div className="flex flex-col gap-1.5 max-h-72 overflow-y-auto overscroll-contain">
        {available.length === 0 ? (
          <p className="text-sm text-muted text-center py-6">
            Todos los ejercicios de tu biblioteca ya están en este día.
          </p>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-muted text-center py-6">
            Sin resultados para &quot;{search}&quot;.
          </p>
        ) : (
          filtered.map((ex) => {
            const isSelected = selected.includes(ex.id);
            return (
              <button
                key={ex.id}
                type="button"
                onClick={() => toggle(ex.id)}
                className={cn(
                  "flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-colors",
                  isSelected
                    ? "bg-accent/10 border border-accent/25"
                    : "bg-surface-2 border border-transparent"
                )}
              >
                <div
                  className={cn(
                    "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all",
                    isSelected
                      ? "border-accent bg-accent"
                      : "border-border"
                  )}
                >
                  {isSelected && (
                    <Check size={11} strokeWidth={3} className="text-white" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{ex.name}</p>
                  <p className="text-xs text-muted capitalize">
                    {ex.role} · {ex.mechanics}
                  </p>
                </div>
              </button>
            );
          })
        )}
      </div>

      <Button
        fullWidth
        disabled={selected.length === 0}
        onClick={() => onConfirm(selected)}
        className="h-12 text-base font-semibold"
      >
        {selected.length === 0
          ? "Selecciona ejercicios"
          : `Añadir ${selected.length} ejercicio${selected.length === 1 ? "" : "s"}`}
      </Button>
    </div>
  );
}
