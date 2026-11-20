import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { Navbar } from "@/features/navegacion/navbar";
import { PiePagina } from "@/features/navegacion/pie-pagina";
import {
  EsqueletoActividad,
  HistorialPerfil,
} from "@/features/perfil/historial";
import { EditarPerfilVisitante } from "@/features/perfil/editar-perfil-visitante";
import { enlaceHistorial, type ResumenPerfil } from "@/features/perfil/tipos";
import { solicitarVisitas } from "@/features/visitas/api";
import { BotonActualizarPanel } from "@/features/visitas/boton-actualizar-panel";

export const metadata: Metadata = {
  title: "Mi perfil · Munay",
  robots: { index: false, follow: false },
};

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const niveles = [
  { nombre: "Explorador", minimo: 0 },
  { nombre: "Colaborador", minimo: 50 },
  { nombre: "Guía Munay", minimo: 150 },
  { nombre: "Embajador", minimo: 300 },
];
const numero = new Intl.NumberFormat("es-PE");
const panel = "rounded-2xl border border-[#d5e0d6] bg-white p-5";
const distribucion =
  "grid min-w-0 items-start gap-5 lg:grid-cols-[minmax(0,1fr)_19rem] xl:grid-cols-[minmax(0,1fr)_21rem]";

function Ranking({ resumen }: { resumen: ResumenPerfil }) {
  function filas(inicio: number, fin?: number) {
    return resumen.ranking.slice(inicio, fin).map((fila, indice) => (
      <li
        key={`${fila.posicion}-${inicio + indice}`}
        className={`flex min-w-0 items-center gap-3 rounded-lg px-2 py-3 text-sm ${fila.propia ? "bg-[#edf4ed] font-semibold" : ""}`}
      >
        <span className="min-w-6 text-center font-semibold tabular-nums text-[#526a60]">
          {fila.posicion}
        </span>
        <span className="min-w-0 flex-1 wrap-anywhere">
          {fila.nombre}
          {fila.propia && (
            <span className="ml-1 text-xs text-[#526a60]">(tú)</span>
          )}
        </span>
        <span className="shrink-0 tabular-nums">
          {numero.format(fila.saldo)} pts
        </span>
      </li>
    ));
  }

  return (
    <section id="ranking" className={`${panel} scroll-mt-28`}>
      <h2 className="font-serif text-xl">La comunidad Munay</h2>
      <p className="mt-2 text-sm leading-relaxed text-[#526a60]">
        {resumen.posicion
          ? `Ocupas la posición ${resumen.posicion} entre quienes comparten sus experiencias.`
          : "Tu primera reseña verificada te permite participar en el ranking."}
      </p>
      {resumen.ranking.length > 0 && (
        <details className="mt-3">
          <summary className="min-h-11 cursor-pointer content-center text-sm font-semibold text-[#174238] underline underline-offset-4">
            Ver ranking de colaboradores
          </summary>
          <ol
            aria-label="Ranking de colaboradores"
            className="mt-2 divide-y divide-[#dce3da]"
          >
            {filas(0)}
          </ol>
        </details>
      )}
    </section>
  );
}

