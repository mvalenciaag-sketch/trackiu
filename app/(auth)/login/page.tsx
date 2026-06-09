"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Dumbbell } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { GoogleButton } from "@/components/auth/GoogleButton";

function getErrorMessage(msg: string): string {
  if (
    msg.includes("Invalid login credentials") ||
    msg.includes("invalid_credentials")
  )
    return "Email o contraseña incorrectos";
  if (msg.includes("Email not confirmed"))
    return "Confirma tu email antes de iniciar sesión";
  if (msg.includes("Too many requests"))
    return "Demasiados intentos. Espera unos minutos.";
  return "Ha ocurrido un error. Inténtalo de nuevo.";
}

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  // Read ?error=oauth from URL without useSearchParams (avoids Suspense/SSR bailout)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("error") === "oauth") {
      setError("El inicio de sesión con Google falló. Inténtalo de nuevo.");
    }
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setError("");
    setLoading(true);

    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(getErrorMessage(authError.message));
      setLoading(false);
      return;
    }

    router.push("/calendario");
    router.refresh();
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
        <p className="text-muted text-sm mt-1">Inicia sesión para continuar</p>
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
          placeholder="••••••••"
          required
          autoComplete="current-password"
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
          Iniciar sesión
        </Button>
      </form>

      <p className="text-center text-sm text-muted mt-6">
        ¿No tienes cuenta?{" "}
        <Link
          href="/registro"
          className="text-accent font-medium hover:underline underline-offset-2"
        >
          Regístrate gratis
        </Link>
      </p>
    </motion.div>
  );
}
