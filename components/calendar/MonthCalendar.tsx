"use client";

import { useRef } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { RoutineDay, ScheduledSession } from "@/lib/supabase/types";

type SessionWithDay = ScheduledSession & { routine_days: RoutineDay | null };

const MONTHS = [
  "Enero","Febrero","Marzo","Abril","Mayo","Junio",
  "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre",
];
const WEEKDAYS = ["L","M","X","J","V","S","D"];

interface MonthCalendarProps {
  year: number;
  month: number;
  selectedDay: number | null;
  slideDir: number; // 1 = forward, -1 = backward
  sessionsByDate: Record<string, SessionWithDay[]>;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onSelectDate: (day: number) => void;
  onGoToToday: () => void;
}

function buildGrid(year: number, month: number): (number | null)[] {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const offset = (firstDay + 6) % 7;
  const cells: (number | null)[] = [
    ...Array<null>(offset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

// ── Day cell ──────────────────────────────────────────────────────────────

function DayCell({
  day,
  isToday,
  isSelected,
  isPast,
  sessions,
  onClick,
}: {
  day: number;
  isToday: boolean;
  isSelected: boolean;
  isPast: boolean;
  sessions: SessionWithDay[];
  onClick: () => void;
}) {
  const nonRestSessions = sessions.filter(s => s.status !== "rest");
  const isRestDay       = sessions.some(s => s.status === "rest");
  const hasSessions     = sessions.length > 0;

  return (
    <motion.button
      whileTap={{ scale: 0.82 }}
      transition={{ duration: 0.1 }}
      onClick={onClick}
      aria-label={`Día ${day}`}
      className={cn(
        "flex flex-col items-center justify-start pt-1.5 pb-1 rounded-xl",
        "min-h-[52px] select-none touch-manipulation",
        "active:bg-surface-2 transition-colors",
        isPast && !isToday && "opacity-55"
      )}
    >
      {/* Day number */}
      <span
        className={cn(
          "w-8 h-8 flex items-center justify-center rounded-full text-sm font-medium",
          isToday && "bg-accent text-on-accent font-bold",
          !isToday && isSelected && "ring-2 ring-accent text-accent font-semibold",
          !isToday && !isSelected && "text-foreground"
        )}
      >
        {day}
      </span>

      {/* Session indicators */}
      {hasSessions && (
        <div className="flex gap-[3px] mt-0.5 flex-wrap justify-center w-8">
          {/* Rest day: small moon dot */}
          {isRestDay && nonRestSessions.length === 0 && (
            <span className="w-1.5 h-1.5 rounded-full inline-block bg-muted opacity-60" />
          )}
          {/* Workout session dots */}
          {nonRestSessions.slice(0, 3).map((s) => {
            const dotColor =
              s.status === "skipped"
                ? "var(--surface-2)"
                : (s.routine_days?.color ?? "var(--accent)");
            const opacity = s.status === "completed" ? 1 : 0.6;
            const size    = s.status === "completed" ? "w-2 h-2" : "w-1.5 h-1.5";
            return (
              <span
                key={s.id}
                className={cn("rounded-full inline-block", size)}
                style={{ backgroundColor: dotColor, opacity }}
              />
            );
          })}
          {nonRestSessions.length > 3 && (
            <span className="text-[9px] text-muted leading-none self-center">
              +{nonRestSessions.length - 3}
            </span>
          )}
        </div>
      )}
    </motion.button>
  );
}

// ── Legend ────────────────────────────────────────────────────────────────

function Legend() {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 px-4 pt-3 pb-1">
      {/* Hoy */}
      <div className="flex items-center gap-1.5">
        <span className="w-5 h-5 rounded-full bg-accent flex items-center justify-center">
          <span className="text-[9px] text-on-accent font-bold">1</span>
        </span>
        <span className="text-[11px] text-muted">Hoy</span>
      </div>
      {/* Seleccionado */}
      <div className="flex items-center gap-1.5">
        <span className="w-5 h-5 rounded-full ring-2 ring-accent" />
        <span className="text-[11px] text-muted">Seleccionado</span>
      </div>
      {/* Completado */}
      <div className="flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-accent inline-block" />
        <span className="text-[11px] text-muted">Completado</span>
      </div>
      {/* Planificado */}
      <div className="flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-accent opacity-60 inline-block" />
        <span className="text-[11px] text-muted">Planificado</span>
      </div>
      {/* Saltado */}
      <div className="flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-surface-2 inline-block border border-border" />
        <span className="text-[11px] text-muted">Saltado</span>
      </div>
      {/* Descanso */}
      <div className="flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-muted opacity-60 inline-block" />
        <span className="text-[11px] text-muted">Descanso</span>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────

export function MonthCalendar({
  year,
  month,
  selectedDay,
  slideDir,
  sessionsByDate,
  onPrevMonth,
  onNextMonth,
  onSelectDate,
  onGoToToday,
}: MonthCalendarProps) {
  const shouldReduce = useReducedMotion();
  const dragStartX = useRef(0);

  const now = new Date();
  const todayY = now.getFullYear();
  const todayM = now.getMonth();
  const todayD = now.getDate();
  const isCurrentMonth = year === todayY && month === todayM;

  const grid = buildGrid(year, month);

  // Month summary
  const allSessions = Object.values(sessionsByDate).flat();
  const completedCount = allSessions.filter((s) => s.status === "completed").length;

  const slideVariants = {
    enter: (dir: number) => ({
      x: shouldReduce ? 0 : dir > 0 ? "60%" : "-60%",
      opacity: 0,
    }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({
      x: shouldReduce ? 0 : dir > 0 ? "-30%" : "30%",
      opacity: 0,
    }),
  };

  return (
    <div className="select-none">
      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="flex items-center gap-1 px-3 pt-4 pb-2">
        <button
          onClick={onPrevMonth}
          className="w-11 h-11 flex items-center justify-center rounded-full text-muted active:bg-surface-2 transition-colors shrink-0"
          aria-label="Mes anterior"
        >
          <ChevronLeft size={22} />
        </button>

        <div className="flex-1 text-center">
          <p className="text-xl font-bold leading-tight">{MONTHS[month]}</p>
          <p className="text-xs text-muted">{year}</p>
        </div>

        <button
          onClick={onNextMonth}
          className="w-11 h-11 flex items-center justify-center rounded-full text-muted active:bg-surface-2 transition-colors shrink-0"
          aria-label="Mes siguiente"
        >
          <ChevronRight size={22} />
        </button>

        <button
          onClick={onGoToToday}
          disabled={isCurrentMonth}
          className="h-8 px-3 rounded-full bg-accent/15 text-accent text-xs font-semibold border border-accent/25 active:bg-accent/25 transition-colors disabled:opacity-30 shrink-0"
          aria-label="Ir a hoy"
        >
          Hoy
        </button>
      </div>

      {/* ── Weekday headers ────────────────────────────────────────── */}
      <div className="grid grid-cols-7 px-2 pb-1">
        {WEEKDAYS.map((d) => (
          <div key={d} className="text-center text-xs font-medium text-muted py-1.5">
            {d}
          </div>
        ))}
      </div>

      {/* ── Animated grid ──────────────────────────────────────────── */}
      <div className="overflow-hidden px-2">
        <AnimatePresence mode="wait" custom={slideDir} initial={false}>
          <motion.div
            key={`${year}-${month}`}
            custom={slideDir}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.22, ease: [0.32, 0, 0.67, 0] }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.07}
            dragMomentum={false}
            onDragStart={(_, info) => { dragStartX.current = info.point.x; }}
            onDragEnd={(_, info) => {
              if (info.offset.x < -55) onNextMonth();
              else if (info.offset.x > 55) onPrevMonth();
            }}
            className="grid grid-cols-7 gap-y-0.5 cursor-grab active:cursor-grabbing"
          >
            {grid.map((day, idx) => {
              if (day === null) return <div key={`e-${idx}`} />;

              const dateKey = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              const daySessions = sessionsByDate[dateKey] ?? [];
              const isToday = year === todayY && month === todayM && day === todayD;
              const isSelected = day === selectedDay;
              const isPast = new Date(year, month, day) < new Date(todayY, todayM, todayD);

              return (
                <DayCell
                  key={day}
                  day={day}
                  isToday={isToday}
                  isSelected={isSelected}
                  isPast={isPast}
                  sessions={daySessions}
                  onClick={() => onSelectDate(day)}
                />
              );
            })}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── Legend ─────────────────────────────────────────────────── */}
      <Legend />

      {/* ── Month summary ──────────────────────────────────────────── */}
      {allSessions.length > 0 && (
        <p className="px-4 pt-1 pb-2 text-xs text-muted">
          <span className="text-foreground font-semibold">{completedCount}</span>
          /{allSessions.length} entrenos completados este mes
        </p>
      )}
    </div>
  );
}