async function ContenidoPerfil({ searchParams }: Props) {
  await connection();
  const [respuesta, consulta] = await Promise.all([
    solicitarVisitas<ResumenPerfil>("/puntos/mi-resumen"),
    searchParams,
  ]);
  if (!respuesta.ok) {
    if (respuesta.estado === 401) redirect("/ingresar?aviso=sesion");
    if (respuesta.estado === 403) redirect("/destinos");
    return (
      <div className={`${panel} space-y-3`}>
        <h1 className="font-serif text-2xl">Tu perfil en Munay</h1>
        <p role="alert" className="text-sm text-stone-700">
          No pudimos cargar tu perfil. Tu actividad estará disponible cuando
          restablezcamos la conexión.
        </p>
        <BotonActualizarPanel reintentar />
      </div>
    );
  }
  const resumen = respuesta.datos;
  const saldoNivel = Math.max(0, resumen.saldo);
  const indice = Math.max(
    0,
    niveles.findLastIndex(({ minimo }) => saldoNivel >= minimo),
  );
  const nivel = niveles[indice];
  const siguiente = niveles[indice + 1];
  const progreso = siguiente
    ? Math.min(
        100,
        Math.max(
          0,
          Math.floor(
            (100 * (saldoNivel - nivel.minimo)) /
              (siguiente.minimo - nivel.minimo),
          ),
        ),
      )
    : 100;
  const iniciales = resumen.nombre
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((parte) => parte[0])
    .join("")
    .toLocaleUpperCase("es-PE");
  const metricas = [
    {
      nombre: "Visitas verificadas",
      valor: resumen.visitas,
      enlace: enlaceHistorial("visitas"),
      detalle: "Tu recorrido en Munay",
    },
    {
      nombre: "Reseñas publicadas",
      valor: resumen.resenas,
      enlace: enlaceHistorial("resenas"),
      detalle: "Experiencias que compartiste",
    },
    {
      nombre: "Puntos disponibles",
      valor: resumen.saldo,
      enlace: enlaceHistorial("puntos"),
      detalle: "Consulta tus movimientos",
    },
  ];

  return (
    <>
      <header className="flex flex-col gap-5 border-b border-[#cddbcf] pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <div
            aria-hidden="true"
            className="grid size-16 shrink-0 place-items-center rounded-2xl bg-[#174238] font-serif text-2xl text-white sm:size-20 sm:text-3xl"
          >
            {iniciales || "M"}
          </div>
          <div className="min-w-0 space-y-1">
            <p className="text-sm font-medium text-[#526a60]">Mi perfil</p>
            <h1 className="wrap-anywhere font-serif text-3xl leading-tight sm:text-4xl">
              {resumen.nombre}
            </h1>
            <p className="text-sm text-[#526a60]">
              Visitante de Munay <span aria-hidden="true">·</span>{" "}
              {nivel.nombre}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/destinos"
            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#174238] px-4 text-sm font-semibold text-white hover:bg-[#23574a]"
          >
            Explorar lugares
          </Link>
          <EditarPerfilVisitante
            nombre={resumen.nombre}
            correo={resumen.correo}
          />
        </div>
      </header>
      <dl className="grid grid-cols-3 gap-2 sm:gap-3">
        {metricas.map((metrica) => (
          <div
            key={metrica.nombre}
            className="min-w-0 rounded-2xl border border-[#d5e0d6] bg-white px-3 py-4 sm:p-5"
          >
            <dt className="text-xs font-medium text-[#526a60] sm:text-sm">
              {metrica.nombre}
            </dt>
            <dd className="mt-1">
              <Link
                href={metrica.enlace}
                className="inline-flex min-h-11 items-center gap-3 rounded font-semibold text-[#174238] focus-visible:outline-2 focus-visible:outline-offset-2"
              >
                <span className="text-2xl tabular-nums sm:text-3xl">
                  {numero.format(metrica.valor)}
                </span>
                <span
                  aria-hidden="true"
                  className="hidden text-lg text-[#638d77] sm:inline"
                >
                  ↗
                </span>
                <span className="sr-only">{metrica.detalle}</span>
              </Link>
            </dd>
            <dd className="mt-1 hidden text-xs text-[#526a60] sm:block">
              {metrica.detalle}
            </dd>
          </div>
        ))}
      </dl>
      <section className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#c7d7cb] bg-white p-5">
        <div>
          <h2 className="text-lg font-semibold text-[#174238]">
            Tus puntos, nuevas experiencias
          </h2>
          <p className="mt-1 text-sm text-[#526a60]">
            Consulta los beneficios aprobados y conserva tus comprobantes de
            canje.
          </p>
        </div>
        <Link
          href="/beneficios"
          className="inline-flex min-h-11 items-center rounded-xl bg-[#174238] px-4 text-sm font-semibold text-white"
        >
          Ver beneficios y mis canjes
        </Link>
      </section>
      <div className={distribucion}>
        <div className="min-w-0">
          <HistorialPerfil consulta={consulta} resumen={resumen} />
        </div>
        <aside className="min-w-0 space-y-4">
          <section className="rounded-2xl bg-[#174238] p-5 text-white">
            <p className="text-sm font-medium text-[#dcebe1]">
              Tu nivel en Munay
            </p>
            <h2 className="mt-1 font-serif text-2xl">{nivel.nombre}</h2>
            <p className="mt-3 text-sm text-[#dcebe1]">
              {numero.format(resumen.saldo)} puntos acumulados
            </p>
            <div
              role="progressbar"
              aria-valuenow={progreso}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={
                siguiente
                  ? `Progreso hacia ${siguiente.nombre}`
                  : "Nivel máximo alcanzado"
              }
              className="mt-3 h-2 overflow-hidden rounded-full bg-white/20"
            >
              <div
                className="h-full rounded-full bg-[#b6d6b6]"
                style={{ width: `${progreso}%` }}
              />
            </div>
            <p className="mt-3 text-sm leading-relaxed text-[#dcebe1]">
              {siguiente
                ? `Te faltan ${numero.format(siguiente.minimo - saldoNivel)} puntos para alcanzar el nivel ${siguiente.nombre}.`
                : "Alcanzaste el nivel más alto. Sigue compartiendo tus experiencias con la comunidad."}
            </p>
            {resumen.puntosPendientes > 0 && (
              <p className="mt-4 rounded-xl bg-white/10 p-3 text-sm">
                Hasta {numero.format(resumen.puntosPendientes)} puntos por
                acreditar. Tus reseñas están pendientes de revisión.
              </p>
            )}
            <details className="mt-4 border-t border-white/20 pt-2">
              <summary className="min-h-11 cursor-pointer content-center text-sm font-semibold">
                Cómo sumar puntos
              </summary>
              <ul className="space-y-2 pb-2 text-sm leading-relaxed text-[#dcebe1]">
                <li>10 puntos por una reseña con visita verificada.</li>
                <li>
                  5 puntos adicionales por una selfie declarada en el lugar.
                </li>
                <li>Los puntos están sujetos a revisión de la publicación.</li>
              </ul>
            </details>
          </section>
          <Ranking resumen={resumen} />
          <section className={panel}>
            <h2 className="font-serif text-xl">Próximos beneficios</h2>
            <p className="mt-2 text-sm leading-relaxed text-[#526a60]">
              Estamos preparando entradas y descuentos en lugares participantes.
              Aquí podrás consultar los premios y sus condiciones cuando estén
              disponibles.
            </p>
            <Link
              href={enlaceHistorial("puntos")}
              className="mt-2 inline-flex min-h-11 items-center text-sm font-semibold text-[#174238] underline underline-offset-4"
            >
              Ver mis movimientos
            </Link>
          </section>
        </aside>
      </div>
    </>
  );
}

