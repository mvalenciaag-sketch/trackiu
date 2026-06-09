"use client";

// NOTE: Email confirmation is DISABLED in Supabase (dev mode).
// signUp() now returns a session immediately → redirect straight to app.
// To re-enable confirmation:
//   1. Toggle "Confirm email" back on in Supabase → Authentication → Providers → Email.
//   2. Restore the `success` state + "revisa tu correo" UI (see git history).

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Dumbbell } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { GoogleButton } from "@/components/auth/GoogleButton";

function getErrorMessage(msg: string): string {
  if (msg.includes("User already registered") || msg.includes("already registered"))
    return "Este email ya está registrado";
  if (msg.includes("Password should be") || msg.includes("password"))
    return "La contraseña debe tener al menos 6 caracteres";
  if (msg.includes("Invalid email") || msg.includes("valid email"))
    return "Introduce un email válido";
  if (
    msg.includes("Too many requests") ||
    msg.includes("over_email_send_rate_limit") ||
    msg.includes("rate limit") ||
    msg.includes("429")
  )
    return "Demasiados intentos de registro. Espera unos minutos e inténtalo de nuevo.";
  return `Ha ocurrido un error: ${msg}`;   // muestra el error real en dev
}

export default function RegistroPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setError("");
    setLoading(true);

    const { data, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      setError(getErrorMessage(authError.message));
      setLoading(false);
      return;
    }

    if (data.session) {
      // Confirmation disabled → session returned immediately
      router.push("/calendario");
      router.refresh();
      return;
    }

    // Fallback: if confirmation gets re-enabled, signUp returns no session.
    // In that case show a generic message instead of crashing.
    setError("Revisa tu correo para confirmar la cuenta antes de entrar.");
    setLoading(false);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22 }}
      className="w-full max-w-sm"
    >
      {/* Brand */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-accent rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg shadow-accent/25">
          <Dumbbell size={28} className="text-white" strokeWidth={2} />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">TrackIU</h1>
        <p className="text-muted text-sm mt-1">Crea tu cuenta para empezar</p>
      </div>

      {/* Google OAuth */}
      <GoogleButton className="mb-5" />

      {/* Divider */}
      <div className="flex items-center gap-3 mb-5">
        <div className="flex-1 h-px bg-border" />
        <span className="text-xs text-muted">o con email</span>
        <div className="flex-1 h-px bg-border" />
      </div>

      {/* Email / password form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="tu@email.com"
          required
          autoComplete="email"
          autoCapitalize="none"
        />
        <Input
          label="Contraseña"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Mínimo 6 caracteres"
          required
          autoComplete="new-password"
          hint="Mínimo 6 caracteres"
        />

        {error && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-sm text-red-400 text-center"
          >
            {error}
          </motion.p>
        )}

        <Button
          type="submit"
          loading={loading}
          fullWidth
          className="mt-1 h-12 text-base font-semibold"
        >
          Crear cuenta
        </Button>
      </form>

      <p className="text-center text-sm text-muted mt-6">
        ¿Ya tienes cuenta?{" "}
        <Link
          href="/login"
          className="text-accent font-medium hover:underline underline-offset-2"
        >
          Inicia sesión
        </Link>
      </p>
    </motion.div>
  );
}
