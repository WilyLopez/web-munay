import { valorBeneficio } from "@/features/beneficios/condiciones";
import { Suspense } from "react";
import Link from "next/link";
import Form from "next/form";
import { redirect } from "next/navigation";
import { Navbar } from "@/features/navegacion/navbar";
import { PiePagina } from "@/features/navegacion/pie-pagina";
import { solicitarVisitas } from "@/features/visitas/api";
import { BotonActualizarPanel } from "@/features/visitas/boton-actualizar-panel";
import { CanjearBeneficio, ReciboCanje } from "@/features/beneficios/canje";
import type {
  CatalogoBeneficios,
  ComprobanteCanje,
} from "@/features/beneficios/tipos";

type Consulta = {
  categoria?: string;
  destino?: string;
  orden?: string;
  pagina?: string;
  seccion?: string;
};
const campo =
  "min-h-11 w-full rounded-xl border border-[#c7d7cb] bg-white px-3 text-sm";
async function Contenido({ consulta }: { consulta: Promise<Consulta> }) {
  const parametros = await consulta;
  const pagina = /^[1-9]\d{0,3}$/.test(parametros.pagina ?? "")
    ? Number(parametros.pagina)
    : 1;
  const filtros = new URLSearchParams({ pagina: String(pagina) });
  for (const clave of ["categoria", "destino", "orden"] as const)
    if (parametros[clave]) filtros.set(clave, parametros[clave]!);
  const resultado = await solicitarVisitas<CatalogoBeneficios>(
    `/beneficios?${filtros}`,
  );
  if (!resultado.ok) {
    if (resultado.estado === 401)
      redirect(`/ingresar?volver=${encodeURIComponent("/beneficios")}`);
    return (
      <div className="space-y-3 rounded-xl bg-white p-5">
        <p role="alert">{resultado.mensaje}</p>
        <BotonActualizarPanel reintentar />
      </div>
    );
  }
  const datos = resultado.datos;
  const canjes = parametros.seccion === "canjes";
  const historial = canjes
    ? await solicitarVisitas<{ canjes: ComprobanteCanje[]; hayMas: boolean }>(
        `/beneficios/mis-canjes?pagina=${pagina}`,
      )
    : null;
  const hayMas = canjes
    ? historial?.ok && historial.datos.hayMas
    : datos.hayMas;
  const enlace = (numero: number) => {
    const q = new URLSearchParams(filtros);
    q.set("pagina", String(numero));
    if (canjes) q.set("seccion", "canjes");
    return `/beneficios?${q}`;
  };
  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-5">
        <div className="max-w-2xl">
          <h1 className="font-serif text-3xl sm:text-4xl">
            Tus experiencias tienen recompensa
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-[#526a60]">
            Usa tus puntos MUNAY en beneficios aprobados por la plataforma.
            Revisa las condiciones y confirma solo cuando estés listo.
          </p>
        </div>
        <div className="rounded-2xl bg-[#174238] px-6 py-4 text-white">
          <p className="text-sm text-[#dcebe1]">Tu saldo disponible</p>
          <p className="mt-1 text-3xl font-semibold tabular-nums">
            {datos.saldo} <span className="text-sm">puntos</span>
          </p>
        </div>
      </header>
      <nav
        aria-label="Beneficios y comprobantes"
        className="flex flex-wrap gap-2 border-b border-[#d5e0d6] pb-3"
      >
        {[
          ["/beneficios", "Beneficios disponibles"],
          ["/beneficios?seccion=canjes", "Mis canjes"],
        ].map(([href, texto], i) => (
          <Link
            key={href}
            href={href}
            aria-current={canjes === (i === 1) ? "page" : undefined}
            className="inline-flex min-h-11 items-center rounded-xl px-4 text-sm font-semibold hover:bg-[#e6eee6] aria-[current=page]:bg-[#174238] aria-[current=page]:text-white"
          >
            {texto}
          </Link>
        ))}
        <Link
          href="/mi-perfil"
          className="ml-auto inline-flex min-h-11 items-center text-sm font-semibold underline"
        >
          Mi perfil y puntos
        </Link>
      </nav>
      {canjes ? (
        historial?.ok ? (
          historial.datos.canjes.length ? (
            <div className="grid items-start gap-5 lg:grid-cols-2">
              {historial.datos.canjes.map((canje) => (
                <ReciboCanje key={canje.id} canje={canje} />
              ))}
            </div>
          ) : (
            <Vacio texto="Todavía no tienes canjes. Cuando confirmes un beneficio, encontrarás aquí su código y su comprobante." />
          )
        ) : (
          <div role="alert" className="rounded-xl bg-white p-5">
            No pudimos cargar tus canjes. <BotonActualizarPanel reintentar />
          </div>
        )
      ) : (
        <>
          <Form
            action="/beneficios"
            className="grid items-end gap-3 rounded-2xl border border-[#dce3da] bg-white p-4 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_auto]"
          >
            <label className="grid gap-1 text-sm font-semibold">
              Categoría
              <select
                name="categoria"
                defaultValue={parametros.categoria ?? ""}
                className={campo}
              >
                <option value="">Todos</option>
                <option value="GASTRONOMIA">Gastronomía</option>
                <option value="EXPERIENCIAS">Experiencias</option>
              </select>
            </label>
            <label className="grid gap-1 text-sm font-semibold">
              Atractivo
              <select
                name="destino"
                defaultValue={parametros.destino ?? ""}
                className={campo}
              >
                <option value="">Todos los atractivos</option>
                {datos.destinos.map((d) => (
                  <option key={d.id} value={d.slug}>
                    {d.nombre}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1 text-sm font-semibold">
              Ordenar por
              <select
                name="orden"
                defaultValue={parametros.orden ?? "recientes"}
                className={campo}
              >
                <option value="recientes">Más recientes</option>
                <option value="costo">Menor costo</option>
              </select>
            </label>
            <button className="min-h-11 rounded-xl bg-[#174238] px-4 text-sm font-semibold text-white">
              Aplicar filtros
            </button>
          </Form>
          <div className="flex flex-wrap justify-between gap-3 text-sm">
            <p>{datos.total} beneficios encontrados</p>
            <Link href="/beneficios" className="font-semibold underline">
              Limpiar filtros
            </Link>
          </div>
          {datos.beneficios.length ? (
            <div className="grid items-start gap-5 md:grid-cols-2 xl:grid-cols-3">
              {datos.beneficios.map((beneficio) => (
                <article
                  key={beneficio.id}
                  className="space-y-4 rounded-2xl border border-[#dce3da] bg-white p-5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span className="rounded-full bg-[#edf4ed] px-3 py-1">
                      {beneficio.categoria === "GASTRONOMIA"
                        ? "Gastronomía"
                        : "Experiencia"}
                    </span>
                    <span className="font-semibold text-[#526a60]">
                      {beneficio.disponibles} disponibles
                    </span>
                  </div>
                  <h2 className="wrap-anywhere text-xl font-semibold">
                    {beneficio.nombre}
                  </h2>
                  <p className="text-sm font-semibold text-[#174238]">
                    {valorBeneficio(beneficio)}
                  </p>
                  <p className="text-sm text-[#526a60]">
                    {beneficio.local} · {beneficio.destino.nombre}
                  </p>
                  <p className="line-clamp-3 whitespace-pre-wrap text-sm leading-relaxed text-[#526a60]">
                    {beneficio.condiciones}
                  </p>
                  <p className="text-2xl font-semibold tabular-nums">
                    {beneficio.costo}{" "}
                    <span className="text-sm font-normal">puntos</span>
                  </p>
                  <CanjearBeneficio
                    beneficio={beneficio}
                    saldo={datos.saldo}
                    usuarioId={datos.usuarioId}
                  />
                </article>
              ))}
            </div>
          ) : (
            <Vacio
              texto={
                datos.total
                  ? "No hay beneficios en esta página."
                  : "Todavía no hay beneficios aprobados que coincidan con estos filtros. No se descontarán puntos hasta que confirmes un canje."
              }
            />
          )}
        </>
      )}
      {(pagina > 1 || hayMas) && (
        <nav
          aria-label="Páginas de beneficios"
          className="flex items-center gap-4 text-sm font-semibold"
        >
          {pagina > 1 && (
            <Link
              className="inline-flex min-h-11 items-center underline"
              href={enlace(pagina - 1)}
            >
              Anterior
            </Link>
          )}
          <span>Página {pagina}</span>
          {hayMas && (
            <Link
              className="inline-flex min-h-11 items-center underline"
              href={enlace(pagina + 1)}
            >
              Siguiente
            </Link>
          )}
        </nav>
      )}
    </div>
  );
}
function Vacio({ texto }: { texto: string }) {
  return (
    <div className="rounded-2xl border border-[#dce3da] bg-white p-6">
      <h2 className="text-lg font-semibold">Sigue explorando Munay</h2>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#526a60]">
        {texto}
      </p>
      <Link
        href="/destinos"
        className="mt-4 inline-flex min-h-11 items-center font-semibold underline"
      >
        Explorar destinos
      </Link>
    </div>
  );
}
export default function PaginaBeneficios({
  searchParams,
}: {
  searchParams: Promise<Consulta>;
}) {
  return (
    <div className="flex min-h-dvh flex-col bg-[#f4f6f0] text-[#14382e]">
      <Navbar />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-7 sm:px-6 sm:py-10">
        <Suspense
          fallback={
            <div
              role="status"
              className="h-80 rounded-2xl bg-[#e0e9e0] motion-safe:animate-pulse"
            >
              <span className="sr-only">Cargando beneficios…</span>
            </div>
          }
        >
          <Contenido consulta={searchParams} />
        </Suspense>
      </main>
      <PiePagina />
    </div>
  );
}
