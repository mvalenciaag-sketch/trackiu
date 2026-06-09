"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle, Plus, Dumbbell } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type {
  WorkoutSession,
  RoutineDay,
  RoutineDayExercise,
  Exercise,
  SetLog,
} from "@/lib/supabase/types";
import {
  useActiveSession,
  newLocalId,
  type ActiveSet,
} from "@/stores/activeSession";
import { useRestTimer } from "@/stores/restTimer";
import { useOnlineStatus } from "@/lib/hooks/useOnlineStatus";
import { Button } from "@/components/ui/Button";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { ExerciseBlock } from "@/components/session/ExerciseBlock";
import { ExercisePicker } from "@/components/routine-days/ExercisePicker";
import { OfflineBanner } from "@/components/session/OfflineBanner";
import { RestTimerBanner } from "@/components/session/RestTimerBanner";

const DEFAULT_REST_SECONDS = 90;

type SessionWithDay = WorkoutSession & {
  routine_days: Pick<RoutineDay, "id" | "name" | "color"> | null;
};
type ExerciseEntry = RoutineDayExercise & { exercises: Exercise };
type LastTimeMap = Record<string, { weightKg: number | null; reps: number | null }>;

// Group exercises by superset_group for display
type ExerciseGroup =
  | { kind: "single"; entry: ExerciseEntry }
  | { kind: "superset"; label: string; entries: ExerciseEntry[] };

function buildGroups(entries: ExerciseEntry[]): ExerciseGroup[] {
  const groups: ExerciseGroup[] = [];
  const visited = new Set<string>();
  const supersetLetters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let supersetIdx = 0;

  for (const entry of entries) {
    if (visited.has(entry.id)) continue;
    const sg = entry.superset_group;
    if (sg != null) {
      const grouped = entries.filter((e) => e.superset_group === sg);
      grouped.forEach((e) => visited.add(e.id));
      groups.push({
        kind: "superset",
        label: `Superset ${supersetLetters[supersetIdx++ % 26]}`,
        entries: grouped,
      });
    } else {
      visited.add(entry.id);
      groups.push({ kind: "single", entry });
    }
  }
  return groups;
}

