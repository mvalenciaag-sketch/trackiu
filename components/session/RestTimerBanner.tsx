"use client";

import { useEffect } from "react";
import { X, Timer } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRestTimer } from "@/stores/restTimer";

export function RestTimerBanner() {
  const { seconds, total, active, tick, stop } = useRestTimer();

  useEffect(() => {
    if (!active) return;
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [active, tick]);

  const pct = total > 0 ? seconds / total : 0;
  const color =
    pct > 0.5 ? "#22c55e" : pct > 0.25 ? "#f59e0b" : "#ef4444";

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const label = `${mins}:${secs.toString().padStart(2, "0")}`;

  return (
    <AnimatePresence>
      {active && (
        <motion.div
          key="rest-timer"
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: "spring", damping: 22, stiffness: 320 }}
          className="fixed bottom-20 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-[calc(480px-2rem)] z-50"
        >
          <div className="rounded-2xl bg-surface border border-border shadow-xl px-4 py-3 flex items-center gap-3">
            <Timer size={16} style={{ color }} className="shrink-0" />
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-xs text-muted">Descanso</p>
                <p
                  className="text-xl font-bold tabular-nums"
                  style={{ color }}
                >
                  {label}
                </p>
              </div>
              <div className="h-1.5 bg-surface-2 rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ backgroundColor: color }}
                  animate={{ width: `${pct * 100}%` }}
                  transition={{ duration: 1, ease: "linear" }}
                />
              </div>
            </div>
            <button
              onClick={stop}
              className="w-8 h-8 flex items-center justify-center rounded-full text-muted active:bg-surface-2 shrink-0"
              aria-label="Cancelar descanso"
            >
              <X size={15} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
