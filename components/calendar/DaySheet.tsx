"use client";

import { useState } from "react";
import {
  Play, X, ChevronLeft, Dumbbell, CalendarDays, SkipForward, Moon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import type { RoutineDay, ScheduledSession } from "@/lib/supabase/types";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

type SessionWithDay = ScheduledSession & { routine_days: RoutineDay | null };

const DAYS_ES  = ["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"];
const MONTHS_ES = [
  "enero","febrero","marzo","abril","mayo","junio",
  "julio","agosto","septiembre","octubre","noviembre","diciembre",
];

const STATUS_LABEL: Record<string, string> = {
  planned:   "Planificado",
  completed: "Completado",
  skipped:   "Saltado",
  rest:      "Descanso",
};
const STATUS_COLOR: Record<string, string> = {
  planned:   "text-accent",
  completed: "text-green-400",
  skipped:   "text-muted line-through",
  rest:      "text-muted",
};

interface DaySheetProps {
  year:    number;
  month:   number;
  day:     number;
  sessions: SessionWithDay[];
  routineDays: RoutineDay[];
  onClose: () => void;
  onSessionAdded:   (session: SessionWithDay) => void;
  onSessionRemoved: (id: string) => void;
  onSessionUpdated: (session: ScheduledSession) => void;
}

type View = "main" | "assign";

export function DaySheet({
  year, month, day,
  sessions, routineDays,
  onClose,
  onSessionAdded, onSessionRemoved, onSessionUpdated,
}: DaySheetProps) {
  const router = useRouter();
  const [view,          setView]          = useState<View>("main");
  const [search,        setSearch]        = useState("");
  const [startingId,    setStartingId]    = useState<string | null>(null);
  const [startingAdhoc, setStartingAdhoc] = useState(false);
  const [markingRest,   setMarkingRest]   = useState(false);

  const dateKey   = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  const dateObj   = new Date(year, month, day);
  const dateLabel = `${DAYS_ES[dateObj.getDay()]}, ${day} de ${MONTHS_ES[month]}`;

  const assignedIds   = sessions.filter(s => s.routine_day_id).map(s => s.routine_day_id!);
  const availableDays = routineDays.filter(rd => !assignedIds.includes(rd.id));
  const filteredDays  = availableDays.filter(rd =>
    rd.name.toLowerCase().includes(search.toLowerCase())
  );

  // Is there already a rest session today?
  const restSession = sessions.find(s => s.status === "rest");
  const isEmpty     = sessions.length === 0;

  function backToMain() { setView("main"); setSearch(""); }

  // ── Assign routine ──────────────────────────────────────────────────────
  async function assignDay(routineDayId: string) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from("scheduled_sessions")
      .insert({ user_id: user.id, routine_day_id: routineDayId, date: dateKey, status: "planned" })
      .select("*, routine_days(*)")
      .single();
    if (data) { onSessionAdded(data as SessionWithDay); backToMain(); }
  }

  // ── Mark rest ────────────────────────────────────────────────────────────
  async function markRest() {
    setMarkingRest(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setMarkingRest(false); return; }
    const { data } = await supabase
      .from("scheduled_sessions")
      .insert({ user_id: user.id, routine_day_id: null, date: dateKey, status: "rest" })
      .select("*, routine_days(*)")
      .single();
    if (data) onSessionAdded(data as SessionWithDay);
    setMarkingRest(false);
  }

  // ── Remove rest ──────────────────────────────────────────────────────────
  async function clearRest() {
    if (!restSession) return;
    const supabase = createClient();
    await supabase.from("scheduled_sessions").delete().eq("id", restSession.id);
    onSessionRemoved(restSession.id);
  }

  // ── Start workout ────────────────────────────────────────────────────────
  async function startWorkout(session?: SessionWithDay) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    if (session) setStartingId(session.id);
    else setStartingAdhoc(true);
    const { data } = await supabase
      .from("workout_sessions")
      .insert({
        user_id: user.id,
        date: dateKey,
        routine_day_id: session?.routine_day_id ?? null,
        scheduled_session_id: session?.id ?? null,
        started_at: new Date().toISOString(),
      })
      .select().single();
    if (data) router.push(`/sesion/${data.id}`);
    else { setStartingId(null); setStartingAdhoc(false); }
  }

  async function removeSession(id: string) {
    const supabase = createClient();
    await supabase.from("scheduled_sessions").delete().eq("id", id);
    onSessionRemoved(id);
  }

  async function toggleSkip(s: SessionWithDay) {
    const supabase = createClient();
    const newStatus = s.status === "skipped" ? "planned" : "skipped";
    const { data } = await supabase
      .from("scheduled_sessions")
      .update({ status: newStatus })
      .eq("id", s.id)
      .select().single();
    if (data) onSessionUpdated(data);
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="px-4 pt-2 pb-10 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        {view === "assign" && (
          <button onClick={backToMain}
            className="w-8 h-8 flex items-center justify-center rounded-full text-muted shrink-0"
            aria-label="Volver">
            <ChevronLeft size={18} />
          </button>
        )}
        <p className="flex-1 font-semibold">
          {view === "main" ? dateLabel : "Elegir plantilla"}
        </p>
        <button onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-surface-2 text-muted shrink-0"
          aria-label="Cerrar">
          <X size={15} />
        </button>
      </div>

      <AnimatePresence mode="wait" initial={false}>
        {view === "main" ? (
          <motion.div key="main"
            initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }} transition={{ duration: 0.15 }}
            className="flex flex-col gap-2.5">

            {/* ── Rest day banner ─────────────────────────────────────── */}
            {restSession && (
              <div className="flex items-center gap-3 bg-surface-2 border border-border
                              rounded-2xl px-4 py-3.5">
                <div className="w-10 h-10 rounded-xl bg-surface-3 flex items-center justify-center shrink-0">
                  <Moon size={18} className="text-muted" />
                </div>
                <div className="flex-1">
                  <p className="text-[14.5px] font-bold text-foreground">Día de descanso</p>
                  <p className="text-[12.5px] text-muted">Recuperación programada</p>
                </div>
                <button onClick={clearRest}
                  className="text-[13px] font-semibold text-accent touch-manipulation">
                  Quitar
                </button>
              </div>
            )}

            {/* ── Planned / completed sessions ───────────────────────── */}
            {sessions
              .filter(s => s.status !== "rest")
              .map(s => (
                <div key={s.id}
                  className="bg-surface-2 rounded-2xl overflow-hidden border border-border">
                  <div className="flex items-center gap-3 px-3 pt-3 pb-2.5">
                    {s.routine_days ? (
                      <span className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: s.routine_days.color ?? "#6366f1" }} />
                    ) : (
                      <Dumbbell size={13} className="text-muted shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">
                        {s.routine_days?.name ?? "Sesión libre"}
                      </p>
                      <p className={cn("text-xs mt-0.5", STATUS_COLOR[s.status] ?? "text-muted")}>
                        {STATUS_LABEL[s.status] ?? s.status}
                      </p>
                    </div>
                    <button onClick={() => toggleSkip(s)}
                      className="w-8 h-8 flex items-center justify-center rounded-full text-muted active:bg-border transition-colors"
                      aria-label={s.status === "skipped" ? "Desmarcar saltado" : "Marcar como saltado"}>
                      <SkipForward size={14} className={s.status === "skipped" ? "text-accent" : ""} />
                    </button>
                    <button onClick={() => removeSession(s.id)}
                      className="w-8 h-8 flex items-center justify-center rounded-full text-muted active:bg-border transition-colors"
                      aria-label="Eliminar">
                      <X size={14} />
                    </button>
                  </div>
                  {s.status !== "completed" && (
                    <Button fullWidth size="sm" loading={startingId === s.id}
                      onClick={() => startWorkout(s)}
                      className="rounded-none rounded-b-2xl h-10 gap-2 border-t border-border text-sm font-semibold">
                      <Play size={12} fill="currentColor" />
                      Empezar entreno
                    </Button>
                  )}
                </div>
              ))}

            {/* ── Empty state actions ─────────────────────────────────── */}
            {isEmpty && (
              <div className="bg-surface-2 border border-dashed border-border rounded-2xl
                              px-4 py-3 mb-1">
                <p className="text-[13px] text-muted mb-3">Nada programado este día.</p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setView("assign")}
                    className="flex-1 flex items-center justify-center gap-2
                               h-[46px] rounded-[13px] bg-accent text-on-accent
                               font-bold text-[13.5px] active:bg-accent-press
                               transition-colors touch-manipulation border-0"
                  >
                    <CalendarDays size={16} />
                    Asignar rutina
                  </button>
                  <button
                    type="button"
                    onClick={markRest}
                    disabled={markingRest}
                    className="flex-none flex items-center justify-center gap-2
                               h-[46px] px-4 rounded-[13px]
                               bg-surface border border-border text-foreground-2
                               font-bold text-[13.5px] active:bg-surface-3
                               transition-colors touch-manipulation disabled:opacity-50"
                  >
                    {markingRest ? (
                      <span className="w-4 h-4 border-2 border-muted border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Moon size={16} />
                    )}
                    Descanso
                  </button>
                </div>
              </div>
            )}

            {/* ── Assign button (when not empty) ───────────────────────── */}
            {!isEmpty && (
              <Button variant="secondary" fullWidth onClick={() => setView("assign")} className="gap-2 h-11">
                <CalendarDays size={16} />
                Asignar plantilla
              </Button>
            )}

            {/* ── Rest button (when not empty and no rest yet) ─────────── */}
            {!isEmpty && !restSession && (
              <Button variant="ghost" fullWidth loading={markingRest} onClick={markRest}
                className="gap-2 h-11 text-muted">
                <Moon size={16} />
                Marcar descanso
              </Button>
            )}

            {/* ── Free session ─────────────────────────────────────────── */}
            <Button variant="ghost" fullWidth loading={startingAdhoc}
              onClick={() => startWorkout()} className="gap-2 h-11 text-muted">
              <Dumbbell size={16} />
              Sesión libre (sin plantilla)
            </Button>
          </motion.div>

        ) : (
          <motion.div key="assign"
            initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 8 }} transition={{ duration: 0.15 }}
            className="flex flex-col gap-3">
            <input
              type="search"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar plantilla..."
              autoFocus
              className="h-11 w-full rounded-xl bg-surface-2 border border-border px-3 text-base
                         text-foreground placeholder:text-muted focus:outline-none focus:ring-2
                         focus:ring-accent focus:border-transparent"
            />
            <div className="flex flex-col gap-1.5 max-h-64 overflow-y-auto overscroll-contain">
              {availableDays.length === 0 ? (
                <p className="text-sm text-muted text-center py-6">
                  Todas las plantillas ya están asignadas para este día.
                </p>
              ) : filteredDays.length === 0 ? (
                <p className="text-sm text-muted text-center py-4">
                  Sin resultados para &quot;{search}&quot;.
                </p>
              ) : (
                filteredDays.map(rd => (
                  <button key={rd.id} onClick={() => assignDay(rd.id)}
                    className="flex items-center gap-3 px-3 py-3.5 rounded-xl bg-surface-2
                               border border-transparent active:border-border transition-colors text-left">
                    <span className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: rd.color ?? "#6366f1" }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{rd.name}</p>
                      {rd.description && (
                        <p className="text-xs text-muted truncate">{rd.description}</p>
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
