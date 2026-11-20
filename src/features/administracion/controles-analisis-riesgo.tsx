"use client";
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { reintentarAnalisisRiesgo } from "./acciones-analisis-riesgo";
export function SincronizarAnalisis({ habilitado }: { habilitado: boolean }) {
  const router = useRouter();
  useEffect(() => {
    if (!habilitado) return;
    const reloj = setInterval(() => { if (document.visibilityState === "visible") router.refresh(); }, 20000);
    return () => clearInterval(reloj);
  }, [habilitado, router]);
  return null;
}
export function ReintentarAnalisis({ id }: { id: string }) {
  const [mensaje, cambiarMensaje] = useState("");
  const [pendiente, iniciar] = useTransition();
  const router = useRouter();
  return <div className="space-y-2"><button type="button" disabled={pendiente} onClick={() => iniciar(async () => { try { const resultado = await reintentarAnalisisRiesgo(id); if (resultado.ok) { cambiarMensaje("Análisis añadido a la cola. La decisión humana no se modifica."); router.refresh(); } else cambiarMensaje(resultado.mensaje); } catch { cambiarMensaje("No pudimos solicitar el reintento. Actualiza y vuelve a intentarlo."); } })} className="min-h-11 rounded-xl border border-[#c7d7cb] px-4 text-sm font-semibold hover:bg-[#edf4ed] disabled:opacity-60">{pendiente ? "Solicitando…" : "Reintentar análisis"}</button>{mensaje && <p role="status" className="text-sm text-[#526a60]">{mensaje}</p>}</div>;
}
