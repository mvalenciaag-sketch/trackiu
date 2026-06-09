import Link from "next/link";
import { User, ChevronRight, Dumbbell, Clock, BarChart2, Ruler } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { LogoutButton } from "@/components/auth/LogoutButton";

// ── Helpers ────────────────────────────────────────────────────────────────

const MONTHS_SHORT = [
  "ene", "feb", "mar", "abr", "may", "jun",
  "jul", "ago", "sep", "oct", "nov", "dic",
];
const DAYS_SHORT = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dow = new Date(y, m - 1, d).getDay();
  return `${DAYS_SHORT[dow]} ${d} ${MONTHS_SHORT[m - 1]}`;
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
  if (vol === 0) return "";
  if (vol >= 1000) return `${(vol / 1000).toFixed(1)}k kg`;
  return `${Math.round(vol)} kg`;
}

// ── Types ──────────────────────────────────────────────────────────────────

type SetSlim = {
  weight_kg: number | null;
  reps: number | null;
  is_completed: boolean;
};

type SessionRow = {
  id: string;
  date: string;
  started_at: string | null;
  completed_at: string | null;
  routine_days: { name: string; color: string } | null;
  set_logs: SetSlim[];
};

// ── Page ───────────────────────────────────────────────────────────────────

export default async function PerfilPage() {
  const supabase = createClient();

  const [{ data: userData }, { data: rawSessions }] = await Promise.all([
    supabase.auth.getUser(),
    supabase
      .from("workout_sessions")
      .select(
        "id, date, started_at, completed_at, routine_days(name, color), set_logs(weight_kg, reps, is_completed)"
      )
      .not("completed_at", "is", null)
      .order("date", { ascending: false })
      .limit(100),
  ]);

  const user = userData?.user;
  const sessions = (rawSessions ?? []) as unknown as SessionRow[];

  return (
    <div className="px-4 pt-6 pb-24">
      <h1 className="text-xl font-bold mb-6">Perfil</h1>

      {/* User card */}
      <Card className="flex items-center gap-3 mb-10">
        <div className="w-10 h-10 rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center shrink-0">
          <User size={18} className="text-accent" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{user?.email}</p>
          <p className="text-xs text-muted">Cuenta activa</p>
        </div>
      </Card>

      {/* Quick links */}
      <div className="flex flex-col gap-2 mb-8">
        <Link
          href="/mediciones"
          className="flex items-center gap-3 bg-surface border border-border rounded-2xl px-4 py-3.5 active:bg-surface-2 transition-colors"
        >
          <Ruler size={16} className="text-accent shrink-0" />
          <span className="text-sm font-medium flex-1">Mediciones corporales</span>
          <ChevronRight size={15} className="text-muted" />
        </Link>
      </div>

      {/* History section */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-semibold">Historial</h2>
        {sessions.length > 0 && (
          <p className="text-xs text-muted">
            {sessions.length} sesión{sessions.length === 1 ? "" : "es"}
          </p>
        )}
      </div>

      {sessions.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-10 text-center">
          <BarChart2 size={32} className="text-muted opacity-40" />
          <p className="text-sm text-muted">
            Aquí aparecerán tus sesiones completadas.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {sessions.map((s) => {
            const completedSets = s.set_logs.filter((sl) => sl.is_completed);
            const setCount = completedSets.length;
            const volume = completedSets.reduce(
              (sum, sl) => sum + (sl.weight_kg ?? 0) * (sl.reps ?? 0),
              0
            );
            const duration = formatDuration(s.started_at, s.completed_at);
            const volStr = formatVolume(volume);

            return (
              <Link
                key={s.id}
                href={`/historial/${s.id}`}
                className="flex bg-surface border border-border rounded-2xl overflow-hidden active:bg-surface-2 transition-colors"
              >
                {/* Color stripe */}
                <div
                  className="w-1.5 shrink-0"
                  style={{
                    backgroundColor: s.routine_days?.color ?? "#71717a",
                  }}
                />

                <div className="flex-1 px-3.5 py-3 flex items-center gap-2 min-w-0">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      {!s.routine_days && (
                        <Dumbbell size={12} className="text-muted shrink-0" />
                      )}
                      <p className="text-sm font-semibold leading-tight truncate">
                        {s.routine_days?.name ?? "Sesión libre"}
                      </p>
                    </div>
                    <p className="text-xs text-muted mt-0.5 capitalize">
                      {formatDate(s.date)}
                    </p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      {setCount > 0 && (
                        <span className="text-xs text-muted">
                          {setCount} serie{setCount === 1 ? "" : "s"}
                        </span>
                      )}
                      {volStr && (
                        <span className="text-xs text-muted">· {volStr}</span>
                      )}
                      {duration && (
                        <span className="text-xs text-muted flex items-center gap-0.5">
                          · <Clock size={10} className="inline" /> {duration}
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-muted shrink-0" />
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Logout */}
      <div className="mt-10">
        <LogoutButton />
      </div>
    </div>
  );
}
