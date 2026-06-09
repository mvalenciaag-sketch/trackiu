"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useReducedMotion } from "framer-motion";
import {
  Calendar, TrendingUp, Plus, Dumbbell, LayoutGrid, User, ChevronRight,
} from "lucide-react";
import { BottomSheet } from "./BottomSheet";

// ── Nav items ─────────────────────────────────────────────────────────────────

const LEFT_NAV = [
  { href: "/calendario", label: "Calendario", Icon: Calendar },
  { href: "/progreso",   label: "Progreso",   Icon: TrendingUp },
] as const;

const RIGHT_NAV = [
  { href: "/entrenar", label: "Entrenar", Icon: Dumbbell },
  { href: "/perfil",   label: "Perfil",   Icon: User },
] as const;

// ── Nav item ─────────────────────────────────────────────────────────────────

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
      className="flex-1 flex flex-col items-center justify-center gap-1 h-full touch-manipulation transition-colors"
      style={{ color: isActive ? "var(--accent)" : "var(--muted)" }}
    >
      <Icon size={22} strokeWidth={isActive ? 2.2 : 1.9} />
      <span className="text-[10.5px] font-semibold tracking-[0.01em]">{label}</span>
    </Link>
  );
}

// ── FAB action row ────────────────────────────────────────────────────────────

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
      className="flex items-center gap-3.5 w-full px-3.5 py-3.5 bg-surface border border-border
                 rounded-2xl active:bg-surface-2 transition-colors text-left touch-manipulation"
      style={{ boxShadow: "var(--shadow)" }}
    >
      <div className="w-[42px] h-[42px] rounded-xl bg-accent-soft flex items-center justify-center shrink-0">
        <Icon size={20} className="text-accent-soft-ink" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[14.5px] font-bold text-foreground leading-tight">{title}</p>
        <p className="text-[12.5px] text-foreground-2">{subtitle}</p>
      </div>
      <ChevronRight size={18} className="text-muted shrink-0" />
    </button>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [fabOpen, setFabOpen] = useState(false);
  const shouldReduce = useReducedMotion();

  function handleAction(href: string) {
    setFabOpen(false);
    setTimeout(() => router.push(href), shouldReduce ? 0 : 200);
  }

  return (
    <>
      {/* ── Nav bar ──────────────────────────────────────────────────── */}
      <nav
        className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] z-30"
        style={{
          background: "color-mix(in oklch, var(--surface), transparent 8%)",
          borderTop: "1px solid var(--border)",
          backdropFilter: "blur(14px)",
        }}
      >
        {/* 78px total height, 14px bottom padding (safe area) */}
        <div className="grid h-[78px] pb-3.5" style={{ gridTemplateColumns: "1fr 1fr 64px 1fr 1fr" }}>
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
          <div className="flex items-center justify-center">
            <button
              type="button"
              onClick={() => setFabOpen(true)}
              aria-label="Acciones rápidas"
              className="w-[58px] h-[58px] rounded-full flex items-center justify-center touch-manipulation"
              style={{
                background: "var(--accent)",
                transform: "translateY(-16px)",
                boxShadow: "0 10px 24px -6px oklch(0.64 0.17 40 / .55), 0 0 0 6px var(--background)",
              }}
            >
              <Plus
                size={26}
                strokeWidth={2.4}
                style={{
                  color: "var(--on-accent)",
                  transform: fabOpen ? "rotate(45deg)" : "rotate(0deg)",
                  transition: "transform 0.18s ease-out",
                }}
              />
            </button>
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

      {/* ── FAB sheet ────────────────────────────────────────────────── */}
      <BottomSheet
        isOpen={fabOpen}
        onClose={() => setFabOpen(false)}
        title="Añadir"
      >
        <div className="px-5 pt-1 pb-5 flex flex-col gap-2.5">
          <FabAction
            icon={Dumbbell}
            title="Añadir ejercicio"
            subtitle="A tu biblioteca personal"
            onClick={() => handleAction("/ejercicios")}
          />
          <FabAction
            icon={LayoutGrid}
            title="Añadir día / rutina"
            subtitle="Nueva plantilla de entreno"
            onClick={() => handleAction("/dias")}
          />
        </div>
      </BottomSheet>
    </>
  );
}
