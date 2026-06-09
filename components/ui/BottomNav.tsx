"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import {
  Calendar, TrendingUp, Plus, Dumbbell, LayoutGrid, User, ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { BottomSheet } from "./BottomSheet";

// ── Nav items ─────────────────────────────────────────────────────────────

const LEFT_NAV = [
  { href: "/calendario", label: "Calendario", Icon: Calendar },
  { href: "/progreso",   label: "Progreso",   Icon: TrendingUp },
] as const;

const RIGHT_NAV = [
  { href: "/entrenar", label: "Entrenar", Icon: Dumbbell },
  { href: "/perfil",   label: "Perfil",   Icon: User },
] as const;

// ── Shared nav item ───────────────────────────────────────────────────────

function NavItem({
  href,
  label,
  Icon,
  isActive,
}: {
  href: string;
  label: string;
  Icon: React.ElementType;
  isActive: boolean;
}) {
  return (
    <Link
      href={href}
      className="flex-1 flex flex-col items-center justify-center h-full relative touch-manipulation"
    >
      <motion.div
        whileTap={{ scale: 0.82 }}
        transition={{ duration: 0.1 }}
        className={cn(
          "flex flex-col items-center gap-0.5 px-2",
          isActive ? "text-accent" : "text-muted"
        )}
      >
        <Icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
        <span className="text-[10px] font-medium tracking-wide">{label}</span>
      </motion.div>

      {isActive && (
        <motion.div
          layoutId="nav-active"
          className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-0.5 bg-accent rounded-full"
          transition={{ type: "spring", damping: 25, stiffness: 400 }}
        />
      )}
    </Link>
  );
}

// ── FAB action row ────────────────────────────────────────────────────────

function FabAction({
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
      className="flex items-center gap-4 w-full px-4 py-4 bg-surface
                 rounded-2xl border border-border active:bg-surface-2
                 transition-colors text-left touch-manipulation"
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

// ── Main component ────────────────────────────────────────────────────────

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [fabOpen, setFabOpen] = useState(false);
  const shouldReduce = useReducedMotion();

  function handleAction(href: string) {
    setFabOpen(false);
    // Small delay so the sheet can animate out before navigating
    setTimeout(() => router.push(href), shouldReduce ? 0 : 200);
  }

  return (
    <>
      {/* ── Nav bar ──────────────────────────────────────────────── */}
      <nav
        className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px]
                   bg-surface border-t border-border z-30 safe-bottom"
      >
        <div className="flex items-stretch h-16">
          {/* Left items */}
          {LEFT_NAV.map(({ href, label, Icon }) => (
            <NavItem
              key={href}
              href={href}
              label={label}
              Icon={Icon}
              isActive={!!pathname?.startsWith(href)}
            />
          ))}

          {/* FAB center slot */}
          <div className="flex-1 flex items-center justify-center relative">
            <motion.button
              type="button"
              whileTap={{ scale: shouldReduce ? 1 : 0.88 }}
              transition={{ duration: 0.12 }}
              onClick={() => setFabOpen(true)}
              aria-label="Acciones rápidas"
              className="absolute -top-5 w-[52px] h-[52px] rounded-full
                         flex items-center justify-center
                         shadow-lg shadow-accent/35 z-40 touch-manipulation"
              style={{
                background:
                  "linear-gradient(160deg, var(--accent), var(--accent-strong))",
              }}
            >
              <motion.div
                animate={{ rotate: fabOpen ? 45 : 0 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
              >
                <Plus size={26} className="text-on-accent" strokeWidth={2.5} />
              </motion.div>
            </motion.button>
          </div>

          {/* Right items */}
          {RIGHT_NAV.map(({ href, label, Icon }) => (
            <NavItem
              key={href}
              href={href}
              label={label}
              Icon={Icon}
              isActive={!!pathname?.startsWith(href)}
            />
          ))}
        </div>
      </nav>

      {/* ── FAB sheet ────────────────────────────────────────────── */}
      <BottomSheet
        isOpen={fabOpen}
        onClose={() => setFabOpen(false)}
        title="Añadir"
      >
        <div className="px-4 pt-1 pb-4 flex flex-col gap-2.5">
          <FabAction
            icon={Dumbbell}
            title="Añadir ejercicio"
            subtitle="A tu biblioteca personal"
            onClick={() => handleAction("/ejercicios")}
          />
          <FabAction
            icon={LayoutGrid}
            title="Añadir día / rutina"
            subtitle="Nueva plantilla de entrenamiento"
            onClick={() => handleAction("/dias")}
          />
        </div>
      </BottomSheet>
    </>
  );
}
