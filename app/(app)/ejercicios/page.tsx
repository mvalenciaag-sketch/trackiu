"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Plus, Search, X, Dumbbell, SlidersHorizontal } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { ExerciseWithMuscles, MuscleGroup } from "@/lib/supabase/types";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { EmptyState } from "@/components/ui/EmptyState";
import { ExerciseCard } from "@/components/exercises/ExerciseCard";
import { ExerciseForm } from "@/components/exercises/ExerciseForm";

// ── Filter option lists (no "Todos" — no selection = todos) ─────────────────

const ROLE_OPTIONS = [
  { value: "principal", label: "Principal" },
  { value: "secundario", label: "Secundario" },
  { value: "accesorio", label: "Accesorio" },
] as const;

const MECHANICS_OPTIONS = [
  { value: "compuesto", label: "Compuesto" },
  { value: "aislado", label: "Aislado" },
] as const;

type RoleValue = (typeof ROLE_OPTIONS)[number]["value"] | "";
type MechanicsValue = (typeof MECHANICS_OPTIONS)[number]["value"] | "";

// ── Page ─────────────────────────────────────────────────────────────────────

export default function EjerciciosPage() {
  const [exercises, setExercises] = useState<ExerciseWithMuscles[]>([]);
  const [muscleGroups, setMuscleGroups] = useState<MuscleGroup[]>([]);
  const [loading, setLoading] = useState(true);

  // ── Applied filters ────────────────────────────────────────────────────────
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleValue>("");
  const [mechanicsFilter, setMechanicsFilter] = useState<MechanicsValue>("");
  const [muscleGroupFilter, setMuscleGroupFilter] = useState<string[]>([]);

  // ── Filter sheet state ────────────────────────────────────────────────────
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  // Draft state: changes here are only committed when "Aplicar" is pressed
  const [draftRole, setDraftRole] = useState<RoleValue>("");
  const [draftMechanics, setDraftMechanics] = useState<MechanicsValue>("");
  const [draftMuscles, setDraftMuscles] = useState<string[]>([]);

  // ── Form sheet state ──────────────────────────────────────────────────────
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingExercise, setEditingExercise] =
    useState<ExerciseWithMuscles | null>(null);

  const supabase = useMemo(() => createClient(), []);

  // ── Data fetching ─────────────────────────────────────────────────────────

  const fetchExercises = useCallback(async () => {
    const { data } = await supabase
      .from("exercises")
      .select(`*, exercise_muscle_groups(*, muscle_groups(*))`)
      .order("name");
    if (data) setExercises(data as ExerciseWithMuscles[]);
  }, [supabase]);

  const fetchMuscleGroups = useCallback(async () => {
    const { data } = await supabase
      .from("muscle_groups")
      .select("*")
      .order("name");
    if (data) setMuscleGroups(data);
  }, [supabase]);

  useEffect(() => {
    Promise.all([fetchExercises(), fetchMuscleGroups()]).finally(() =>
      setLoading(false)
    );
  }, [fetchExercises, fetchMuscleGroups]);

  // ── Filtered list ─────────────────────────────────────────────────────────

  const filtered = useMemo(
    () =>
      exercises.filter((ex) => {
        if (!ex.name.toLowerCase().includes(search.toLowerCase())) return false;
        if (roleFilter && ex.role !== roleFilter) return false;
        if (mechanicsFilter && ex.mechanics !== mechanicsFilter) return false;
        if (muscleGroupFilter.length > 0) {
          const exMgIds = ex.exercise_muscle_groups.map(
            (emg) => emg.muscle_group_id
          );
          if (!muscleGroupFilter.some((id) => exMgIds.includes(id)))
            return false;
        }
        return true;
      }),
    [exercises, search, roleFilter, mechanicsFilter, muscleGroupFilter]
  );

  // ── Active filter count (badge on the Filtros button) ────────────────────

  const activeFilterCount =
    (roleFilter ? 1 : 0) +
    (mechanicsFilter ? 1 : 0) +
    muscleGroupFilter.length;

  // ── Filter sheet actions ──────────────────────────────────────────────────

  function openFilterSheet() {
    // Seed drafts from current applied filters
    setDraftRole(roleFilter);
    setDraftMechanics(mechanicsFilter);
    setDraftMuscles([...muscleGroupFilter]);
    setIsFilterSheetOpen(true);
  }

  function applyFilters() {
    setRoleFilter(draftRole);
    setMechanicsFilter(draftMechanics);
    setMuscleGroupFilter(draftMuscles);
    setIsFilterSheetOpen(false);
  }

  function clearAllFilters() {
    setRoleFilter("");
    setMechanicsFilter("");
    setMuscleGroupFilter([]);
    setDraftRole("");
    setDraftMechanics("");
    setDraftMuscles([]);
    setIsFilterSheetOpen(false);
  }

  // ── Form actions ──────────────────────────────────────────────────────────

  function openCreate() {
    setEditingExercise(null);
    setIsFormOpen(true);
  }

  function openEdit(exercise: ExerciseWithMuscles) {
    setEditingExercise(exercise);
    setIsFormOpen(true);
  }

  function closeForm() {
    setIsFormOpen(false);
    setEditingExercise(null);
  }

  function handleSaved() {
    closeForm();
    fetchExercises();
  }

  function handleMuscleGroupCreated(mg: MuscleGroup) {
    setMuscleGroups((prev) =>
      [...prev, mg].sort((a, b) => a.name.localeCompare(b.name, "es"))
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col min-h-full">
      {/* ── Page header ──────────────────────────────────────────────────── */}
      <div className="px-4 pt-6 pb-3 flex items-center justify-between">
        <h1 className="text-xl font-bold">Ejercicios</h1>
        <Button size="sm" onClick={openCreate} className="gap-1.5 shrink-0">
          <Plus size={15} strokeWidth={2.5} />
          Añadir
        </Button>
      </div>

      {/* ── Search + Filtros button (same row) ───────────────────────────── */}
      <div className="px-4 pb-3 flex gap-2">
        {/* Search */}
        <div className="relative flex-1">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
          />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar ejercicio..."
            className="h-11 w-full rounded-xl bg-surface-2 border border-border pl-9 pr-9 text-base
                       text-foreground placeholder:text-muted focus:outline-none focus:ring-2
                       focus:ring-accent focus:border-transparent transition-colors"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted p-1 touch-manipulation"
              aria-label="Borrar búsqueda"
              type="button"
            >
              <X size={15} />
            </button>
          )}
        </div>

        {/* Filtros button */}
        <button
          type="button"
          onClick={openFilterSheet}
          className="flex items-center gap-1.5 h-11 px-3 rounded-xl bg-surface-2 border border-border
                     text-sm font-medium shrink-0 active:bg-surface transition-colors touch-manipulation
                     whitespace-nowrap"
          style={
            activeFilterCount > 0
              ? { borderColor: "var(--accent)", color: "var(--accent)" }
              : undefined
          }
        >
          <SlidersHorizontal
            size={15}
            className={activeFilterCount > 0 ? "text-accent" : "text-muted"}
          />
          <span>
            Filtros{activeFilterCount > 0 ? ` · ${activeFilterCount}` : ""}
          </span>
        </button>
      </div>

      {/* ── Active filter chips (deletable, shown only when filters are set) */}
      {activeFilterCount > 0 && (
        <div className="px-4 pb-3 flex flex-wrap gap-2">
          {roleFilter && (
            <Chip
              label={
                ROLE_OPTIONS.find((o) => o.value === roleFilter)?.label ??
                roleFilter
              }
              selected
              onRemove={() => setRoleFilter("")}
              size="sm"
            />
          )}
          {mechanicsFilter && (
            <Chip
              label={
                MECHANICS_OPTIONS.find((o) => o.value === mechanicsFilter)
                  ?.label ?? mechanicsFilter
              }
              selected
              onRemove={() => setMechanicsFilter("")}
              size="sm"
            />
          )}
          {muscleGroupFilter.map((mgId) => {
            const mg = muscleGroups.find((m) => m.id === mgId);
            return mg ? (
              <Chip
                key={mgId}
                label={mg.name}
                selected
                onRemove={() =>
                  setMuscleGroupFilter((prev) =>
                    prev.filter((id) => id !== mgId)
                  )
                }
                size="sm"
              />
            ) : null;
          })}
        </div>
      )}

      {/* ── Exercise list ─────────────────────────────────────────────────── */}
      <div className="px-4 flex flex-col gap-3 pb-6">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-[88px] rounded-2xl bg-surface border border-border animate-pulse"
            />
          ))
        ) : exercises.length === 0 ? (
          <EmptyState
            icon={Dumbbell}
            title="Sin ejercicios"
            description="Añade tus primeros ejercicios para construir tus rutinas."
            action={{ label: "Añadir ejercicio", onClick: openCreate }}
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Search}
            title="Sin resultados"
            description="No hay ejercicios con estos filtros."
            action={
              activeFilterCount > 0
                ? { label: "Limpiar filtros", onClick: clearAllFilters }
                : undefined
            }
          />
        ) : (
          filtered.map((exercise) => (
            <ExerciseCard
              key={exercise.id}
              exercise={exercise}
              onEdit={() => openEdit(exercise)}
            />
          ))
        )}
      </div>

      {/* ── Filter sheet ──────────────────────────────────────────────────── */}
      <BottomSheet
        isOpen={isFilterSheetOpen}
        onClose={() => setIsFilterSheetOpen(false)}
        title="Filtros"
        footer={
          <div className="flex gap-2">
            <Button variant="ghost" fullWidth onClick={clearAllFilters}>
              Limpiar
            </Button>
            <Button fullWidth onClick={applyFilters}>
              Aplicar
            </Button>
          </div>
        }
      >
        <div className="px-4 pt-4 pb-4 flex flex-col gap-7">
          {/* Rol */}
          <div className="flex flex-col gap-3">
            <p className="text-xs font-semibold text-muted uppercase tracking-wider">
              Rol
            </p>
            <div className="flex flex-wrap gap-2">
              {ROLE_OPTIONS.map((opt) => (
                <Chip
                  key={opt.value}
                  label={opt.label}
                  selected={draftRole === opt.value}
                  onClick={() =>
                    setDraftRole((prev) =>
                      prev === opt.value ? "" : opt.value
                    )
                  }
                />
              ))}
            </div>
          </div>

          {/* Mecánica */}
          <div className="flex flex-col gap-3">
            <p className="text-xs font-semibold text-muted uppercase tracking-wider">
              Mecánica
            </p>
            <div className="flex flex-wrap gap-2">
              {MECHANICS_OPTIONS.map((opt) => (
                <Chip
                  key={opt.value}
                  label={opt.label}
                  selected={draftMechanics === opt.value}
                  onClick={() =>
                    setDraftMechanics((prev) =>
                      prev === opt.value ? "" : opt.value
                    )
                  }
                />
              ))}
            </div>
          </div>

          {/* Grupos musculares */}
          {muscleGroups.length > 0 && (
            <div className="flex flex-col gap-3">
              <p className="text-xs font-semibold text-muted uppercase tracking-wider">
                Grupos musculares
              </p>
              <div className="flex flex-wrap gap-2">
                {muscleGroups.map((mg) => (
                  <Chip
                    key={mg.id}
                    label={mg.name}
                    selected={draftMuscles.includes(mg.id)}
                    onClick={() =>
                      setDraftMuscles((prev) =>
                        prev.includes(mg.id)
                          ? prev.filter((id) => id !== mg.id)
                          : [...prev, mg.id]
                      )
                    }
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </BottomSheet>

      {/* ── Create / Edit sheet ───────────────────────────────────────────── */}
      <BottomSheet
        isOpen={isFormOpen}
        onClose={closeForm}
        title={editingExercise ? "Editar ejercicio" : "Nuevo ejercicio"}
      >
        <ExerciseForm
          key={editingExercise?.id ?? "new"}
          exercise={editingExercise}
          muscleGroups={muscleGroups}
          onSaved={handleSaved}
          onClose={closeForm}
          onMuscleGroupCreated={handleMuscleGroupCreated}
        />
      </BottomSheet>
    </div>
  );
}
