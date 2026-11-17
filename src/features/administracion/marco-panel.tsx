import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import { accesoPanel } from "./acceso";
import { MenuCuenta } from "./menu-cuenta";
import { MenuMovilEncargado } from "./menu-movil-encargado";
import { Sidebar } from "./sidebar";

const marco =
  "min-h-dvh bg-[#f4f5ef] text-[#173b32] md:grid md:grid-cols-[15rem_minmax(0,1fr)]";
const encabezado =
  "flex flex-wrap items-center justify-between gap-3 border-b border-[#dce3da] bg-[#fbfcf8] px-4 py-3 sm:px-8 sm:py-4";
const contenido = "mx-auto w-full px-4 py-6 sm:px-8 sm:py-7";

function EsqueletoPanel({ global }: { global: boolean }) {
  return (
    <div role="status" className={marco}>
      <span className="sr-only">Cargando el panel de administración</span>
      <div
        aria-hidden="true"
        className="flex flex-col gap-5 bg-[#11342c] px-5 py-4 md:h-dvh md:gap-8 md:px-6 md:py-7"
      >
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-lg bg-white/20 motion-safe:animate-pulse" />
          <div className="h-6 w-20 rounded-md bg-white/20 motion-safe:animate-pulse" />
        </div>
        <div className="flex flex-wrap gap-2 md:flex-col">
          {(global ? [36, 24, 22, 28, 32, 20] : [28, 24, 32, 20]).map(
            (ancho) => (
              <div
                key={ancho}
                style={{ width: `${ancho / 4}rem` }}
                className="h-9 rounded-lg bg-white/15 motion-safe:animate-pulse"
              />
            ),
          )}
        </div>
      </div>
      <div aria-hidden="true" className="min-w-0">
        <div className={encabezado}>
          <div className="h-4 w-40 rounded bg-[#dce6dd] motion-safe:animate-pulse" />
          <div className="ml-auto flex items-center gap-2 motion-safe:animate-pulse">
            <div className="h-[34px] w-28 rounded-lg bg-[#e6eee6]" />
            <div className="h-10 w-14 rounded-full bg-[#dce6dd] sm:w-36" />
          </div>
        </div>
        <div className={`${contenido} space-y-5 motion-safe:animate-pulse`}>
          <div className="h-10 w-3/5 max-w-72 rounded-lg bg-[#dbe6dc]" />
          <div className="h-4 w-4/5 max-w-96 rounded bg-[#e0e9e0]" />
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3].map((fila) => (
              <div
                key={fila}
                className="space-y-4 rounded-2xl border border-[#dce3da] bg-white p-5"
              >
                <div className="h-5 w-3/5 rounded bg-[#dbe6dc]" />
                <div className="h-3 w-4/5 rounded bg-[#e6eee6]" />
                <div className="h-8 w-24 rounded-lg bg-[#e6eee6]" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

async function Marco({
  children,
  global,
}: {
  children: ReactNode;
  global: boolean;
}) {
  const perfil = await accesoPanel(global);
  if (!perfil) {
    return (
      <p role="alert">
        No pudimos consultar tu sesión. Recarga la página para reintentar.
      </p>
    );
  }
  const esSuperAdmin = perfil.rol === "SUPER_ADMIN";

  return (
    <div className={marco}>
      <Sidebar global={esSuperAdmin} />
      <div className="min-w-0">
        <header className={encabezado}>
          <p className="text-sm font-semibold">
            {esSuperAdmin
              ? "Administración de plataforma"
              : "Panel del encargado"}
          </p>
          <div className="ml-auto flex min-w-0 items-center gap-2 sm:gap-3">
            <Link
              href="/"
              className="inline-flex min-h-11 items-center shrink-0 rounded-lg border border-[#ccd9cf] px-3 py-2 text-xs font-semibold hover:bg-[#e6eee6]"
            >
              Ver sitio público <span aria-hidden="true">↗</span>
            </Link>
            <MenuCuenta nombre={perfil.nombreCompleto} global={esSuperAdmin} />
          </div>
        </header>
        <div
          className={`${contenido} ${esSuperAdmin ? "max-w-7xl" : "max-md:pb-[calc(4.5rem+env(safe-area-inset-bottom))]"}`}
        >
          {children}
        </div>
      </div>
      {!esSuperAdmin && (
        <Suspense>
          <MenuMovilEncargado />
        </Suspense>
      )}
    </div>
  );
}

export function MarcoPanel({
  children,
  global = false,
}: {
  children: ReactNode;
  global?: boolean;
}) {
  return (
    <Suspense fallback={<EsqueletoPanel global={global} />}>
      <Marco global={global}>{children}</Marco>
    </Suspense>
  );
}
