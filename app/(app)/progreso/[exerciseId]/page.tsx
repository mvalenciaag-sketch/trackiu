import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Trophy } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { LineChart, type ChartPoint } from "@/components/progress/LineChart";
import {
  epley,
  formatVolKg,
  formatShortDate,
} from "@/lib/utils/analytics";

// ── Types ──────────────────────────────────────────────────────────────────

type RawLog = {
  weight_kg: number;
  reps: number;
  created_at: string;
  workout_sessions: { date: string } | null;
};

type SessionSummary = {
  date: string;
  maxWeight: number;
  maxReps: number;
  maxE1RM: number;
  totalVolume: number;
};

// ── Data processing ────────────────────────────────────────────────────────

function buildProgression(logs: RawLog[]): SessionSummary[] {
  const map: Record<string, SessionSummary> = {};

  for (const log of logs) {
    const date = log.workout_sessions?.date ?? log.created_at.split("T")[0];
    const e1rm = epley(log.weight_kg, log.reps);
    const vol = log.weight_kg * log.reps;

    if (!map[date]) {
      map[date] = {
        date,
        maxWeight: log.weight_kg,
        maxReps: log.reps,
        maxE1RM: e1rm,
        totalVolume: vol,
      };
    } else {
      if (e1rm > map[date].maxE1RM) {
        map[date].maxE1RM = e1rm;
        map[date].maxWeight = log.weight_kg;
        map[date].maxReps = log.reps;
      }
      map[date].totalVolume += vol;
    }
  }

  return Object.values(map).sort((a, b) => a.date.localeCompare(b.date));
}

// ── Page ───────────────────────────────────────────────────────────────────

export default async function ExerciseProgressPage({
  params,
}: {
  params: { exerciseId: string };
}) {
  const supabase = createClient();
  const { exerciseId } = params;

  const [{ data: exercise }, { data: rawLogs }] = await Promise.all([
    supabase
      .from("exercises")
      .select("id, name, role, mechanics")
      .eq("id", exerciseId)
      .single(),
    supabase
      .from("set_logs")
      .select("weight_kg, reps, created_at, workout_sessions(date)")
      .eq("exercise_id", exerciseId)
      .eq("is_completed", true)
      .not("weight_kg", "is", null)
      .not("reps", "is", null)
      .order("created_at", { ascending: true })
      .limit(500),
  ]);

  if (!exercise) notFound();

  const logs = (rawLogs ?? []) as RawLog[];
  const progression = buildProgression(logs);

  // All-time PRs
  const allTimeMaxWeight = progression.reduce(
    (m, s) => Math.max(m, s.maxWeight),
    0
  );
  const allTimeMaxReps = logs.reduce((m, l) => Math.max(m, l.reps), 0);
  const allTimeE1RM = progression.reduce((m, s) => Math.max(m, s.maxE1RM), 0);
  const totalVolume = logs.reduce(
    (s, l) => s + l.weight_kg * l.reps,
    0
  );
  const sessionCount = progression.length;

  // Chart data
  const e1rmPoints: ChartPoint[] = progression.map((s) => ({
    date: s.date,
    value: s.maxE1RM,
  }));
  const weightPoints: ChartPoint[] = progression.map((s) => ({
    date: s.date,
    value: s.maxWeight,
  }));

  // Recent sessions (last 10, newest first)
  const recentSessions = [...progression].reverse().slice(0, 10);

  return (
    <div className="flex flex-col min-h-full pb-28">
      {/* Header */}
      <div className="px-4 pt-6 pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/progreso"
            className="w-9 h-9 flex items-center justify-center rounded-full bg-surface-2 text-muted shrink-0"
            aria-label="Volver"
          >
            <ArrowLeft size={17} />
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold truncate">{exercise.name}</h1>
            <p className="text-xs text-muted capitalize">
              {exercise.role} · {exercise.mechanics} · {sessionCount} sesion{sessionCount === 1 ? "" : "es"}
            </p>
          </div>
        </div>
      </div>

      <div className="px-4 flex flex-col gap-5">
        {/* PR summary cards */}
        <div className="grid grid-cols-3 gap-2">
          <StatCard
            label="Peso máx."
            value={allTimeMaxWeight > 0 ? `${allTimeMaxWeight} kg` : "—"}
            icon={<Trophy size={12} className="text-amber-400" />}
          />
          <StatCard
            label="Reps máx."
            value={allTimeMaxReps > 0 ? `${allTimeMaxReps}` : "—"}
          />
          <StatCard
            label="e1RM"
            value={allTimeE1RM > 0 ? `${allTimeE1RM} kg` : "—"}
          />
        </div>

        {/* Volume summary */}
        {totalVolume > 0 && (
          <div className="flex gap-2">
            <span className="h-7 px-3 rounded-full bg-surface-2 border border-border text-xs text-muted flex items-center gap-1.5">
              <span className="text-foreground font-medium">
                {formatVolKg(totalVolume)}
              </span>
              volumen total
            </span>
            <span className="h-7 px-3 rounded-full bg-surface-2 border border-border text-xs text-muted flex items-center">
              {logs.length} series completadas
            </span>
          </div>
        )}

        {/* e1RM chart — Tarea 2.4 */}
        <section>
          <h2 className="text-sm font-semibold text-muted uppercase tracking-wide mb-3">
            e1RM estimado
          </h2>
          <div className="bg-surface border border-border rounded-2xl p-4">
            <LineChart
              data={e1rmPoints}
              unit=" kg"
              color="#6366f1"
              gradientId="e1rm-fill"
            />
          </div>
        </section>

        {/* Max weight chart — Tarea 2.3 */}
        <section>
          <h2 className="text-sm font-semibold text-muted uppercase tracking-wide mb-3">
            Peso máximo por sesión
          </h2>
          <div className="bg-surface border border-border rounded-2xl p-4">
            <LineChart
              data={weightPoints}
              unit=" kg"
              color="#22c55e"
              gradientId="weight-fill"
            />
          </div>
        </section>

        {/* Recent sessions */}
        {recentSessions.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-muted uppercase tracking-wide mb-3">
              Sesiones recientes
            </h2>
            <div className="bg-surface border border-border rounded-2xl overflow-hidden divide-y divide-border/50">
              {recentSessions.map((s) => (
                <div key={s.date} className="flex items-center gap-3 px-4 py-3">
                  <p className="text-xs text-muted w-16 shrink-0 capitalize">
                    {formatShortDate(s.date)}
                  </p>
                  <div className="flex-1 flex items-center gap-3 min-w-0 flex-wrap">
                    <span className="text-sm font-semibold tabular-nums">
                      {s.maxWeight} kg × {s.maxReps}
                    </span>
                    {s.maxReps > 1 && (
                      <span className="text-xs text-muted">
                        e1RM {s.maxE1RM} kg
                      </span>
                    )}
                    <span className="text-xs text-muted">
                      {formatVolKg(s.totalVolume)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="bg-surface border border-border rounded-2xl px-3 py-3 flex flex-col gap-1">
      <div className="flex items-center gap-1">
        {icon}
        <p className="text-[11px] text-muted">{label}</p>
      </div>
      <p className="text-base font-bold tabular-nums">{value}</p>
    </div>
  );
}
