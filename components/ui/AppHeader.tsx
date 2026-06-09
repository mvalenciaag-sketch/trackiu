"use client";

import { Settings, Flame } from "lucide-react";

function Logo() {
  return (
    <span className="font-sans font-extrabold text-[23px] tracking-[-0.035em] leading-none select-none text-foreground">
      Track<span style={{ color: "oklch(0.76 0.14 40)" }}>IU</span>
    </span>
  );
}

export function AppHeader() {
  return (
    <header
      className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] z-40"
      style={{
        background: "color-mix(in oklch, var(--surface), transparent 8%)",
        backdropFilter: "blur(14px)",
      }}
    >
      <div className="flex items-center justify-between px-5 pt-1.5 pb-3">
        <Logo />

        <div className="flex items-center gap-2">
          {/* PRO badge — transparent bg, border only (matches design's .pill-pro) */}
          <span
            className="font-display text-[11px] font-semibold tracking-[0.08em] text-accent px-[9px] py-[3px] rounded-full select-none"
            style={{ border: "1.4px solid var(--accent)" }}
          >
            PRO
          </span>

          {/* Streak */}
          <span className="inline-flex items-center gap-1 font-bold text-sm text-foreground-2 select-none px-1">
            <Flame size={16} className="text-accent" />
            0
          </span>

          {/* Settings */}
          <button
            type="button"
            className="w-9 h-9 flex items-center justify-center rounded-full text-foreground-2 active:bg-surface-2 transition-colors touch-manipulation"
            aria-label="Ajustes"
          >
            <Settings size={19} strokeWidth={1.8} />
          </button>
        </div>
      </div>
    </header>
  );
}
