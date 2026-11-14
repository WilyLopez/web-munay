"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { cerrarSesion } from "@/features/autenticacion/acciones";
import { AvisoExpiracion } from "@/features/autenticacion/aviso-expiracion";
import {
  enlaceFicha,
  normalizarBusqueda,
  type Catalogo,
} from "@/features/destinos/catalogo";

export type DestinoBusqueda = {
  slug: string;
  nombre: string;
  ubicacion: string;
};

const enlaces = [
  ["/", "Inicio"],
  ["/destinos", "Destinos"],
  ["/destinos?vista=mapa", "Mapa"],
  ["/resenas", "Reseñas"],
] as const;

const boton =
  "flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm font-semibold transition-colors hover:bg-[#eae5d8] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#174238] motion-reduce:transition-none";
const opcion =
  "block w-full rounded-lg px-3 py-3 text-left text-sm font-semibold hover:bg-[#f1eee5] focus-visible:outline-2 focus-visible:outline-[#174238]";

function Lupa() {
  return (
    <svg
      aria-hidden="true"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
    >
      <circle cx="10.8" cy="10.8" r="6.3" />
      <path d="m15.5 15.5 4.5 4.5" strokeLinecap="round" />
    </svg>
  );
}

function AccionesCuenta({ sesion }: { sesion?: Catalogo["sesion"] }) {
  if (!sesion)
    return (
      <>
        <Link href="/ingresar" className={opcion}>
          Iniciar sesión
        </Link>
        <Link href="/registro" className={opcion}>
          Crear cuenta
        </Link>
      </>
    );

  const { nombreCompleto, rol } = sesion.perfil;
  const encargado = rol === "ADMIN_DESTINO" || rol === "SUPER_ADMIN";
  return (
    <>
      <div className="border-b border-[#e5ded0] px-3 pt-2 pb-3">
        <p className="wrap-anywhere font-semibold">{nombreCompleto}</p>
        <p className="text-xs text-[#52665e]">
          {rol === "SUPER_ADMIN"
            ? "Administrador de plataforma"
            : encargado
              ? "Encargado"
              : "Turista"}
        </p>
      </div>
      {encargado ? (
        <>
          <Link href="/administracion/estadisticas" className={opcion}>
            Panel del encargado
          </Link>
          <Link href="/administracion/visitas" className={opcion}>
            QR de visitas
          </Link>
        </>
      ) : (
        <Link href="/verificar-visita" className={opcion}>
          Escanear QR
        </Link>
      )}
      <form action={cerrarSesion}>
        <button type="submit" className={opcion}>
          Cerrar sesión
        </button>
      </form>
    </>
  );
}

