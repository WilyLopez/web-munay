import { ContenidoResena } from "@/features/resenas/contenido-resena";
import { VisibilidadAtractivo } from "@/features/administracion/visibilidad-atractivo";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { accesoPanel } from "@/features/administracion/acceso";
import {
  categorias,
  enlaceFicha,
  provincias,
} from "@/features/destinos/catalogo";
import {
  estadosFicha,
  type EstadoFicha,
} from "@/features/destinos/informacion";
import { BotonActualizarPanel } from "@/features/visitas/boton-actualizar-panel";
import { solicitarVisitas } from "@/features/visitas/api";
import {
  fechaVisita,
  type DestinoVisita,
  type HistorialVisitas,
} from "@/features/visitas/tipos";

type Atractivo = DestinoVisita & {
  ubicacion: string;
  provincia: keyof typeof provincias;
  categoria: keyof typeof categorias;
  estadoEditorial: EstadoFicha;
  imagenUrl?: string | null;
  calificacionPromedio?: number | string | null;
  _count: { visitas: number; resenas: number };
};

const panel = "min-w-0 rounded-2xl border border-[#dce3da] bg-white p-4 sm:p-6";
const boton =
  "inline-flex min-h-11 items-center justify-center rounded-xl px-4 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2";
const principal = `${boton} bg-[#174238] text-white hover:bg-[#23574a]`;
const secundario = `${boton} border border-[#ccd9cf] hover:bg-[#e6eee6]`;
const nota = new Intl.NumberFormat("es-PE", { maximumFractionDigits: 1 });

