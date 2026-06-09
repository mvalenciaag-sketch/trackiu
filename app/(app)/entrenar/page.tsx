"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Play, Dumbbell, LayoutGrid, Plus, ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

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

// ── Sub-components ─────────────────────────────────────────────────────────

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
    >
      <div className="w-10 h-10 rounded-xl bg-accent/15 flex items-center justify-center shrink-0">
        <Icon size={20} className="text-accent" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold">{title}</p>
        <p className="text-xs text-muted">{subtitle}</p>
      </div>
      <ChevronRight size={16} className="text-muted shrink-0" />
    </button>
  );
}

function EmptyCarousel({ onAdd }: { onAdd: () => void }) {
  return (
    <button
      type="button"
      onClick={onAdd}
      className="mx-4 rounded-2xl border-2 border-dashed border-border flex flex-col
                 items-center justify-center p-10 gap-3
                 active:bg-surface-2 transition-colors touch-manipulation"
    >
      <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center">
        <Plus size={28} className="text-accent" />
      </div>
      <p className="font-semibold">Crea tu primera rutina</p>
      <p className="text-sm text-muted text-center max-w-[220px]">
        Organiza tus ejercicios en días de entrenamiento
      </p>
    </button>
  );
}

function DayCard({
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
      className="relative rounded-2xl overflow-hidden flex-shrink-0 h-52 select-none"
      style={{
        scrollSnapAlign: "start",
        width: "82%",
        background: `linear-gradient(140deg, ${day.color}f0, ${day.color}88)`,
      }}
    >
      {/* Depth overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/5 to-black/55" />

      {/* Content */}
      <div className="relative h-full p-5 flex flex-col justify-between">
        {/* Top */}
        <div>
          <p className="text-[10px] font-bold text-white/55 uppercase tracking-widest">
            Rutina
          </p>
          <h2 className="text-[22px] font-bold text-white leading-tight mt-0.5">
            {day.name}
          </h2>
          {day.description && (
            <p className="text-xs text-white/65 mt-1 line-clamp-1">
              {day.description}
            </p>
          )}
        </div>

        {/* Bottom */}
        <div className="flex items-end justify-between gap-2">
          <div className="flex gap-1.5 flex-wrap">
            {exerciseCount > 0 && (
              <span className="text-xs text-white/90 bg-black/25 backdrop-blur-sm px-2.5 py-1 rounded-lg font-medium">
                {exerciseCount} ejercicio{exerciseCount !== 1 ? "s" : ""}
              </span>
            )}
            {targetSets > 0 && (
              <span className="text-xs text-white/90 bg-black/25 backdrop-blur-sm px-2.5 py-1 rounded-lg font-medium">
                ~{targetSets} series
              </span>
            )}
          </div>

          <motion.button
            type="button"
            whileTap={{ scale: 0.88 }}
            transition={{ duration: 0.1 }}
            onClick={onStart}
            disabled={disabled}
            aria-label={`Empezar ${day.name}`}
            className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center
                       shrink-0 active:bg-white/35 transition-colors disabled:opacity-50 touch-manipulation"
          >
            {isStarting ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Play size={18} className="text-white fill-white" />
            )}
          </motion.button>
        </div>
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function EntrenarPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [days, setDays] = useState<DayWithExercises[]>([]);
  const [loading, setLoading] = useState(true);
  const [startingId, setStartingId] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const scrollRef = useRef<HTMLDivElement>(null);

  // Fetch routine days
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

  // Track active carousel index from scroll position
  function handleScroll() {
    const el = scrollRef.current;
    if (!el || days.length <= 1) return;
    // Card occupies 82% of scroll container + 12px gap
    const cardWidth = el.offsetWidth * 0.82 + 12;
    setActiveIndex(Math.round(el.scrollLeft / cardWidth));
  }

  async function startWorkout(routineDayId: string) {
    if (startingId) return;
    setStartingId(routineDayId);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setStartingId(null);
      return;
    }

    const { data } = await supabase
      .from("workout_sessions")
      .insert({
        user_id: user.id,
        routine_day_id: routineDayId,
        scheduled_session_id: null,
        date: todayStr(),
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (data) {
      router.push(`/sesion/${data.id}`);
    } else {
      setStartingId(null);
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col pt-4 gap-6">
      {/* Header */}
      <div className="px-4">
        <h1 className="text-xl font-bold">Entrenar</h1>
        <p className="text-sm text-muted mt-0.5">
          {days.length > 0 ? "¿Qué toca hoy?" : "Empieza creando una rutina"}
        </p>
      </div>

      {/* Carousel or empty state */}
      {days.length === 0 ? (
        <EmptyCarousel onAdd={() => router.push("/dias")} />
      ) : (
        <div>
          {/* Scrollable cards */}
          <div
            ref={scrollRef}
            onScroll={handleScroll}
            className="no-scrollbar flex gap-3 overflow-x-auto px-4 pb-1"
            style={{ scrollSnapType: "x mandatory", WebkitOverflowScrolling: "touch" }}
          >
            {days.map((day) => (
              <DayCard
                key={day.id}
                day={day}
                onStart={() => startWorkout(day.id)}
                isStarting={startingId === day.id}
                disabled={!!startingId}
              />
            ))}
            {/* Right padding sentinel so last card has breathing room */}
            <div className="w-4 shrink-0" />
          </div>

          {/* Pagination dots */}
          {days.length > 1 && (
            <div className="flex justify-center gap-1.5 mt-3">
              {days.map((_, i) => (
                <motion.div
                  key={i}
                  animate={{
                    width: i === activeIndex ? 18 : 6,
                    opacity: i === activeIndex ? 1 : 0.3,
                  }}
                  transition={{ duration: 0.2 }}
                  className="h-1.5 rounded-full bg-accent"
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Quick actions */}
      <div className="px-4 flex flex-col gap-2.5">
        <p className="text-xs font-semibold text-muted uppercase tracking-wider px-1 mb-0.5">
          Acciones rápidas
        </p>
        <ActionRow
          icon={Dumbbell}
          title="Añadir ejercicio"
          subtitle="Añade un ejercicio a tu biblioteca"
          onClick={() => router.push("/ejercicios")}
        />
        <ActionRow
          icon={LayoutGrid}
          title="Añadir día / rutina"
          subtitle="Crea una nueva plantilla de entreno"
          onClick={() => router.push("/dias")}
        />
      </div>
    </div>
  );
}
