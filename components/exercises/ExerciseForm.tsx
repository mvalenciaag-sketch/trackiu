"use client";

import { useState } from "react";
import { AlertTriangle, Plus, X, Dumbbell } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import type { ExerciseWithMuscles, MuscleGroup } from "@/lib/supabase/types";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { MuscleGroupPicker } from "./MuscleGroupPicker";
import { cn } from "@/lib/utils";

// ── Muscle region colour coding ────────────────────────────────────────────
// Maps muscle group names (as seeded) to training regions and accent hues.

const MUSCLE_REGION: Record<string, { hue: number; region: string }> = {
  "Pecho":                 { hue: 40,  region: "Empuje" },
  "Hombro anterior":       { hue: 40,  region: "Empuje" },
  "Hombro lateral":        { hue: 40,  region: "Empuje" },
  "Tríceps":               { hue: 40,  region: "Empuje" },
  "Espalda (dorsal)":      { hue: 270, region: "Tirón" },
  "Trapecio":              { hue: 270, region: "Tirón" },
  "Hombro posterior":      { hue: 270, region: "Tirón" },
  "Bíceps":                { hue: 270, region: "Tirón" },
  "Antebrazo":             { hue: 270, region: "Tirón" },
  "Cuádriceps":            { hue: 158, region: "Pierna" },
  "Femoral/Isquios":       { hue: 158, region: "Pierna" },
  "Gemelo":                { hue: 158, region: "Pierna" },
  "Glúteo":                { hue: 158, region: "Pierna" },
  "Abdomen":               { hue: 80,  region: "Core"   },
  "Lumbar":                { hue: 80,  region: "Core"   },
};

function muscleHue(name: string): number {
  return MUSCLE_REGION[name]?.hue ?? 40;
}

// ── Role cards ────────────────────────────────────────────────────────────

const ROLE_OPTIONS = [
  { value: "principal"  as const, label: "Principal",  help: "Eje del entreno",    bars: 3 },
  { value: "secundario" as const, label: "Secundario", help: "Trabajo de apoyo",   bars: 2 },
  { value: "accesorio"  as const, label: "Accesorio",  help: "Aislamiento / remate", bars: 1 },
];

// ── Mechanics cards ───────────────────────────────────────────────────────

const MECHANICS_OPTIONS = [
  {
    value: "compuesto" as const,
    label: "Compuesto",
    help: "Varias articulaciones",
    dots: 3,
  },
  {
    value: "aislado" as const,
    label: "Aislado",
    help: "Una articulación",
    dots: 1,
  },
];

// ── Props ─────────────────────────────────────────────────────────────────

interface ExerciseFormProps {
  exercise?: ExerciseWithMuscles | null;
  muscleGroups: MuscleGroup[];
  onSaved: () => void;
  onClose: () => void;
  onMuscleGroupCreated: (mg: MuscleGroup) => void;
}

// ── Component ─────────────────────────────────────────────────────────────

