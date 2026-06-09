"use client";

import { motion } from "framer-motion";
import type { ActiveSet, SetType } from "@/stores/activeSession";
import { cn } from "@/lib/utils";

const SET_TYPES: { value: SetType; label: string; color: string }[] = [
  { value: "warmup",  label: "Calent.",  color: "bg-amber-500/15 text-amber-400 border-amber-500/25" },
  { value: "working", label: "Trabajo",  color: "bg-accent/15 text-accent border-accent/25" },
  { value: "drop",    label: "Drop",     color: "bg-orange-500/15 text-orange-400 border-orange-500/25" },
  { value: "failure", label: "Al fallo", color: "bg-red-500/15 text-red-400 border-red-500/25" },
];

const ROM_OPTIONS = [
  { value: "completo",   label: "Completo" },
  { value: "parcial",    label: "Parcial" },
  { value: "lengthened", label: "Estirado" },
  { value: "corto",      label: "Corto" },
];

interface AdvancedSetOptionsProps {
  set: ActiveSet;
  onUpdate: (updates: Partial<ActiveSet>) => void;
}

function SmallStepper({
  value,
  step,
  min,
  max,
  onChange,
  label,
}: {
  value: number | null;
  step: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
  label: string;
}) {
  const current = value ?? 0;
  return (
    <div className="flex flex-col gap-1">
      <p className="text-[11px] text-muted">{label}</p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onChange(Math.max(min, +(current - step).toFixed(1)))}
          className="w-7 h-7 flex items-center justify-center rounded-lg bg-surface-2 text-muted active:bg-border text-base leading-none"
        >
          −
        </button>
        <span className="w-10 text-center text-sm font-semibold tabular-nums">
          {value ?? "—"}
        </span>
        <button
          onClick={() => onChange(Math.min(max, +(current + step).toFixed(1)))}
          className="w-7 h-7 flex items-center justify-center rounded-lg bg-surface-2 text-muted active:bg-border text-base leading-none"
        >
          +
        </button>
      </div>
    </div>
  );
}

export function AdvancedSetOptions({ set, onUpdate }: AdvancedSetOptionsProps) {
  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: "auto", opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      className="overflow-hidden"
    >
      <div className="px-3 pb-3 pt-1 flex flex-col gap-4 border-t border-border/50">
        {/* Set type */}
        <div className="flex flex-col gap-1.5">
          <p className="text-[11px] text-muted font-medium">Tipo de serie</p>
          <div className="flex gap-1.5 flex-wrap">
            {SET_TYPES.map((t) => (
              <button
                key={t.value}
                onClick={() => onUpdate({ setType: t.value })}
                className={cn(
                  "h-7 px-2.5 rounded-lg text-xs font-medium border transition-colors",
                  set.setType === t.value
                    ? t.color
                    : "bg-surface-2 text-muted border-transparent"
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Steppers row */}
        <div className="flex gap-6 flex-wrap">
          <SmallStepper
            value={set.weightKg}
            step={2.5}
            min={0}
            max={999}
            label="Peso (±2.5 kg)"
            onChange={(v) => onUpdate({ weightKg: v })}
          />
          <SmallStepper
            value={set.reps}
            step={1}
            min={1}
            max={99}
            label="Reps (±1)"
            onChange={(v) => onUpdate({ reps: v })}
          />
          <SmallStepper
            value={set.rir}
            step={1}
            min={0}
            max={10}
            label="RIR"
            onChange={(v) => onUpdate({ rir: v })}
          />
          <SmallStepper
            value={set.rpe}
            step={0.5}
            min={5}
            max={10}
            label="RPE"
            onChange={(v) => onUpdate({ rpe: v })}
          />
        </div>

        {/* ROM + Tempo + Rest */}
        <div className="flex gap-4 flex-wrap">
          {/* ROM */}
          <div className="flex flex-col gap-1">
            <p className="text-[11px] text-muted">ROM</p>
            <div className="flex gap-1 flex-wrap">
              {ROM_OPTIONS.map((r) => (
                <button
                  key={r.value}
                  onClick={() =>
                    onUpdate({ rom: set.rom === r.value ? null : r.value })
                  }
                  className={cn(
                    "h-7 px-2 rounded-lg text-xs border transition-colors",
                    set.rom === r.value
                      ? "bg-surface border-border text-foreground font-medium"
                      : "bg-surface-2 border-transparent text-muted"
                  )}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-4 flex-wrap">
          {/* Tempo */}
          <div className="flex flex-col gap-1">
            <p className="text-[11px] text-muted">Tempo (ej: 3-1-1-0)</p>
            <input
              type="text"
              value={set.tempo ?? ""}
              onChange={(e) => onUpdate({ tempo: e.target.value || null })}
              placeholder="3-1-1-0"
              className="w-28 h-8 rounded-lg bg-surface-2 border border-border px-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>
          {/* Rest */}
          <div className="flex flex-col gap-1">
            <p className="text-[11px] text-muted">Descanso (s)</p>
            <input
              type="text"
              inputMode="numeric"
              value={set.restSeconds?.toString() ?? ""}
              onChange={(e) => {
                const v = parseInt(e.target.value);
                onUpdate({ restSeconds: isNaN(v) ? null : v });
              }}
              placeholder="90"
              className="w-20 h-8 rounded-lg bg-surface-2 border border-border px-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>
        </div>

        {/* Notes */}
        <div className="flex flex-col gap-1">
          <p className="text-[11px] text-muted">Nota de serie</p>
          <input
            type="text"
            value={set.notes ?? ""}
            onChange={(e) => onUpdate({ notes: e.target.value || null })}
            placeholder="Notas opcionales..."
            className="h-8 rounded-lg bg-surface-2 border border-border px-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </div>
      </div>
    </motion.div>
  );
}
