import { PiePagina } from "@/features/navegacion/pie-pagina";
import { Navbar } from "@/features/navegacion/navbar";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { crearSupabaseServidor } from "@/features/autenticacion/supabase/servidor";
import { solicitarDestinos } from "@/features/destinos/api";
import {
  categorias,
  enlaceFicha,
  provincias,
  type FichaDestino,
} from "@/features/destinos/catalogo";
import { FavoritoDestino } from "@/features/destinos/favorito-destino";
import { Opiniones, paginaResenas } from "@/features/resenas/opiniones";
import {
  EsqueletoSentimiento,
  TarjetaSentimiento,
} from "@/features/sentimiento/tarjeta-sentimiento";
import { FotoFicha } from "@/features/destinos/foto-ficha";
import { DisponibilidadVisita } from "@/features/destinos/disponibilidad-visita";
import { ErrorDestinos } from "@/features/destinos/error-destinos";
import { EsqueletoFicha } from "@/features/destinos/esqueletos";
import { MapaFicha } from "@/features/destinos/mapa-ficha";
import {
  AvisoDestino,
  ContactoDestino,
  DatosVisitaDestino,
  HistoriaDestino,
} from "@/features/destinos/contenido-destino";

const moneda = new Intl.NumberFormat("es-PE", {
  style: "currency",
  currency: "PEN",
});

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{
    volver?: string | string[];
    orden?: string;
    pagina?: string;
  }>;
};

