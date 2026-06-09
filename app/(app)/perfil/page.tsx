import Link from "next/link";
import { ChevronRight, Ruler, Dumbbell } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { LogoutButton } from "@/components/auth/LogoutButton";

// ── Helpers ───────────────────────────────────────────────────────────────────

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

function formatVolume(vol: number): string {
  if (vol === 0) return "";
  if (vol >= 1000) return `${(vol / 1000).toFixed(1)}k kg`;
  return `${Math.round(vol)} kg`;
}

// ── Types ─────────────────────────────────────────────────────────────────────

type SetSlim = {
  weight_kg: number | null;
  reps: number | null;
  is_completed: boolean;
};

type SessionRow = {
  id: string;
  date: string;
  routine_days: { name: string; color: string } | null;
  set_logs: SetSlim[];
};

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function PerfilPage() {
  const supabase = createClient();

  const [{ data: userData }, { data: rawSessions }] = await Promise.all([
    supabase.auth.getUser(),
    supabase
      .from("workout_sessions")
      .select(
        "id, date, routine_days(name, color), set_logs(weight_kg, reps, is_completed)"
      )
      .not("completed_at", "is", null)
      .order("date", { ascending: false })
      .limit(100),
  ]);

  const user = userData?.user;
  const sessions = (rawSessions ?? []) as unknown as SessionRow[];

  // First letter of email for avatar
  const emailLetter = user?.email?.[0]?.toUpperCase() ?? "U";

  return (
    <div className="px-5 pt-2 pb-28">
      {/* Screen header */}
      <div className="py-4 pb-[18px]">
        <h1 className="font-display text-[30px] font-bold tracking-tight text-foreground leading-tight">
          Perfil
        </h1>
      </div>

      {/* Account card */}
      <div className="flex items-center gap-3.5 bg-surface border border-border rounded-2xl p-4 mb-3.5">
        <span className="w-12 h-12 rounded-xl bg-accent text-on-accent flex items-center justify-center font-display font-bold text-xl shrink-0">
          {emailLetter}
        </span>
        <div className="min-w-0 flex-1">
          <p
            className="text-[14.5px] font-bold text-foreground truncate"
            style={{ wordBreak: "break-all" }}
          >
            {user?.email}
          </p>
          <p className="text-[12.5px] text-foreground-2 mt-0.5">
            Cuenta activa
          </p>
        </div>
      </div>

      {/* Mediciones quick link */}
      <Link
        href="/mediciones"
        className="flex items-center gap-3.5 bg-surface border border-border rounded-2xl px-3.5 py-3.5 active:bg-surface-2 transition-colors mb-7"
      >
        <span className="w-[42px] h-[42px] rounded-xl bg-accent-soft text-accent-soft-ink flex items-center justify-center shrink-0">
          <Ruler size={20} />
        </span>
        <div className="flex flex-col gap-px flex-1 min-w-0">
          <span className="text-[14.5px] font-bold text-foreground">
            Mediciones corporales
          </span>
          <span className="text-[12.5px] text-foreground-2">
            Peso, perímetros y fotos
          </span>
        </div>
        <ChevronRight size={18} className="text-muted shrink-0" />
      </Link>

      {/* History header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[13px] font-bold tracking-[0.05em] uppercase text-muted">
          Historial
        </h3>
        {sessions.length > 0 && (
          <span className="text-[12.5px] text-muted font-semibold">
            {sessions.length} sesión{sessions.length === 1 ? "" : "es"}
          </span>
        )}
      </div>

      {/* History list */}
      {sessions.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-10 text-center">
          <Dumbbell size={32} className="text-muted opacity-40" />
          <p className="text-sm text-muted">
            Aquí aparecerán tus sesiones completadas.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {sessions.map((s) => {
            const completedSets = s.set_logs.filter((sl) => sl.is_completed);
            const setCount = completedSets.length;
            const volume = completedSets.reduce(
              (sum, sl) => sum + (sl.weight_kg ?? 0) * (sl.reps ?? 0),
              0
            );
            const volStr = formatVolume(volume);
            const color = s.routine_days?.color ?? "#71717a";

            return (
              <Link
                key={s.id}
                href={`/historial/${s.id}`}
                className="flex items-center gap-3 bg-surface border border-border rounded-2xl px-3.5 py-3.5 active:bg-surface-2 transition-colors"
              >
                {/* Color bar */}
                <span
                  className="w-1 self-stretch rounded-full shrink-0"
                  style={{ backgroundColor: color }}
                />

                {/* Name + date */}
                <div className="flex-1 min-w-0">
                  <p className="text-[14.5px] font-bold text-foreground leading-tight truncate">
                    {s.routine_days?.name ?? "Sesión libre"}
                  </p>
                  <p className="text-xs text-muted mt-0.5 capitalize">
                    {formatDate(s.date)}
                  </p>
                </div>

                {/* Volume + sets */}
                {(volStr || setCount > 0) && (
                  <div className="text-right shrink-0">
                    {volStr && (
                      <p className="font-display text-sm font-semibold text-foreground">
                        {volStr}
                      </p>
                    )}
                    {setCount > 0 && (
                      <p className="text-[11px] text-muted">
                        {setCount} serie{setCount !== 1 ? "s" : ""}
                      </p>
                    )}
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      )}

      {/* Logout */}
      <LogoutButton />
    </div>
  );
}
