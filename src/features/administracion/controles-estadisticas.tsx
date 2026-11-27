"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { useToast } from "@/lib/use-toast";

export function BotonActualizarEstadisticas({
  reintentar = false,
  variante = "boton",
}: {
  reintentar?: boolean;
  variante?: "boton" | "enlace";
}) {
  const router = useRouter();
  const [pendiente, iniciar] = useTransition();
  const toast = useToast();

  const ejecutar = () => {
    iniciar(() => {
      router.refresh();
      toast.exito("Estadísticas sincronizadas con éxito");
    });
  };

  if (variante === "enlace") {
    return (
      <button
        type="button"
        disabled={pendiente}
        onClick={ejecutar}
        className="w-fit text-xs font-semibold text-[#174238] underline hover:text-[#235c4e] disabled:opacity-50"
      >
        {pendiente ? "Sincronizando..." : reintentar ? "Reintentar" : "Actualizar"}
      </button>
    );
  }

  return (
    <button
      type="button"
      disabled={pendiente}
      onClick={ejecutar}
      className="inline-flex min-h-9 items-center gap-2 rounded-xl border border-[#d5e0d6] bg-white px-3 py-1.5 text-xs font-semibold text-[#174238] shadow-xs transition-colors hover:bg-[#edf4ed] disabled:opacity-50"
    >
      <svg
        viewBox="0 0 20 20"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        className={`size-3.5 shrink-0 ${pendiente ? "animate-spin" : ""}`}
        aria-hidden="true"
      >
        <path d="M10 3v2m0 10v2M4.93 4.93l1.41 1.41m7.32 7.32 1.41 1.41M3 10h2m10 0h2M4.93 15.07l1.41-1.41m7.32-7.32 1.41-1.41" />
      </svg>
      <span>{pendiente ? "Sincronizando..." : "Actualizar datos"}</span>
    </button>
  );
}

export function BotonCopiarResumenEstadisticas({
  destino,
  totalVisitas,
  totalResenas,
  promedio,
  periodoMeses,
}: {
  destino: string;
  totalVisitas: number;
  totalResenas: number;
  promedio: number | null;
  periodoMeses: string;
}) {
  const toast = useToast();

  const copiar = async () => {
    const calificacionTexto =
      promedio === null
        ? "Sin calificaciones"
        : `${promedio.toLocaleString("es-PE", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} / 5.0`;

    const texto = [
      `Resumen Ejecutivo · ${destino}`,
      `Período analizado: Últimos ${periodoMeses} meses`,
      `• Visitas verificadas (QR presencial): ${totalVisitas.toLocaleString("es-PE")}`,
      `• Reseñas recibidas: ${totalResenas.toLocaleString("es-PE")}`,
      `• Calificación promedio: ${calificacionTexto}`,
    ].join("\n");

    try {
      await navigator.clipboard.writeText(texto);
      toast.exito("Resumen de estadísticas copiado al portapapeles");
    } catch {
      toast.error("No se pudo copiar el resumen al portapapeles");
    }
  };

  return (
    <button
      type="button"
      onClick={copiar}
      className="inline-flex min-h-9 items-center gap-1.5 rounded-xl border border-[#d5e0d6] bg-white px-3 py-1.5 text-xs font-semibold text-[#174238] shadow-xs transition-colors hover:bg-[#edf4ed]"
      title="Copiar resumen al portapapeles"
    >
      <svg
        viewBox="0 0 20 20"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        className="size-3.5 shrink-0"
        aria-hidden="true"
      >
        <rect x="7" y="7" width="10" height="10" rx="2" />
        <path d="M5 13H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v1" />
      </svg>
      <span>Copiar resumen</span>
    </button>
  );
}

export function SelectorPeriodoRapido({
  mesesSeleccionados,
  slugDestino,
}: {
  mesesSeleccionados: string;
  slugDestino: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pendiente, iniciar] = useTransition();

  const opciones = [
    { valor: "3", etiqueta: "3 meses" },
    { valor: "6", etiqueta: "6 meses" },
    { valor: "12", etiqueta: "12 meses" },
  ];

  const seleccionar = (nuevoMes: string) => {
    if (nuevoMes === mesesSeleccionados) return;
    iniciar(() => {
      const params = new URLSearchParams(searchParams?.toString() ?? "");
      params.set("destino", slugDestino);
      params.set("meses", nuevoMes);
      params.delete("seccion");
      router.push(`/administracion/estadisticas?${params.toString()}`);
    });
  };

  return (
    <div className="flex items-center gap-1 rounded-xl border border-[#d5e0d6] bg-[#fbfcf8] p-1">
      {opciones.map((opc) => {
        const activo = opc.valor === mesesSeleccionados;
        return (
          <button
            key={opc.valor}
            type="button"
            disabled={pendiente}
            onClick={() => seleccionar(opc.valor)}
            className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
              activo
                ? "bg-[#174238] text-white shadow-xs"
                : "text-[#526a60] hover:bg-[#edf4ed] hover:text-[#174238]"
            } disabled:opacity-50`}
          >
            {opc.etiqueta}
          </button>
        );
      })}
    </div>
  );
}

export function BotonCopiarEnlaceQr({ slug }: { slug: string }) {
  const toast = useToast();

  const copiar = async () => {
    const url = new URL(
      `/pantalla-qr?destino=${encodeURIComponent(slug)}`,
      window.location.origin,
    ).href;
    try {
      await navigator.clipboard.writeText(url);
      toast.exito("Enlace de pantalla QR copiado para transmisión");
    } catch {
      toast.error("No se pudo copiar el enlace");
    }
  };

  return (
    <button
      type="button"
      onClick={copiar}
      className="inline-flex min-h-9 items-center gap-1.5 rounded-xl border border-[#174238] bg-[#174238] px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-[#23574a]"
    >
      <svg
        viewBox="0 0 20 20"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        className="size-3.5"
        aria-hidden="true"
      >
        <path d="M7 13l6-6M9 7h4v4" />
      </svg>
      <span>Transmitir pantalla QR</span>
    </button>
  );
}
