"use client";

import { useState } from "react";
import { AlertTriangle, Plus, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import type { ExerciseWithMuscles, MuscleGroup } from "@/lib/supabase/types";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { MuscleGroupPicker } from "./MuscleGroupPicker";

const ROLE_OPTIONS = [
  { value: "principal" as const, label: "Principal" },
  { value: "secundario" as const, label: "Secundario" },
  { value: "accesorio" as const, label: "Accesorio" },
];

const MECHANICS_OPTIONS = [
  { value: "compuesto" as const, label: "Compuesto" },
  { value: "aislado" as const, label: "Aislado" },
];

interface ExerciseFormProps {
  exercise?: ExerciseWithMuscles | null;
  muscleGroups: MuscleGroup[];
  onSaved: () => void;
  onClose: () => void;
  onMuscleGroupCreated: (mg: MuscleGroup) => void;
}

export function ExerciseForm({
  exercise,
  muscleGroups,
  onSaved,
  onClose: _onClose, // closing is handled by the parent BottomSheet header
  onMuscleGroupCreated,
}: ExerciseFormProps) {
  const isEditing = !!exercise;

  // ── Form fields ────────────────────────────────────────────────────────────
  const [name, setName] = useState(exercise?.name ?? "");
  const [role, setRole] = useState<"principal" | "secundario" | "accesorio">(
    (exercise?.role as "principal" | "secundario" | "accesorio") ?? "principal"
  );
  const [mechanics, setMechanics] = useState<"compuesto" | "aislado">(
    (exercise?.mechanics as "compuesto" | "aislado") ?? "compuesto"
  );
  const [equipment, setEquipment] = useState(exercise?.equipment ?? "");
  const [notes, setNotes] = useState(exercise?.notes ?? "");
  const [primaryMuscles, setPrimaryMuscles] = useState<string[]>(
    () =>
      exercise?.exercise_muscle_groups
        .filter((emg) => emg.relation === "primary")
        .map((emg) => emg.muscle_group_id) ?? []
  );
  const [secondaryMuscles, setSecondaryMuscles] = useState<string[]>(
    () =>
      exercise?.exercise_muscle_groups
        .filter((emg) => emg.relation === "secondary")
        .map((emg) => emg.muscle_group_id) ?? []
  );

  // ── UI state ───────────────────────────────────────────────────────────────
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  /** null = closed, "primary" | "secondary" = which muscle picker is open */
  const [musclePickerTarget, setMusclePickerTarget] = useState<
    "primary" | "secondary" | null
  >(null);

  // ── Muscle toggle helpers ──────────────────────────────────────────────────
  function togglePrimary(id: string) {
    setPrimaryMuscles((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
    setSecondaryMuscles((prev) => prev.filter((x) => x !== id));
  }

  function toggleSecondary(id: string) {
    setSecondaryMuscles((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
    setPrimaryMuscles((prev) => prev.filter((x) => x !== id));
  }

  // ── Save ───────────────────────────────────────────────────────────────────
  async function handleSave() {
    if (!name.trim()) {
      setError("El nombre es obligatorio");
      return;
    }
    setSaving(true);
    setError("");

    const supabase = createClient();

    try {
      let exerciseId = exercise?.id;

      if (isEditing && exercise) {
        const { error: updateError } = await supabase
          .from("exercises")
          .update({
            name: name.trim(),
            role,
            mechanics,
            equipment: equipment.trim() || null,
            notes: notes.trim() || null,
          })
          .eq("id", exercise.id);

        if (updateError) throw updateError;

        await supabase
          .from("exercise_muscle_groups")
          .delete()
          .eq("exercise_id", exercise.id);
      } else {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) throw new Error("No autenticado");

        const { data: newEx, error: insertError } = await supabase
          .from("exercises")
          .insert({
            name: name.trim(),
            role,
            mechanics,
            equipment: equipment.trim() || null,
            notes: notes.trim() || null,
            user_id: user.id,
          })
          .select()
          .single();

        if (insertError || !newEx)
          throw insertError ?? new Error("Error al crear");
        exerciseId = newEx.id;
      }

      // Re-insert muscle group relations
      const inserts = [
        ...primaryMuscles.map((id) => ({
          exercise_id: exerciseId!,
          muscle_group_id: id,
          relation: "primary" as const,
        })),
        ...secondaryMuscles.map((id) => ({
          exercise_id: exerciseId!,
          muscle_group_id: id,
          relation: "secondary" as const,
        })),
      ];

      if (inserts.length > 0) {
        const { error: mgError } = await supabase
          .from("exercise_muscle_groups")
          .insert(inserts);
        if (mgError) throw mgError;
      }

      onSaved();
    } catch {
      setError("Error al guardar. Inténtalo de nuevo.");
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!exercise) return;
    setDeleting(true);
    const supabase = createClient();
    await supabase.from("exercises").delete().eq("id", exercise.id);
    onSaved();
  }

  // ── Derived muscle objects ─────────────────────────────────────────────────
  const primaryMuscleObjs = muscleGroups.filter((mg) =>
    primaryMuscles.includes(mg.id)
  );
  const secondaryMuscleObjs = muscleGroups.filter((mg) =>
    secondaryMuscles.includes(mg.id)
  );

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      {/* ── Scrollable form body ──────────────────────────────────────────── */}
      <div className="px-4 pt-4 pb-2 flex flex-col gap-5">
        {/* Nombre */}
        <Input
          label="Nombre"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="p. ej. Press de banca"
          autoFocus
        />

        {/* Rol */}
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium">Rol</p>
          <SegmentedControl
            layoutId="form-role"
            options={ROLE_OPTIONS}
            value={role}
            onChange={setRole}
          />
        </div>

        {/* Mecánica */}
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium">Mecánica</p>
          <SegmentedControl
            layoutId="form-mechanics"
            options={MECHANICS_OPTIONS}
            value={mechanics}
            onChange={setMechanics}
          />
        </div>

        {/* Músculos primarios */}
        <MuscleSection
          label="Músculos primarios"
          muscles={primaryMuscleObjs}
          onRemove={togglePrimary}
          onAdd={() => setMusclePickerTarget("primary")}
          accent
        />

        {/* Músculos secundarios */}
        <MuscleSection
          label="Músculos secundarios"
          muscles={secondaryMuscleObjs}
          onRemove={toggleSecondary}
          onAdd={() => setMusclePickerTarget("secondary")}
          accent={false}
        />

        {/* Equipamiento */}
        <Input
          label="Equipamiento (opcional)"
          value={equipment}
          onChange={(e) => setEquipment(e.target.value)}
          placeholder="p. ej. Barra, Mancuernas, Máquina..."
        />

        {/* Notas */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">Notas (opcional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Técnica, variaciones, indicaciones..."
            rows={3}
            className="w-full rounded-xl bg-surface-2 border border-border px-3 py-2.5 text-base
                       text-foreground placeholder:text-muted focus:outline-none focus:ring-2
                       focus:ring-accent focus:border-transparent resize-none transition-colors"
          />
        </div>
      </div>

      {/* ── Sticky footer ─────────────────────────────────────────────────────
          sticky bottom-0 inside the BottomSheet's overflow-y-auto container
          → sticks to the visible bottom of the sheet while content scrolls above.
      ──────────────────────────────────────────────────────────────────────── */}
      <div
        className="sticky bottom-0 bg-surface-2 border-t border-border/50
                   px-4 pt-3 pb-5 flex flex-col gap-3"
      >
        {error && (
          <p className="text-sm text-red-400 flex items-center justify-center gap-1.5">
            <AlertTriangle size={14} className="shrink-0" />
            {error}
          </p>
        )}

        <Button
          fullWidth
          loading={saving}
          onClick={handleSave}
          className="h-12 text-base font-semibold"
        >
          {isEditing ? "Guardar cambios" : "Crear ejercicio"}
        </Button>

        {isEditing && (
          <AnimatePresence mode="wait">
            {confirmDelete ? (
              <motion.div
                key="confirm"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex flex-col gap-3"
              >
                <p className="text-sm text-center text-muted flex items-center justify-center gap-1.5">
                  <AlertTriangle size={14} className="text-red-400 shrink-0" />
                  ¿Eliminar &quot;{exercise.name}&quot;? No se puede deshacer.
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    fullWidth
                    onClick={() => setConfirmDelete(false)}
                    disabled={deleting}
                  >
                    Cancelar
                  </Button>
                  <Button
                    variant="danger"
                    fullWidth
                    loading={deleting}
                    onClick={handleDelete}
                  >
                    Eliminar
                  </Button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="delete-btn"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <Button
                  variant="ghost"
                  fullWidth
                  onClick={() => setConfirmDelete(true)}
                  className="text-red-400"
                >
                  Eliminar ejercicio
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>

      {/* ── Muscle picker sheet ───────────────────────────────────────────────
          Renders inside ExerciseForm which is already inside a BottomSheet.
          Both use fixed positioning; DOM order ensures this sheet is on top.
      ──────────────────────────────────────────────────────────────────────── */}
      <BottomSheet
        isOpen={musclePickerTarget !== null}
        onClose={() => setMusclePickerTarget(null)}
        title={
          musclePickerTarget === "primary"
            ? "Músculos primarios"
            : "Músculos secundarios"
        }
        footer={
          <Button fullWidth onClick={() => setMusclePickerTarget(null)}>
            Listo
          </Button>
        }
      >
        <div className="px-4 py-4">
          <MuscleGroupPicker
            label=""
            muscleGroups={muscleGroups}
            selectedIds={
              musclePickerTarget === "primary"
                ? primaryMuscles
                : secondaryMuscles
            }
            disabledIds={
              musclePickerTarget === "primary"
                ? secondaryMuscles
                : primaryMuscles
            }
            onToggle={
              musclePickerTarget === "primary"
                ? togglePrimary
                : toggleSecondary
            }
            onCreated={onMuscleGroupCreated}
          />
        </div>
      </BottomSheet>
    </>
  );
}

// ── Sub-component: inline muscle chips + "Añadir" button ─────────────────────

interface MuscleSectionProps {
  label: string;
  muscles: MuscleGroup[];
  onRemove: (id: string) => void;
  onAdd: () => void;
  /** true = primary (accent fill), false = secondary (accent soft) */
  accent: boolean;
}

function MuscleSection({
  label,
  muscles,
  onRemove,
  onAdd,
  accent,
}: MuscleSectionProps) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-medium">{label}</p>
      <div className="flex flex-wrap gap-2 items-center">
        {muscles.map((mg) => (
          <span
            key={mg.id}
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
              accent
                ? "bg-accent text-on-accent"
                : "bg-accent/20 text-accent border border-accent/30"
            }`}
          >
            {mg.name}
            <button
              type="button"
              onClick={() => onRemove(mg.id)}
              aria-label={`Quitar ${mg.name}`}
              className="rounded-full p-0.5 hover:bg-black/15 active:bg-black/25 transition-colors touch-manipulation"
            >
              <X size={11} />
            </button>
          </span>
        ))}

        {/* Add button */}
        <button
          type="button"
          onClick={onAdd}
          className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 min-h-[32px]
                     rounded-full border border-dashed border-accent/50 text-accent
                     hover:bg-accent/10 active:bg-accent/20 transition-colors touch-manipulation"
        >
          <Plus size={12} />
          {muscles.length > 0 ? "Añadir más" : "Añadir músculos"}
        </button>
      </div>
    </div>
  );
}