export function ExerciseForm({
  exercise,
  muscleGroups,
  onSaved,
  onClose: _onClose, // closing is handled by the parent BottomSheet header
  onMuscleGroupCreated,
}: ExerciseFormProps) {
  const isEditing = !!exercise;

  // ── Form fields ────────────────────────────────────────────────────────
  const [name,      setName]      = useState(exercise?.name ?? "");
  const [role,      setRole]      = useState<"principal"|"secundario"|"accesorio">(
    (exercise?.role as "principal"|"secundario"|"accesorio") ?? "principal"
  );
  const [mechanics, setMechanics] = useState<"compuesto"|"aislado">(
    (exercise?.mechanics as "compuesto"|"aislado") ?? "compuesto"
  );
  const [equipment, setEquipment] = useState(exercise?.equipment ?? "");
  const [notes,     setNotes]     = useState(exercise?.notes ?? "");
  const [primaryMuscles, setPrimaryMuscles]   = useState<string[]>(
    () => exercise?.exercise_muscle_groups
            .filter(emg => emg.relation === "primary")
            .map(emg => emg.muscle_group_id) ?? []
  );
  const [secondaryMuscles, setSecondaryMuscles] = useState<string[]>(
    () => exercise?.exercise_muscle_groups
            .filter(emg => emg.relation === "secondary")
            .map(emg => emg.muscle_group_id) ?? []
  );

  // ── UI state ───────────────────────────────────────────────────────────
  const [saving,        setSaving]        = useState(false);
  const [error,         setError]         = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting,      setDeleting]      = useState(false);
  const [musclePickerTarget, setMusclePickerTarget] = useState<"primary"|"secondary"|null>(null);

  // ── Muscle toggle helpers ─────────────────────────────────────────────
  function togglePrimary(id: string) {
    setPrimaryMuscles(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
    setSecondaryMuscles(prev => prev.filter(x => x !== id));
  }

  function toggleSecondary(id: string) {
    setSecondaryMuscles(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
    setPrimaryMuscles(prev => prev.filter(x => x !== id));
  }

  // ── Save ───────────────────────────────────────────────────────────────
  async function handleSave() {
    if (!name.trim()) { setError("El nombre es obligatorio"); return; }
    setSaving(true);
    setError("");
    const supabase = createClient();
    try {
      let exerciseId = exercise?.id;
      if (isEditing && exercise) {
        const { error: updateError } = await supabase
          .from("exercises")
          .update({ name: name.trim(), role, mechanics,
                    equipment: equipment.trim() || null,
                    notes: notes.trim() || null })
          .eq("id", exercise.id);
        if (updateError) throw updateError;
        await supabase.from("exercise_muscle_groups").delete().eq("exercise_id", exercise.id);
      } else {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("No autenticado");
        const { data: newEx, error: insertError } = await supabase
          .from("exercises")
          .insert({ name: name.trim(), role, mechanics,
                    equipment: equipment.trim() || null,
                    notes: notes.trim() || null, user_id: user.id })
          .select().single();
        if (insertError || !newEx) throw insertError ?? new Error("Error al crear");
        exerciseId = newEx.id;
      }
      const inserts = [
        ...primaryMuscles.map(id => ({ exercise_id: exerciseId!, muscle_group_id: id, relation: "primary"   as const })),
        ...secondaryMuscles.map(id => ({ exercise_id: exerciseId!, muscle_group_id: id, relation: "secondary" as const })),
      ];
      if (inserts.length > 0) {
        const { error: mgError } = await supabase.from("exercise_muscle_groups").insert(inserts);
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

  // ── Derived ───────────────────────────────────────────────────────────
  const primaryMuscleObjs   = muscleGroups.filter(mg => primaryMuscles.includes(mg.id));
  const secondaryMuscleObjs = muscleGroups.filter(mg => secondaryMuscles.includes(mg.id));
  const previewHue          = primaryMuscleObjs[0] ? muscleHue(primaryMuscleObjs[0].name) : 40;

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <>
      {/* ── Scrollable form body ──────────────────────────────────── */}
      <div className="px-4 pt-4 pb-2 flex flex-col gap-5">

        {/* ── Live preview card ─────────────────────────────────────── */}
        <div
          className="relative overflow-hidden bg-surface-2 border border-border rounded-2xl
                     p-4 pl-[22px] flex items-center gap-3"
        >
          {/* Left accent bar */}
          <div
            className="absolute left-0 top-0 bottom-0 w-[5px] rounded-l-2xl"
            style={{ background: `oklch(0.64 0.16 ${previewHue})` }}
          />
          {/* Radial glow */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `radial-gradient(90% 120% at 0% 0%, oklch(0.62 0.16 ${previewHue} / 0.15), transparent 60%)`,
            }}
          />
          {/* Body */}
          <div className="flex-1 min-w-0 relative z-10">
            <p className="font-display font-semibold text-xl text-foreground leading-tight truncate">
              {name || "Nuevo ejercicio"}
            </p>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {/* Role badge */}
              <span className="inline-flex text-[11px] font-bold px-2.5 py-1 rounded-full
                               bg-accent-soft text-accent-soft-ink">
                {role.charAt(0).toUpperCase() + role.slice(1)}
              </span>
              {/* Mechanics badge */}
              <span className="inline-flex text-[11px] font-bold px-2.5 py-1 rounded-full
                               bg-surface-3 text-muted">
                {mechanics.charAt(0).toUpperCase() + mechanics.slice(1)}
              </span>
              {/* First primary muscle */}
              {primaryMuscleObjs.slice(0, 1).map(m => {
                const h = muscleHue(m.name);
                return (
                  <span key={m.id}
                    className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full"
                    style={{
                      background: `oklch(0.34 0.06 ${h})`,
                      color: `oklch(0.85 0.12 ${h})`,
                    }}>
                    <span className="w-1.5 h-1.5 rounded-full flex-none"
                      style={{ background: `oklch(0.66 0.16 ${h})` }} />
                    {m.name}
                  </span>
                );
              })}
              {/* Overflow count */}
              {(primaryMuscles.length + secondaryMuscles.length > 1) && (
                <span className="inline-flex text-[11px] font-bold px-2.5 py-1 rounded-full
                                 border border-border text-muted">
                  +{primaryMuscles.length + secondaryMuscles.length - 1}
                </span>
              )}
            </div>
          </div>
          {/* Icon */}
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center flex-none relative z-10"
            style={{ background: `oklch(0.64 0.16 ${previewHue})` }}
          >
            <Dumbbell size={22} color="#1a1208" />
          </div>
        </div>

        {/* Nombre */}
        <Input
          label="Nombre"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="p. ej. Press de banca"
          autoFocus
        />

        {/* ── Rol — tiered cards ────────────────────────────────────── */}
        <div className="flex flex-col gap-2">
          <p className="text-sm font-semibold text-foreground-2 uppercase tracking-wider text-[11px]">
            Rol del ejercicio
          </p>
          <div className="grid grid-cols-3 gap-2">
            {ROLE_OPTIONS.map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setRole(opt.value)}
                className={cn(
                  "flex flex-col gap-1 text-left rounded-2xl border-[1.5px] p-3 transition-all",
                  role === opt.value
                    ? "border-accent bg-accent-soft"
                    : "border-border bg-surface-2 active:bg-surface-3"
                )}
              >
                {/* Tier bars */}
                <div className="flex gap-1 mb-1">
                  {[1, 2, 3].map(b => (
                    <div
                      key={b}
                      className={cn(
                        "h-[4px] w-[14px] rounded-full transition-colors",
                        b <= opt.bars
                          ? "bg-accent"
                          : role === opt.value ? "bg-accent/30" : "bg-surface-3"
                      )}
                    />
                  ))}
                </div>
                <span className="font-display font-semibold text-[13.5px] text-foreground block">
                  {opt.label}
                </span>
                <span className={cn(
                  "text-[10.5px] leading-tight block",
                  role === opt.value ? "text-accent-soft-ink" : "text-muted"
                )}>
                  {opt.help}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* ── Mecánica — visual cards ───────────────────────────────── */}
        <div className="flex flex-col gap-2">
          <p className="text-sm font-semibold text-foreground-2 uppercase tracking-wider text-[11px]">
            Mecánica
          </p>
          <div className="grid grid-cols-2 gap-2">
            {MECHANICS_OPTIONS.map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setMechanics(opt.value)}
                className={cn(
                  "flex items-center gap-3 text-left rounded-2xl border-[1.5px] p-3 transition-all",
                  mechanics === opt.value
                    ? "border-accent bg-accent-soft"
                    : "border-border bg-surface-2 active:bg-surface-3"
                )}
              >
                {/* Icon: dots */}
                <div className="flex items-center gap-[5px] flex-none">
                  {Array.from({ length: opt.dots }).map((_, i) => (
                    <div key={i}
                      className={cn(
                        "rounded-full transition-colors",
                        opt.dots === 1 ? "w-3 h-3" : "w-2 h-2",
                        mechanics === opt.value ? "bg-accent" : "bg-surface-3"
                      )}
                    />
                  ))}
                </div>
                <div>
                  <span className="font-display font-semibold text-[13.5px] text-foreground block">
                    {opt.label}
                  </span>
                  <span className={cn(
                    "text-[11px] block",
                    mechanics === opt.value ? "text-accent-soft-ink" : "text-muted"
                  )}>
                    {opt.help}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Músculos primarios */}
        <MuscleSection
          label="Músculos primarios"
          muscles={primaryMuscleObjs}
          onRemove={togglePrimary}
          onAdd={() => setMusclePickerTarget("primary")}
          isPrimary
        />

        {/* Músculos secundarios */}
        <MuscleSection
          label="Músculos secundarios"
          muscles={secondaryMuscleObjs}
          onRemove={toggleSecondary}
          onAdd={() => setMusclePickerTarget("secondary")}
          isPrimary={false}
        />

        {/* Equipamiento */}
        <Input
          label="Equipamiento (opcional)"
          value={equipment}
          onChange={e => setEquipment(e.target.value)}
          placeholder="p. ej. Barra, Mancuernas, Máquina..."
        />

        {/* Notas */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">Notas (opcional)</label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Técnica, variaciones, indicaciones..."
            rows={3}
            className="w-full rounded-xl bg-surface-2 border border-border px-3 py-2.5 text-base
                       text-foreground placeholder:text-muted focus:outline-none focus:ring-2
                       focus:ring-accent focus:border-transparent resize-none transition-colors"
          />
        </div>
      </div>

      {/* ── Sticky footer ─────────────────────────────────────────────────
          sticky bottom-0 inside BottomSheet's overflow-y-auto → visible at bottom
      ──────────────────────────────────────────────────────────────────── */}
      <div className="sticky bottom-0 bg-surface-2 border-t border-border/50 px-4 pt-3 pb-5 flex flex-col gap-3">
        {error && (
          <p className="text-sm text-red-400 flex items-center justify-center gap-1.5">
            <AlertTriangle size={14} className="shrink-0" />
            {error}
          </p>
        )}

        <Button fullWidth loading={saving} onClick={handleSave} className="h-12 text-base font-semibold">
          {isEditing ? "Guardar cambios" : "Crear ejercicio"}
        </Button>

        {isEditing && (
          <AnimatePresence mode="wait">
            {confirmDelete ? (
              <motion.div key="confirm"
                initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="flex flex-col gap-3">
                <p className="text-sm text-center text-muted flex items-center justify-center gap-1.5">
                  <AlertTriangle size={14} className="text-red-400 shrink-0" />
                  ¿Eliminar &quot;{exercise.name}&quot;? No se puede deshacer.
                </p>
                <div className="flex gap-2">
                  <Button variant="ghost" fullWidth onClick={() => setConfirmDelete(false)} disabled={deleting}>
                    Cancelar
                  </Button>
                  <Button variant="danger" fullWidth loading={deleting} onClick={handleDelete}>
                    Eliminar
                  </Button>
                </div>
              </motion.div>
            ) : (
              <motion.div key="delete-btn" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <Button variant="ghost" fullWidth onClick={() => setConfirmDelete(true)} className="text-red-400">
                  Eliminar ejercicio
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>

      {/* ── Nested muscle picker sheet ────────────────────────────────────
          Renders inside ExerciseForm → already inside a BottomSheet.
          DOM order ensures this sheet appears on top (fixed z-50).
      ──────────────────────────────────────────────────────────────────── */}
      <BottomSheet
        isOpen={musclePickerTarget !== null}
        onClose={() => setMusclePickerTarget(null)}
        title={musclePickerTarget === "primary" ? "Músculos primarios" : "Músculos secundarios"}
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
            selectedIds={musclePickerTarget === "primary" ? primaryMuscles : secondaryMuscles}
            disabledIds={musclePickerTarget === "primary" ? secondaryMuscles : primaryMuscles}
            onToggle={musclePickerTarget === "primary" ? togglePrimary : toggleSecondary}
            onCreated={onMuscleGroupCreated}
          />
        </div>
      </BottomSheet>
    </>
  );
}

// ── Sub-component: muscle chips + "Añadir" button ─────────────────────────

interface MuscleSectionProps {
  label: string;
  muscles: MuscleGroup[];
  onRemove: (id: string) => void;
  onAdd: () => void;
  isPrimary: boolean;
}

function MuscleSection({ label, muscles, onRemove, onAdd, isPrimary }: MuscleSectionProps) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-medium">{label}</p>
      <div className="flex flex-wrap gap-2 items-center">
        {muscles.map(mg => {
          const h = muscleHue(mg.name);
          return (
            <span
              key={mg.id}
              className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium"
              style={isPrimary
                ? { background: `oklch(0.34 0.06 ${h})`, color: `oklch(0.85 0.12 ${h})` }
                : { background: `oklch(0.28 0.04 ${h})`, color: `oklch(0.75 0.10 ${h})`,
                    border: `1px solid oklch(0.42 0.07 ${h})` }
              }
            >
              {isPrimary && (
                <span className="w-1.5 h-1.5 rounded-full flex-none"
                  style={{ background: `oklch(0.66 0.16 ${h})` }} />
              )}
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
          );
        })}

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
