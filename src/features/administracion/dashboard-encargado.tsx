import Image from "next/image";
import Link from "next/link";
import Form from "next/form";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { accesoPanel } from "./acceso";
import { VisibilidadAtractivo } from "./visibilidad-atractivo";
import {
  OpinionResumen,
  DetalleOpinion,
  type OpinionEncargado,
} from "./opinion-encargado";
import { solicitarVisitas } from "@/features/visitas/api";
import { BotonActualizarPanel } from "@/features/visitas/boton-actualizar-panel";
import {
  categorias,
  provincias,
  enlaceFicha,
} from "@/features/destinos/catalogo";
import {
  estadosFicha,
  type EstadoFicha,
} from "@/features/destinos/informacion";
import { fechaVisita, type HistorialVisitas } from "@/features/visitas/tipos";

export type ConsultaDashboard = { meses?: string; resena?: string };
type Atractivo = {
  slug: string;
  nombre: string;
  ubicacion: string;
  imagenUrl?: string | null;
  categoria: keyof typeof categorias;
  provincia: keyof typeof provincias;
  estadoEditorial: EstadoFicha;
};
type Estadisticas = {
  totalVisitas: number;
  totalResenas: number;
  promedio: number | null;
  visitasConResena: number;
  desde: string;
  actualizadoEn: string;
  tendencia: { mes: string; total: number; resenas: number }[];
  recientes: OpinionEncargado[];
};
const panel = "min-w-0 rounded-2xl border border-[#dce3da] bg-white";
const accion =
  "inline-flex min-h-11 items-center justify-center rounded-xl border border-[#ccd9cf] px-4 text-sm font-semibold transition-colors hover:bg-[#edf4ed] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#174238]";
const numero = new Intl.NumberFormat("es-PE", { maximumFractionDigits: 1 });
const mesCorto = new Intl.DateTimeFormat("es-PE", {
  month: "short",
  timeZone: "UTC",
});
const fecha = new Intl.DateTimeFormat("es-PE", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "America/Lima",
});

export function EsqueletoDashboard() {
  return (
    <div role="status" className="space-y-5">
      <span className="sr-only">Cargando el dashboard de tu atractivo…</span>
      <div aria-hidden="true" className="space-y-5 motion-safe:animate-pulse">
        <div className="h-44 rounded-2xl bg-[#e1e9df]" />
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="h-28 rounded-2xl bg-[#e1e9df]" />
          ))}
        </div>
        <div className="grid gap-5 xl:grid-cols-[1.25fr_1fr]">
          <div className="h-80 rounded-2xl bg-[#e1e9df]" />
          <div className="h-80 rounded-2xl bg-[#e1e9df]" />
        </div>
      </div>
    </div>
  );
}

