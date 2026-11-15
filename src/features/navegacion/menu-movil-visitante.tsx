"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const enlaces = [
  ["/destinos", "Destinos"],
  ["/resenas", "Reseñas"],
  ["/verificar-visita", "Verificar QR"],
  ["/mi-perfil", "Perfil"],
] as const;

export function MenuMovilVisitante() {
  const ruta = usePathname();

  return (
    <nav
      data-menu-visitante
      aria-label="Navegación del visitante"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-teal-900/15 bg-[#f8f4ea] pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_20px_#173b3212] md:hidden"
    >
      <ul className="mx-auto grid max-w-lg grid-cols-4 gap-1 px-2 py-1">
        {enlaces.map(([href, etiqueta]) => (
          <li key={href}>
            <Link
              href={href}
              aria-current={ruta === href ? "page" : undefined}
              className="flex min-h-11 items-center justify-center rounded-xl px-1 text-center text-xs font-semibold text-teal-950 hover:bg-teal-50 aria-[current=page]:bg-teal-900 aria-[current=page]:text-white"
            >
              {etiqueta}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