function EsqueletoPerfil() {
  return (
    <div role="status" className="space-y-6 motion-safe:animate-pulse">
      <span className="sr-only">Cargando tu perfil</span>
      <div aria-hidden="true" className="flex gap-4">
        <div className="size-20 rounded-2xl bg-[#dce6dc]" />
        <div className="flex-1 space-y-3 py-2">
          <div className="h-4 w-24 rounded bg-[#dce6dc]" />
          <div className="h-8 w-3/5 max-w-sm rounded bg-[#dce6dc]" />
        </div>
      </div>
      <div aria-hidden="true" className="grid grid-cols-3 gap-2 sm:gap-3">
        {[1, 2, 3].map((item) => (
          <div key={item} className="h-28 rounded-2xl bg-[#dce6dc]" />
        ))}
      </div>
      <section className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#c7d7cb] bg-white p-5">
        <div>
          <h2 className="text-lg font-semibold text-[#174238]">
            Tus puntos, nuevas experiencias
          </h2>
          <p className="mt-1 text-sm text-[#526a60]">
            Consulta los beneficios aprobados y conserva tus comprobantes de
            canje.
          </p>
        </div>
        <Link
          href="/beneficios"
          className="inline-flex min-h-11 items-center rounded-xl bg-[#174238] px-4 text-sm font-semibold text-white"
        >
          Ver beneficios y mis canjes
        </Link>
      </section>
      <div className={distribucion}>
        <div className={panel}>
          <EsqueletoActividad />
        </div>
        <div aria-hidden="true" className="h-64 rounded-2xl bg-[#dce6dc]" />
      </div>
    </div>
  );
}

export default function PaginaMiPerfil(props: Props) {
  return (
    <div className="flex min-h-dvh flex-col bg-[#f4f6f0] text-[#173b32]">
      <Navbar />
      <main className="mx-auto w-full max-w-7xl flex-1 space-y-6 px-4 py-7 sm:px-8 sm:py-10">
        <Suspense fallback={<EsqueletoPerfil />}>
          <ContenidoPerfil {...props} />
        </Suspense>
      </main>
      <PiePagina />
    </div>
  );
}
