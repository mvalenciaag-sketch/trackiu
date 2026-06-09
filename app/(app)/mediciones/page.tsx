"use client";

import { useState, useEffect, useMemo } from "react";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { BodyMeasurement } from "@/lib/supabase/types";
import { formatShortDate } from "@/lib/utils/analytics";
import { Button } from "@/components/ui/Button";
import { BottomSheet } from "@/components/ui/BottomSheet";

type FormState = {
  date: string;
  weight_kg: string;
  body_fat_pct: string;
  notes: string;
};

const EMPTY_FORM: FormState = {
  date: new Date().toISOString().split("T")[0],
  weight_kg: "",
  body_fat_pct: "",
  notes: "",
};

export default function MedicionesPage() {
  const [records, setRecords] = useState<BodyMeasurement[]>([]);
  const [loading, setLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    supabase
      .from("body_measurements")
      .select("*")
      .order("date", { ascending: false })
      .then(({ data }) => {
        setRecords((data ?? []) as BodyMeasurement[]);
        setLoading(false);
      });
  }, [supabase]);

  function openAdd() {
    setForm({ ...EMPTY_FORM, date: new Date().toISOString().split("T")[0] });
    setSheetOpen(true);
  }

  async function handleSave() {
    const wkg = parseFloat(form.weight_kg);
    const bfp = form.body_fat_pct ? parseFloat(form.body_fat_pct) : null;
    if (!form.date) return;
    setSaving(true);

    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return;

    const { data } = await supabase
      .from("body_measurements")
      .insert({
        user_id: user.user.id,
        date: form.date,
        weight_kg: isNaN(wkg) ? null : wkg,
        body_fat_pct: bfp !== null && isNaN(bfp) ? null : bfp,
        notes: form.notes || null,
      })
      .select()
      .single();

    if (data) {
      setRecords((prev) =>
        [data as BodyMeasurement, ...prev].sort((a, b) =>
          b.date.localeCompare(a.date)
        )
      );
    }
    setSaving(false);
    setSheetOpen(false);
  }

  async function handleDelete(id: string) {
    setRecords((prev) => prev.filter((r) => r.id !== id));
    await supabase.from("body_measurements").delete().eq("id", id);
  }

  return (
    <div className="flex flex-col min-h-full pb-28">
      {/* Header */}
      <div className="px-4 pt-6 pb-4 flex items-center gap-3">
        <Link
          href="/perfil"
          className="w-9 h-9 flex items-center justify-center rounded-full bg-surface-2 text-muted shrink-0"
          aria-label="Volver"
        >
          <ArrowLeft size={17} />
        </Link>
        <h1 className="text-xl font-bold flex-1">Mediciones</h1>
        <button
          onClick={openAdd}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-accent text-white shrink-0"
          aria-label="Añadir medición"
        >
          <Plus size={17} />
        </button>
      </div>

      <div className="px-4">
        {loading ? (
          <div className="flex flex-col gap-2.5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-16 bg-surface rounded-2xl border border-border animate-pulse" />
            ))}
          </div>
        ) : records.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <p className="text-muted text-sm">Sin mediciones todavía.</p>
            <Button onClick={openAdd} className="gap-2">
              <Plus size={15} />
              Añadir primera medición
            </Button>
          </div>
        ) : (
          <div className="bg-surface border border-border rounded-2xl overflow-hidden divide-y divide-border/50">
            {records.map((r) => (
              <div key={r.id} className="flex items-center gap-3 px-4 py-3.5">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    {r.weight_kg != null && (
                      <span className="text-sm font-semibold tabular-nums">
                        {r.weight_kg} kg
                      </span>
                    )}
                    {r.body_fat_pct != null && (
                      <span className="text-xs text-muted">
                        {r.body_fat_pct}% grasa
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted mt-0.5 capitalize">
                    {formatShortDate(r.date)}
                    {r.notes && ` · ${r.notes}`}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(r.id)}
                  className="w-8 h-8 flex items-center justify-center rounded-full text-muted active:bg-surface-2"
                  aria-label="Eliminar"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add sheet */}
      <BottomSheet isOpen={sheetOpen} onClose={() => setSheetOpen(false)} title="Añadir medición">
        <div className="px-4 pt-2 pb-10 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-muted font-medium">Fecha</label>
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
              className="w-full rounded-xl bg-surface-2 border border-border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
          <div className="flex gap-3">
            <div className="flex-1 flex flex-col gap-1.5">
              <label className="text-xs text-muted font-medium">Peso (kg)</label>
              <input
                type="number"
                inputMode="decimal"
                placeholder="70.5"
                value={form.weight_kg}
                onChange={(e) => setForm((f) => ({ ...f, weight_kg: e.target.value }))}
                className="w-full rounded-xl bg-surface-2 border border-border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
            <div className="flex-1 flex flex-col gap-1.5">
              <label className="text-xs text-muted font-medium">Grasa (%)</label>
              <input
                type="number"
                inputMode="decimal"
                placeholder="15.0"
                value={form.body_fat_pct}
                onChange={(e) => setForm((f) => ({ ...f, body_fat_pct: e.target.value }))}
                className="w-full rounded-xl bg-surface-2 border border-border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-muted font-medium">Notas (opcional)</label>
            <input
              type="text"
              placeholder="En ayunas, por la mañana…"
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              className="w-full rounded-xl bg-surface-2 border border-border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
          <Button fullWidth loading={saving} onClick={handleSave} className="h-12">
            Guardar medición
          </Button>
        </div>
      </BottomSheet>
    </div>
  );
}
