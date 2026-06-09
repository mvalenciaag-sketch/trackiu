"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Plus, Edit2, Dumbbell, Copy, Share2, Link2, Link2Off } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { RoutineDay, RoutineDayExercise, Exercise } from "@/lib/supabase/types";
import { Button } from "@/components/ui/Button";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { EmptyState } from "@/components/ui/EmptyState";
import { DayExerciseRow } from "@/components/routine-days/DayExerciseRow";
import { ExercisePicker } from "@/components/routine-days/ExercisePicker";
import { RoutineDayForm } from "@/components/routine-days/RoutineDayForm";
import { encodeRoutine } from "@/lib/utils/shareRoutine";

type DayExItem = RoutineDayExercise & { exercises: Exercise };

export default function DayDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [day, setDay] = useState<RoutineDay | null>(null);
  const [items, setItems] = useState<DayExItem[]>([]);
  const [allExercises, setAllExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [shareCode, setShareCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [duplicating, setDuplicating] = useState(false);

  const supabase = useMemo(() => createClient(), []);

  const fetchData = useCallback(async () => {
    const [dayRes, itemsRes, exRes] = await Promise.all([
      supabase.from("routine_days").select("*").eq("id", id).single(),
      supabase
        .from("routine_day_exercises")
        .select("*, exercises(*)")
        .eq("routine_day_id", id)
        .order("position"),
      supabase.from("exercises").select("*").order("name"),
    ]);

    if (dayRes.error || !dayRes.data) {
      router.push("/dias");
      return;
    }
    setDay(dayRes.data);
    if (itemsRes.data) setItems(itemsRes.data as DayExItem[]);
    if (exRes.data) setAllExercises(exRes.data);
  }, [supabase, id, router]);

  useEffect(() => {
    fetchData().finally(() => setLoading(false));
  }, [fetchData]);

  // ── Reorder ─────────────────────────────────────────────────────────────

  async function moveUp(index: number) {
    if (index === 0) return;
    const next = [...items];
    const a = { ...next[index - 1], position: index };
    const b = { ...next[index], position: index - 1 };
    next[index - 1] = b;
    next[index] = a;
    setItems(next);
    await Promise.all([
      supabase.from("routine_day_exercises").update({ position: index - 1 }).eq("id", b.id),
      supabase.from("routine_day_exercises").update({ position: index }).eq("id", a.id),
    ]);
  }

  async function moveDown(index: number) {
    if (index === items.length - 1) return;
    const next = [...items];
    const a = { ...next[index], position: index + 1 };
    const b = { ...next[index + 1], position: index };
    next[index] = b;
    next[index + 1] = a;
    setItems(next);
    await Promise.all([
      supabase.from("routine_day_exercises").update({ position: index + 1 }).eq("id", a.id),
      supabase.from("routine_day_exercises").update({ position: index }).eq("id", b.id),
    ]);
  }

  // ── Superset toggle ──────────────────────────────────────────────────────

  async function toggleSuperset(index: number) {
    if (index >= items.length - 1) return;
    const a = items[index];
    const b = items[index + 1];

    let newGroupA: number | null;
    let newGroupB: number | null;

    if (a.superset_group !== null && a.superset_group === b.superset_group) {
      // Unlink
      newGroupA = null;
      newGroupB = null;
    } else {
      // Link — assign same group
      const usedGroups = items
        .map((i) => i.superset_group)
        .filter((g): g is number => g !== null);
      const newGroup =
        usedGroups.length > 0 ? Math.max(...usedGroups) + 1 : 1;
      newGroupA = a.superset_group ?? newGroup;
      newGroupB = newGroupA;
    }

    setItems((prev) =>
      prev.map((item, i) => {
        if (i === index) return { ...item, superset_group: newGroupA };
        if (i === index + 1) return { ...item, superset_group: newGroupB };
        return item;
      })
    );

    await Promise.all([
      supabase
        .from("routine_day_exercises")
        .update({ superset_group: newGroupA })
        .eq("id", a.id),
      supabase
        .from("routine_day_exercises")
        .update({ superset_group: newGroupB })
        .eq("id", b.id),
    ]);
  }

  // ── CRUD ────────────────────────────────────────────────────────────────

  async function removeItem(itemId: string) {
    setItems((prev) =>
      prev
        .filter((x) => x.id !== itemId)
        .map((x, i) => ({ ...x, position: i }))
    );
    await supabase.from("routine_day_exercises").delete().eq("id", itemId);
  }

  async function changeSets(itemId: string, sets: number) {
    setItems((prev) =>
      prev.map((x) => (x.id === itemId ? { ...x, target_sets: sets } : x))
    );
    await supabase
      .from("routine_day_exercises")
      .update({ target_sets: sets })
      .eq("id", itemId);
  }

  async function handleAddExercises(selectedIds: string[]) {
    const inserts = selectedIds.map((exerciseId, i) => ({
      routine_day_id: id,
      exercise_id: exerciseId,
      position: items.length + i,
    }));

    const { data } = await supabase
      .from("routine_day_exercises")
      .insert(inserts)
      .select("*, exercises(*)");

    if (data) {
      setItems((prev) => [...prev, ...(data as DayExItem[])]);
    }
    setIsPickerOpen(false);
  }

  // ── Duplicate ────────────────────────────────────────────────────────────

  async function duplicateDay() {
    if (!day) return;
    setDuplicating(true);

    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id;
    if (!userId) { setDuplicating(false); return; }

    const { data: newDay } = await supabase
      .from("routine_days")
      .insert({
        user_id: userId,
        name: `${day.name} (copia)`,
        description: day.description,
        color: day.color,
        position: 9999,
      })
      .select()
      .single();

    if (!newDay) { setDuplicating(false); return; }

    if (items.length > 0) {
      await supabase.from("routine_day_exercises").insert(
        items.map((item) => ({
          routine_day_id: newDay.id,
          exercise_id: item.exercise_id,
          position: item.position,
          target_sets: item.target_sets,
          notes: item.notes,
          superset_group: item.superset_group,
        }))
      );
    }

    setDuplicating(false);
    router.push(`/dias/${newDay.id}`);
  }

  // ── Share ────────────────────────────────────────────────────────────────

  function openShare() {
    if (!day) return;
    const code = encodeRoutine({
      v: 1,
      name: day.name,
      description: day.description ?? null,
      color: day.color ?? null,
      exercises: items.map((item) => ({
        name: item.exercises.name,
        role: item.exercises.role,
        mechanics: item.exercises.mechanics,
        equipment: item.exercises.equipment ?? null,
        target_sets: item.target_sets ?? null,
        notes: item.notes ?? null,
        superset_group: item.superset_group ?? null,
      })),
    });
    setShareCode(code);
    setIsShareOpen(true);
    setCopied(false);
  }

  function copyCode() {
    navigator.clipboard.writeText(shareCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  // ── Render ───────────────────────────────────────────────────────────────

  const excludedIds = useMemo(() => items.map((x) => x.exercise_id), [items]);

  if (loading) {
    return (
      <div className="px-4 pt-6 flex flex-col gap-4">
        <div className="h-8 w-40 bg-surface rounded-lg animate-pulse" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-16 bg-surface rounded-2xl border border-border animate-pulse" />
        ))}
      </div>
    );
  }

  if (!day) return null;

  return (
    <div className="flex flex-col min-h-full">
      {/* Header */}
      <div className="px-4 pt-6 pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/dias"
            className="w-9 h-9 flex items-center justify-center rounded-full bg-surface-2 text-muted shrink-0"
            aria-label="Volver a días"
          >
            <ArrowLeft size={17} />
          </Link>
          <div
            className="w-3 h-3 rounded-full shrink-0"
            style={{ backgroundColor: day.color ?? "#6366f1" }}
          />
          <h1 className="text-xl font-bold flex-1 min-w-0 truncate">{day.name}</h1>
          {/* Action buttons */}
          <button
            onClick={openShare}
            disabled={items.length === 0}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-surface-2 text-muted shrink-0 disabled:opacity-30"
            aria-label="Compartir día"
          >
            <Share2 size={15} />
          </button>
          <button
            onClick={duplicateDay}
            disabled={duplicating}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-surface-2 text-muted shrink-0 disabled:opacity-50"
            aria-label="Duplicar día"
          >
            <Copy size={15} />
          </button>
          <button
            onClick={() => setIsEditOpen(true)}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-surface-2 text-muted shrink-0"
            aria-label="Editar día"
          >
            <Edit2 size={15} />
          </button>
        </div>
        {day.description && (
          <p className="text-sm text-muted mt-1.5 ml-12">{day.description}</p>
        )}
      </div>

      {/* Exercise list with superset connectors */}
      <div className="px-4 pb-4">
        {items.length === 0 ? (
          <EmptyState
            icon={Dumbbell}
            title="Sin ejercicios"
            description="Añade ejercicios de tu biblioteca para construir este día."
            action={{ label: "Añadir ejercicios", onClick: () => setIsPickerOpen(true) }}
          />
        ) : (
          <div className="flex flex-col">
            {items.map((item, index) => {
              const nextItem = items[index + 1];
              const linked =
                item.superset_group !== null &&
                nextItem?.superset_group === item.superset_group;

              return (
                <div key={item.id} className="flex flex-col">
                  <DayExerciseRow
                    item={item}
                    isFirst={index === 0}
                    isLast={index === items.length - 1}
                    onMoveUp={() => moveUp(index)}
                    onMoveDown={() => moveDown(index)}
                    onRemove={() => removeItem(item.id)}
                    onChangeSets={(sets) => changeSets(item.id, sets)}
                    supersetGroup={item.superset_group}
                  />
                  {/* Superset connector between adjacent exercises */}
                  {index < items.length - 1 && (
                    <div className="flex items-center gap-2 px-1 my-0.5">
                      <div className={`flex-1 h-px ${linked ? "bg-accent/40" : "bg-transparent"}`} />
                      <button
                        onClick={() => toggleSuperset(index)}
                        className={`flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-medium transition-colors ${
                          linked
                            ? "bg-accent/15 text-accent border border-accent/30"
                            : "bg-surface-2 text-muted border border-transparent hover:border-border"
                        }`}
                        aria-label={linked ? "Desenlazar superset" : "Enlazar como superset"}
                      >
                        {linked ? (
                          <>
                            <Link2Off size={11} />
                            Superset
                          </>
                        ) : (
                          <>
                            <Link2 size={11} />
                            Superset
                          </>
                        )}
                      </button>
                      <div className={`flex-1 h-px ${linked ? "bg-accent/40" : "bg-transparent"}`} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add exercises button */}
      {items.length > 0 && (
        <div className="px-4 pb-6">
          <Button variant="secondary" fullWidth onClick={() => setIsPickerOpen(true)} className="gap-2 h-11">
            <Plus size={16} />
            Añadir ejercicios
          </Button>
        </div>
      )}

      {/* Exercise picker sheet */}
      <BottomSheet isOpen={isPickerOpen} onClose={() => setIsPickerOpen(false)} title="Añadir ejercicios">
        <ExercisePicker
          exercises={allExercises}
          excludedIds={excludedIds}
          onConfirm={handleAddExercises}
        />
      </BottomSheet>

      {/* Edit day sheet */}
      <BottomSheet isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Editar día">
        <RoutineDayForm
          key={day.id + "-edit"}
          day={day}
          onSaved={(updated) => { setDay(updated); setIsEditOpen(false); }}
          onDeleted={() => router.push("/dias")}
          onClose={() => setIsEditOpen(false)}
        />
      </BottomSheet>

      {/* Share sheet */}
      <BottomSheet isOpen={isShareOpen} onClose={() => setIsShareOpen(false)} title="Compartir día">
        <div className="px-4 pt-2 pb-10 flex flex-col gap-4">
          <p className="text-sm text-muted">
            Comparte este código con quien quiera importar tu día de entrenamiento.
          </p>
          <div
            className="rounded-xl bg-surface-2 border border-border p-3 font-mono text-xs break-all select-all text-muted"
            onClick={copyCode}
          >
            {shareCode}
          </div>
          <Button fullWidth onClick={copyCode} variant={copied ? "secondary" : "primary"} className="h-12 gap-2">
            {copied ? "¡Copiado!" : "Copiar código"}
          </Button>
          <p className="text-xs text-muted text-center">
            Para importar: <Link href="/importar" className="text-accent underline">Días → Importar</Link>
          </p>
        </div>
      </BottomSheet>
    </div>
  );
}
