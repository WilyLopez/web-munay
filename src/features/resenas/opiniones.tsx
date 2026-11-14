import Link from "next/link";
import { solicitarVisitas } from "@/features/visitas/api";
import { fechaVisita } from "@/features/visitas/tipos";
import { AccionesResena } from "./acciones-resena";
import { FormularioResena } from "./formulario-resena";
import { ReintentarOpiniones } from "./reintentar-opiniones";
import type { ListadoResenas } from "./tipos";

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
      <section id="opiniones" className="space-y-3">
        <h2 className="text-2xl font-bold">Reseñas</h2>
        <p role="alert">No pudimos cargar las reseñas.</p>
        <ReintentarOpiniones />
      </section>
    );
  const datos = resultado.datos;
  return (
    <section
      id="opiniones"
      className="space-y-5 rounded-3xl border border-stone-200 bg-white p-5 sm:p-8"
    >
      <h2 className="text-2xl font-bold">Reseñas</h2>
      <p>
        {datos.total} reseñas · {datos.verificadas} con visita verificada ·{" "}
        {datos.promedio === null
          ? "Sin calificaciones"
          : `${datos.promedio.toFixed(1)} de 5`}
      </p>
      <ul
        className="grid grid-cols-5 gap-1 text-center text-sm"
        aria-label="Distribución por estrellas"
      >
        {[5, 4, 3, 2, 1].map((nota) => (
          <li key={nota} className="rounded-lg bg-stone-100 p-2">
            {nota} ★<br />
            {datos.distribucion.find((grupo) => grupo.calificacion === nota)
              ?.total ?? 0}
          </li>
        ))}
      </ul>
      <p className="text-sm text-stone-700">
        La verificación respalda el registro de la visita. Cada opinión refleja
        la experiencia de su autor.
      </p>
      <form
        action={`${ruta}#opiniones`}
        className="flex flex-wrap items-end gap-3"
      >
        {regreso && <input type="hidden" name="volver" value={regreso} />}
        {!slug && (
          <label className="grid gap-1 font-semibold">
            Atractivo
            <select
              name="destino"
              defaultValue={filtro ?? ""}
              className="max-w-64 rounded border p-2 font-normal"
            >
              <option value="">Todos los atractivos</option>
              {datos.destinos.map((lugar) => (
                <option key={lugar.slug} value={lugar.slug}>
                  {lugar.nombre}
                </option>
              ))}
            </select>
          </label>
        )}
        <label className="grid gap-1 font-semibold">
          Orden
          <select
            name="orden"
            defaultValue={orden === "calificacion" ? orden : "fecha"}
            className="rounded border p-2 font-normal"
          >
            <option value="fecha">Más recientes</option>
            <option value="calificacion">Mejor calificadas</option>
          </select>
        </label>
        <button className="rounded border px-4 py-2 font-semibold">
          Aplicar
        </button>
      </form>
      {slug && (
        <div className="space-y-2 rounded-xl bg-teal-50 p-4">
          {datos.estado === "habilitada" && <FormularioResena slug={slug} />}
          {datos.estado === "publicada" && (
            <p>Ya publicaste una reseña para esta visita.</p>
          )}
          {datos.estado === "bloqueada" && (
            <p>Visita el destino y escanea su QR para escribir una reseña.</p>
          )}
          {datos.estado === "visitante" && (
            <Link
              href="/ingresar?aviso=sesion"
              className="font-semibold underline"
            >
              Escribir una reseña
            </Link>
          )}
        </div>
      )}
      {datos.resenas.length === 0 && <p>Aún no hay reseñas disponibles.</p>}
      <ul className="divide-y divide-stone-200">
        {datos.resenas.map((resena) => (
          <li
            key={resena.id}
            id={`resena-${resena.id}`}
            className="space-y-2 py-4"
          >
            {!slug && (
              <Link
                href={`/destinos/${encodeURIComponent(resena.destino.slug)}#opiniones`}
                className="font-semibold underline"
              >
                {resena.destino.nombre}
              </Link>
            )}
            <p className="font-semibold">{resena.usuario.nombreCompleto}</p>
            <p className="text-sm text-stone-700">
              <time dateTime={resena.creadaEn}>
                {fechaVisita.format(new Date(resena.creadaEn))}
              </time>{" "}
              · {resena.calificacion} de 5 ★
            </p>
            <p className="text-sm font-semibold text-teal-900">
              {resena.verificada
                ? "Visita verificada · Opinión auténtica en sitio"
                : "Sin verificación"}
            </p>
            <p className="wrap-anywhere whitespace-pre-wrap">
              {resena.comentario}
            </p>
            <AccionesResena
              id={resena.id}
              utiles={resena.utiles}
              votoPropio={resena.votoPropio}
            />
          </li>
        ))}
      </ul>
      <nav aria-label="Paginación de reseñas" className="flex gap-4">
        {pagina > 1 && (
          <Link href={parametrosPagina(pagina - 1)} className="underline">
            Anteriores
          </Link>
        )}
        {datos.hayMas && (
          <Link href={parametrosPagina(pagina + 1)} className="underline">
            Siguientes
          </Link>
        )}
      </nav>
    </section>
  );
}

export function paginaResenas(valor?: string) {
  return typeof valor === "string" && /^[1-9]\d{0,4}$/.test(valor)
    ? Number(valor)
    : 1;
}
