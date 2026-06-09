"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { ChevronRight, Trophy, Dumbbell } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import {
  epley,
  formatVolKg,
  formatShortDate,
  daysAgoISO,
} from "@/lib/utils/analytics";

// ── Raw types from Supabase join ─────────────────────────────────────────

type RawLog = {
  exercise_id: string;
  weight_kg: number;
  reps: number;
  created_at: string;
  exercises: {
    id: string;
    name: string;
    exercise_muscle_groups: {
      relation: string;
      muscle_groups: { id: string; name: string };
    }[];
  };
  workout_sessions: { date: string } | null;
};

// ── Analytics helpers ────────────────────────────────────────────────────

type Period = "7" | "30" | "90";
const PERIOD_OPTIONS: { value: Period; label: string }[] = [
  { value: "7", label: "7 días" },
  { value: "30", label: "30 días" },
  { value: "90", label: "90 días" },
];

function logDate(log: RawLog): string {
  return log.workout_sessions?.date ?? log.created_at.split("T")[0];
}

function computeVolumeByMuscle(logs: RawLog[]) {
  const map: Record<string, { name: string; volume: number }> = {};
  for (const log of logs) {
    const vol = log.weight_kg * log.reps;
    for (const emg of log.exercises.exercise_muscle_groups) {
      const id = emg.muscle_groups.id;
      const factor = emg.relation === "primary" ? 1 : 0.5;
      if (!map[id]) map[id] = { name: emg.muscle_groups.name, volume: 0 };
      map[id].volume += vol * factor;
    }
  }
  return Object.values(map)
    .sort((a, b) => b.volume - a.volume)
    .slice(0, 12);
}

type PREntry = {
  exerciseId: string;
  name: string;
  weight: number;
  reps: number;
  e1rm: number;
};

function computePRs(logs: RawLog[]): PREntry[] {
  const map: Record<string, PREntry> = {};
  for (const log of logs) {
    const e1rm = epley(log.weight_kg, log.reps);
    const ex = map[log.exercise_id];
    if (!ex || e1rm > ex.e1rm) {
      map[log.exercise_id] = {
        exerciseId: log.exercise_id,
        name: log.exercises.name,
        weight: log.weight_kg,
        reps: log.reps,
        e1rm,
      };
    }
  }
  return Object.values(map).sort((a, b) => b.e1rm - a.e1rm);
}

type ExerciseRow = {
  id: string;
  name: string;
  lastDate: string;
  setCount: number;
};

function computeExerciseList(logs: RawLog[]): ExerciseRow[] {
  const map: Record<string, ExerciseRow> = {};
  for (const log of logs) {
    const id = log.exercise_id;
    const date = logDate(log);
    if (!map[id]) {
      map[id] = { id, name: log.exercises.name, lastDate: date, setCount: 0 };
    } else if (date > map[id].lastDate) {
      map[id].lastDate = date;
    }
    map[id].setCount++;
  }
  return Object.values(map).sort((a, b) =>
    b.lastDate.localeCompare(a.lastDate)
  );
}

// ── VolumeBarChart (inline) ──────────────────────────────────────────────

