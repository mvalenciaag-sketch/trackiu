"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { RoutineDay, ScheduledSession } from "@/lib/supabase/types";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { MonthCalendar } from "@/components/calendar/MonthCalendar";
import { DaySheet } from "@/components/calendar/DaySheet";

type SessionWithDay = ScheduledSession & { routine_days: RoutineDay | null };

export default function CalendarioPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [slideDir, setSlideDir] = useState<1 | -1>(1);
  const [sessions, setSessions] = useState<SessionWithDay[]>([]);
  const [routineDays, setRoutineDays] = useState<RoutineDay[]>([]);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const supabase = useMemo(() => createClient(), []);

  const fetchSessions = useCallback(async () => {
    const pad = (n: number) => String(n).padStart(2, "0");
    const start = `${year}-${pad(month + 1)}-01`;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const end = `${year}-${pad(month + 1)}-${pad(daysInMonth)}`;

    const { data } = await supabase
      .from("scheduled_sessions")
      .select("*, routine_days(*)")
      .gte("date", start)
      .lte("date", end)
      .order("created_at");

    if (data) setSessions(data as SessionWithDay[]);
  }, [supabase, year, month]);

  const fetchRoutineDays = useCallback(async () => {
    const { data } = await supabase
      .from("routine_days")
      .select("*")
      .order("position")
      .order("created_at");
    if (data) setRoutineDays(data);
  }, [supabase]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  useEffect(() => {
    fetchRoutineDays();
  }, [fetchRoutineDays]);

  const sessionsByDate = useMemo(() => {
    const map: Record<string, SessionWithDay[]> = {};
    for (const s of sessions) {
      if (!map[s.date]) map[s.date] = [];
      map[s.date].push(s);
    }
    return map;
  }, [sessions]);

  function prevMonth() {
    setSlideDir(-1);
    if (month === 0) {
      setMonth(11);
      setYear((y) => y - 1);
    } else {
      setMonth((m) => m - 1);
    }
  }

  function nextMonth() {
    setSlideDir(1);
    if (month === 11) {
      setMonth(0);
      setYear((y) => y + 1);
    } else {
      setMonth((m) => m + 1);
    }
  }

  function goToToday() {
    const today = new Date();
    setSlideDir(
      new Date(year, month) > new Date(today.getFullYear(), today.getMonth())
        ? -1
        : 1
    );
    setYear(today.getFullYear());
    setMonth(today.getMonth());
    setSelectedDay(today.getDate());
  }

  const selectedSessions = useMemo(() => {
    if (selectedDay === null) return [];
    const pad = (n: number) => String(n).padStart(2, "0");
    const key = `${year}-${pad(month + 1)}-${pad(selectedDay)}`;
    return sessionsByDate[key] ?? [];
  }, [selectedDay, sessionsByDate, year, month]);

  function handleSessionAdded(s: SessionWithDay) {
    setSessions((prev) => [...prev, s]);
  }

  function handleSessionRemoved(id: string) {
    setSessions((prev) => prev.filter((s) => s.id !== id));
  }

  function handleSessionUpdated(updated: ScheduledSession) {
    setSessions((prev) =>
      prev.map((s) =>
        s.id === updated.id ? { ...s, ...updated } : s
      )
    );
  }

  return (
    <div className="flex flex-col min-h-full">
      <div className="px-4 pt-6 pb-2">
        <h1 className="text-xl font-bold">Calendario</h1>
      </div>

      <MonthCalendar
        year={year}
        month={month}
        selectedDay={selectedDay}
        slideDir={slideDir}
        sessionsByDate={sessionsByDate}
        onPrevMonth={prevMonth}
        onNextMonth={nextMonth}
        onSelectDate={setSelectedDay}
        onGoToToday={goToToday}
      />

      <BottomSheet
        isOpen={selectedDay !== null}
        onClose={() => setSelectedDay(null)}
      >
        {selectedDay !== null && (
          <DaySheet
            key={`${year}-${month}-${selectedDay}`}
            year={year}
            month={month}
            day={selectedDay}
            sessions={selectedSessions}
            routineDays={routineDays}
            onClose={() => setSelectedDay(null)}
            onSessionAdded={handleSessionAdded}
            onSessionRemoved={handleSessionRemoved}
            onSessionUpdated={handleSessionUpdated}
          />
        )}
      </BottomSheet>
    </div>
  );
}
