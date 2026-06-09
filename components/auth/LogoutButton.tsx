"use client";

import { useState } from "react";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function LogoutButton() {
  const [loading, setLoading] = useState(false);

  function handleLogout() {
    setLoading(true);
    // Server-side route clears the session cookie and redirects to /login
    window.location.href = "/auth/signout";
  }

  return (
    <Button
      variant="danger"
      onClick={handleLogout}
      loading={loading}
      className="gap-2"
    >
      <LogOut size={16} />
      Cerrar sesión
    </Button>
  );
}
