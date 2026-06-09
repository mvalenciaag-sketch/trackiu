"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Flame, Trophy, ChevronRight, Dumbbell, ArrowUp } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  epley,
  formatVolKg,
  formatShortDate,
  daysAgoISO,
} from "@/lib/utils/analytics";

// ── Raw types ─────────────────────────────────────────────────────────────────

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

// ── Analytics helpers ─────────────────────────────────────────────────────────

function logDate(log: RawLog): string {
  return log.workout_sessions?.date ?? log.created_at.split("T")[0];
}

function computeStreak(dates: string[]): { streak: number; bestStreak: number } {
  if (dates.length === 0) return { streak: 0, bestStreak: 0 };
  const dateSet = new Set(dates);
  const sorted = Array.from(dateSet).sort().reverse();

  const today = new Date().toISOString().split("T")[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

  let streak = 0;
  const startDate = dateSet.has(today)
    ? today
    : dateSet.has(yesterday)
    ? yesterday
    : null;

  if (startDate) {
    const d = new Date(startDate + "T12:00:00Z");
    while (dateSet.has(d.toISOString().split("T")[0])) {
      streak++;
      d.setUTCDate(d.getUTCDate() - 1);
    }
  }

  let best = streak;
  let cur = 1;
  for (let i = 1; i < sorted.length; i++) {
    const d1 = new Date(sorted[i - 1] + "T12:00:00Z");
    const d2 = new Date(sorted[i] + "T12:00:00Z");
    const diff = Math.round((d1.getTime() - d2.getTime()) / 86400000);
    if (diff === 1) {
      cur++;
      if (cur > best) best = cur;
    } else {
      cur = 1;
    }
  }

  return { streak, bestStreak: Math.max(best, streak) };
}

function countWeekSessions(dates: string[]): number {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - dayOfWeek);
  const startStr = startOfWeek.toISOString().split("T")[0];
  const todayStr = now.toISOString().split("T")[0];
  const unique = new Set(dates.filter((d) => d >= startStr && d <= todayStr));
  return unique.size;
}

function computeWeeklyVolume(logs: RawLog[], weeks = 12): number[] {
  const result = new Array(weeks).fill(0);
  const now = Date.now();
  for (const log of logs) {
    const ts = new Date(logDate(log) + "T12:00:00Z").getTime();
    const diffWeeks = Math.floor((now - ts) / (7 * 24 * 60 * 60 * 1000));
    if (diffWeeks >= 0 && diffWeeks < weeks) {
      result[weeks - 1 - diffWeeks] += log.weight_kg * log.reps;
    }
  }
  return result;
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
  const values = Object.values(map)
    .sort((a, b) => b.volume - a.volume)
    .slice(0, 10);
  const total = values.reduce((s, v) => s + v.volume, 0);
  return values.map((v) => ({ ...v, pct: total > 0 ? v.volume / total : 0 }));
}

type PREntry = {
  exerciseId: string;
  name: string;
  e1rm: number;
  date: string;
};

