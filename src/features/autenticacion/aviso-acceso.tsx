import Link from "next/link";
import { enlaceAcceso } from "./estilos-acceso";

type TipoAviso = "informacion" | "exito" | "error";

export type DatosAviso = {
  mensaje: string;
  tipo: TipoAviso;
  reenviar?: boolean;
};

const estado = {
  informacion: {
    clase: "border-stone-300 bg-[#f5f4ed] text-[#30473d]",
    simbolo: "i",
  },
  exito: {
    clase: "border-emerald-200 bg-emerald-50 text-emerald-950",
    simbolo: "✓",
  },
  error: { clase: "border-rose-200 bg-rose-50 text-rose-950", simbolo: "!" },
};

export function AvisoAcceso({ mensaje, tipo, reenviar }: DatosAviso) {
  const { clase, simbolo } = estado[tipo];
  return (
    <div
      role={tipo === "error" ? "alert" : "status"}
      className={`flex items-start gap-3 rounded-xl border p-3.5 text-sm leading-relaxed ${clase}`}
    >
      <span
        aria-hidden="true"
        className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border border-current text-xs font-bold"
      >
        {simbolo}
      </span>
      <div className="min-w-0 space-y-1">
        <p>{mensaje}</p>
        {reenviar && (
          <Link
            className={`${enlaceAcceso} inline-block`}
            href="/autenticacion/reenviar"
          >
            Reenviar correo de confirmación
          </Link>
        )}
      </div>
    </div>
  );
}

export function EsqueletoAcceso() {
  return (
    <div role="status" className="space-y-4 motion-safe:animate-pulse">
      <span className="sr-only">Cargando formulario</span>
      <div className="h-9 w-2/3 rounded-lg bg-stone-200" />
      <div className="h-4 w-4/5 rounded-lg bg-stone-100" />
      <div className="h-12 rounded-xl bg-stone-100" />
      <div className="h-12 rounded-xl bg-stone-100" />
    </div>
  );
}
