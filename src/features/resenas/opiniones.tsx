import Link from "next/link";
import { solicitarVisitas } from "@/features/visitas/api";
import { fechaVisita } from "@/features/visitas/tipos";
import { FormularioResena } from "./formulario-resena";
import { ReintentarOpiniones } from "./reintentar-opiniones";
import { tokenVisitaInvitada } from "@/features/visitas/invitada";
import { enlaceEscribirResena } from "./enlaces";
import type { PreparacionResena, ListadoResenas } from "./tipos";
import { FiltrosResenas } from "./filtros-resenas";
import { TarjetaResena } from "./tarjeta-resena";

const formatoNota = new Intl.NumberFormat("es-PE", {
  maximumFractionDigits: 1,
});
export async function Opiniones({
  slug,
  filtro,
  orden,
  pagina = 1,
  regreso,
}: {
  slug?: string;
  filtro?: string;
  orden?: string;
  pagina?: number;
  regreso?: string;
}) {
  const destino = slug ?? filtro;
  const consulta = new URLSearchParams({ pagina: String(pagina) });
  if (destino) consulta.set("destino", destino);
  if (orden) consulta.set("orden", orden);
  const ruta = slug ? `/destinos/${encodeURIComponent(slug)}` : "/resenas";
  const parametrosPagina = (numero: number) => {
    const parametros = new URLSearchParams(consulta);
    parametros.set("pagina", String(numero));
    if (slug) parametros.delete("destino");
    if (regreso) parametros.set("volver", regreso);
    return `${ruta}?${parametros}#opiniones`;
  };
  const resultado = await solicitarVisitas<ListadoResenas>(
    `/resenas?${consulta}`,
    undefined,
    { publica: true },
  );
  if (!resultado.ok)
    return (
      <section id="opiniones" className="scroll-mt-24 space-y-3 py-6">
        <h2 className="text-2xl font-bold">Reseñas</h2>
        <p role="alert">No pudimos cargar las reseñas.</p>
        <ReintentarOpiniones />
      </section>
    );
  const datos = resultado.datos;
  let puedeRetomar = false;
  if (destino && datos.estado === "visitante") {
    const token = await tokenVisitaInvitada();
    if (token) {
      const preparacion = await solicitarVisitas<PreparacionResena>(
        "/visitas/invitadas/estado",
        { token, destino },
        { publica: true },
      );
      puedeRetomar =
        preparacion.ok && preparacion.datos.estado === "habilitada";
    }
  }
  if (
    slug &&
    datos.total === 0 &&
    datos.estado !== "habilitada" &&
    datos.estado !== "publicada"
  )
    return (
      <section
        id="opiniones"
        className="scroll-mt-28 rounded-2xl border border-[#dedacf] bg-[#fffdf6] p-6 sm:p-8"
      >
        <h2 className="font-serif text-2xl">
          Sé la primera persona en compartir su experiencia
        </h2>
        <p className="mt-2 max-w-prose text-sm leading-relaxed text-[#465a50]">
          Todavía no hay reseñas de este destino. Después de tu visita, verifica
          tu presencia con el QR para compartir tu opinión.
        </p>
        <Link
          href={
            puedeRetomar
            ? enlaceEscribirResena(slug, true)
              : `/verificar-visita?destino=${encodeURIComponent(slug)}`
          }
          className="mt-4 inline-flex min-h-11 items-center rounded-full bg-[#174238] px-4 text-sm font-semibold text-white hover:bg-[#245649] focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          {puedeRetomar
            ? "Continuar mi reseña"
            : "Verificar mi visita y escribir"}
        </Link>
      </section>
    );
  const conteos = new Map(
    datos.distribucion.map(({ calificacion, total }) => [calificacion, total]),
  );
  const controles = (
    <div className="space-y-4">
      <FiltrosResenas
        ruta={ruta}
        destino={filtro ?? slug}
        orden={orden}
        regreso={regreso}
        destinos={datos.destinos}
        mostrarDestinos={!slug}
      />
      {datos.total > 0 && (
        <div className="grid min-w-0 gap-4 rounded-2xl border border-[#dedacf] bg-[#fffdf6] p-5 sm:p-6">
          <div>
            <h2 className="font-serif text-2xl tracking-tight">Valoraciones</h2>
            {datos.promedio !== null && (
              <p className="mt-2 flex flex-wrap items-baseline gap-2 text-[#193b33]">
                <strong className="text-4xl font-semibold tabular-nums">
                  {formatoNota.format(datos.promedio)}
                </strong>
                <span className="text-sm">de 5</span>
              </p>
            )}
            <p className="mt-1 text-sm text-[#465a50]">
              {datos.total} {datos.total === 1 ? "reseña" : "reseñas"} ·{" "}
              {datos.verificadas} con visita verificada
            </p>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-[#465a50]">
              Las insignias indican que Munay comprobó una visita al destino. No
              garantizan la veracidad de la opinión ni la calidad del lugar.
            </p>
          </div>
          <ul
            className="grid content-center gap-2"
            aria-label="Distribución por estrellas"
          >
            {[5, 4, 3, 2, 1].map((nota) => {
              const total = conteos.get(nota) ?? 0;
              return (
                <li
                  key={nota}
                  className="grid grid-cols-[5rem_minmax(0,1fr)_auto] items-center gap-2 text-sm tabular-nums"
                >
                  <span>
                    {nota} {nota === 1 ? "estrella" : "estrellas"}
                  </span>
                  <span
                    aria-hidden="true"
                    className="h-1.5 overflow-hidden rounded-full bg-[#e4e9df]"
                  >
                    <span
                      className="block h-full rounded-full bg-[#386454]"
                      style={{ width: `${(total / datos.total) * 100}%` }}
                    />
                  </span>
                  <span className="min-w-[2ch] text-right">{total}</span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
  return (
    <section id="opiniones" className="scroll-mt-24 space-y-5 py-5 sm:py-7">
      <div
        className={
          slug
            ? "space-y-5"
            : "grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_18rem]"
        }
      >
        {slug ? (
          controles
        ) : (
          <div className="min-w-0 lg:col-start-2 lg:row-start-1">
            <details className="rounded-2xl border border-[#dce3da] bg-white p-4 lg:hidden">
              <summary className="min-h-11 cursor-pointer content-center text-sm font-semibold text-[#174238]">
                Filtrar reseñas y ver valoraciones
              </summary>
              <div className="mt-3">{controles}</div>
            </details>
            <div className="hidden lg:block">{controles}</div>
          </div>
        )}
        <div className="min-w-0 space-y-5 lg:col-start-1 lg:row-start-1">
          {destino && (
            <div className="space-y-2 rounded-xl bg-teal-50 p-4">
              {datos.estado === "habilitada" && (
                <FormularioResena
                  key={destino}
                  slug={destino}
                  fechaVisita={datos.fechaVisita}
                  puntosResena={datos.puntosResena}
                  puntosSelfie={datos.puntosSelfie}
                />
              )}
              {datos.estado === "publicada" &&
                (datos.recompensa ? (
                  <div
                    id="escribir-resena"
                    className="scroll-mt-28 space-y-2 text-teal-950"
                  >
                    <p className="font-semibold">
                      +{datos.recompensa.puntos} puntos MUNAY
                    </p>
                    <p className="text-sm">
                      Reseña verificada de {datos.recompensa.destino} ·{" "}
                      {fechaVisita.format(new Date(datos.recompensa.creadoEn))}
                    </p>
                    <Link
                      href="/mi-perfil#ranking"
                      className="text-sm font-semibold underline underline-offset-4"
                    >
                      Ver mi perfil y ranking
                    </Link>
                  </div>
                ) : (
                  <p id="escribir-resena" className="scroll-mt-28">
                    Tu reseña está publicada. La acreditación de puntos está
                    pendiente.
                  </p>
                ))}
              {datos.estado === "retirada" && (
                <p>Esta reseña fue retirada de la publicación.</p>
              )}
              {datos.estado === "bloqueada" && (
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                  <button
                    type="button"
                    disabled
                    aria-describedby="motivo-resena-bloqueada"
                    className="inline-flex min-h-12 items-center justify-center cursor-not-allowed rounded-full border border-teal-900/20 px-4 py-2 text-sm font-semibold text-stone-600"
                  >
                    Escribir una reseña
                  </button>
                  <p id="motivo-resena-bloqueada" className="text-sm">
                    Verifica tu visita escaneando el QR que muestra el
                    encargado.
                  </p>
                  <Link
                    href={`/verificar-visita?destino=${encodeURIComponent(destino)}`}
                    className="inline-flex min-h-12 items-center text-sm font-semibold underline underline-offset-4 hover:text-[#0b6b52]"
                  >
                    Verificar mi visita
                  </Link>
                </div>
              )}
              {datos.estado === "visitante" && (
                <Link
                  href={
                    puedeRetomar
                      ? enlaceEscribirResena(destino)
                      : `/verificar-visita?destino=${encodeURIComponent(destino)}`
                  }
                  className="inline-flex min-h-12 items-center font-semibold underline hover:text-[#0b6b52]"
                >
                  {puedeRetomar
                    ? "Continuar mi reseña"
                    : "Verificar mi visita y escribir"}
                </Link>
              )}
            </div>
          )}
          {datos.resenas.length ? (
            <ul className="grid gap-4" aria-label="Reseñas publicadas">
              {datos.resenas.map((resena) => (
                <li key={resena.id} className="min-w-0">
                  <TarjetaResena
                    resena={resena}
                    mostrarDestino={!slug}
                    puedeResponder={datos.puedeResponder}
                  />
                </li>
              ))}
            </ul>
          ) : (
            <div className="rounded-2xl border border-[#dedacf] bg-[#fffdf6] px-5 py-8 text-center">
              <h2 className="font-serif text-2xl">
                Aún no hay reseñas disponibles
              </h2>
              <p className="mx-auto mt-2 max-w-md text-sm text-[#465a50]">
                {destino
                  ? "Las opiniones aparecerán aquí cuando se publiquen."
                  : "Explora el catálogo para planear tu próxima visita."}
              </p>
              {!slug && (
                <Link
                  href={filtro ? "/resenas#opiniones" : "/destinos"}
                  className="mt-2 inline-flex min-h-12 items-center rounded-lg text-sm font-semibold underline underline-offset-4 hover:text-[#0b6b52] focus-visible:outline-2 focus-visible:outline-offset-2"
                >
                  {filtro
                    ? "Ver todos los destinos con reseñas"
                    : "Explorar destinos"}
                </Link>
              )}
            </div>
          )}
          {(pagina > 1 || datos.hayMas) && (
            <nav
              aria-label="Paginación de reseñas"
              className="flex flex-wrap items-center gap-2 text-sm font-semibold"
            >
              {pagina > 1 && (
                <Link
                  href={parametrosPagina(pagina - 1)}
                  className="inline-flex min-h-12 items-center rounded-lg border border-[#dedacf] px-4 hover:bg-[#e8eee6] focus-visible:outline-2"
                >
                  Página anterior
                </Link>
              )}
              <span aria-current="page" className="px-2 tabular-nums">
                Página {pagina}
              </span>
              {datos.hayMas && (
                <Link
                  href={parametrosPagina(pagina + 1)}
                  className="inline-flex min-h-12 items-center rounded-lg border border-[#dedacf] px-4 hover:bg-[#e8eee6] focus-visible:outline-2"
                >
                  Página siguiente
                </Link>
              )}
            </nav>
          )}
        </div>
      </div>
    </section>
  );
}

export function paginaResenas(valor?: string) {
  return typeof valor === "string" && /^[1-9]\d{0,4}$/.test(valor)
    ? Number(valor)
    : 1;
}
