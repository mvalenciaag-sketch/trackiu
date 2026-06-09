"use client";

import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import type { RoutineDay } from "@/lib/supabase/types";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/utils";

const COLORS = [
  "#6366f1",
  "#8b5cf6",
  "#ec4899",
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#06b6d4",
  "#0ea5e9",
  "#64748b",
];

interface RoutineDayFormProps {
  day?: RoutineDay | null;
  position?: number;
  onSaved: (day: RoutineDay) => void;
  onDeleted?: () => void;
  onClose: () => void;
}

export function RoutineDayForm({
  day,
  position = 0,
  onSaved,
  onDeleted,
  onClose,
}: RoutineDayFormProps) {
  const isEditing = !!day;

  const [name, setName] = useState(day?.name ?? "");
  const [description, setDescription] = useState(day?.description ?? "");
  const [color, setColor] = useState(day?.color ?? "#6366f1");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleSave() {
    if (!name.trim()) {
      setError("El nombre es obligatorio");
      return;
    }
    setSaving(true);
    setError("");

    const supabase = createClient();

    try {
      if (isEditing && day) {
        const { data, error: err } = await supabase
          .from("routine_days")
          .update({
            name: name.trim(),
            description: description.trim() || null,
            color,
          })
          .eq("id", day.id)
          .select()
          .single();
        if (err || !data) throw err;
        onSaved(data);
      } else {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) throw new Error("No autenticado");

        const { data, error: err } = await supabase
          .from("routine_days")
          .insert({
            name: name.trim(),
            description: description.trim() || null,
            color,
            user_id: user.id,
            position,
          })
          .select()
          .single();
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

  return (
    <div className="px-4 pt-2 pb-10 flex flex-col gap-5">
      <Input
        label="Nombre"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder='p. ej. Push, Pull, Legs, Upper...'
        autoFocus
      />

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium">Descripción (opcional)</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Notas sobre este día de entrenamiento..."
          rows={2}
          className="w-full rounded-xl bg-surface-2 border border-border px-3 py-2.5 text-base text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent resize-none transition-colors"
        />
      </div>

      {/* Color picker */}
      <div className="flex flex-col gap-2.5">
        <p className="text-sm font-medium">Color</p>
        <div className="flex flex-wrap gap-3">
          {COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className={cn(
                "w-9 h-9 rounded-full transition-all",
                color === c &&
                  "ring-2 ring-offset-2 ring-offset-background ring-white scale-110"
              )}
              style={{ backgroundColor: c }}
              aria-label={`Seleccionar color ${c}`}
            />
          ))}
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-400 text-center">{error}</p>
      )}

      <Button
        fullWidth
        loading={saving}
        onClick={handleSave}
        className="h-12 text-base font-semibold"
      >
        {isEditing ? "Guardar cambios" : "Crear día"}
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
                ¿Eliminar &quot;{day.name}&quot; y todos sus ejercicios?
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
                Eliminar día
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
}
