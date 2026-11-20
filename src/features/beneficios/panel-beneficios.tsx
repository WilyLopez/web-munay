import { Suspense } from "react";
import Link from "next/link";
import Form from "next/form";
import { accesoPanel } from "@/features/administracion/acceso";
import { solicitarVisitas } from "@/features/visitas/api";
import { BotonActualizarPanel } from "@/features/visitas/boton-actualizar-panel";
import { ValidarComprobante } from "./gestion";
import { EditorBeneficioModal } from "./editor-beneficio-modal";
import { valorBeneficio } from "./condiciones";
import {
  estadosBeneficio,
  type CatalogoBeneficios,
  type CanjesRecibidos,
} from "./tipos";

export type ConsultaGestionBeneficios = {
  pagina?: string;
  seccion?: string;
  estado?: string;
  buscar?: string;
  editar?: string;
  crear?: string;
};
const campo =
  "min-h-11 w-full rounded-xl border border-[#c7d7cb] bg-white px-3 text-sm";
const fecha = new Intl.DateTimeFormat("es-PE", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "America/Lima",
});
const tarjeta =
  "min-w-0 rounded-2xl border border-[#dce3da] bg-white p-5 sm:p-6";
const boton =
  "inline-flex min-h-11 items-center justify-center rounded-xl border border-[#c7d7cb] px-4 text-sm font-semibold hover:bg-[#edf4ed]";
