"use client";

import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import type { RoutineDay } from "@/lib/supabase/types";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/utils";

// ── Templates ─────────────────────────────────────────────────────────────

const DAY_TEMPLATES = [
  { name: "Push",      color: "#f97316" },  // orange
  { name: "Pull",      color: "#6366f1" },  // indigo
  { name: "Legs",      color: "#22c55e" },  // green
  { name: "Upper",     color: "#a855f7" },  // purple
  { name: "Lower",     color: "#84cc16" },  // lime
  { name: "Full body", color: "#06b6d4" },  // cyan
  { name: "Push/Pull", color: "#f43f5e" },  // rose
] as const;

// ── Colour palette ─────────────────────────────────────────────────────────

const COLORS = [
  "#f97316", // orange
  "#ef4444", // red
  "#f43f5e", // rose
  "#ec4899", // pink
  "#a855f7", // purple
  "#8b5cf6", // violet
  "#6366f1", // indigo
  "#0ea5e9", // sky
  "#06b6d4", // cyan
  "#22c55e", // green
  "#84cc16", // lime
  "#eab308", // yellow
  "#64748b", // slate
] as const;

// ── Props ──────────────────────────────────────────────────────────────────

interface RoutineDayFormProps {
  day?: RoutineDay | null;
  position?: number;
  onSaved: (day: RoutineDay) => void;
  onDeleted?: () => void;
  onClose: () => void;
}

// ── Component ─────────────────────────────────────────────────────────────

export function RoutineDayForm({
  day,
  position = 0,
  onSaved,
  onDeleted,
  onClose: _onClose,
}: RoutineDayFormProps) {
  const isEditing = !!day;

  const [name,        setName]        = useState(day?.name ?? "");
  const [description, setDescription] = useState(day?.description ?? "");
  const [color,       setColor]       = useState(day?.color ?? "#f97316");
  const [saving,      setSaving]      = useState(false);
  const [error,       setError]       = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting,    setDeleting]    = useState(false);

  function applyTemplate(t: (typeof DAY_TEMPLATES)[number]) {
    setName(t.name);
    setColor(t.color);
  }

  async function handleSave() {
    if (!name.trim()) { setError("El nombre es obligatorio"); return; }
    setSaving(true);
    setError("");
    const supabase = createClient();
    try {
      if (isEditing && day) {
        const { data, error: err } = await supabase
          .from("routine_days")
          .update({ name: name.trim(), description: description.trim() || null, color })
          .eq("id", day.id)
          .select().single();
        if (err || !data) throw err;
        onSaved(data);
      } else {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("No autenticado");
        const { data, error: err } = await supabase
          .from("routine_days")
          .insert({ name: name.trim(), description: description.trim() || null,
                    color, user_id: user.id, position })
          .select().single();
        if (err || !data) throw err;
        onSaved(data);
      }
    } catch {
      setError("Error al guardar. Inténtalo de nuevo.");
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!day) return;
    setDeleting(true);
    const supabase = createClient();
    await supabase.from("routine_days").delete().eq("id", day.id);
    onDeleted?.();
  }

  // ── Render ────────────────────────────────────────────────────────────

  return (
    <>
      {/* ── Scrollable form body ──────────────────────────────────────── */}
      <div className="px-4 pt-4 pb-2 flex flex-col gap-5">

        {/* ── Live preview card ──────────────────────────────────────── */}
        <div
          className="rounded-2xl p-5 text-white"
          style={{
            background: `linear-gradient(150deg, ${color}f0, ${color}88)`,
            boxShadow: "var(--shadow-lg)",
          }}
        >
          <p className="font-mono text-[10px] font-bold tracking-[0.12em] uppercase text-white/80">
            Rutina
          </p>
          <p className="font-display font-bold text-[30px] tracking-[-0.02em] leading-none mt-2">
            {name || "Sin nombre"}
          </p>
          <p className="text-[12.5px] text-white/80 mt-2 font-medium">
            0 ejercicios · plantilla nueva
          </p>
        </div>

        {/* ── Templates ─────────────────────────────────────────────── */}
        {!isEditing && (
          <div className="flex flex-col gap-2">
            <p className="text-[11px] font-bold text-muted uppercase tracking-wider">
              Empieza desde una plantilla
            </p>
            <div className="flex flex-wrap gap-2">
              {DAY_TEMPLATES.map(t => (
                <button
                  key={t.name}
                  type="button"
                  onClick={() => applyTemplate(t)}
                  className={cn(
                    "inline-flex items-center gap-2 px-3.5 py-2 rounded-full",
                    "text-[13px] font-semibold border transition-all",
                    name === t.name
                      ? "border-transparent text-white"
                      : "bg-surface-2 border-border text-foreground-2 active:bg-surface-3"
                  )}
                  style={name === t.name
                    ? { background: t.color, borderColor: t.color }
                    : undefined}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full flex-none"
                    style={{ background: t.color }}
                  />
                  {t.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Nombre */}
        <Input
          label="Nombre"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="p. ej. Push, Pull, Legs, Upper..."
          autoFocus
        />

        {/* Descripción */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">Descripción (opcional)</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Notas sobre este día de entrenamiento..."
            rows={2}
            className="w-full rounded-xl bg-surface-2 border border-border px-3 py-2.5
                       text-base text-foreground placeholder:text-muted
                       focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent
                       resize-none transition-colors"
          />
        </div>

        {/* Color palette */}
        <div className="flex flex-col gap-2.5">
          <p className="text-sm font-medium">Color</p>
          <div className="flex flex-wrap gap-2.5">
            {COLORS.map(c => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={cn(
                  "w-8 h-8 rounded-full transition-all",
                  color === c
                    ? "ring-2 ring-offset-2 ring-offset-background ring-white scale-110"
                    : "active:scale-95"
                )}
                style={{ backgroundColor: c }}
                aria-label={`Color ${c}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ── Sticky footer ─────────────────────────────────────────────── */}
      <div className="sticky bottom-0 bg-surface-2 border-t border-border/50 px-4 pt-3 pb-5 flex flex-col gap-3">
        {error && (
          <p className="text-sm text-red-400 flex items-center justify-center gap-1.5">
            <AlertTriangle size={14} className="shrink-0" />
            {error}
          </p>
        )}

        <Button fullWidth loading={saving} onClick={handleSave} className="h-12 text-base font-semibold">
          {isEditing ? "Guardar cambios" : "Crear día"}
        </Button>

        {isEditing && (
          <AnimatePresence mode="wait">
            {confirmDelete ? (
              <motion.div key="confirm"
                initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="flex flex-col gap-3">
                <p className="text-sm text-center text-muted flex items-center justify-center gap-1.5">
                  <AlertTriangle size={14} className="text-red-400 shrink-0" />
                  ¿Eliminar &quot;{day.name}&quot; y todos sus ejercicios?
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
                  Eliminar día
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
    </>
  );
}