async function Actividad({ slug }: { slug: string }) {
  const ruta = `/visitas/administracion/${encodeURIComponent(slug)}`;
  const [visitas, estadisticas] = await Promise.all([
    solicitarVisitas<HistorialVisitas>(`${ruta}/historial?pagina=1`),
    solicitarVisitas<{
      recientes: { id: string; comentario: string; calificacion: number }[];
    }>(`${ruta}/estadisticas?meses=3`),
  ]);
  const consulta = new URLSearchParams({ destino: slug });
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <section className={panel}>
        <h2 className="font-serif text-2xl">Visitas recientes</h2>
        {visitas.ok && visitas.datos.registros.length ? (
          <ul className="mt-3 divide-y divide-[#e5ebe2] text-sm">
            {visitas.datos.registros.slice(0, 3).map((visita) => (
              <li
                key={visita.id}
                className="flex flex-wrap justify-between gap-2 py-2"
              >
                <span>Visita verificada</span>
                <time dateTime={visita.verificadaEn} className="text-[#4d665b]">
                  {fechaVisita.format(new Date(visita.verificadaEn))}
                </time>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-[#4d665b]">
            {visitas.ok
              ? "Aquí aparecerán las visitas después de que los turistas confirmen su ubicación."
              : "No pudimos cargar las visitas recientes."}
          </p>
        )}
        <Link
          className="mt-3 inline-flex min-h-11 items-center text-sm font-semibold underline underline-offset-4"
          href={`/administracion/visitas?${consulta}`}
        >
          Ver visitas
        </Link>
      </section>
      <section className={panel}>
        <h2 className="font-serif text-2xl">Reseñas recientes</h2>
        {estadisticas.ok && estadisticas.datos.recientes.length ? (
          <ul className="mt-3 divide-y divide-[#e5ebe2] text-sm">
            {estadisticas.datos.recientes.slice(0, 3).map((resena) => (
              <li
                key={resena.id}
                className="py-4"
              >
                <ContenidoResena comentario={resena.comentario} calificacion={resena.calificacion} compacto />
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-[#4d665b]">
            {estadisticas.ok
              ? "Todavía no hay reseñas de los últimos tres meses."
              : "No pudimos cargar las reseñas recientes."}
          </p>
        )}
        <Link
          className="mt-3 inline-flex min-h-11 items-center text-sm font-semibold underline underline-offset-4"
          href={`/administracion/resenas?${consulta}`}
        >
          Ver reseñas
        </Link>
      </section>
    </div>
  );
}

async function Resumen() {
  const perfil = await accesoPanel();
  if (!perfil) return null;
  if (perfil.rol === "SUPER_ADMIN") redirect("/superadmin");
  const respuesta = await solicitarVisitas<Atractivo[]>(
    "/destinos/administracion/resumen",
  );
  if (!respuesta.ok) {
    if (respuesta.estado === 401) redirect("/ingresar?aviso=sesion");
    return (
      <div className={panel}>
        <p role="alert" className="mb-3">
          {respuesta.mensaje}
        </p>
        <BotonActualizarPanel reintentar />
      </div>
    );
  }
  const [destino] = respuesta.datos;
  if (!destino) {
    return (
      <section className={panel}>
        <h2 className="font-serif text-2xl">
          Aún no tienes un atractivo asignado
        </h2>
        <p className="mt-2 text-sm text-[#4d665b]">
          El administrador de plataforma puede asignar un destino a tu cuenta.
        </p>
      </section>
    );
  }

  const publicado = destino.estadoEditorial === "publicada";
  const consulta = new URLSearchParams({ destino: destino.slug });
  const ficha = `/administracion/atractivos/${encodeURIComponent(destino.slug)}`;
  const metricas = [
    ["Visitas verificadas", String(destino._count.visitas)],
    ["Reseñas publicadas", String(destino._count.resenas)],
    [
      "Calificación media",
      destino.calificacionPromedio != null
        ? `${nota.format(Number(destino.calificacionPromedio))} de 5`
        : destino._count.resenas
          ? "No disponible"
          : "Sin reseñas",
    ],
  ];

  return (
    <>
      <section className="grid overflow-hidden rounded-3xl border border-[#dce3da] bg-white sm:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        <div className="min-w-0 space-y-3 p-5 sm:p-7">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="font-medium text-[#4d665b]">
              {categorias[destino.categoria]} · {provincias[destino.provincia]}
            </span>
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${publicado ? "bg-[#e7f2e9] text-[#174238]" : "bg-amber-50 text-amber-900"}`}
            >
              {estadosFicha[destino.estadoEditorial]}
            </span>
          </div>
          <h2 className="wrap-anywhere text-balance font-serif text-3xl leading-tight sm:text-4xl">
            {destino.nombre}
          </h2>
          <p className="text-sm text-[#4d665b]">{destino.ubicacion}</p>
          <div className="flex flex-wrap gap-2 pt-2">
            <Link href={ficha} className={principal}>
              Editar ficha
            </Link>
            {publicado && (
              <Link href={enlaceFicha(destino.slug)} className={secundario}>
                Ver ficha pública
              </Link>
            )}
          </div>
        </div>
        {destino.imagenUrl && (
          <div className="relative min-h-44 bg-[#e5ebe2] sm:min-h-52">
            <Image
              src={destino.imagenUrl}
              alt=""
              fill
              unoptimized={!destino.imagenUrl.startsWith("/")}
              sizes="(min-width: 768px) 38vw, 100vw"
              className="object-cover"
            />
          </div>
        )}
      </section>

      <VisibilidadAtractivo slug={destino.slug} nombre={destino.nombre} estado={destino.estadoEditorial} />

      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {metricas.map(([etiqueta, valor]) => (
          <div key={etiqueta} className={panel}>
            <dt className="text-sm font-medium text-[#4d665b]">{etiqueta}</dt>
            <dd className="mt-2 wrap-anywhere text-xl font-semibold tabular-nums sm:text-3xl">
              {valor}
            </dd>
          </div>
        ))}
      </dl>

      <section className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-[#173b32] p-5 text-white sm:p-6">
        <div>
          <h2 className="font-serif text-2xl">QR de visitas</h2>
          <p className="mt-1 max-w-lg text-sm text-[#dcebe1]">
            {publicado
              ? "Abre la pantalla para que los visitantes verifiquen su visita con la cámara."
              : "Publica la ficha del atractivo para habilitar el QR."}
          </p>
        </div>
        {publicado && (
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/pantalla-qr?${consulta}`}
              target="_blank"
              rel="noopener noreferrer"
              className={`${boton} bg-[#f8f5ea] text-[#173b32] hover:bg-white`}
            >
              Mostrar QR para visitantes
            </Link>
            <Link
              href={`/administracion/visitas?${consulta}`}
              className={`${boton} border border-white/40 hover:bg-white/10`}
            >
              Gestionar QR
            </Link>
          </div>
        )}
      </section>

      <Suspense
        fallback={
          <p role="status" className={panel}>
            Cargando actividad reciente…
          </p>
        }
      >
        <Actividad slug={destino.slug} />
      </Suspense>
    </>
  );
}

export default function PaginaAdministracion() {
  return (
    <main className="space-y-5">
      <header className="space-y-1">
        <h1 className="font-serif text-4xl tracking-tight">Dashboard</h1>
        <p className="text-sm text-[#4d665b]">
          Gestiona tu atractivo y revisa su actividad.
        </p>
      </header>
      <Suspense
        fallback={
          <div
            role="status"
            className="rounded-2xl border border-[#dce3da] bg-white p-6"
          >
            <span className="sr-only">Cargando el resumen de tu atractivo</span>
            <div
              aria-hidden="true"
              className="h-36 rounded-xl bg-[#e0e9e0] motion-safe:animate-pulse"
            />
          </div>
        }
      >
        <Resumen />
      </Suspense>
    </main>
  );
}
