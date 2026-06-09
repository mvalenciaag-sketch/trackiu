"use client";

import { useState } from "react";
import { LogOut } from "lucide-react";

export function LogoutButton() {
  const [loading, setLoading] = useState(false);

  function handleLogout() {
    setLoading(true);
    // Server-side route clears the session cookie and redirects to /login
    window.location.href = "/auth/signout";
  }

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      className="flex items-center justify-center gap-2 w-full mt-5 bg-transparent font-bold text-sm rounded-[14px] py-[13px] px-4 transition-opacity disabled:opacity-60"
      style={{
        border:
          "1px solid color-mix(in oklch, oklch(0.6 0.2 25), transparent 60%)",
        color: "oklch(0.72 0.16 25)",
      }}
    >
      {loading ? (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : (
        <LogOut size={18} />
      )}
      Cerrar sesión
    </button>
  );
}
