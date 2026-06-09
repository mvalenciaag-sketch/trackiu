"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Dumbbell } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function OnboardingPage() {
  const [name, setName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const supabase = createClient();

  // Pre-fill with the name Google already gave us
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.replace("/login");
        return;
      }
      const googleName =
        (user.user_metadata?.full_name as string | undefined) ??
        (user.user_metadata?.name as string | undefined) ??
        "";
      setName(googleName);
      setAvatarUrl(
        (user.user_metadata?.avatar_url as string | undefined) ?? null
      );
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (loading || !trimmed) return;
    setLoading(true);
    setError("");

    const { error: updateError } = await supabase.auth.updateUser({
      data: { username: trimmed },
    });

    if (updateError) {
      setError("No se pudo guardar el nombre. Inténtalo de nuevo.");
      setLoading(false);
      return;
    }

    router.push("/calendario");
    router.refresh();
  }

  return (
    <div className="min-h-dvh bg-frame flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22 }}
        className="w-full max-w-sm"
      >
        {/* Avatar / Brand */}
        <div className="text-center mb-8">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarUrl}
              alt="Foto de Google"
              referrerPolicy="no-referrer"
              className="w-16 h-16 rounded-2xl mx-auto mb-4 object-cover"
            />
          ) : (
            <div className="w-16 h-16 bg-accent rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg shadow-accent/25">
              <Dumbbell size={28} className="text-white" strokeWidth={2} />
            </div>
          )}
          <h1 className="text-2xl font-bold tracking-tight">
            ¡Bienvenido a TrackIU!
          </h1>
          <p className="text-muted text-sm mt-1">
            ¿Cómo quieres que te llamemos?
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Tu nombre"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej. Marcos"
            required
            autoFocus
            autoComplete="name"
            autoCapitalize="words"
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
            disabled={!name.trim()}
            fullWidth
            className="mt-1 h-12 text-base font-semibold"
          >
            Empezar a entrenar
          </Button>
        </form>

        <p className="text-center text-xs text-muted mt-6">
          Podrás cambiar tu nombre más adelante desde el perfil.
        </p>
      </motion.div>
    </div>
  );
}