export default function SessionPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [session, setSession] = useState<SessionWithDay | null>(null);
  const [exercises, setExercises] = useState<ExerciseEntry[]>([]);
  const [adHocExercises, setAdHocExercises] = useState<Exercise[]>([]);
  const [allExercises, setAllExercises] = useState<Exercise[]>([]);
  const [lastTime, setLastTime] = useState<LastTimeMap>({});
  const [loading, setLoading] = useState(true);
  const [isFinishing, setIsFinishing] = useState(false);
  const [showFinishSheet, setShowFinishSheet] = useState(false);
  const [showPickerSheet, setShowPickerSheet] = useState(false);
  const [sessionNotes, setSessionNotes] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);

  const { sessionId: storeId, sets, init, upsertSet, removeSet, clear } =
    useActiveSession();
  const { start: startTimer } = useRestTimer();
  const supabase = useMemo(() => createClient(), []);
  const online = useOnlineStatus();
  const prevOnline = useRef(online);

  // ── Pending sets (no remoteId) ───────────────────────────────────────────
  const pendingCount = sets.filter((s) => !s.remoteId).length;

  // ── Sync on reconnect ───────────────────────────────────────────────────
  useEffect(() => {
    if (online && !prevOnline.current && pendingCount > 0) {
      syncPending();
    }
    prevOnline.current = online;
  }, [online]); // eslint-disable-line react-hooks/exhaustive-deps

  async function syncPending() {
    setIsSyncing(true);
    const pending = useActiveSession.getState().sets.filter((s) => !s.remoteId);
    for (const s of pending) {
      const { data } = await supabase
        .from("set_logs")
        .insert({
          session_id: id,
          exercise_id: s.exerciseId,
          set_number: s.setNumber,
          set_type: s.setType,
          weight_kg: s.weightKg,
          reps: s.reps,
          is_completed: s.isCompleted,
          rir: s.rir,
          rpe: s.rpe,
          rom: s.rom,
          tempo: s.tempo,
          rest_seconds: s.restSeconds,
          notes: s.notes,
        })
        .select()
        .single();
      if (data) {
        useActiveSession.getState().upsertSet({ ...s, remoteId: data.id });
      }
    }
    setIsSyncing(false);
  }

  // ── Data fetch ───────────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    const { data: sessionData, error } = await supabase
      .from("workout_sessions")
      .select("*, routine_days(id, name, color)")
      .eq("id", id)
      .single();

    if (error || !sessionData) {
      router.push("/calendario");
      return;
    }
    setSession(sessionData as SessionWithDay);
    setSessionNotes(sessionData.notes ?? "");

    let entries: ExerciseEntry[] = [];
    if (sessionData.routine_day_id) {
      const { data } = await supabase
        .from("routine_day_exercises")
        .select("*, exercises(*)")
        .eq("routine_day_id", sessionData.routine_day_id)
        .order("position");
      if (data) entries = data as ExerciseEntry[];
    }
    setExercises(entries);

    const { data: allEx } = await supabase
      .from("exercises")
      .select("*")
      .order("name");
    if (allEx) setAllExercises(allEx);

    if (storeId === id) {
      setLoading(false);
      return;
    }

    const { data: setData } = await supabase
      .from("set_logs")
      .select("*")
      .eq("session_id", id)
      .order("set_number");

    const initialSets: ActiveSet[] = (setData ?? []).map((s: SetLog) => ({
      localId: s.id,
      remoteId: s.id,
      exerciseId: s.exercise_id,
      setNumber: s.set_number,
      setType: (s.set_type ?? "working") as ActiveSet["setType"],
      weightKg: s.weight_kg,
      reps: s.reps,
      isCompleted: s.is_completed,
      rir: s.rir,
      rpe: s.rpe,
      rom: s.rom,
      tempo: s.tempo,
      restSeconds: s.rest_seconds,
      notes: s.notes,
    }));

    init(id, initialSets);

    if (!sessionData.routine_day_id && setData && allEx) {
      const seen = new Set<string>();
      const adHoc: Exercise[] = [];
      for (const s of setData) {
        if (!seen.has(s.exercise_id)) {
          seen.add(s.exercise_id);
          const ex = allEx.find((e) => e.id === s.exercise_id);
          if (ex) adHoc.push(ex);
        }
      }
      setAdHocExercises(adHoc);
    }

    const exerciseIds = entries.map((e) => e.exercise_id);
    if (exerciseIds.length > 0) {
      const { data: lastSets } = await supabase
        .from("set_logs")
        .select("exercise_id, weight_kg, reps")
        .in("exercise_id", exerciseIds)
        .neq("session_id", id)
        .eq("is_completed", true)
        .not("weight_kg", "is", null)
        .order("created_at", { ascending: false })
        .limit(exerciseIds.length * 5);

      if (lastSets) {
        const map: LastTimeMap = {};
        for (const s of lastSets) {
          if (!map[s.exercise_id]) {
            map[s.exercise_id] = { weightKg: s.weight_kg, reps: s.reps };
          }
        }
        setLastTime(map);
      }
    }

    setLoading(false);
  }, [supabase, id, router, storeId, init]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ── Set mutations ────────────────────────────────────────────────────────

  async function addSet(exerciseId: string) {
    const exerciseSets = sets.filter((s) => s.exerciseId === exerciseId);
    const last = exerciseSets[exerciseSets.length - 1];

    const newSet: ActiveSet = {
      localId: newLocalId(),
      exerciseId,
      setNumber: exerciseSets.length + 1,
      setType: last?.setType ?? "working",
      weightKg: last?.weightKg ?? null,
      reps: last?.reps ?? null,
      isCompleted: false,
      rir: null, rpe: null, rom: null, tempo: null, restSeconds: null, notes: null,
    };

    upsertSet(newSet);

    if (!online) return; // Will sync on reconnect

    const { data } = await supabase
      .from("set_logs")
      .insert({
        session_id: id,
        exercise_id: exerciseId,
        set_number: newSet.setNumber,
        set_type: newSet.setType,
        weight_kg: newSet.weightKg,
        reps: newSet.reps,
        is_completed: false,
      })
      .select()
      .single();

    if (data) {
      upsertSet({ ...newSet, remoteId: data.id });
    }
  }

  async function updateSet(localId: string, updates: Partial<ActiveSet>) {
    const current = sets.find((s) => s.localId === localId);
    if (!current) return;

    const updated = { ...current, ...updates };
    upsertSet(updated);

    // Auto-start rest timer when set is marked completed
    if (updates.isCompleted && !current.isCompleted) {
      const restDuration = updated.restSeconds ?? DEFAULT_REST_SECONDS;
      startTimer(restDuration);
    }

    if (current.remoteId && online) {
      await supabase
        .from("set_logs")
        .update({
          weight_kg: updated.weightKg,
          reps: updated.reps,
          is_completed: updated.isCompleted,
          set_type: updated.setType,
          rir: updated.rir,
          rpe: updated.rpe,
          rom: updated.rom,
          tempo: updated.tempo,
          rest_seconds: updated.restSeconds,
          notes: updated.notes,
        })
        .eq("id", current.remoteId);
    }
  }

  async function handleRemoveSet(localId: string) {
    const current = sets.find((s) => s.localId === localId);
    removeSet(localId);
    if (current?.remoteId && online) {
      await supabase.from("set_logs").delete().eq("id", current.remoteId);
    }
  }

  function handleAddAdHocExercises(selectedIds: string[]) {
    const newEx = allExercises.filter((e) => selectedIds.includes(e.id));
    setAdHocExercises((prev) => {
      const existing = new Set(prev.map((e) => e.id));
      return [...prev, ...newEx.filter((e) => !existing.has(e.id))];
    });
    setShowPickerSheet(false);
    selectedIds.forEach((exId) => addSet(exId));
  }

  async function finishSession() {
    if (!session) return;
    setIsFinishing(true);

    const completedAt = new Date().toISOString();

    await supabase
      .from("workout_sessions")
      .update({ completed_at: completedAt, notes: sessionNotes || null })
      .eq("id", id);

    if (session.scheduled_session_id) {
      await supabase
        .from("scheduled_sessions")
        .update({ status: "completed" })
        .eq("id", session.scheduled_session_id);
    }

    clear();
    router.push("/calendario");
  }

  // ── Derived state ────────────────────────────────────────────────────────

  const setsForExercise = (exerciseId: string) =>
    sets.filter((s) => s.exerciseId === exerciseId);

  const completedCount = sets.filter((s) => s.isCompleted).length;
  const isAdHoc = !session?.routine_day_id;

  const displayExercises = useMemo(() => {
    if (exercises.length > 0) return exercises;
    return adHocExercises.map((ex) => ({
      id: "",
      routine_day_id: "",
      exercise_id: ex.id,
      position: 0,
      target_sets: null,
      notes: null,
      superset_group: null,
      created_at: "",
      exercises: ex,
    })) as ExerciseEntry[];
  }, [exercises, adHocExercises]);

  const exerciseGroups = useMemo(
    () => buildGroups(displayExercises),
    [displayExercises]
  );

  const adHocExerciseIds = useMemo(
    () => adHocExercises.map((e) => e.id),
    [adHocExercises]
  );

  // ── Render ───────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="px-4 pt-6 flex flex-col gap-4">
        <div className="h-8 w-36 bg-surface rounded-lg animate-pulse" />
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="h-40 bg-surface rounded-2xl border border-border animate-pulse" />
        ))}
      </div>
    );
  }

  if (!session) return null;

  const dayName = session.routine_days?.name ?? "Sesión libre";
  const dayColor = session.routine_days?.color ?? "#6366f1";

  return (
    <div className="flex flex-col min-h-full pb-28">
      {/* Header */}
      <div className="px-4 pt-6 pb-3 flex items-center gap-3">
        <Link
          href="/calendario"
          className="w-9 h-9 flex items-center justify-center rounded-full bg-surface-2 text-muted shrink-0"
          aria-label="Volver al calendario"
        >
          <ArrowLeft size={17} />
        </Link>
        {!isAdHoc && (
          <span
            className="w-3 h-3 rounded-full shrink-0"
            style={{ backgroundColor: dayColor }}
          />
        )}
        <h1 className="flex-1 text-lg font-bold min-w-0 truncate">{dayName}</h1>
        <Button size="sm" onClick={() => setShowFinishSheet(true)} className="shrink-0 gap-1.5">
          <CheckCircle size={14} />
          Terminar
        </Button>
      </div>

      {/* Offline banner */}
      {(!online || isSyncing) && (
        <OfflineBanner pendingCount={pendingCount} isSyncing={isSyncing} />
      )}

      {/* Exercise list with superset groups */}
      <div className="px-4 flex flex-col gap-4">
        {displayExercises.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-10 text-center">
            <Dumbbell size={32} className="text-muted opacity-40" />
            <p className="text-sm text-muted">
              {isAdHoc
                ? "Añade ejercicios para empezar a registrar."
                : "Esta plantilla no tiene ejercicios."}
            </p>
            {isAdHoc && (
              <Button onClick={() => setShowPickerSheet(true)} className="gap-2">
                <Plus size={15} />
                Añadir ejercicio
              </Button>
            )}
          </div>
        ) : (
          exerciseGroups.map((group, gi) => {
            if (group.kind === "superset") {
              return (
                <div key={`sg-${gi}`} className="rounded-2xl border border-accent/25 overflow-hidden">
                  <div className="bg-accent/10 px-4 py-1.5">
                    <p className="text-xs font-semibold text-accent">{group.label}</p>
                  </div>
                  <div className="flex flex-col gap-0 divide-y divide-border/40">
                    {group.entries.map((entry) => (
                      <ExerciseBlock
                        key={entry.exercise_id}
                        exercise={entry.exercises}
                        sets={setsForExercise(entry.exercise_id)}
                        targetSets={entry.target_sets ?? 3}
                        lastTime={lastTime[entry.exercise_id]}
                        onAddSet={() => addSet(entry.exercise_id)}
                        onUpdateSet={updateSet}
                        onRemoveSet={handleRemoveSet}
                        noBorder
                      />
                    ))}
                  </div>
                </div>
              );
            }
            return (
              <ExerciseBlock
                key={group.entry.exercise_id}
                exercise={group.entry.exercises}
                sets={setsForExercise(group.entry.exercise_id)}
                targetSets={group.entry.target_sets ?? 3}
                lastTime={lastTime[group.entry.exercise_id]}
                onAddSet={() => addSet(group.entry.exercise_id)}
                onUpdateSet={updateSet}
                onRemoveSet={handleRemoveSet}
              />
            );
          })
        )}

        {/* Add more exercises (ad-hoc) */}
        {isAdHoc && displayExercises.length > 0 && (
          <Button variant="secondary" fullWidth onClick={() => setShowPickerSheet(true)} className="gap-2 h-11">
            <Plus size={16} />
            Añadir ejercicio
          </Button>
        )}
      </div>

      {/* Session notes */}
      <div className="px-4 mt-6">
        <textarea
          value={sessionNotes}
          onChange={(e) => setSessionNotes(e.target.value)}
          onBlur={async () => {
            if (online) {
              await supabase
                .from("workout_sessions")
                .update({ notes: sessionNotes || null })
                .eq("id", id);
            }
          }}
          placeholder="Notas de la sesión..."
          rows={2}
          className="w-full rounded-xl bg-surface-2 border border-border px-3 py-2.5 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent resize-none transition-colors"
        />
      </div>

      {/* Rest timer */}
      <RestTimerBanner />

      {/* Finish confirmation sheet */}
      <BottomSheet isOpen={showFinishSheet} onClose={() => setShowFinishSheet(false)} title="Terminar entreno">
        <div className="px-4 pt-2 pb-10 flex flex-col gap-4">
          <p className="text-sm text-muted">
            {completedCount === 0
              ? "No hay series completadas todavía."
              : `${completedCount} serie${completedCount === 1 ? "" : "s"} completada${completedCount === 1 ? "" : "s"} en esta sesión.`}
          </p>
          <Button fullWidth loading={isFinishing} onClick={finishSession} className="h-12 text-base font-semibold gap-2">
            <CheckCircle size={16} />
            Guardar y terminar
          </Button>
          <Button variant="ghost" fullWidth onClick={() => setShowFinishSheet(false)}>
            Seguir entrenando
          </Button>
        </div>
      </BottomSheet>

      {/* Ad-hoc exercise picker */}
      {isAdHoc && (
        <BottomSheet isOpen={showPickerSheet} onClose={() => setShowPickerSheet(false)} title="Añadir ejercicio">
          <ExercisePicker
            exercises={allExercises}
            excludedIds={adHocExerciseIds}
            onConfirm={handleAddAdHocExercises}
          />
        </BottomSheet>
      )}
    </div>
  );
}