async function ContenidoFicha({ params, searchParams }: Props) {
  await connection();
  const [{ slug }, { volver, orden, pagina }] = await Promise.all([
    params,
    searchParams,
  ]);
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
      <ErrorDestinos titulo="No pudimos cargar el destino" regreso={regreso} />
    );
  }

  const { destino, tieneSesion } = (await respuesta.json()) as FichaDestino;
  const informacion = destino.informacion ?? {};
  const mapa = new URLSearchParams({ vista: "mapa", destino: destino.id });
  const puntoLlegada: [number, number] =
    informacion.latitudIngreso && informacion.longitudIngreso
      ? [
          Number(informacion.latitudIngreso),
          Number(informacion.longitudIngreso),
        ]
      : [destino.latitud, destino.longitud];
  const rutaDesdeUbicacion = new URLSearchParams({
    api: "1",
    destination: puntoLlegada.join(","),
    travelmode: "driving",
  });
  const rutaDesdeChiclayo = new URLSearchParams(rutaDesdeUbicacion);
  rutaDesdeChiclayo.set("origin", "Chiclayo, Perú");

  return (
    <main className="mx-auto max-w-6xl space-y-8 py-6 sm:py-10">
      <nav
        aria-label="Navegación de la ficha"
        className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-300 pb-4"
      >
        <Link href={regreso} className="font-semibold text-teal-900 underline">
          Volver a explorar
        </Link>
      </nav>
      <FotoFicha
        key={destino.slug}
        url={destino.imagenUrl}
        adicionales={destino.fotosAdicionales}
        nombre={destino.nombre}
        verificado={destino.verificado}
        informacion={informacion}
      >
        <header className="entrada-portada max-w-3xl space-y-3">
          <p className="text-sm font-semibold text-teal-100">
            {[
              categorias[destino.categoria],
              informacion.distrito,
              provincias[destino.provincia],
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>
          <h1 className="font-serif text-4xl leading-tight tracking-tight sm:text-6xl">
            {destino.nombre}
          </h1>
          <p className="text-sm font-medium text-teal-50">
            {destino.ubicacion}
          </p>
          <p className="max-w-prose whitespace-pre-line text-sm leading-relaxed text-white/95 sm:text-base">
            {destino.descripcion}
          </p>
          <a
            href="#resenas-del-destino"
            className="inline-flex rounded-full border border-white/50 bg-black/25 px-4 py-2 text-sm font-semibold transition-colors hover:bg-white hover:text-teal-950"
          >
            {destino.calificacionPromedio === null
              ? "Sin calificaciones · "
              : `★ ${destino.calificacionPromedio} de 5 · `}
            {destino.totalResenas}{" "}
            {destino.totalResenas === 1 ? "reseña" : "reseñas"}
          </a>
        </header>
      </FotoFicha>
      <nav
        aria-label="Secciones del destino"
        className="flex flex-wrap gap-2 border-b border-stone-200 pb-4 text-sm font-semibold"
      >
        <a
          href="#planifica"
          className="rounded-full bg-teal-50 px-4 py-2 hover:bg-teal-100"
        >
          Planea tu visita
        </a>
        <a
          href="#como-llegar"
          className="rounded-full bg-teal-50 px-4 py-2 hover:bg-teal-100"
        >
          Cómo llegar
        </a>
        <a
          href="#resenas-del-destino"
          className="rounded-full bg-teal-50 px-4 py-2 hover:bg-teal-100"
        >
          Reseñas
        </a>
      </nav>
      <AvisoDestino informacion={informacion} />
      <div className="grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          <HistoriaDestino informacion={informacion} />
          <section
            id="como-llegar"
            tabIndex={-1}
            className="scroll-mt-28 space-y-3 rounded-3xl border border-stone-200 bg-white p-6"
          >
            <h2 className="text-2xl font-bold">Cómo llegar</h2>
            <p className="font-semibold">{destino.ubicacion}</p>
            <MapaFicha punto={puntoLlegada} />
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <a
                className="inline-flex min-h-11 items-center rounded-xl bg-teal-950 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-950"
                href={`https://www.google.com/maps/dir/?${rutaDesdeUbicacion}`}
              >
                Cómo llegar desde mi ubicación
              </a>
              <a
                className="inline-flex min-h-11 items-center text-sm font-semibold text-teal-900 underline underline-offset-4"
                href={`https://www.google.com/maps/dir/?${rutaDesdeChiclayo}`}
              >
                Ver ruta desde Chiclayo
              </a>
            </div>
            <h3 className="font-semibold text-teal-950">
              Trayecto referencial desde Chiclayo
            </h3>
            <p className="text-stone-700">
              {destino.rutaDesdeChiclayo ??
                "Los detalles del trayecto están por confirmar."}
            </p>
            {(destino.distanciaKm != null ||
              destino.duracionMinutos != null) && (
              <p className="font-semibold text-teal-900">
                {[
                  destino.distanciaKm != null && `${destino.distanciaKm} km`,
                  destino.duracionMinutos != null &&
                    `${destino.duracionMinutos} min aprox.`,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            )}
            {informacion.transporte && (
              <p className="whitespace-pre-line text-stone-700">
                <strong>Transporte</strong> {informacion.transporte}
              </p>
            )}
            {informacion.estacionamiento && (
              <p className="whitespace-pre-line text-stone-700">
                <strong>Estacionamiento</strong> {informacion.estacionamiento}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-4">
              <Link
                href={`/destinos?${mapa}`}
                className="font-semibold text-teal-900 underline"
              >
                Abrir mapa del catálogo
              </Link>
              {destino.fuenteRutaUrl && (
                <a
                  href={destino.fuenteRutaUrl}
                  className="text-sm text-stone-600 underline"
                >
                  Fuente del trayecto
                </a>
              )}
              {informacion.mapaUrl && (
                <a href={informacion.mapaUrl} className="text-sm underline">
                  Ubicación oficial
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
          <ContactoDestino informacion={informacion} />
        </div>
        <section
          id="planifica"
          className="scroll-mt-28 space-y-5 self-start rounded-3xl border border-stone-200 bg-white p-6"
        >
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
            <DatosVisitaDestino informacion={informacion} />
          </dl>
          <p className="text-sm text-stone-600">
            Los horarios y las tarifas son referenciales y pueden cambiar.
          </p>
          {informacion.condicion !== "cerrado" &&
            informacion.condicion !== "restringido" && (
              <DisponibilidadVisita dias={destino.diasAtencion ?? []} />
            )}
          {destino.revisadoEn && (
            <p className="text-sm text-stone-600">
              Información revisada el{" "}
              <time dateTime={destino.revisadoEn}>
                {new Intl.DateTimeFormat("es-PE", {
                  dateStyle: "medium",
                  timeZone: "America/Lima",
                }).format(new Date(destino.revisadoEn))}
              </time>
              .
            </p>
          )}
          <div className="flex flex-wrap items-center gap-4 border-t border-stone-200 pt-4">
            <a
              className="rounded-full bg-teal-950 px-5 py-3 font-semibold text-white"
              href="#como-llegar"
            >
              Cómo llegar
            </a>
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
      <Suspense fallback={<EsqueletoSentimiento />}>
        <TarjetaSentimiento slug={slug} />
      </Suspense>
      <div id="resenas-del-destino" className="scroll-mt-28">
        <Suspense fallback={<p role="status">Cargando reseñas…</p>}>
          <Opiniones
            regreso={regreso}
            slug={slug}
            orden={typeof orden === "string" ? orden : undefined}
            pagina={paginaResenas(pagina)}
          />
        </Suspense>
      </div>
      <Link href="/resenas" className="font-semibold underline">
        Ver reseñas de todos los atractivos
      </Link>
    </main>
  );
}

export default function PaginaFicha(props: Props) {
  return (
    <>
      <div className="sticky top-0 z-40 -mx-8 -mt-8">
        <Navbar />
      </div>
      <Suspense fallback={<EsqueletoFicha />}>
        <ContenidoFicha {...props} />
      </Suspense>
      <PiePagina className="-mx-8 -mb-8" />
    </>
  );
}
