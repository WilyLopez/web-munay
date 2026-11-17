"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

const enlaces = [
  ["/administracion/estadisticas", "Estadísticas"],
  ["/administracion", "Atractivos"],
  ["/administracion/visitas", "Mi QR"],
  ["/administracion/resenas", "Reseñas"],
] as const;

export function MenuMovilEncargado() {
  const ruta = usePathname();
  const actual = useSearchParams();
  const parametros = new URLSearchParams();
  const destino = actual.get("destino");
  const meses = actual.get("meses");
  if (destino) parametros.set("destino", destino);
  if (meses) parametros.set("meses", meses);
  const seccion =
    ruta === "/administracion/estadisticas" && actual.get("seccion") === "qr"
      ? "/administracion/visitas"
      : ruta.startsWith("/administracion/atractivos/")
        ? "/administracion"
        : ruta;

  return (
    <nav
      aria-label="Panel del encargado"
      className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t border-teal-900/15 bg-[#f8f5ea] px-2 pt-1 pb-[calc(0.35rem+env(safe-area-inset-bottom))] text-center text-xs font-semibold md:hidden"
    >
      {enlaces.map(([href, etiqueta]) => (
        <Link
          key={href}
          href={parametros.size ? `${href}?${parametros}` : href}
          aria-current={seccion === href ? "page" : undefined}
          className="grid min-h-12 place-items-center rounded-lg px-1 text-teal-950 hover:bg-teal-50 focus-visible:outline-2 focus-visible:outline-teal-950 aria-[current=page]:bg-teal-100 active:scale-95 transition-transform"
        >
          {etiqueta}
        </Link>
      ))}
    </nav>
  );
}
