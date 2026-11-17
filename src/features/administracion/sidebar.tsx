"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

const enlacesOperacion = [
  ["/administracion/estadisticas", "Estadísticas"],
  ["/administracion/visitas", "QR de visitas"],
  ["/administracion/resenas", "Reseñas"],
];

export function Sidebar({ global }: { global: boolean }) {
  const ruta = usePathname();
  const enlaces = global
    ? [
        ["/superadmin", "Dashboard"],
        ["/superadmin/usuarios", "Usuarios"],
        ["/superadmin/accesos", "Accesos de encargados"],
        ["/superadmin/destinos", "Revisión de destinos"],
        ["/superadmin/reportes", "Reportes"],
        ["/superadmin/blockchain", "Registros blockchain"],
        ...enlacesOperacion,
      ]
    : [["/administracion", "Mis atractivos"], ...enlacesOperacion];

  return (
    <aside className="flex flex-col gap-5 bg-[#11342c] px-5 py-4 text-[#f7f5ea] md:sticky md:top-0 md:h-dvh md:gap-8 md:px-6 md:py-7">
      <Link href="/" className="flex items-center gap-3 self-start">
        <Image
          src="/marca/logo-secundario.png"
          alt=""
          width={40}
          height={40}
          className="rounded-lg bg-[#f8f4ea] object-contain"
        />
        <span className="font-serif text-2xl">Munay</span>
      </Link>
      <nav
        aria-label={global ? "Panel de SuperAdmin" : "Panel de Admin"}
        className={`${global ? "flex" : "hidden md:flex"} flex-wrap gap-2 md:flex-col`}
      >
        {enlaces.map(([href, etiqueta]) => (
          <Link
            key={href}
            href={href}
            aria-current={
              ruta === href ||
              (href === "/administracion" &&
                ruta.startsWith("/administracion/atractivos/")) ||
              (["/superadmin/usuarios", "/superadmin/destinos"].includes(
                href,
              ) &&
                ruta.startsWith(href + "/"))
                ? "page"
                : undefined
            }
            className="rounded-lg px-3 py-2 text-sm font-medium text-[#dfebe3] motion-safe:transition-colors hover:bg-white/10 aria-[current=page]:bg-[#d7eadc] aria-[current=page]:text-[#11342c]"
          >
            {etiqueta}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
