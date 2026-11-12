import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { crearSupabaseServidor } from "@/features/autenticacion/supabase/servidor";
import { solicitarDestinos } from "@/features/destinos/api";
import {
  categorias,
  enlaceFicha,
  type FichaDestino,
} from "@/features/destinos/catalogo";
import { FavoritoDestino } from "@/features/destinos/favorito-destino";
import { FotoFicha } from "@/features/destinos/foto-ficha";
import { DisponibilidadVisita } from "@/features/destinos/disponibilidad-visita";

const moneda = new Intl.NumberFormat("es-PE", {
  style: "currency",
  currency: "PEN",
});

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ volver?: string | string[] }>;
};

async function ContenidoFicha({ params, searchParams }: Props) {
  const [{ slug }, { volver }] = await Promise.all([params, searchParams]);
  if (!/^[a-z0-9]+(?:-+[a-z0-9]+)*$/.test(slug)) notFound();
  const regreso =
    typeof volver === "string" && volver.startsWith("/destinos?")
      ? volver
      : "/destinos";
  const ruta = enlaceFicha(slug);
  let respuesta: Response | undefined;

  try {
    const supabase = await crearSupabaseServidor();
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    respuesta = await solicitarDestinos(token, ruta);
    if (respuesta.status === 401 && token)
      respuesta = await solicitarDestinos(undefined, ruta);
  } catch {
    respuesta = undefined;
  }

  if (respuesta?.status === 404) notFound();
  if (!respuesta?.ok) {
    return (
      <main className="mx-auto max-w-5xl space-y-4 py-10">
        <h1 className="text-2xl font-bold">No pudimos cargar el destino</h1>
        <Link href={enlaceFicha(slug, regreso)} className="mr-5 underline">
          Reintentar
        </Link>
        <Link href={regreso} className="underline">
          Volver a explorar
        </Link>
      </main>
    );
  }

  const { destino, tieneSesion } = (await respuesta.json()) as FichaDestino;
  const mapa = new URLSearchParams({ vista: "mapa", destino: destino.id });
  const indicaciones = new URLSearchParams({
    api: "1",
    origin: "Chiclayo, Perú",
    destination: `${destino.latitud},${destino.longitud}`,
    travelmode: "driving",
  });

  return (
    <main className="mx-auto max-w-6xl space-y-8 py-6 sm:py-10">
      <nav
        aria-label="Navegación de la ficha"
        className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-300 pb-4"
      >
        <Link href="/" className="text-xl font-black text-teal-950">
          munay.
        </Link>
        <Link href={regreso} className="font-semibold text-teal-900 underline">
          Volver a explorar
        </Link>
      </nav>
      <header className="space-y-3">
        <p className="font-semibold text-teal-800">
          {categorias[destino.categoria]}
        </p>
        <h1 className="text-4xl font-bold tracking-tight text-teal-950 sm:text-5xl">
          {destino.nombre}
        </h1>
        <p className="text-stone-700">
          {destino.ubicacion} ·{" "}
          {destino.calificacionPromedio === null
            ? "Sin calificaciones"
            : `${destino.calificacionPromedio} de 5`}
        </p>
      </header>
      <div className="grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          <FotoFicha
            key={destino.slug}
            url={destino.imagenUrl}
            adicionales={destino.fotosAdicionales}
            nombre={destino.nombre}
            verificado={destino.verificado}
          />
          <section className="space-y-2">
            <h2 className="text-2xl font-bold">Sobre el destino</h2>
            <p className="leading-relaxed text-stone-700">
              {destino.descripcion}
            </p>
          </section>
          <section
            id="como-llegar"
            className="space-y-3 rounded-3xl border border-stone-200 bg-white p-6"
          >
            <h2 className="text-2xl font-bold">Cómo llegar desde Chiclayo</h2>
            <p className="text-stone-700">
              {destino.rutaDesdeChiclayo ??
                "Los detalles del trayecto están por confirmar."}
            </p>
            {destino.distanciaKm != null && destino.duracionMinutos != null && (
              <p className="font-semibold text-teal-900">
                {destino.distanciaKm} km · {destino.duracionMinutos} min aprox.
                en auto
              </p>
            )}
            <div className="flex flex-wrap items-center gap-4">
              <a
                className="font-semibold text-teal-900 underline"
                href={`https://www.google.com/maps/dir/?${indicaciones}`}
              >
                Abrir ruta en Google Maps
              </a>
              <Link
                href={`/destinos?${mapa}`}
                className="font-semibold text-teal-900 underline"
              >
                Ver ubicación en el mapa
              </Link>
              {destino.fuenteRutaUrl && (
                <a
                  href={destino.fuenteRutaUrl}
                  className="text-sm text-stone-600 underline"
                >
                  Fuente del trayecto
                </a>
              )}
            </div>
          </section>
          {destino.recomendacion && (
            <aside className="space-y-2 rounded-3xl bg-teal-50 p-6">
              <h2 className="text-xl font-bold text-teal-950">
                Recomendación para tu visita
              </h2>
              <p className="text-stone-700">{destino.recomendacion}</p>
            </aside>
          )}
        </div>
        <section className="space-y-5 self-start rounded-3xl border border-stone-200 bg-white p-6">
          <h2 className="text-2xl font-bold">Planea tu visita</h2>
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="font-semibold">Horario de atención</dt>
              <dd>{destino.horario ?? "Por confirmar"}</dd>
            </div>
            <div>
              <dt className="font-semibold">Tarifa general</dt>
              <dd>
                {destino.tarifaGeneral === null
                  ? "Por confirmar"
                  : moneda.format(destino.tarifaGeneral)}
              </dd>
            </div>
            <div>
              <dt className="font-semibold">Tarifa para estudiantes</dt>
              <dd>
                {destino.tarifaEstudiantes === null
                  ? "Por confirmar"
                  : moneda.format(destino.tarifaEstudiantes)}
              </dd>
            </div>
          </dl>
          <p className="text-sm text-stone-600">
            Los horarios y las tarifas son referenciales y pueden cambiar.
          </p>
          <DisponibilidadVisita dias={destino.diasAtencion ?? []} />
          <div className="flex flex-wrap items-center gap-4 border-t border-stone-200 pt-4">
            <Link
              className="rounded-full bg-teal-950 px-5 py-3 font-semibold text-white"
              href="#como-llegar"
            >
              Cómo llegar
            </Link>
            <FavoritoDestino destino={destino} tieneSesion={tieneSesion} />
            <Link
              href={`/verificar-visita?destino=${encodeURIComponent(destino.slug)}`}
              className="font-semibold text-teal-900 underline"
            >
              Registrar visita
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}

export default function PaginaFicha(props: Props) {
  return (
    <Suspense fallback={<p role="status">Cargando destino…</p>}>
      <ContenidoFicha {...props} />
    </Suspense>
  );
}
