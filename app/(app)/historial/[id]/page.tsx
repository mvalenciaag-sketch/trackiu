import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Clock, Dumbbell } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import type { SetLog, Exercise } from "@/lib/supabase/types";

// ── Helpers ────────────────────────────────────────────────────────────────

const MONTHS_LONG = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];
const DAYS_LONG = [
  "Domingo", "Lunes", "Martes", "Miércoles",
  "Jueves", "Viernes", "Sábado",
];

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dow = new Date(y, m - 1, d).getDay();
  return `${DAYS_LONG[dow]}, ${d} de ${MONTHS_LONG[m - 1]} de ${y}`;
}

function formatDuration(start: string | null, end: string | null): string {
  if (!start || !end) return "";
  const mins = Math.round(
    (new Date(end).getTime() - new Date(start).getTime()) / 60000
  );
  if (mins < 1) return "";
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const rem = mins % 60;
  return rem > 0 ? `${h}h ${rem}min` : `${h}h`;
}

function formatVolume(vol: number): string {
  if (vol === 0) return "—";
  if (vol >= 1000) return `${(vol / 1000).toFixed(1)}k kg`;
  return `${Math.round(vol)} kg`;
}

const SET_TYPE_BADGE: Record<string, { label: string; cls: string }> = {
  warmup:  { label: "C",  cls: "bg-amber-500/15 text-amber-400 border border-amber-500/25" },
  drop:    { label: "D",  cls: "bg-orange-500/15 text-orange-400 border border-orange-500/25" },
  failure: { label: "F",  cls: "bg-red-500/15 text-red-400 border border-red-500/25" },
};

// ── Types ──────────────────────────────────────────────────────────────────

type SetLogWithExercise = SetLog & { exercises: Pick<Exercise, "id" | "name"> };

// ── Page ───────────────────────────────────────────────────────────────────