function VolumeBarChart({ data }: { data: { name: string; volume: number }[] }) {
  if (data.length === 0)
    return (
      <p className="text-sm text-muted text-center py-4">
        Sin datos para el período seleccionado.
      </p>
    );

  const max = Math.max(...data.map((d) => d.volume), 1);

  return (
    <div className="flex flex-col gap-3">
      {data.map(({ name, volume }) => (
        <div key={name} className="flex items-center gap-2.5">
          <p className="text-xs text-muted w-24 truncate shrink-0">{name}</p>
          <div className="flex-1 h-2 bg-surface-2 rounded-full overflow-hidden">
            <div
              className="h-full bg-accent/70 rounded-full transition-all duration-500"
              style={{ width: `${(volume / max) * 100}%` }}
            />
          </div>
          <p className="text-[11px] text-muted text-right w-16 shrink-0 tabular-nums">
            {formatVolKg(volume)}
          </p>
        </div>
      ))}
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────

export default function ProgresoPage() {
  const [period, setPeriod] = useState<Period>("30");
  const [allLogs, setAllLogs] = useState<RawLog[]>([]);
  const [loading, setLoading] = useState(true);

  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    async function fetchLogs() {
      const { data } = await supabase
        .from("set_logs")
        .select(
          "exercise_id, weight_kg, reps, created_at," +
          "exercises(id, name, exercise_muscle_groups(relation, muscle_groups(id, name)))," +
          "workout_sessions(date)"
        )
        .eq("is_completed", true)
        .not("weight_kg", "is", null)
        .not("reps", "is", null)
        .order("created_at", { ascending: false })
        .limit(3000);

      setAllLogs((data ?? []) as unknown as RawLog[]);
      setLoading(false);
    }
    fetchLogs();
  }, [supabase]);

  const periodCutoff = daysAgoISO(parseInt(period));

  const periodLogs = useMemo(
    () => allLogs.filter((l) => logDate(l) >= periodCutoff),
    [allLogs, periodCutoff]
  );

  const volumeByMuscle = useMemo(
    () => computeVolumeByMuscle(periodLogs),
    [periodLogs]
  );

  const prs = useMemo(() => computePRs(allLogs), [allLogs]);

  const exerciseList = useMemo(
    () => computeExerciseList(allLogs),
    [allLogs]
  );

  const totalVolumePeriod = useMemo(
    () => periodLogs.reduce((s, l) => s + l.weight_kg * l.reps, 0),
    [periodLogs]
  );

  const totalSetsPeriod = periodLogs.length;

  if (loading) {
    return (
      <div className="px-4 pt-6 flex flex-col gap-4">
        <div className="h-8 w-32 bg-surface rounded-lg animate-pulse" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-28 bg-surface rounded-2xl border border-border animate-pulse" />
        ))}
      </div>
    );
  }

  if (allLogs.length === 0) {
    return (
      <div className="px-4 pt-6 flex flex-col items-center gap-3 py-20 text-center">
        <Dumbbell size={36} className="text-muted opacity-40" />
        <p className="font-semibold">Sin datos todavía</p>
        <p className="text-sm text-muted">
          Completa tu primera sesión para ver aquí tu progreso.
        </p>
      </div>
    );
  }

  return (
    <div className="px-4 pt-6 pb-28 flex flex-col gap-6">
      <h1 className="text-xl font-bold">Progreso</h1>

      {/* Period toggle */}
      <SegmentedControl
        options={PERIOD_OPTIONS}
        value={period}
        onChange={setPeriod}
        layoutId="progreso-period"
      />

      {/* Summary chips */}
      <div className="flex gap-2 flex-wrap">
        <span className="h-8 px-3 rounded-full bg-surface-2 border border-border text-xs text-muted flex items-center gap-1.5 tabular-nums">
          <span className="text-foreground font-semibold">{totalSetsPeriod}</span>
          series
        </span>
        {totalVolumePeriod > 0 && (
          <span className="h-8 px-3 rounded-full bg-surface-2 border border-border text-xs text-muted flex items-center gap-1.5 tabular-nums">
            <span className="text-foreground font-semibold">
              {formatVolKg(totalVolumePeriod)}
            </span>
            volumen total
          </span>
        )}
      </div>

      {/* Volume by muscle */}
      <section>
        <h2 className="text-sm font-semibold text-muted uppercase tracking-wide mb-3">
          Volumen por músculo
        </h2>
        <div className="bg-surface border border-border rounded-2xl p-4">
          <VolumeBarChart data={volumeByMuscle} />
        </div>
      </section>

      {/* Personal Records */}
      {prs.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-muted uppercase tracking-wide mb-3">
            Récords personales
          </h2>
          <div className="bg-surface border border-border rounded-2xl overflow-hidden divide-y divide-border/50">
            {prs.slice(0, 8).map((pr) => (
              <Link
                key={pr.exerciseId}
                href={`/progreso/${pr.exerciseId}`}
                className="flex items-center gap-3 px-4 py-3.5 active:bg-surface-2 transition-colors"
              >
                <Trophy size={14} className="text-amber-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{pr.name}</p>
                  <p className="text-xs text-muted mt-0.5">
                    {pr.weight} kg × {pr.reps} reps
                    {pr.reps > 1 && (
                      <span className="ml-1">· e1RM {pr.e1rm} kg</span>
                    )}
                  </p>
                </div>
                <ChevronRight size={15} className="text-muted shrink-0" />
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Exercise list for drill-down */}
      {exerciseList.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-muted uppercase tracking-wide mb-3">
            Análisis por ejercicio
          </h2>
          <div className="bg-surface border border-border rounded-2xl overflow-hidden divide-y divide-border/50">
            {exerciseList.map((ex) => (
              <Link
                key={ex.id}
                href={`/progreso/${ex.id}`}
                className="flex items-center gap-3 px-4 py-3.5 active:bg-surface-2 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{ex.name}</p>
                  <p className="text-xs text-muted mt-0.5">
                    {ex.setCount} series · última vez {formatShortDate(ex.lastDate)}
                  </p>
                </div>
                <ChevronRight size={15} className="text-muted shrink-0" />
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
