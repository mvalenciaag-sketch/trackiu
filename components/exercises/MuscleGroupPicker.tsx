"use client";

import { useState } from "react";
import { Plus, Search } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { MuscleGroup } from "@/lib/supabase/types";
import { Chip } from "@/components/ui/Chip";
import { cn } from "@/lib/utils";

interface MuscleGroupPickerProps {
  label: string;
  muscleGroups: MuscleGroup[];
  selectedIds: string[];
  disabledIds?: string[];
  onToggle: (id: string) => void;
  onCreated: (mg: MuscleGroup) => void;
}

export function MuscleGroupPicker({
  label,
  muscleGroups,
  selectedIds,
  disabledIds = [],
  onToggle,
  onCreated,
}: MuscleGroupPickerProps) {
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);

  const filtered = muscleGroups.filter((mg) =>
    mg.name.toLowerCase().includes(search.toLowerCase())
  );

  const exactMatch = muscleGroups.some(
    (mg) => mg.name.toLowerCase() === search.trim().toLowerCase()
  );

  async function handleCreate() {
    if (!search.trim() || creating || exactMatch) return;
    setCreating(true);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setCreating(false);
      return;
    }

    const slug = search
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");

    const { data: newMg } = await supabase
      .from("muscle_groups")
      .insert({ name: search.trim(), slug, user_id: user.id })
      .select()
      .single();

    if (newMg) {
      onCreated(newMg);
      onToggle(newMg.id);
      setSearch("");
    }

    setCreating(false);
  }

  return (
    <div className="flex flex-col gap-2.5">
      {label && <p className="text-sm font-medium text-foreground">{label}</p>}

      {/* Search input */}
      <div className="relative">
        <Search
          size={13}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
        />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar o crear..."
          className="h-9 w-full rounded-lg bg-surface-2 border border-border pl-8 pr-3 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-accent focus:border-transparent transition-colors"
        />
      </div>

      {/* Chips */}
      <div className="flex flex-wrap gap-2">
        {filtered.map((mg) => {
          const isSelected = selectedIds.includes(mg.id);
          const isDisabled = disabledIds.includes(mg.id);
          return (
            <div
              key={mg.id}
              className={cn(isDisabled && "opacity-30 pointer-events-none")}
            >
              <Chip
                label={mg.name}
                selected={isSelected}
                onClick={() => onToggle(mg.id)}
                size="sm"
              />
            </div>
          );
        })}

        {/* Create new muscle group */}
        {search.trim() && !exactMatch && (
          <button
            type="button"
            onClick={handleCreate}
            disabled={creating}
            className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border border-dashed border-accent/50 text-accent hover:bg-accent/10 transition-colors disabled:opacity-50 min-h-[44px]"
          >
            <Plus size={12} />
            {creating ? "Creando..." : `Crear "${search.trim()}"`}
          </button>
        )}

        {filtered.length === 0 && !search.trim() && (
          <p className="text-xs text-muted">
            Ningún grupo muscular disponible.
          </p>
        )}
      </div>
    </div>
  );
}
