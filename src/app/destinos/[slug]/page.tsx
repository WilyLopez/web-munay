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
  DetalleVisitaDestino,
  HistoriaDestino,
} from "@/features/destinos/contenido-destino";

import { textoTarifa } from "@/features/destinos/presentacion-ficha";

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
  const tieneHistoria = Boolean(
    informacion.historia ||
    informacion.detalles ||
    informacion.fuentesHistoria ||
    informacion.videoYoutube ||
    informacion.etiquetas,
  );
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
    <main className="mx-auto max-w-[82rem] space-y-5 px-4 pb-28 pt-4 sm:space-y-7 sm:px-8 lg:px-12 lg:pb-12">
      <Link
        href={regreso}
        className="inline-flex min-h-12 items-center gap-2 rounded-sm text-sm font-semibold underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2"
      >
        <span aria-hidden="true">←</span> Volver a explorar
      </Link>
      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,0.75fr)_minmax(0,1.25fr)] lg:gap-10">
        <header className="space-y-3 lg:pt-5">
          <p className="text-sm font-semibold text-[#8d402d]">
            {[
              categorias[destino.categoria],
              informacion.distrito,
              provincias[destino.provincia],
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>
          <h1 className="wrap-anywhere text-balance font-serif text-[clamp(2rem,4.5vw,3.5rem)] leading-[1.04] tracking-tight">
            {destino.nombre}
          </h1>
          <p className="text-sm text-[#465a50] sm:text-base">
            {destino.ubicacion}
          </p>
          <a
            href="#resenas-del-destino"
            className="inline-flex min-h-11 items-center rounded-full bg-[#e8eee6] px-4 text-sm font-semibold hover:bg-[#dbe8db] focus-visible:outline-2 focus-visible:outline-offset-2"
          >
            {destino.calificacionPromedio !== null &&
              `★ ${destino.calificacionPromedio} de 5 · `}
            {destino.calificacionPromedio === null &&
              "Sin calificaciones todavía · "}
            {destino.totalResenas}{" "}
            {destino.totalResenas === 1 ? "reseña" : "reseñas"}
          </a>
        </header>
        <FotoFicha
          key={destino.slug}
          url={destino.imagenUrl}
          adicionales={destino.fotosAdicionales}
          nombre={destino.nombre}
          verificado={destino.verificado}
          informacion={informacion}
        />
      </div>
      <AvisoDestino informacion={informacion} />
      <p className="max-w-prose wrap-anywhere whitespace-pre-line leading-relaxed text-[#465a50]">
        {destino.descripcion}
      </p>
      <nav
        aria-label="Secciones del destino"
        className="flex gap-2 overflow-x-auto border-y border-[#dedacf] py-3 text-sm font-semibold"
      >
        {[
          ["#planifica", "Planea tu visita"],
          ["#como-llegar", "Cómo llegar"],
          ...(tieneHistoria ? [["#historia", "Historia y atractivos"]] : []),
          ["#resenas-del-destino", "Reseñas"],
        ].map(([href, texto]) => (
          <a
            key={href}
            href={href}
            className="inline-flex min-h-12 shrink-0 items-center rounded-full border border-[#b9c4b9] px-4 hover:bg-[#e8eee6] focus-visible:outline-2 focus-visible:outline-offset-2 active:scale-95 transition-transform"
          >
            {texto}
          </a>
        ))}
      </nav>
      <div className="grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <section
          id="planifica"
          className="scroll-mt-24 min-w-0 space-y-5 self-start rounded-2xl border border-[#dedacf] bg-[#fffdf6] p-4 shadow-sm sm:p-6 lg:col-start-2 lg:row-start-1 lg:sticky lg:top-24"
        >
          <h2 className="font-serif text-3xl tracking-tight">
            Planea tu visita
          </h2>
          <dl className="grid gap-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="font-semibold">Horario de atención</dt>
              <dd>{destino.horario ?? "Por confirmar"}</dd>
            </div>
            <div>
              <dt className="font-semibold">Tarifa general</dt>
              <dd>
                {textoTarifa(
                  destino.tarifaGeneral,
                  informacion.modalidadIngreso,
                )}
              </dd>
            </div>
            <div>
              <dt className="font-semibold">Tarifa para estudiantes</dt>
              <dd>
                {textoTarifa(
                  destino.tarifaEstudiantes,
                  informacion.modalidadIngreso,
                )}
              </dd>
            </div>
            <DatosVisitaDestino informacion={informacion} />
          </dl>
          <p className="text-sm text-stone-600">
            Los horarios y las tarifas son referenciales y pueden cambiar.
          </p>
          {informacion.condicion !== "cerrado" &&
            informacion.condicion !== "restringido" && (
              <details className="border-t border-[#dedacf] pt-3">
                <summary className="cursor-pointer py-2 text-sm font-semibold focus-visible:outline-2">
                  Consultar días de atención
                </summary>
                <DisponibilidadVisita dias={destino.diasAtencion ?? []} />
              </details>
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
          <div className="flex flex-wrap items-center gap-3 border-t border-stone-200 pt-4">
            <a
              className="inline-flex min-h-12 items-center justify-center rounded-full bg-teal-950 px-5 py-3 font-semibold text-white shadow-sm hover:bg-teal-900 active:scale-95 transition-transform"
              href="#como-llegar"
            >
              Cómo llegar
            </a>
            <FavoritoDestino destino={destino} tieneSesion={tieneSesion} />
            <Link
              href={`/verificar-visita?destino=${encodeURIComponent(destino.slug)}`}
              className="inline-flex min-h-12 items-center font-semibold text-teal-900 underline underline-offset-4"
            >
              Registrar visita
            </Link>
          </div>
        </section>
        <div className="min-w-0 space-y-5 lg:col-start-1 lg:row-start-1">
          <HistoriaDestino informacion={informacion} />
          <DetalleVisitaDestino informacion={informacion} />
          <section
            id="como-llegar"
            tabIndex={-1}
            className="scroll-mt-28 min-w-0 space-y-4 rounded-2xl border border-[#dedacf] bg-[#fffdf6] p-4 sm:p-6"
          >
            <h2 className="font-serif text-3xl tracking-tight">Cómo llegar</h2>
            <p className="font-semibold">{destino.ubicacion}</p>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <a
                className="inline-flex min-h-11 items-center rounded-xl bg-teal-950 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-950"
                target="_blank"
                rel="noopener noreferrer"
                href={`https://www.google.com/maps/dir/?${rutaDesdeUbicacion}`}
              >
                Cómo llegar desde mi ubicación
                <span className="sr-only"> (abre en otra pestaña)</span>
              </a>
              <a
                className="inline-flex min-h-11 items-center text-sm font-semibold text-teal-900 underline underline-offset-4"
                href={`https://www.google.com/maps/dir/?${rutaDesdeChiclayo}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Ver ruta desde Chiclayo
                <span className="sr-only"> (abre en otra pestaña)</span>
              </a>
            </div>
            <MapaFicha
              destino={destino}
              punto={puntoLlegada}
              volver={regreso}
            />
            <h3 className="font-semibold text-teal-950">
              Trayecto referencial desde Chiclayo
            </h3>
            <p className="text-stone-700">
              {destino.rutaDesdeChiclayo ??
                "Los detalles del trayecto están por confirmar."}
            </p>
            <dl className="grid gap-3 rounded-xl bg-[#edf3ea] p-4 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-[#52675b]">Distancia desde Chiclayo</dt>
                <dd className="mt-1 font-semibold">
                  {destino.distanciaKm == null
                    ? "Por confirmar"
                    : `${destino.distanciaKm} km`}
                </dd>
              </div>
              <div>
                <dt className="text-[#52675b]">Tiempo aproximado</dt>
                <dd className="mt-1 font-semibold">
                  {destino.duracionMinutos == null
                    ? "Por confirmar"
                    : `${destino.duracionMinutos} minutos`}
                </dd>
              </div>
            </dl>
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
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-stone-600 underline"
                >
                  Fuente del trayecto
                  <span className="sr-only"> (abre en otra pestaña)</span>
                </a>
              )}
              {informacion.mapaUrl && (
                <a
                  href={informacion.mapaUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm underline"
                >
                  Ubicación oficial
                  <span className="sr-only"> (abre en otra pestaña)</span>
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
      </div>
      <Suspense fallback={<EsqueletoSentimiento />}>
        <TarjetaSentimiento slug={slug} />
      </Suspense>
      <div id="resenas-del-destino" className="scroll-mt-28">
        <Suspense
          fallback={
            <div
              role="status"
              className="space-y-3 rounded-2xl border border-[#dedacf] p-5 motion-safe:animate-pulse"
            >
              <span className="sr-only">Cargando opiniones de visitantes…</span>
              <div
                aria-hidden="true"
                className="h-6 w-48 rounded bg-[#e8eee6]"
              />
              <div
                aria-hidden="true"
                className="h-24 rounded-xl bg-[#e8eee6]"
              />
            </div>
          }
        >
          <Opiniones
            regreso={regreso}
            slug={slug}
            orden={typeof orden === "string" ? orden : undefined}
            pagina={paginaResenas(pagina)}
          />
        </Suspense>
      </div>
      <Link
        href="/resenas"
        className="inline-flex min-h-12 items-center font-semibold underline underline-offset-4"
      >
        Ver reseñas de todos los atractivos
      </Link>

      <div className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-between gap-3 border-t border-stone-200 bg-[#fffdf7]/95 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-4px_20px_rgba(0,0,0,0.08)] backdrop-blur-md lg:hidden">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-stone-500">
            Tarifa general
          </p>
          <p className="truncate text-base font-bold text-teal-950">
            {textoTarifa(destino.tarifaGeneral, informacion.modalidadIngreso)}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <a
            className="inline-flex min-h-12 items-center justify-center rounded-full bg-teal-950 px-4 py-2.5 text-sm font-semibold text-white shadow-sm active:scale-95 transition-transform"
            target="_blank"
            rel="noopener noreferrer"
            href={`https://www.google.com/maps/dir/?${rutaDesdeUbicacion}`}
          >
            Cómo llegar<span className="sr-only"> (abre en otra pestaña)</span>
          </a>
          <Link
            href={`/verificar-visita?destino=${encodeURIComponent(destino.slug)}`}
            className="hidden min-h-12 items-center justify-center rounded-full border border-teal-900 bg-white px-3.5 py-2.5 text-xs font-semibold text-teal-950 shadow-sm min-[380px]:inline-flex motion-safe:active:scale-95 motion-safe:transition-transform"
          >
            Ya estoy aquí
          </Link>
        </div>
      </div>
    </main>
  );
}

export default function PaginaFicha(props: Props) {
  return (
    <div className="min-h-dvh flex flex-col bg-[#f8f4ea] text-[#193b33]">
      <div className="sticky top-0 z-40">
        <Navbar />
      </div>
      <div className="flex-1">
        <Suspense fallback={<EsqueletoFicha />}>
          <ContenidoFicha {...props} />
        </Suspense>
      </div>
      <PiePagina className="pb-[calc(6rem+env(safe-area-inset-bottom))] lg:pb-0" />
    </div>
  );
}
