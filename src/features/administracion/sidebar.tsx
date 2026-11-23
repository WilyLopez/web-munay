"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

const enlacesOperacion = [
  ["/administracion/estadisticas", "Estadísticas"],
  ["/administracion/visitas", "QR de visitas"],
  ["/administracion/resenas", "Reseñas"],
];

export type ContadoresSidebar = {
  accesosPendientes: number;
  reportesPendientes: number;
  revisionPendientes: number;
};

function BadgeSidebar({ n }: { n: number }) {
  if (n <= 0) return null;
  return (
    <span
      aria-label={`${n} pendientes`}
      className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white tabular-nums"
    >
      {n > 99 ? "99+" : n}
    </span>
  );
}

export function Sidebar({
  global,
  contadores,
}: {
  global: boolean;
  contadores?: ContadoresSidebar;
}) {
  const ruta = usePathname();

  const badgePor: Record<string, number> = {
    "/superadmin/accesos": contadores?.accesosPendientes ?? 0,
    "/superadmin/reportes": contadores?.reportesPendientes ?? 0,
    "/superadmin/destinos": contadores?.revisionPendientes ?? 0,
  };

  const enlaces: [string, string][] = global
    ? [
        ["/superadmin", "Dashboard"],
        ["/superadmin/usuarios", "Usuarios"],
        ["/superadmin/accesos", "Accesos de encargados"],
        ["/superadmin/destinos", "Revisión de destinos"],
        ["/superadmin/reportes", "Reportes"],
        ["/superadmin/beneficios", "Beneficios"],
        ["/superadmin/blockchain", "Registros blockchain"],
        ...(enlacesOperacion as [string, string][]),
      ]
    : [
        ["/administracion", "Dashboard"],
        ["/administracion/atractivos", "Mi atractivo"],
        enlacesOperacion[1] as [string, string],
        enlacesOperacion[0] as [string, string],
        enlacesOperacion[2] as [string, string],
        ["/administracion/beneficios", "Beneficios"],
      ];

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
        className={`${global ? "flex" : "hidden md:flex"} flex-wrap gap-1 md:flex-col`}
      >
        {enlaces.map(([href, etiqueta]) => (
          <Link
            key={href}
            href={href}
            aria-current={
              ruta === href ||
              (href === "/administracion/atractivos" &&
                ruta.startsWith("/administracion/atractivos/")) ||
              (["/superadmin/usuarios", "/superadmin/destinos"].includes(href) &&
                ruta.startsWith(href + "/"))
                ? "page"
                : undefined
            }
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-[#dfebe3] motion-safe:transition-colors hover:bg-white/10 aria-[current=page]:bg-[#d7eadc] aria-[current=page]:text-[#11342c]"
          >
            <span className="flex-1 truncate">{etiqueta}</span>
            {global && <BadgeSidebar n={badgePor[href] ?? 0} />}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