async function Contenido({
  global,
  consulta,
}: {
  global: boolean;
  consulta: Promise<ConsultaGestionBeneficios>;
}) {
  const perfil = await accesoPanel(global);
  if (!perfil) return null;
  const p = await consulta;
  const seccion = ["canjes", "validar"].includes(p.seccion ?? "")
    ? p.seccion!
    : "beneficios";
  const pagina = /^[1-9]\d{0,3}$/.test(p.pagina ?? "") ? Number(p.pagina) : 1;
  const ruta = global ? "/superadmin/beneficios" : "/administracion/beneficios";
  const filtros = new URLSearchParams({ seccion, pagina: String(pagina) });
  if (p.estado) filtros.set("estado", p.estado);
  if (p.buscar) filtros.set("buscar", p.buscar);
  const [indicadores, resultado] = await Promise.all([
    solicitarVisitas<{
      activos: number;
      pendientes: number;
      entregados: number;
      totalCanjes: number;
    }>("/beneficios/administracion/indicadores"),
    seccion === "validar"
      ? Promise.resolve(null)
      : seccion === "canjes"
        ? solicitarVisitas<CanjesRecibidos>(
            `/beneficios/administracion/canjes?${filtros}`,
          )
        : solicitarVisitas<CatalogoBeneficios>(
            `/beneficios/administracion?${filtros}`,
          ),
  ]);
  const volver = `${ruta}?${filtros}`;
  const datos =
    seccion === "beneficios" && resultado?.ok
      ? (resultado.datos as CatalogoBeneficios)
      : null;
  const recibidos =
    seccion === "canjes" && resultado?.ok
      ? (resultado.datos as CanjesRecibidos)
      : null;
  const elegido = datos?.beneficios.find((b) => b.id === p.editar);
  const enlacePagina = (n: number) => {
    const q = new URLSearchParams(filtros);
    q.set("pagina", String(n));
    return `${ruta}?${q}`;
  };
  return (
    <div className="space-y-5">
      {indicadores.ok ? (
        <dl className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          {[
            ["Beneficios activos", indicadores.datos.activos],
            ["Canjes por utilizar", indicadores.datos.pendientes],
            ["Beneficios entregados", indicadores.datos.entregados],
            ["Canjes registrados", indicadores.datos.totalCanjes],
          ].map(([titulo, valor]) => (
            <div key={titulo} className={tarjeta}>
              <dt className="text-sm text-[#526a60]">{titulo}</dt>
              <dd className="mt-2 text-3xl font-semibold tabular-nums">
                {valor}
              </dd>
            </div>
          ))}
        </dl>
      ) : (
        <p
          role="alert"
          className="rounded-xl bg-amber-50 p-4 text-sm text-amber-950"
        >
          No pudimos cargar los indicadores. <BotonActualizarPanel reintentar />
        </p>
      )}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <nav
          aria-label="Gestión de beneficios"
          className="flex flex-wrap gap-1 rounded-xl bg-[#eaf0e7] p-1"
        >
          {[
            ["beneficios", "Mis beneficios"],
            ["canjes", "Canjes recibidos"],
            ["validar", "Validar comprobante"],
          ].map(([clave, titulo]) => (
            <Link
              key={clave}
              href={`${ruta}?seccion=${clave}`}
              aria-current={seccion === clave ? "page" : undefined}
              className="inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-semibold hover:bg-white/70 aria-[current=page]:bg-[#174238] aria-[current=page]:text-white"
            >
              {titulo}
            </Link>
          ))}
        </nav>
        <BotonActualizarPanel />
      </div>
      {seccion === "validar" ? (
        <ValidarComprobante />
      ) : (
        <>
          <section className={tarjeta}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">
                  {seccion === "canjes"
                    ? "Comprobantes de tus visitantes"
                    : "Qué ofreces a cambio de puntos"}
                </h2>
                <p className="mt-1 text-xs text-[#526a60]">
                  {seccion === "canjes"
                    ? "Consulta la vigencia y quién confirmó cada entrega. El código se muestra parcialmente por privacidad."
                    : "El valor del beneficio y el costo en puntos son independientes. Las reglas para ganar puntos son generales de Munay."}
                </p>
              </div>
              {datos && (
                <Link
                  href={`${volver}&crear=1`}
                  scroll={false}
                  className={`${boton} bg-[#174238] text-white hover:bg-[#23574a]`}
                >
                  Crear beneficio
                </Link>
              )}
            </div>
            <Form
              key={filtros.toString()}
              action={ruta}
              className="mt-5 grid items-end gap-3 sm:grid-cols-[minmax(0,1fr)_14rem_auto]"
            >
              <input type="hidden" name="seccion" value={seccion} />
              <label className="grid gap-1 text-sm font-semibold">
                {seccion === "canjes"
                  ? "Buscar por beneficio o final del código"
                  : "Buscar beneficio o local"}
                <input
                  name="buscar"
                  defaultValue={p.buscar}
                  maxLength={120}
                  className={campo}
                  placeholder="Escribe para buscar…"
                />
              </label>
              <label className="grid gap-1 text-sm font-semibold">
                Estado
                <select
                  name="estado"
                  defaultValue={p.estado ?? ""}
                  className={campo}
                >
                  <option value="">Todos los estados</option>
                  {(seccion === "canjes"
                    ? [
                        ["vigentes", "Por utilizar"],
                        ["usados", "Utilizados"],
                        ["vencidos", "Vencidos"],
                      ]
                    : Object.entries(estadosBeneficio)
                  ).map(([valor, titulo]) => (
                    <option key={valor} value={valor}>
                      {titulo}
                    </option>
                  ))}
                </select>
              </label>
              <button
                className={`${boton} bg-[#174238] text-white hover:bg-[#23574a]`}
              >
                Aplicar filtros
              </button>
            </Form>
            <Link
              className="mt-3 inline-flex min-h-11 items-center text-sm font-semibold underline"
              href={`${ruta}?seccion=${seccion}`}
            >
              Limpiar filtros
            </Link>
          </section>
          {resultado && !resultado.ok && (
            <div role="alert" className={tarjeta}>
              <p>{resultado.mensaje}</p>
              <BotonActualizarPanel reintentar />
            </div>
          )}
          {datos && (
            <section className="overflow-hidden rounded-2xl border border-[#dce3da] bg-white">
              <h2 className="border-b border-[#dce3da] px-5 py-4 text-sm font-semibold">
                {datos.total} beneficios encontrados
              </h2>
              {datos.beneficios.length ? (
                <>
                  <div className="hidden overflow-x-auto md:block">
                    <table className="w-full text-left text-sm">
                      <caption className="sr-only">
                        Beneficios configurados del atractivo
                      </caption>
                      <thead className="bg-[#f4f7f0] text-xs text-[#526a60]">
                        <tr>
                          {[
                            "Beneficio y valor",
                            "Costo en puntos",
                            "Cupos",
                            "Vigencia",
                            "Estado",
                            "Acciones",
                          ].map((t) => (
                            <th
                              key={t}
                              scope="col"
                              className="px-4 py-3 font-semibold"
                            >
                              {t}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#e5ebe2]">
                        {datos.beneficios.map((b) => (
                          <tr key={b.id}>
                            <td className="max-w-80 px-4 py-4">
                              <p className="wrap-anywhere font-semibold">
                                {b.nombre}
                              </p>
                              <p className="mt-1 text-xs text-[#526a60]">
                                {valorBeneficio(b)} · {b.local}
                              </p>
                            </td>
                            <td className="px-4 py-4 font-semibold tabular-nums">
                              {b.costo} pts
                            </td>
                            <td className="px-4 py-4 tabular-nums">
                              {b.disponibles}
                            </td>
                            <td className="px-4 py-4 text-xs">
                              {fecha.format(new Date(b.iniciaEn))}
                              <br />a {fecha.format(new Date(b.venceEn))}
                            </td>
                            <td className="px-4 py-4">
                              <Estado estado={b.estadoVista} />
                            </td>
                            <td className="px-4 py-4">
                              <Link
                                href={`${volver}&editar=${b.id}`}
                                scroll={false}
                                className={boton}
                              >
                                Gestionar
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <ul className="divide-y divide-[#e5ebe2] md:hidden">
                    {datos.beneficios.map((b) => (
                      <li key={b.id} className="space-y-3 p-5">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <h3 className="max-w-full wrap-anywhere font-semibold">
                            {b.nombre}
                          </h3>
                          <Estado estado={b.estadoVista} />
                        </div>
                        <p className="text-sm text-[#526a60]">
                          {valorBeneficio(b)} · {b.local}
                        </p>
                        <dl className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <dt className="text-xs text-[#526a60]">
                              Costo en puntos
                            </dt>
                            <dd className="mt-1 font-semibold">
                              {b.costo} pts
                            </dd>
                          </div>
                          <div>
                            <dt className="text-xs text-[#526a60]">Cupos</dt>
                            <dd className="mt-1 font-semibold">
                              {b.disponibles}
                            </dd>
                          </div>
                        </dl>
                        <p className="text-xs text-[#526a60]">
                          Hasta {fecha.format(new Date(b.venceEn))}
                        </p>
                        <Link
                          href={`${volver}&editar=${b.id}`}
                          scroll={false}
                          className={boton}
                        >
                          Gestionar beneficio
                        </Link>
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <p className="p-6 text-sm text-[#526a60]">
                  No hay beneficios que coincidan con estos filtros. Crea una
                  propuesta o limpia la búsqueda.
                </p>
              )}
            </section>
          )}
          {recibidos && (
            <section className="space-y-4">
              <h2 className="text-sm font-semibold">
                {recibidos.total} canjes encontrados
              </h2>
              {recibidos.canjes.length ? (
                <div className="grid items-start gap-4 lg:grid-cols-2">
                  {recibidos.canjes.map((c) => (
                    <article key={c.id} className={tarjeta}>
                      <div className="flex flex-wrap justify-between gap-2">
                        <h3 className="font-semibold">{c.nombre}</h3>
                        <span className="text-xs font-semibold">
                          {c.estado === "usado"
                            ? "Utilizado"
                            : c.estado === "vencido"
                              ? "Vencido"
                              : "Por utilizar"}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-[#526a60]">
                        {c.usuario.nombreCompleto} · {c.local}
                      </p>
                      <p className="mt-2 text-sm">
                        {c.costo} puntos · Código {c.codigoParcial}
                      </p>
                      <p className="mt-2 text-xs text-[#526a60]">
                        Canjeado: {fecha.format(new Date(c.creadoEn))}.
                        Vigencia: {fecha.format(new Date(c.venceEn))}.
                      </p>
                      {c.usadoEn && (
                        <p className="mt-3 rounded-lg bg-[#edf4ed] p-3 text-xs">
                          Entrega: {fecha.format(new Date(c.usadoEn))}.
                          Responsable:{" "}
                          {c.confirmadoPor ??
                            "No registrado en el historial previo"}
                          .
                        </p>
                      )}
                      {c.estado === "vigente" && (
                        <Link
                          href={`${ruta}?seccion=validar`}
                          className={`${boton} mt-3`}
                        >
                          Validar con el visitante
                        </Link>
                      )}
                    </article>
                  ))}
                </div>
              ) : (
                <p className={tarjeta}>
                  Todavía no hay canjes que coincidan con estos filtros.
                </p>
              )}
            </section>
          )}
          {(pagina > 1 || datos?.hayMas || recibidos?.hayMas) && (
            <nav
              aria-label="Páginas del control de beneficios"
              className="flex items-center gap-4 text-sm font-semibold"
            >
              {pagina > 1 && (
                <Link href={enlacePagina(pagina - 1)} className={boton}>
                  Anterior
                </Link>
              )}
              <span>Página {pagina}</span>
              {(datos?.hayMas || recibidos?.hayMas) && (
                <Link href={enlacePagina(pagina + 1)} className={boton}>
                  Siguiente
                </Link>
              )}
            </nav>
          )}
        </>
      )}
      {datos && (p.crear === "1" || elegido) && (
        <EditorBeneficioModal
          key={elegido?.id ?? "nuevo"}
          beneficio={elegido}
          destinos={datos.destinos}
          superadmin={perfil.rol === "SUPER_ADMIN"}
          volver={volver}
        />
      )}
    </div>
  );
}
function Estado({ estado }: { estado: string }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${estado === "publicado" ? "bg-emerald-50 text-emerald-900" : ["vencido", "agotado"].includes(estado) ? "bg-stone-100 text-stone-700" : "bg-amber-50 text-amber-900"}`}
    >
      {estadosBeneficio[estado] ?? estado}
    </span>
  );
}
export function PanelBeneficios({
  global = false,
  consulta,
}: {
  global?: boolean;
  consulta: Promise<ConsultaGestionBeneficios>;
}) {
  return (
    <main className="space-y-5 text-[#14382e]">
      <header>
        <h1 className="text-2xl font-semibold sm:text-3xl">
          {global
            ? "Control de beneficios y acuerdos"
            : "Beneficios de mi atractivo"}
        </h1>
        <p className="mt-2 text-sm text-[#526a60]">
          Configura qué ofreces, cuántos puntos cuesta y cómo se entrega.
        </p>
      </header>
      <Suspense
        fallback={
          <div
            role="status"
            className="h-80 rounded-2xl bg-[#e0e9e0] motion-safe:animate-pulse"
          >
            <span className="sr-only">Cargando control de beneficios…</span>
          </div>
        }
      >
        <Contenido global={global} consulta={consulta} />
      </Suspense>
    </main>
  );
}