export function BarraNavegacion({
  destinos = [],
  sesion,
}: {
  destinos?: DestinoBusqueda[];
  sesion?: Catalogo["sesion"];
}) {
  const ruta = usePathname();
  const parametros = useSearchParams();
  const router = useRouter();
  const activa =
    ruta === "/destinos" && parametros.get("vista") === "mapa"
      ? enlaces[2][0]
      : ruta.startsWith("/destinos/")
        ? "/destinos"
        : ruta;
  const [panel, cambiarPanel] = useState<"busqueda" | "menu" | "cuenta">();
  const [texto, cambiarTexto] = useState("");
  const [sombra, cambiarSombra] = useState(false);
  const barra = useRef<HTMLElement>(null);
  const disparador = useRef<HTMLButtonElement>(null);
  const campo = useRef<HTMLInputElement>(null);
  const consulta = normalizarBusqueda(texto.trim());
  const resultados = consulta
    ? destinos
        .filter(({ nombre, ubicacion }) =>
          [nombre, ubicacion].some((valor) =>
            normalizarBusqueda(valor).includes(consulta),
          ),
        )
        .slice(0, 5)
    : [];
  const busqueda = `/destinos?${new URLSearchParams({ buscar: texto.trim() })}`;
  const nombre = sesion?.perfil.nombreCompleto.trim() ?? "";
  const iniciales = nombre
    .split(/\s+/)
    .slice(0, 2)
    .map((parte) => parte[0])
    .join("")
    .toUpperCase();

  useEffect(() => {
    function actualizarSombra() {
      cambiarSombra(window.scrollY > 8);
    }
    actualizarSombra();
    window.addEventListener("scroll", actualizarSombra, { passive: true });
    function cerrarFuera(evento: PointerEvent) {
      if (
        evento.target instanceof Node &&
        !barra.current?.contains(evento.target)
      )
        cambiarPanel(undefined);
    }
    document.addEventListener("pointerdown", cerrarFuera);
    return () => {
      window.removeEventListener("scroll", actualizarSombra);
      document.removeEventListener("pointerdown", cerrarFuera);
    };
  }, []);

  useEffect(() => {
    if (panel === "busqueda") campo.current?.focus();
  }, [panel]);

  function abrir(opcion: typeof panel, elemento: HTMLButtonElement) {
    disparador.current = elemento;
    cambiarPanel(panel === opcion ? undefined : opcion);
  }

  function buscar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (!consulta) return;
    cambiarPanel(undefined);
    router.push(busqueda);
  }

  function enlacesPublicos() {
    return enlaces.map(([href, etiqueta]) => (
      <Link
        key={href}
        href={href}
        aria-current={activa === href ? "page" : undefined}
        className={`${boton} relative aria-[current=page]:bg-[#e8eee6] aria-[current=page]:text-[#174238]`}
        onClick={() => cambiarPanel(undefined)}
      >
        {etiqueta}
      </Link>
    ));
  }

  return (
    <header
      ref={barra}
      className={`sticky top-0 z-40 border-b border-[#e5ded0] bg-[#f8f4ea]/95 text-[#193b33] backdrop-blur transition-shadow motion-reduce:transition-none ${sombra ? "shadow-sm" : ""}`}
      onKeyDown={(evento) => {
        if (evento.key === "Escape" && panel) {
          evento.preventDefault();
          cambiarPanel(undefined);
          disparador.current?.focus();
        }
      }}
    >
      {sesion && <AvisoExpiracion venceEn={sesion.venceEn} />}
      <div className="relative mx-auto flex min-h-[4.5rem] max-w-[82rem] items-center justify-between gap-2 px-4 sm:gap-5 sm:px-8 lg:px-12">
        <Link
          href="/"
          aria-label="Munay, inicio"
          onClick={() => cambiarPanel(undefined)}
          className="shrink-0 rounded focus-visible:outline-2 focus-visible:outline-offset-4"
        >
          <Image
            src="/marca/logo-navbar.webp"
            alt=""
            width={360}
            height={80}
            className="h-auto w-28 sm:w-36"
          />
        </Link>
        <nav
          aria-label="Navegación principal"
          className="hidden items-center gap-1 lg:flex"
        >
          {enlacesPublicos()}
        </nav>
        <div className="flex items-center gap-1 sm:gap-2">
          <button
            type="button"
            aria-label="Buscar destinos"
            aria-expanded={panel === "busqueda"}
            onClick={(e) => abrir("busqueda", e.currentTarget)}
            className={`${boton} sm:border sm:border-[#dedacf]`}
          >
            <Lupa />
            <span className="hidden sm:inline">Buscar destinos</span>
          </button>
          {sesion ? (
            <button
              type="button"
              aria-label={`Cuenta de ${nombre}`}
              aria-expanded={panel === "cuenta"}
              onClick={(e) => abrir("cuenta", e.currentTarget)}
              className={`${boton} hidden sm:flex`}
            >
              <span
                aria-hidden="true"
                className="grid size-8 place-items-center rounded-full bg-[#174238] text-xs text-white"
              >
                {iniciales}
              </span>
              <span className="max-w-24 truncate">
                {nombre.split(/\s+/)[0]}
              </span>
              <span aria-hidden="true">⌄</span>
            </button>
          ) : (
            <div className="hidden items-center sm:flex">
              <Link href="/ingresar" className={boton}>
                Iniciar sesión
              </Link>
              <Link
                href="/registro"
                className={`${boton} bg-[#174238] text-white hover:bg-[#23574a]`}
              >
                Crear cuenta
              </Link>
            </div>
          )}
          <button
            type="button"
            aria-expanded={panel === "menu"}
            onClick={(e) => abrir("menu", e.currentTarget)}
            className={`${boton} lg:hidden`}
          >
            <svg
              aria-hidden="true"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
            </svg>
            Menú
          </button>
        </div>
        {panel && (
          <div
            key={panel}
            className={`panel-navbar absolute inset-x-4 top-full max-h-[calc(100dvh-5rem)] overflow-auto rounded-xl border border-[#dedacf] bg-[#fffdf7] p-2 shadow-lg sm:right-8 sm:left-auto lg:right-12 ${panel === "busqueda" ? "sm:w-96" : "sm:w-64"} ${panel === "menu" ? "lg:hidden" : panel === "cuenta" ? "hidden sm:block" : ""}`}
          >
            {panel === "busqueda" ? (
              <div className="space-y-2 p-2">
                <form
                  role="search"
                  onSubmit={buscar}
                  className="flex items-center gap-2 rounded-lg border border-[#c8cec4] bg-white px-3 focus-within:border-[#174238]"
                >
                  <Lupa />
                  <input
                    ref={campo}
                    type="search"
                    aria-label="Buscar por nombre o ubicación"
                    placeholder="Nombre o ubicación"
                    className="min-h-11 min-w-0 flex-1 outline-none"
                    value={texto}
                    onChange={(e) => cambiarTexto(e.target.value)}
                  />
                  <button
                    type="submit"
                    disabled={!consulta}
                    className="text-sm font-semibold underline disabled:opacity-40"
                  >
                    Buscar
                  </button>
                </form>
                {resultados.length > 0 && (
                  <ul aria-label="Destinos encontrados">
                    {resultados.map(({ slug, nombre, ubicacion }) => (
                      <li key={slug}>
                        <Link
                          href={enlaceFicha(slug)}
                          className={opcion}
                          onClick={() => cambiarPanel(undefined)}
                        >
                          {nombre}
                          <span className="block text-xs font-normal text-[#52665e]">
                            {ubicacion}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
                {consulta && (
                  <Link
                    href={busqueda}
                    onClick={() => cambiarPanel(undefined)}
                    className={opcion}
                  >
                    Ver resultados en el catálogo
                  </Link>
                )}
              </div>
            ) : panel === "cuenta" ? (
              <AccionesCuenta sesion={sesion} />
            ) : (
              <>
                <nav aria-label="Navegación principal móvil">
                  {enlacesPublicos()}
                </nav>
                <div className="mt-2 border-t border-[#e5ded0] pt-2 sm:hidden">
                  <AccionesCuenta sesion={sesion} />
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
