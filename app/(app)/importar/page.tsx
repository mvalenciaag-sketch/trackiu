"use client";

import { useState, useMemo } from "react";
import { ArrowLeft, Download, CheckCircle, AlertCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { decodeRoutine, type SharedRoutine } from "@/lib/utils/shareRoutine";
import { Button } from "@/components/ui/Button";

type Step = "input" | "preview" | "done";

export default function ImportarPage() {
  const [step, setStep] = useState<Step>("input");
  const [code, setCode] = useState("");
  const [decoded, setDecoded] = useState<SharedRoutine | null>(null);
  const [error, setError] = useState("");
  const [importing, setImporting] = useState(false);

  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  function handleDecode() {
    setError("");
    try {
      const data = decodeRoutine(code);
      setDecoded(data);
      setStep("preview");
    } catch {
      setError("El código no es válido. Comprueba que lo has pegado completo.");
    }
  }

  async function handleImport() {
    if (!decoded) return;
    setImporting(true);

    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id;
    if (!userId) return;

    // 1. Fetch user's exercises to match by name
    const { data: existingExercises } = await supabase
      .from("exercises")
      .select("id, name")
      .eq("user_id", userId);

    const exerciseMap = new Map(
      (existingExercises ?? []).map((e) => [e.name.toLowerCase(), e.id])
    );

    // 2. Create missing exercises
    const exerciseIds: string[] = [];
    for (const ex of decoded.exercises) {
      const existing = exerciseMap.get(ex.name.toLowerCase());
      if (existing) {
        exerciseIds.push(existing);
      } else {
        const { data: newEx } = await supabase
          .from("exercises")
          .insert({
            user_id: userId,
            name: ex.name,
            role: ex.role,
            mechanics: ex.mechanics,
            equipment: ex.equipment,
            notes: ex.notes,
          })
          .select("id")
          .single();
        if (newEx) exerciseIds.push(newEx.id);
      }
    }

    // 3. Create routine_day
    const maxPos =
      (
        await supabase
          .from("routine_days")
          .select("position")
          .eq("user_id", userId)
          .order("position", { ascending: false })
          .limit(1)
          .single()
      ).data?.position ?? 0;

    const { data: newDay } = await supabase
      .from("routine_days")
      .insert({
        user_id: userId,
        name: decoded.name,
        description: decoded.description,
        color: decoded.color,
        position: maxPos + 1,
      })
      .select("id")
      .single();

    if (!newDay) {
      setError("Error al crear el día. Intenta de nuevo.");
      setImporting(false);
      return;
    }

    // 4. Create routine_day_exercises
    await supabase.from("routine_day_exercises").insert(
      decoded.exercises.map((ex, i) => ({
        routine_day_id: newDay.id,
        exercise_id: exerciseIds[i],
        position: i,
        target_sets: ex.target_sets,
        notes: ex.notes,
        superset_group: ex.superset_group,
      }))
    );

    setStep("done");
    setImporting(false);
    setTimeout(() => router.push(`/dias/${newDay.id}`), 1500);
  }

  return (
    <div className="flex flex-col min-h-full pb-28">
      {/* Header */}
      <div className="px-4 pt-6 pb-4 flex items-center gap-3">
        <Link
          href="/dias"
          className="w-9 h-9 flex items-center justify-center rounded-full bg-surface-2 text-muted shrink-0"
          aria-label="Volver"
        >
          <ArrowLeft size={17} />
        </Link>
        <h1 className="text-xl font-bold flex-1">Importar día</h1>
      </div>

      <div className="px-4 flex flex-col gap-4">
        {step === "done" ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <CheckCircle size={40} className="text-green-500" />
            <p className="font-semibold">¡Día importado!</p>
            <p className="text-sm text-muted">Redirigiendo…</p>
          </div>
        ) : step === "input" ? (
          <>
            <p className="text-sm text-muted">
              Pega aquí el código compartido por otra persona para importar su día de entrenamiento.
            </p>
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Pega el código aquí…"
              rows={5}
              className="w-full rounded-xl bg-surface-2 border border-border px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-accent resize-none"
            />
            {error && (
              <div className="flex items-center gap-2 text-xs text-red-400">
                <AlertCircle size={13} />
                {error}
              </div>
            )}
            <Button fullWidth onClick={handleDecode} disabled={!code.trim()} className="h-12">
              <Download size={15} className="mr-2" />
              Previsualizar
            </Button>
          </>
        ) : decoded ? (
          <>
            <div className="bg-surface border border-border rounded-2xl p-4 flex flex-col gap-3">
              <div className="flex items-center gap-2">
                {decoded.color && (
                  <span
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: decoded.color }}
                  />
                )}
                <p className="font-semibold">{decoded.name}</p>
              </div>
              {decoded.description && (
                <p className="text-sm text-muted">{decoded.description}</p>
              )}
              <div className="flex flex-col gap-1.5">
                {decoded.exercises.map((ex, i) => (
                  <div key={i} className="flex items-center gap-2">
                    {ex.superset_group != null && (
                      <span className="w-4 h-4 rounded bg-accent/20 text-accent text-[10px] flex items-center justify-center font-bold shrink-0">
                        S
                      </span>
                    )}
                    <p className="text-sm">{ex.name}</p>
                    <p className="text-xs text-muted ml-auto shrink-0">
                      {ex.target_sets ?? 3} series
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-xs text-red-400">
                <AlertCircle size={13} />
                {error}
              </div>
            )}

            <div className="flex gap-2">
              <Button variant="secondary" fullWidth onClick={() => { setStep("input"); setError(""); }}>
                Cancelar
              </Button>
              <Button fullWidth loading={importing} onClick={handleImport} className="gap-2">
                <Download size={15} />
                Importar
              </Button>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
