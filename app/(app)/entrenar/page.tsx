"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Play, Dumbbell, LayoutGrid, Plus, ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

// ── Types ──────────────────────────────────────────────────────────────────

type DayWithExercises = {
  id: string;
  name: string;
  color: string;
  description: string | null;
  routine_day_exercises: { id: string; target_sets: number | null }[];
};

// ── Helpers ────────────────────────────────────────────────────────────────

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const DAYS_ES = ["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"];
const MONTHS_ES = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];

function getDateLabel() {
  const d = new Date();
  return `${DAYS_ES[d.getDay()]} · ${d.getDate()} ${MONTHS_ES[d.getMonth()]}`;
}

// ── Hero card ──────────────────────────────────────────────────────────────

function HeroCard({
  day,
  onStart,
  isStarting,
  disabled,
}: {
  day: DayWithExercises;
  onStart: () => void;
  isStarting: boolean;
  disabled: boolean;
}) {
  const exerciseCount = day.routine_day_exercises.length;
  const targetSets = day.routine_day_exercises.reduce(
    (sum, e) => sum + (e.target_sets ?? 0),
    0
  );

  return (
    <button
      type="button"
      onClick={onStart}
      disabled={disabled}
      className="w-full text-left text-white rounded-[20px] p-5 flex flex-col gap-4
                 min-h-[188px] relative overflow-hidden active:scale-[.993] transition-transform
                 disabled:opacity-70"
      style={{
        background: `linear-gradient(150deg, ${day.color}f5, ${day.color}88)`,
        boxShadow: "var(--shadow-lg)",
      }}
    >
      {/* Shine overlay */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(120% 90% at 90% 10%, rgba(255,255,255,.18), transparent 55%)" }}
      />

      {/* Top row */}
      <div className="flex items-center justify-between relative z-10">
        <span className="font-mono text-[11px] font-bold tracking-[0.1em] uppercase
                         bg-white/22 backdrop-blur-sm px-3 py-1.5 rounded-full">
          Sesión de hoy
        </span>
        <span className="text-[12.5px] font-semibold text-white/85">
          {exerciseCount > 0 ? `${exerciseCount} ejercicio${exerciseCount !== 1 ? "s" : ""}` : ""}
          {exerciseCount > 0 && targetSets > 0 ? " · " : ""}
          {targetSets > 0 ? `~${targetSets} series` : ""}
        </span>
      </div>

      {/* Name */}
      <div className="flex-1 relative z-10">
        <h2 className="font-display font-bold text-[42px] leading-none tracking-[-0.02em]">
          {day.name}
        </h2>
        {day.description && (
          <p className="text-[14px] text-white/85 mt-1.5 font-medium line-clamp-1">
            {day.description}
          </p>
        )}
      </div>

      {/* Bottom row */}
      <div className="flex items-center justify-end relative z-10">
        <span className="inline-flex items-center gap-2 bg-white text-[#1a1208]
                         font-display font-bold text-[14px] px-4 py-2.5 rounded-full">
          {isStarting ? (
            <span className="w-4 h-4 border-2 border-[#1a1208]/40 border-t-[#1a1208] rounded-full animate-spin" />
          ) : (
            <Play size={16} fill="currentColor" />
          )}
          Empezar
        </span>
      </div>
    </button>
  );
}

// ── Routine rail card ──────────────────────────────────────────────────────

function RailCard({
  day,
  onStart,
  isStarting,
  disabled,
}: {
  day: DayWithExercises;
  onStart: () => void;
  isStarting: boolean;
  disabled: boolean;
}) {
  const exerciseCount = day.routine_day_exercises.length;
  const targetSets = day.routine_day_exercises.reduce(
    (sum, e) => sum + (e.target_sets ?? 0),
    0
  );

  return (
    <div
      className="flex-none rounded-[20px] p-4 flex flex-col gap-3 select-none"
      style={{ width: 158, background: "var(--surface)", border: "1px solid var(--border)" }}
    >
      {/* Colour dot */}
      <span
        className="w-8 h-8 rounded-[10px] flex-none"
        style={{ backgroundColor: day.color }}
      />
      <div className="flex-1 min-w-0">
        <h4 className="font-display font-semibold text-[19px] text-foreground leading-tight truncate">
          {day.name}
        </h4>
        {day.description && (
          <p className="text-[12.5px] text-muted mt-0.5 line-clamp-2 leading-snug">
            {day.description}
          </p>
        )}
      </div>
      <div className="flex items-center justify-between">
        <div className="flex gap-1 text-[11.5px] text-muted font-semibold flex-wrap">
          {exerciseCount > 0 && <span>{exerciseCount} ejercicio{exerciseCount !== 1 ? "s" : ""}</span>}
          {exerciseCount > 0 && targetSets > 0 && <span>·</span>}
          {targetSets > 0 && <span>~{targetSets} series</span>}
        </div>
        <button
          type="button"
          onClick={onStart}
          disabled={disabled}
          aria-label={`Empezar ${day.name}`}
          className="w-9 h-9 rounded-full bg-accent/15 flex items-center justify-center
                     active:bg-accent/30 transition-colors disabled:opacity-50 touch-manipulation shrink-0"
        >
          {isStarting ? (
            <span className="w-3.5 h-3.5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          ) : (
            <Play size={15} className="text-accent" fill="var(--accent)" />
          )}
        </button>
      </div>
    </div>
  );
}

// ── Add routine card ───────────────────────────────────────────────────────

function AddRoutineCard({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex-none rounded-[20px] p-4 flex flex-col items-start gap-3
                 border border-dashed border-border bg-transparent
                 active:bg-surface-2 transition-colors touch-manipulation"
      style={{ width: 158 }}
    >
      <span className="w-8 h-8 rounded-[10px] bg-accent-soft flex items-center justify-center">
        <Plus size={18} className="text-accent" />
      </span>
      <div>
        <h4 className="font-display font-semibold text-[16px] text-foreground">
          Nueva rutina
        </h4>
        <p className="text-[12px] text-muted mt-0.5">Crea una plantilla</p>
      </div>
    </button>
  );
}

// ── Quick action row ───────────────────────────────────────────────────────

function ActionRow({
  icon: Icon,
  title,
  subtitle,
  onClick,
}: {
  icon: React.ElementType;
  title: string;
  subtitle: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-4 w-full px-4 py-3.5 bg-surface border border-border
                 rounded-2xl active:bg-surface-2 transition-colors text-left touch-manipulation"
      style={{ boxShadow: "var(--shadow)" }}
    >
      <div className="w-10 h-10 rounded-xl bg-accent-soft flex items-center justify-center shrink-0">
        <Icon size={20} className="text-accent-soft-ink" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[14.5px] font-bold text-foreground">{title}</p>
        <p className="text-[12.5px] text-muted">{subtitle}</p>
      </div>
      <ChevronRight size={16} className="text-muted shrink-0" />
    </button>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function EntrenarPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [days,       setDays]       = useState<DayWithExercises[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [startingId, setStartingId] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const railRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase
      .from("routine_days")
      .select("id, name, color, description, routine_day_exercises(id, target_sets)")
      .order("position")
      .order("created_at")
      .then(({ data }) => {
        if (data) setDays(data as DayWithExercises[]);
        setLoading(false);
      });
  }, [supabase]);

  function handleRailScroll() {
    const el = railRef.current;
    if (!el) return;
    // 158px card + 12px gap
    setActiveIndex(Math.round(el.scrollLeft / 170));
  }

  async function startWorkout(routineDayId: string) {
    if (startingId) return;
    setStartingId(routineDayId);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setStartingId(null); return; }
    const { data } = await supabase
      .from("workout_sessions")
      .insert({
        user_id: user.id,
        routine_day_id: routineDayId,
        scheduled_session_id: null,
        date: todayStr(),
        started_at: new Date().toISOString(),
      })
      .select().single();
    if (data) router.push(`/sesion/${data.id}`);
    else setStartingId(null);
  }

  // ── Loading skeleton ──────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="px-4 pt-8 flex flex-col gap-5">
        <div className="h-7 w-24 bg-surface-3 rounded-lg animate-pulse" />
        <div className="h-6 w-40 bg-surface-3 rounded-lg animate-pulse" />
        <div className="h-[188px] rounded-[20px] bg-surface-3 animate-pulse" />
        <div className="flex gap-3">
          {[1, 2].map(i => (
            <div key={i} className="w-[158px] h-[168px] rounded-[20px] bg-surface-3 animate-pulse flex-none" />
          ))}
        </div>
      </div>
    );
  }

  const heroDay = days[0];

  return (
    <div className="flex flex-col pb-6 gap-5">
      {/* ── Header ────────────────────────────────────────────────── */}
      <div className="px-5 pt-2 pb-0">
        <div className="py-2 pb-[18px]">
          <p className="font-display text-[12px] font-semibold tracking-[0.1em] uppercase mb-1.5 text-accent-soft-ink">
            {getDateLabel()}
          </p>
          <h1 className="font-display font-bold text-[30px] tracking-[-0.02em] text-foreground leading-[1.1]">
            Entrenar
          </h1>
          <p className="text-[14.5px] text-foreground-2 mt-[5px]">
            {heroDay
              ? <>Toca <span className="font-bold text-foreground">{heroDay.name}</span> hoy — vamos a por ello.</>
              : "Empieza creando tu primera rutina."}
          </p>
        </div>
      </div>

      {/* ── Hero card ─────────────────────────────────────────────── */}
      {heroDay ? (
        <div className="px-5">
          <HeroCard
            day={heroDay}
            onStart={() => startWorkout(heroDay.id)}
            isStarting={startingId === heroDay.id}
            disabled={!!startingId}
          />
        </div>
      ) : (
        <div className="px-5 rounded-[20px] border-2 border-dashed border-border
                        flex flex-col items-center justify-center py-12 gap-3
                        mx-5 active:bg-surface transition-colors"
          onClick={() => router.push("/dias")}
        >
          <div className="w-14 h-14 rounded-2xl bg-accent-soft flex items-center justify-center">
            <Plus size={28} className="text-accent" />
          </div>
          <p className="font-semibold text-foreground">Crea tu primera rutina</p>
          <p className="text-sm text-muted text-center max-w-[220px]">
            Organiza tus ejercicios en días de entrenamiento
          </p>
        </div>
      )}

      {/* ── Routine rail ──────────────────────────────────────────── */}
      {days.length > 0 && (
        <div>
          <div className="flex items-center justify-between px-5 mb-3">
            <h3 className="text-[13px] font-bold uppercase tracking-[0.05em] text-muted">
              Mis rutinas
            </h3>
            <button
              type="button"
              onClick={() => router.push("/dias")}
              className="text-accent text-[13.5px] font-semibold"
            >
              Gestionar
            </button>
          </div>

          <div
            ref={railRef}
            onScroll={handleRailScroll}
            className="no-scrollbar flex gap-3 overflow-x-auto px-5 pb-1"
            style={{ scrollSnapType: "x mandatory", WebkitOverflowScrolling: "touch" }}
          >
            {days.map(d => (
              <div key={d.id} style={{ scrollSnapAlign: "start" }}>
                <RailCard
                  day={d}
                  onStart={() => startWorkout(d.id)}
                  isStarting={startingId === d.id}
                  disabled={!!startingId}
                />
              </div>
            ))}
            <div style={{ scrollSnapAlign: "start" }}>
              <AddRoutineCard onClick={() => router.push("/dias")} />
            </div>
            {/* Right sentinel */}
            <div className="w-4 shrink-0" />
          </div>

          {/* Pagination dots */}
          {days.length > 1 && (
            <div className="flex justify-center gap-1.5 mt-3">
              {days.map((_, i) => (
                <motion.div
                  key={i}
                  animate={{ width: i === activeIndex ? 18 : 6, opacity: i === activeIndex ? 1 : 0.3 }}
                  transition={{ duration: 0.2 }}
                  className="h-1.5 rounded-full bg-accent"
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Quick actions ─────────────────────────────────────────── */}
      <div className="px-5 flex flex-col gap-2.5">
        <p className="text-[13px] font-bold text-muted uppercase tracking-[0.05em] mb-0.5">
          Acciones rápidas
        </p>
        <ActionRow
          icon={Dumbbell}
          title="Añadir ejercicio"
          subtitle="A tu biblioteca personal"
          onClick={() => router.push("/ejercicios")}
        />
        <ActionRow
          icon={LayoutGrid}
          title="Añadir día / rutina"
          subtitle="Nueva plantilla de entreno"
          onClick={() => router.push("/dias")}
        />
      </div>
    </div>
  );
}
