"use client";

import { WifiOff, RefreshCw } from "lucide-react";

interface OfflineBannerProps {
  pendingCount?: number;
  isSyncing?: boolean;
}

export function OfflineBanner({ pendingCount = 0, isSyncing = false }: OfflineBannerProps) {
  return (
    <div className="mx-4 mb-3 rounded-xl bg-amber-500/15 border border-amber-500/30 px-3 py-2.5 flex items-center gap-2.5">
      {isSyncing ? (
        <RefreshCw size={14} className="text-amber-400 shrink-0 animate-spin" />
      ) : (
        <WifiOff size={14} className="text-amber-400 shrink-0" />
      )}
      <p className="text-xs text-amber-300 leading-tight">
        {isSyncing
          ? "Sincronizando series pendientes…"
          : pendingCount > 0
          ? `Sin conexión · ${pendingCount} serie${pendingCount === 1 ? "" : "s"} pendiente${pendingCount === 1 ? "" : "s"}`
          : "Sin conexión · Las series se guardan localmente"}
      </p>
    </div>
  );
}
