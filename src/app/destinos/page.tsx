import Link from "next/link";
import { Suspense } from "react";
import { cerrarSesion } from "@/features/autenticacion/acciones";
import { AvisoExpiracion } from "@/features/autenticacion/aviso-expiracion";
import { crearSupabaseServidor } from "@/features/autenticacion/supabase/servidor";
import { solicitarDestinos } from "@/features/destinos/api";
import type { Catalogo } from "@/features/destinos/catalogo";
import { CatalogoDestinos } from "@/features/destinos/catalogo-destinos";
import { EnlaceVisitas } from "@/features/visitas/enlace-visitas";

async function DestinosPublicos() {
  const supabase = await crearSupabaseServidor();
  const { data } = await supabase.auth.getSession();

  let respuesta;

  try {
    const token = data.session?.access_token;
    respuesta = await solicitarDestinos(token);

    if (token && respuesta.status === 401) {
      respuesta = await solicitarDestinos();
    }
  } catch {
    respuesta = null;
  }

  if (!respuesta?.ok) {
    return (
      <main className="mx-auto max-w-3xl py-10">
        <h1 className="text-2xl font-bold">No pudimos cargar el catálogo</h1>
        <Link
          className="mt-4 inline-block font-semibold text-teal-800 underline"
          href="/destinos"
        >
          Reintentar
        </Link>
      </main>
    );
  }

  const { sesion, destinos } = (await respuesta.json()) as Catalogo;

  return (
    <main className="mx-auto max-w-6xl space-y-7 py-4 sm:py-8">
      {sesion && <AvisoExpiracion venceEn={sesion.venceEn} />}
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-300 pb-4">
        <Link
          href="/"
          className="text-lg font-bold tracking-wide text-teal-900"
        >
          MUNAY
        </Link>
        <div className="flex flex-wrap items-center gap-3 text-sm">
          {sesion ? (
            <>
              <p>
                Hola, {sesion.perfil.nombreCompleto}{" "}
                <span className="text-teal-800">· Cuenta activa</span>
              </p>
              <EnlaceVisitas rol={sesion.perfil.rol} />
              <form action={cerrarSesion}>
                <button
                  type="submit"
                  className="rounded-lg border border-teal-900 px-3 py-2 font-semibold text-teal-900"
                >
                  Cerrar sesión
                </button>
              </form>
            </>
          ) : (
            <Link
              href="/ingresar"
              className="rounded-lg border border-teal-900 px-3 py-2 font-semibold text-teal-900"
            >
              Iniciar sesión
            </Link>
          )}
        </div>
      </header>
      <div className="rounded-2xl bg-teal-950 px-6 py-9 text-white sm:px-9">
        <h1 className="text-3xl font-bold sm:text-5xl">Explorar destinos</h1>
        <p className="mt-3 max-w-xl text-teal-50">
          Descubre lugares para visitar en Lambayeque.
        </p>
      </div>
      <CatalogoDestinos destinos={destinos} tieneSesion={Boolean(sesion)} />
    </main>
  );
}

export default function PaginaDestinos() {
  return (
    <Suspense fallback={<p role="status">Cargando destinos…</p>}>
      <DestinosPublicos />
    </Suspense>
  );
}
