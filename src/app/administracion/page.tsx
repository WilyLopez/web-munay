import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { accesoPanel } from "@/features/administracion/acceso";
import {
  categorias,
  enlaceFicha,
  normalizarBusqueda,
  provincias,
} from "@/features/destinos/catalogo";
import { BotonActualizarPanel } from "@/features/visitas/boton-actualizar-panel";
import { solicitarVisitas } from "@/features/visitas/api";
import type { DestinoVisita } from "@/features/visitas/tipos";
import {
  estadosFicha,
  type EstadoFicha,
} from "@/features/destinos/informacion";

type Atractivo = DestinoVisita & {
  ubicacion: string;
  provincia: keyof typeof provincias;
  categoria: keyof typeof categorias;
  estadoEditorial: EstadoFicha;
  _count: { visitas: number; resenas: number };
};

const accion =
  "rounded-lg border border-[#ccd9cf] px-3 py-2 hover:bg-[#e6eee6]";

async function Atractivos({
  searchParams,
}: Pick<PageProps<"/administracion">, "searchParams">) {
  const perfil = await accesoPanel();
  if (!perfil) return null;
  if (perfil.rol === "SUPER_ADMIN") redirect("/superadmin");
  const [{ buscar }, respuesta] = await Promise.all([
    searchParams,
    solicitarVisitas<Atractivo[]>("/destinos/administracion/resumen"),
  ]);
  if (!respuesta.ok) {
    if (respuesta.estado === 401) redirect("/ingresar?aviso=sesion");
    return (
      <div className="space-y-3 rounded-2xl border border-amber-200 bg-amber-50 p-5">
        <p role="alert">{respuesta.mensaje}</p>
        <BotonActualizarPanel reintentar />
      </div>
    );
  }
  if (!respuesta.datos.length)
    return (
      <p className="rounded-xl border border-[#dce3da] bg-white p-6">
        Tu cuenta todavía no tiene atractivos asignados. El SuperAdmin de Munay
        puede asignarte un atractivo desde su panel.
      </p>
    );

  const texto = typeof buscar === "string" ? buscar.trim().slice(0, 120) : "";
  const termino = normalizarBusqueda(texto);
  const atractivos = respuesta.datos.filter(
    ({ nombre, ubicacion, provincia }) =>
      normalizarBusqueda(
        `${nombre} ${ubicacion} ${provincias[provincia]}`,
      ).includes(termino),
  );
  const totales = respuesta.datos.reduce(
    (suma, item) => ({
      visitas: suma.visitas + item._count.visitas,
      resenas: suma.resenas + item._count.resenas,
    }),
    { visitas: 0, resenas: 0 },
  );

  return (
    <>
      <dl className="grid gap-3 sm:grid-cols-3">
        {[
          ["Atractivos asignados", respuesta.datos.length],
          ["Visitas verificadas", totales.visitas],
          ["Reseñas publicadas", totales.resenas],
        ].map(([etiqueta, valor]) => (
          <div
            key={etiqueta}
            className="rounded-2xl border border-[#dce3da] bg-white p-5"
          >
            <dt className="text-sm font-medium text-[#4d665b]">{etiqueta}</dt>
            <dd className="mt-1 text-3xl font-semibold tabular-nums">
              {valor}
            </dd>
          </div>
        ))}
      </dl>
      <form
        action="/administracion"
        className="flex flex-wrap items-end gap-3 rounded-2xl border border-[#dce3da] bg-white p-4"
      >
        <label className="grid min-w-0 grow gap-1 text-sm font-semibold">
          Buscar entre mis atractivos
          <input
            type="search"
            name="buscar"
            defaultValue={texto}
            key={texto}
            maxLength={120}
            placeholder="Nombre, ubicación o provincia"
            className="min-w-0 rounded-lg border border-[#bdcfc2] px-3 py-2 font-normal"
          />
        </label>
        <button className="rounded-lg bg-[#174238] px-3 py-2 text-sm font-semibold text-white hover:bg-[#23574a]">
          Buscar
        </button>
        {texto && (
          <Link
            href="/administracion"
            className={`${accion} text-sm font-semibold`}
          >
            Limpiar búsqueda
          </Link>
        )}
      </form>
      {atractivos.length ? (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {atractivos.map(
            ({
              id,
              nombre,
              slug,
              ubicacion,
              provincia,
              categoria,
              estadoEditorial,
              _count,
            }) => {
              const consulta = new URLSearchParams({ destino: slug });
              return (
                <li
                  key={id}
                  className="flex flex-col justify-between gap-6 rounded-2xl border border-[#dce3da] bg-white p-5"
                >
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-[#4d665b]">
                      {categorias[categoria]} · {provincias[provincia]}
                    </p>
                    <h2 className="font-serif text-2xl">{nombre}</h2>
                    <p className="w-fit rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold">
                      {estadosFicha[estadoEditorial]}
                    </p>
                    <p className="text-sm text-[#4d665b]">{ubicacion}</p>
                    <p className="text-sm">
                      {_count.visitas} visitas verificadas · {_count.resenas}{" "}
                      reseñas
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-3 text-sm font-semibold">
                    <Link
                      href={`/administracion/atractivos/${encodeURIComponent(slug)}`}
                      className={accion}
                    >
                      Editar ficha
                    </Link>
                    <Link
                      href={`/administracion/estadisticas?${consulta}`}
                      className="rounded-lg bg-[#174238] px-3 py-2 text-white hover:bg-[#23574a]"
                    >
                      Ver estadísticas
                    </Link>
                    <Link
                      href={`/administracion/visitas?${consulta}`}
                      className={accion}
                    >
                      Gestionar QR
                    </Link>
                    <Link
                      href={`/administracion/resenas?${consulta}`}
                      className={accion}
                    >
                      Ver reseñas
                    </Link>
                    {estadoEditorial === "publicada" && (
                      <Link
                        href={enlaceFicha(slug)}
                        className="self-center underline underline-offset-4"
                      >
                        Ver detalles públicos
                      </Link>
                    )}
                  </div>
                </li>
              );
            },
          )}
        </ul>
      ) : (
        <p
          role="status"
          className="rounded-2xl border border-[#dce3da] bg-white p-5"
        >
          No encontramos atractivos asignados que coincidan con tu búsqueda.
        </p>
      )}
    </>
  );
}

export default function PaginaAdministracion({
  searchParams,
}: PageProps<"/administracion">) {
  return (
    <main className="space-y-5">
      <h1 className="font-serif text-4xl tracking-tight">Mis atractivos</h1>
      <p className="text-sm text-[#4d665b]">
        Actualiza la ficha pública y gestiona las visitas de tus atractivos
        asignados.
      </p>
      <Suspense
        fallback={
          <div
            role="status"
            className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
          >
            <span className="sr-only">Cargando atractivos asignados</span>
            {[1, 2, 3].map((fila) => (
              <div
                key={fila}
                aria-hidden="true"
                className="h-36 rounded-2xl border border-[#dce3da] bg-[#e0e9e0] motion-safe:animate-pulse"
              />
            ))}
          </div>
        }
      >
        <Atractivos searchParams={searchParams} />
      </Suspense>
    </main>
  );
}
