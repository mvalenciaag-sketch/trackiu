"use client";

import { Settings, Flame } from "lucide-react";

// Wordmark: "Track" in white, "IU" in lighter orange (design token)
function Logo() {
  return (
    <span
      className="font-display font-extrabold text-[23px] tracking-[-0.035em] leading-none select-none text-white"
    >
      Track<span style={{ color: "#f0a96e" }}>IU</span>
    </span>
  );
}

export function AppHeader() {
  return (
    <header
      className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] z-40
                 bg-background/90 backdrop-blur-md border-b border-border/50"
    >
      <div className="flex items-center justify-between h-14 px-4">
        {/* Wordmark */}
        <Logo />

        {/* Right cluster */}
        <div className="flex items-center gap-1">
          {/* PRO badge — visual placeholder, logic TBD */}
          <span
            className="h-6 px-2.5 rounded-full border border-accent/40 bg-accent/10
                       text-accent text-[10px] font-bold tracking-wider
                       flex items-center select-none"
          >
            PRO
          </span>

          {/* Streak — placeholder value 0; logic TBD */}
          <div className="flex items-center gap-0.5 h-9 px-2 rounded-full select-none">
            <Flame size={16} className="text-accent" fill="var(--accent)" />
            <span className="text-sm font-bold tabular-nums">0</span>
          </div>

          {/* Settings — placeholder action for now */}
          <button
            type="button"
            className="w-9 h-9 flex items-center justify-center rounded-full
                       text-muted active:bg-surface-2 transition-colors touch-manipulation"
            aria-label="Ajustes"
          >
            <Settings size={20} strokeWidth={1.8} />
          </button>
        </div>
      </div>
    </header>
  );
}