export default async function HistorialDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();

  const [{ data: session }, { data: rawLogs }] = await Promise.all([
    supabase
      .from("workout_sessions")
      .select("*, routine_days(name, color)")
      .eq("id", params.id)
      .single(),
    supabase
      .from("set_logs")
      .select("*, exercises(id, name)")
      .eq("session_id", params.id)
      .order("set_number"),
  ]);

  if (!session) notFound();

  const logs = (rawLogs ?? []) as SetLogWithExercise[];

  // Group logs by exercise preserving insertion order
  const exerciseOrder: string[] = [];
  const logsByExercise: Record<string, SetLogWithExercise[]> = {};
  for (const log of logs) {
    const key = log.exercise_id;
    if (!logsByExercise[key]) {
      exerciseOrder.push(key);
      logsByExercise[key] = [];
    }
    logsByExercise[key].push(log);
  }

  // Summary stats
  const completedLogs = logs.filter((l) => l.is_completed);
  const totalVolume = completedLogs.reduce(
    (sum, l) => sum + (l.weight_kg ?? 0) * (l.reps ?? 0),
    0
  );
  const duration = formatDuration(session.started_at ?? null, session.completed_at ?? null);
  const dayName = (session as any).routine_days?.name ?? "Sesión libre";
  const dayColor = (session as any).routine_days?.color ?? "#71717a";

  return (
    <div className="flex flex-col min-h-full pb-24">
      {/* Header */}
      <div className="px-4 pt-6 pb-4">
        <div className="flex items-center gap-3 mb-1">
          <Link
            href="/perfil"
            className="w-9 h-9 flex items-center justify-center rounded-full bg-surface-2 text-muted shrink-0"
            aria-label="Volver"
          >
            <ArrowLeft size={17} />
          </Link>
          <span
            className="w-3 h-3 rounded-full shrink-0"
            style={{ backgroundColor: dayColor }}
          />
          <h1 className="text-lg font-bold flex-1 min-w-0 truncate">
            {dayName}
          </h1>
        </div>
        <p className="text-sm text-muted ml-12 capitalize">
          {formatDate(session.date)}
        </p>
      </div>

      {/* Summary chips */}
      <div className="px-4 pb-5 flex gap-2 flex-wrap">
        {completedLogs.length > 0 && (
          <span className="h-7 px-3 rounded-full bg-surface-2 border border-border text-xs text-muted flex items-center">
            {completedLogs.length} serie{completedLogs.length === 1 ? "" : "s"}
          </span>
        )}
        {totalVolume > 0 && (
          <span className="h-7 px-3 rounded-full bg-surface-2 border border-border text-xs text-muted flex items-center">
            {formatVolume(totalVolume)}
          </span>
        )}
        {duration && (
          <span className="h-7 px-3 rounded-full bg-surface-2 border border-border text-xs text-muted flex items-center gap-1">
            <Clock size={10} />
            {duration}
          </span>
        )}
      </div>

      {/* Exercise sections */}
      <div className="px-4 flex flex-col gap-4">
        {exerciseOrder.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-10 text-center">
            <Dumbbell size={28} className="text-muted opacity-40" />
            <p className="text-sm text-muted">Sin series registradas.</p>
          </div>
        ) : (
          exerciseOrder.map((exerciseId) => {
            const exLogs = logsByExercise[exerciseId];
            const exerciseName = exLogs[0]?.exercises?.name ?? "Ejercicio";

            return (
              <div
                key={exerciseId}
                className="bg-surface border border-border rounded-2xl overflow-hidden"
              >
                {/* Exercise name */}
                <div className="px-4 py-3 border-b border-border/50">
                  <p className="font-semibold text-sm">{exerciseName}</p>
                </div>

                {/* Set rows */}
                <div className="divide-y divide-border/30">
                  {exLogs.map((log) => {
                    const badge = SET_TYPE_BADGE[log.set_type ?? ""];
                    const hasWeight = log.weight_kg != null;
                    const hasReps = log.reps != null;

                    return (
                      <div
                        key={log.id}
                        className="flex items-center gap-2.5 px-4 py-2.5"
                        style={{ opacity: log.is_completed ? 1 : 0.45 }}
                      >
                        {/* Set number */}
                        <span className="text-xs text-muted w-5 tabular-nums shrink-0">
                          {log.set_number}
                        </span>

                        {/* Type badge (only non-working) */}
                        {badge ? (
                          <span
                            className={`text-[10px] font-bold w-5 h-5 rounded flex items-center justify-center shrink-0 ${badge.cls}`}
                          >
                            {badge.label}
                          </span>
                        ) : (
                          <div className="w-5 h-5 shrink-0" />
                        )}

                        {/* Weight × reps */}
                        <p className="flex-1 text-sm">
                          {hasWeight || hasReps ? (
                            <>
                              {hasWeight && (
                                <span className="font-semibold">
                                  {log.weight_kg} kg
                                </span>
                              )}
                              {hasWeight && hasReps && (
                                <span className="text-muted"> × </span>
                              )}
                              {hasReps && (
                                <span className="font-semibold">
                                  {log.reps} reps
                                </span>
                              )}
                            </>
                          ) : (
                            <span className="text-muted">—</span>
                          )}
                        </p>

                        {/* Extras: RIR / RPE */}
                        {(log.rir != null || log.rpe != null) && (
                          <div className="flex gap-1.5 shrink-0">
                            {log.rir != null && (
                              <span className="text-[11px] text-muted">
                                RIR {log.rir}
                              </span>
                            )}
                            {log.rpe != null && (
                              <span className="text-[11px] text-muted">
                                RPE {log.rpe}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Completed indicator */}
                        <span
                          className="text-xs shrink-0"
                          aria-label={log.is_completed ? "Completada" : "No completada"}
                        >
                          {log.is_completed ? (
                            <span className="text-green-400">✓</span>
                          ) : (
                            <span className="text-muted">○</span>
                          )}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Session notes */}
      {session.notes && (
        <div className="px-4 mt-5">
          <div className="rounded-xl bg-surface-2 border border-border px-3 py-2.5">
            <p className="text-[11px] text-muted mb-1">Notas</p>
            <p className="text-sm text-foreground whitespace-pre-wrap">
              {session.notes}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