function computePRs(logs: RawLog[]): PREntry[] {
  const map: Record<string, PREntry> = {};
  for (const log of logs) {
    const e1rm = epley(log.weight_kg, log.reps);
    const date = logDate(log);
    const ex = map[log.exercise_id];
    if (!ex || e1rm > ex.e1rm) {
      map[log.exercise_id] = {
        exerciseId: log.exercise_id,
        name: log.exercises.name,
        e1rm,
        date,
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

// ── WeekRing component ────────────────────────────────────────────────────────

function WeekRing({ sessions, goal }: { sessions: number; goal: number }) {
  const C = 2 * Math.PI * 34;
  const pct = Math.min(sessions / Math.max(goal, 1), 1);
  return (
    <div className="bg-surface border border-border rounded-2xl p-[18px] flex items-center justify-center relative">
      <svg
        viewBox="0 0 80 80"
        className="w-[120px] h-[120px]"
        style={{ transform: "rotate(-90deg)" }}
      >
        <circle
          cx="40"
          cy="40"
          r="34"
          fill="none"
          style={{ stroke: "var(--surface-3)", strokeWidth: 8 }}
        />
        <circle
          cx="40"
          cy="40"
          r="34"
          fill="none"
          style={{
            stroke: "var(--accent)",
            strokeWidth: 8,
            strokeLinecap: "round",
            strokeDasharray: C,
            strokeDashoffset: C * (1 - pct),
            transition: "stroke-dashoffset 0.6s",
          }}
        />
      </svg>
      <div className="absolute text-center pointer-events-none">
        <b className="font-display text-[26px] font-bold text-foreground leading-none">
          {sessions}
          <span className="text-base text-muted">/{goal}</span>
        </b>
        <em className="block text-[11px] text-foreground-2 font-semibold not-italic mt-0.5">
          esta semana
        </em>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

const WEEK_GOAL = 4;

export default function ProgresoPage() {
  const [allLogs, setAllLogs] = useState<RawLog[]>([]);
  const [sessionDates, setSessionDates] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    async function fetchData() {
      const [{ data: logs }, { data: sessions }] = await Promise.all([
        supabase
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
          .limit(3000),
        supabase
          .from("workout_sessions")
          .select("date")
          .not("completed_at", "is", null)
          .order("date", { ascending: false }),
      ]);
      setAllLogs((logs ?? []) as unknown as RawLog[]);
      setSessionDates(
        ((sessions ?? []) as { date: string }[]).map((s) => s.date)
      );
      setLoading(false);
    }
    fetchData();
  }, [supabase]);

  const { streak, bestStreak } = useMemo(
    () => computeStreak(sessionDates),
    [sessionDates]
  );
  const weekSessions = useMemo(
    () => countWeekSessions(sessionDates),
    [sessionDates]
  );
  const weeklyVolume = useMemo(
    () => computeWeeklyVolume(allLogs),
    [allLogs]
  );
  const prs = useMemo(() => computePRs(allLogs), [allLogs]);
  const muscleBalance = useMemo(
    () =>
      computeVolumeByMuscle(
        allLogs.filter((l) => logDate(l) >= daysAgoISO(28))
      ),
    [allLogs]
  );
  const exerciseList = useMemo(
    () => computeExerciseList(allLogs),
    [allLogs]
  );

  const weeklyTotal = weeklyVolume.reduce((s, v) => s + v, 0);
  const weeklyMax = Math.max(...weeklyVolume, 1);

  // ── Loading skeleton ──────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="px-5 pt-4 pb-28 flex flex-col gap-3.5">
        <div className="h-[72px] w-44 bg-surface rounded-2xl animate-pulse mb-1" />
        <div className="grid grid-cols-2 gap-3">
          <div className="h-[152px] bg-surface border border-border rounded-2xl animate-pulse" />
          <div className="h-[152px] bg-surface border border-border rounded-2xl animate-pulse" />
        </div>
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="h-[120px] bg-surface border border-border rounded-2xl animate-pulse"
          />
        ))}
      </div>
    );
  }

  // ── Empty state ───────────────────────────────────────────────────────────

  if (allLogs.length === 0 && sessionDates.length === 0) {
    return (
      <div className="px-5 pt-6 flex flex-col items-center gap-3 py-20 text-center">
        <Dumbbell size={36} className="text-muted opacity-40" />
        <p className="font-display font-semibold">Sin datos todavía</p>
        <p className="text-sm text-muted">
          Completa tu primera sesión para ver aquí tu progreso.
        </p>
      </div>
    );
  }

  // ── Main view ─────────────────────────────────────────────────────────────

  return (
    <div className="px-5 pt-2 pb-28 flex flex-col">
      {/* Screen header */}
      <div className="py-4 pb-[18px]">
        <h1 className="font-display text-[30px] font-bold tracking-tight text-foreground leading-tight">
          Progreso
        </h1>
        <p className="text-[14.5px] text-foreground-2 mt-[5px]">
          Lo que mueves, medido.
        </p>
      </div>

      {/* Streak + week ring grid */}
      <div className="grid grid-cols-2 gap-3 mb-3.5">
        {/* Streak card */}
        <div className="bg-surface border border-border rounded-2xl p-[18px] flex flex-col">
          <span className="w-[38px] h-[38px] rounded-xl bg-accent-soft text-accent-soft-ink flex items-center justify-center mb-3 shrink-0">
            <Flame size={22} />
          </span>
          <div className="font-display text-[38px] font-bold leading-none text-foreground">
            {streak}
          </div>
          <div className="text-[13px] text-foreground-2 font-semibold mt-0.5">
            días de racha
          </div>
          <div className="text-[11.5px] text-muted mt-2.5 font-medium">
            Mejor: {bestStreak} día{bestStreak !== 1 ? "s" : ""}
          </div>
        </div>

        {/* Week ring */}
        <WeekRing sessions={weekSessions} goal={WEEK_GOAL} />
      </div>

      {/* Weekly volume chart */}
      <div className="bg-surface border border-border rounded-2xl p-[18px]">
        <div className="flex items-start justify-between mb-[18px]">
          <div>
            <h3 className="font-display text-base font-semibold text-foreground">
              Volumen semanal
            </h3>
            <p className="text-xs text-muted mt-0.5">Últimas 12 semanas</p>
          </div>
          <span className="font-display text-sm font-semibold text-accent-soft-ink bg-accent-soft px-[11px] py-[5px] rounded-full whitespace-nowrap">
            {formatVolKg(weeklyTotal)}
          </span>
        </div>
        <div className="flex items-end gap-1.5 h-24">
          {weeklyVolume.map((v, i) => (
            <div key={i} className="flex-1 h-full flex items-end">
              <div
                className={`w-full rounded-[5px] min-h-[6px] transition-[height] duration-500 ${
                  i === weeklyVolume.length - 1 ? "bg-accent" : "bg-surface-3"
                }`}
                style={{ height: `${(v / weeklyMax) * 100}%` }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Personal records */}
      {prs.length > 0 && (
        <>
          <div className="flex items-center mt-7 mb-3">
            <h3 className="text-[13px] font-bold tracking-[0.05em] uppercase text-muted">
              Récords personales
            </h3>
          </div>
          <div className="flex flex-col gap-2">
            {prs.slice(0, 8).map((pr) => (
              <Link
                key={pr.exerciseId}
                href={`/progreso/${pr.exerciseId}`}
                className="flex items-center gap-3 bg-surface border border-border rounded-2xl px-3.5 py-3 active:bg-surface-2 transition-colors"
              >
                <span className="w-[34px] h-[34px] rounded-[10px] bg-accent-soft text-accent-soft-ink flex items-center justify-center shrink-0">
                  <Trophy size={18} />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-foreground truncate leading-tight">
                    {pr.name}
                  </p>
                  <p className="text-xs text-muted mt-0.5">
                    {formatShortDate(pr.date)}
                  </p>
                </div>
                <div className="font-display text-[15px] font-semibold text-foreground-2 flex items-center gap-0.5 shrink-0">
                  <ArrowUp
                    size={14}
                    strokeWidth={2.4}
                    className="text-green-500"
                  />
                  {pr.e1rm} kg
                </div>
              </Link>
            ))}
          </div>
        </>
      )}

      {/* Muscle balance */}
      {muscleBalance.length > 0 && (
        <div className="bg-surface border border-border rounded-2xl p-[18px] mt-3.5">
          <div className="flex items-start justify-between mb-[18px]">
            <div>
              <h3 className="font-display text-base font-semibold text-foreground">
                Equilibrio muscular
              </h3>
              <p className="text-xs text-muted mt-0.5">
                Volumen relativo (28 días)
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-[11px]">
            {muscleBalance.map((m) => (
              <div
                key={m.name}
                className="grid items-center gap-2.5"
                style={{ gridTemplateColumns: "88px 1fr 38px" }}
              >
                <span className="text-[13px] font-semibold text-foreground-2 truncate">
                  {m.name}
                </span>
                <span className="h-2 bg-surface-3 rounded-full overflow-hidden">
                  <span
                    className="block h-full bg-accent rounded-full transition-[width] duration-500"
                    style={{ width: `${m.pct * 100}%` }}
                  />
                </span>
                <span className="font-display text-[12.5px] font-semibold text-muted text-right">
                  {Math.round(m.pct * 100)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Exercise drill-down */}
      {exerciseList.length > 0 && (
        <>
          <div className="flex items-center mt-7 mb-3">
            <h3 className="text-[13px] font-bold tracking-[0.05em] uppercase text-muted">
              Análisis por ejercicio
            </h3>
          </div>
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
                    {ex.setCount} series · última vez{" "}
                    {formatShortDate(ex.lastDate)}
                  </p>
                </div>
                <ChevronRight size={15} className="text-muted shrink-0" />
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