export async function DashboardEncargado({
  consulta,
}: {
  consulta: Promise<ConsultaDashboard>;
}) {
  await connection();
  const perfil = await accesoPanel();
  if (!perfil) return null;
  if (perfil.rol === "SUPER_ADMIN") redirect("/superadmin");
  const parametros = await consulta;
  const meses = ["3", "6", "12"].includes(parametros.meses ?? "")
    ? parametros.meses!
    : "3";
  const respuesta = await solicitarVisitas<Atractivo[]>(
    "/destinos/administracion/resumen",
  );
  if (!respuesta.ok)
    return (
      <div className={`${panel} space-y-3 p-6`}>
        <p role="alert">{respuesta.mensaje}</p>
        <BotonActualizarPanel reintentar />
      </div>
    );
  const destino = respuesta.datos[0];
  if (!destino)
    return (
      <section className={`${panel} p-6`}>
        <h2 className="text-xl font-semibold">
          Tu próximo paso: asignar un atractivo
        </h2>
        <p className="mt-2 text-sm text-[#526a60]">
          El administrador de la plataforma debe asignar un destino a tu cuenta
          para comenzar.
        </p>
      </section>
    );
  const slug = encodeURIComponent(destino.slug);
  const [estadisticas, historial] = await Promise.all([
    solicitarVisitas<Estadisticas>(
      `/visitas/administracion/${slug}/estadisticas?meses=${meses}`,
    ),
    solicitarVisitas<HistorialVisitas>(
      `/visitas/administracion/${slug}/historial?pagina=1`,
    ),
  ]);
  const datos = estadisticas.ok ? estadisticas.datos : null;
  const publicado = destino.estadoEditorial === "publicada";
  const filtro = new URLSearchParams({ destino: destino.slug });
  const volver = `/administracion?meses=${meses}`;
  const elegido = datos?.recientes.find(({ id }) => id === parametros.resena);
  const conversion =
    datos && datos.totalVisitas > 0
      ? (datos.visitasConResena / datos.totalVisitas) * 100
      : null;
  const metricas = datos
    ? [
        {
          titulo: "Visitas verificadas",
          valor: numero.format(datos.totalVisitas),
          texto: "Presencia confirmada con QR",
          simbolo: "visita",
        },
        {
          titulo: "Reseñas publicadas",
          valor: numero.format(datos.totalResenas),
          texto: "Opiniones recibidas en el período",
          simbolo: "resena",
        },
        {
          titulo: "Calificación media",
          valor:
            datos.promedio === null
              ? "Sin reseñas"
              : `${numero.format(datos.promedio)} / 5`,
          texto: "Según las reseñas del período",
          simbolo: "estrella",
        },
        {
          titulo: "Visitas con reseña",
          valor:
            conversion === null
              ? "Sin visitas"
              : `${numero.format(conversion)} %`,
          texto: `${datos.visitasConResena} de ${datos.totalVisitas} visitas del período`,
          simbolo: "conversion",
        },
      ]
    : [];
  const maximo = Math.max(
    1,
    ...(datos?.tendencia.flatMap((p) => [p.total, p.resenas]) ?? []),
  );
  return (
    <div className="space-y-5 text-[#14382e]">
      <section className={`${panel} overflow-hidden`}>
        <div className="grid sm:grid-cols-[minmax(0,1fr)_14rem] xl:grid-cols-[minmax(0,1fr)_19rem]">
          <div className="min-w-0 p-5 sm:p-6">
            <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-[#526a60]">
              <span>
                {categorias[destino.categoria]} ·{" "}
                {provincias[destino.provincia]}
              </span>
              <span className="rounded-full bg-[#edf4ed] px-2.5 py-1 font-semibold text-[#315b43]">
                {estadosFicha[destino.estadoEditorial]}
              </span>
            </div>
            <h2 className="wrap-anywhere font-serif text-2xl leading-tight sm:text-3xl">
              {destino.nombre}
            </h2>
            <p className="mt-2 text-sm text-[#526a60]">{destino.ubicacion}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                href={`/administracion/atractivos/${slug}`}
                className={accion}
              >
                Gestionar mi atractivo
              </Link>
              {publicado && (
                <Link
                  href={enlaceFicha(destino.slug)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={accion}
                >
                  Ver sitio público{" "}
                  <span aria-hidden="true" className="ml-2">
                    ↗
                  </span>
                  <span className="sr-only"> (abre otra pestaña)</span>
                </Link>
              )}
            </div>
          </div>
          {destino.imagenUrl && (
            <div className="relative hidden min-h-44 bg-[#e1e9df] sm:block">
              <Image
                src={destino.imagenUrl}
                alt=""
                fill
                sizes="(min-width: 1280px) 304px, 224px"
                unoptimized={!destino.imagenUrl.startsWith("/")}
                className="object-cover"
              />
            </div>
          )}
        </div>
      </section>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">Así va tu atractivo</h2>
          <p className="mt-1 text-xs text-[#526a60]">
            {datos ? (
              <>
                Desde {fecha.format(new Date(datos.desde))}. Actualizado:{" "}
                <time dateTime={datos.actualizadoEn}>
                  {fecha.format(new Date(datos.actualizadoEn))}
                </time>
                .
              </>
            ) : (
              "Consulta la actividad de tu atractivo."
            )}
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-4">
          <Form
            action="/administracion"
            className="flex flex-wrap items-end gap-2"
          >
            <label className="grid gap-1 text-xs font-semibold">
              Período
              <select
                name="meses"
                defaultValue={meses}
                key={meses}
                className="min-h-11 rounded-xl border border-[#ccd9cf] bg-white px-3 text-sm"
              >
                <option value="3">Últimos 3 meses</option>
                <option value="6">Últimos 6 meses</option>
                <option value="12">Últimos 12 meses</option>
              </select>
            </label>
            <button className={accion}>Aplicar</button>
          </Form>
          <div className="pb-2">
            <BotonActualizarPanel />
          </div>
        </div>
      </div>
      {!estadisticas.ok && (
        <div
          role="alert"
          className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950"
        >
          No pudimos cargar las estadísticas. {estadisticas.mensaje}{" "}
          <BotonActualizarPanel reintentar />
        </div>
      )}
      <dl className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {metricas.map((m) => (
          <div key={m.titulo} className={`${panel} p-4 sm:p-5`}>
            <dt className="flex items-center gap-2 text-sm font-medium text-[#526a60]">
              <IconoIndicador tipo={m.simbolo} />
              {m.titulo}
            </dt>
            <dd className="mt-3 wrap-anywhere text-2xl font-semibold tabular-nums sm:text-3xl">
              {m.valor}
            </dd>
            <dd className="mt-2 text-xs leading-relaxed text-[#526a60]">
              {m.texto}
            </dd>
          </div>
        ))}
      </dl>
      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <div className="min-w-0 space-y-5">
          {datos && (
            <section className={`${panel} p-5 sm:p-6`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold">
                    Actividad del período
                  </h2>
                  <p className="mt-1 text-sm text-[#526a60]">
                    Visitas verificadas y reseñas publicadas por mes.
                  </p>
                </div>
                <Link
                  href={`/administracion/estadisticas?${filtro}&meses=${meses}`}
                  className="inline-flex min-h-11 items-center text-sm font-semibold underline underline-offset-4"
                >
                  Ver estadísticas
                </Link>
              </div>
              <div className="mt-4 flex gap-4 text-xs text-[#526a60]">
                <span className="flex items-center gap-2">
                  <span className="size-2.5 rounded-sm bg-[#174238]" />
                  Visitas
                </span>
                <span className="flex items-center gap-2">
                  <span className="size-2.5 rounded-sm bg-[#b17b3f]" />
                  Reseñas
                </span>
              </div>
              {datos.totalVisitas || datos.totalResenas ? (
                <div className="mt-5 overflow-x-auto pb-2">
                  <div
                    className="flex h-48 min-w-fit items-end gap-3"
                    role="img"
                    aria-label="Evolución mensual. Los datos exactos están en la tabla siguiente."
                  >
                    {datos.tendencia.map((p) => (
                      <div
                        key={p.mes}
                        className="flex min-w-8 flex-1 flex-col items-center gap-2"
                      >
                        <div
                          className="flex h-36 w-full items-end justify-center gap-1"
                          aria-hidden="true"
                        >
                          <div
                            title={`${p.total} visitas`}
                            style={{ height: `${(p.total / maximo) * 100}%` }}
                            className="w-3 max-w-5 flex-1 rounded-t bg-[#174238]"
                          />
                          <div
                            title={`${p.resenas} reseñas`}
                            style={{ height: `${(p.resenas / maximo) * 100}%` }}
                            className="w-3 max-w-5 flex-1 rounded-t bg-[#b17b3f]"
                          />
                        </div>
                        <span className="text-xs text-[#526a60]">
                          {mesCorto.format(new Date(`${p.mes}-01T00:00:00Z`))}
                          <span className="sr-only"> {p.mes.slice(0, 4)}</span>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="my-8 rounded-xl bg-[#f3f7f1] p-5 text-sm text-[#526a60]">
                  Todavía no hay actividad en este período. Comparte el QR en tu
                  atractivo para comenzar a registrar visitas.
                </p>
              )}
              <details className="mt-3 text-sm">
                <summary className="w-fit cursor-pointer py-2 font-semibold">
                  Ver datos por mes
                </summary>
                <table className="mt-2 w-full text-left text-xs tabular-nums">
                  <caption className="sr-only">
                    Actividad mensual del atractivo
                  </caption>
                  <thead>
                    <tr className="border-b">
                      <th className="py-2" scope="col">
                        Mes
                      </th>
                      <th scope="col">Visitas</th>
                      <th scope="col">Reseñas</th>
                    </tr>
                  </thead>
                  <tbody>
                    {datos.tendencia.map((p) => (
                      <tr key={p.mes} className="border-b border-[#edf1e9]">
                        <th className="py-2 font-normal" scope="row">
                          {p.mes}
                        </th>
                        <td>{p.total}</td>
                        <td>{p.resenas}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </details>
              <p className="mt-3 text-xs leading-relaxed text-[#526a60]">
                Las reseñas se cuentan por su fecha de publicación. La
                conversión usa las visitas del período que ya tienen una reseña
                visible.
              </p>
            </section>
          )}
          <section className="rounded-2xl bg-[#173b32] p-5 text-white sm:p-6">
            <div className="flex items-center gap-3">
              <IconoIndicador tipo="qr" />
              <h2 className="text-lg font-semibold">Recibe a tus visitantes</h2>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-[#dcebe1]">
              {publicado
                ? "Muestra el QR en el ingreso para que cada visitante confirme su visita y comparta su experiencia."
                : "Habilita tu atractivo para mostrar el QR y recibir visitas verificadas."}
            </p>
            {publicado && (
              <div className="mt-4 flex flex-wrap gap-2">
                <Link
                  href={`/pantalla-qr?${filtro}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-11 items-center rounded-xl bg-white px-4 text-sm font-semibold text-[#173b32] hover:bg-[#edf4ed]"
                >
                  Abrir pantalla QR
                  <span className="sr-only"> en otra pestaña</span>
                </Link>
                <Link
                  href={`/administracion/visitas?${filtro}`}
                  className="inline-flex min-h-11 items-center rounded-xl border border-white/40 px-4 text-sm font-semibold hover:bg-white/10"
                >
                  Gestionar QR
                </Link>
              </div>
            )}
          </section>
          <section className={`${panel} p-5 sm:p-6`}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-semibold">
                Últimas visitas registradas
              </h2>
              <Link
                href={`/administracion/visitas?${filtro}`}
                className="inline-flex min-h-11 items-center text-sm font-semibold underline underline-offset-4"
              >
                Ver visitas
              </Link>
            </div>
            {historial.ok ? (
              historial.datos.registros.length ? (
                <ul className="mt-2 divide-y divide-[#edf1e9]">
                  {historial.datos.registros.slice(0, 3).map((v) => (
                    <li
                      key={v.id}
                      className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm"
                    >
                      <span className="flex items-center gap-2">
                        <span
                          aria-hidden="true"
                          className="size-2 rounded-full bg-emerald-600"
                        />
                        Visita verificada
                      </span>
                      <time
                        dateTime={v.verificadaEn}
                        className="text-xs text-[#526a60]"
                      >
                        {fechaVisita.format(new Date(v.verificadaEn))}
                      </time>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-sm text-[#526a60]">
                  Aquí aparecerán las visitas confirmadas mediante QR.
                </p>
              )
            ) : (
              <div className="text-sm">
                <p role="alert">No pudimos cargar las últimas visitas.</p>
                <BotonActualizarPanel reintentar />
              </div>
            )}
            <p className="mt-2 text-xs text-[#526a60]">
              Actividad más reciente de todo el historial.
            </p>
          </section>
        </div>
        <section className={`${panel} p-5 sm:p-6`}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-semibold">Opiniones recientes</h2>
              <p className="mt-1 text-xs text-[#526a60]">
                Escucha a quienes visitaron tu atractivo.
              </p>
            </div>
            <Link
              href={`/administracion/resenas?${filtro}`}
              className="inline-flex min-h-11 items-center text-sm font-semibold underline underline-offset-4"
            >
              Ver todas
            </Link>
          </div>
          {datos?.recientes.length ? (
            <div className="divide-y divide-[#e5ebe2]">
              {datos.recientes.slice(0, 3).map((resena) => (
                <OpinionResumen
                  key={resena.id}
                  resena={resena}
                  href={`${volver}&resena=${encodeURIComponent(resena.id)}`}
                />
              ))}
            </div>
          ) : (
            <p className="mt-5 rounded-xl bg-[#f3f7f1] p-4 text-sm text-[#526a60]">
              {datos
                ? "Aún no hay reseñas en este período. Cuando lleguen, podrás leerlas y responder desde aquí."
                : "Las opiniones estarán disponibles cuando se restablezca la conexión."}
            </p>
          )}
        </section>
      </div>
      <Link href="/administracion/beneficios" className={accion}>
        Gestionar beneficios y validar comprobantes
      </Link>
      <VisibilidadAtractivo
        slug={destino.slug}
        nombre={destino.nombre}
        estado={destino.estadoEditorial}
      />
      {elegido && (
        <DetalleOpinion key={elegido.id} resena={elegido} volver={volver} />
      )}
    </div>
  );
}

function IconoIndicador({ tipo }: { tipo: string }) {
  const trazos: Record<string, string> = {
    visita: "M12 21s7-6 7-12a7 7 0 0 0-14 0c0 6 7 12 7 12ZM9 9l2 2 4-4",
    resena: "M4 4h16v12H9l-5 4V4Zm4 4h8M8 12h5",
    estrella:
      "m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9L12 3Z",
    conversion: "M5 18V9m7 9V4m7 14v-6M3 21h18",
    qr: "M3 3h6v6H3V3Zm12 0h6v6h-6V3ZM3 15h6v6H3v-6Zm12 0h3v3h3v3h-6v-6Z",
  };
  return (
    <svg
      aria-hidden="true"
      className="size-5 shrink-0"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={trazos[tipo] ?? trazos.visita} />
    </svg>
  );
}
