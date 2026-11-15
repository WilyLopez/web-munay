import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { Navbar } from "@/features/navegacion/navbar";
import { PiePagina } from "@/features/navegacion/pie-pagina";
import { HistorialPerfil } from "@/features/perfil/historial";
import { solicitarVisitas } from "@/features/visitas/api";
import { BotonActualizarPanel } from "@/features/visitas/boton-actualizar-panel";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

type Resumen = {
  nombre: string;
  rol: "TURISTA";
  visitas: number;
  resenas: number;
  saldo: number;
  posicion: number | null;
  ranking: {
    nombre: string;
    saldo: number;
    posicion: number;
    propia: boolean;
  }[];
};

const niveles = [
  { nombre: "Explorador", minimo: 0 },
  { nombre: "Colaborador", minimo: 50 },
  { nombre: "Guía Munay", minimo: 150 },
  { nombre: "Embajador", minimo: 300 },
];

async function ContenidoPerfil({ searchParams }: Props) {
  await connection();
  const respuesta = await solicitarVisitas<Resumen>("/puntos/mi-resumen");
  if (!respuesta.ok) {
    if (respuesta.estado === 401) redirect("/ingresar?aviso=sesion");
    if (respuesta.estado === 403) redirect("/destinos");
    return (
      <div
        role="alert"
        className="space-y-2 rounded-3xl border border-stone-200 bg-white p-5"
      >
        <p>No pudimos cargar tu historial.</p>
        <BotonActualizarPanel reintentar />
      </div>
    );
  }
  const { saldo, nombre, rol, visitas, resenas, posicion, ranking } =
    respuesta.datos;
  const indice = niveles.findLastIndex(({ minimo }) => saldo >= minimo);
  const nivel = niveles[Math.max(0, indice)];
  const siguiente = niveles[indice + 1];
  const progreso = siguiente
    ? Math.floor(
        (100 * (saldo - nivel.minimo)) / (siguiente.minimo - nivel.minimo),
      )
    : 100;

  return (
    <>
      <h1 className="font-serif text-4xl">Mi perfil</h1>
      <section className="space-y-4 rounded-3xl border border-teal-200 bg-teal-50 p-5 sm:p-8">
        <h2 className="text-xl font-semibold">{nombre}</h2>
        {rol === "TURISTA" && (
          <p className="w-fit rounded-full bg-white px-3 py-1 text-xs font-semibold">
            Visitante
          </p>
        )}
        <dl className="flex flex-wrap gap-x-8 gap-y-3 text-sm">
          <div>
            <dt>Visitas verificadas</dt>
            <dd className="text-xl font-semibold">{visitas}</dd>
          </div>
          <div>
            <dt>Reseñas publicadas</dt>
            <dd className="text-xl font-semibold">{resenas}</dd>
          </div>
        </dl>
        <p>
          <strong className="text-3xl">{saldo}</strong> puntos MUNAY
        </p>
        <p className="font-semibold">Nivel {nivel.nombre}</p>
        <progress
          className="block h-2 w-full max-w-sm accent-teal-800"
          value={progreso}
          max={100}
          aria-label="Progreso al siguiente nivel"
        />
        <p className="text-sm">
          {siguiente
            ? `${progreso}% hacia ${siguiente.nombre} · Faltan ${siguiente.minimo - saldo} puntos.`
            : "Alcanzaste el nivel más alto."}
        </p>
      </section>
      <HistorialPerfil consulta={await searchParams} />
      <section
        id="ranking"
        className="space-y-4 rounded-3xl border border-stone-200 bg-white p-5 sm:p-8"
      >
        <h2 className="font-serif text-2xl">Ranking de colaboradores</h2>
        <p className="text-sm">
          {posicion
            ? `Tu posición: ${posicion}.`
            : "Publica una reseña verificada para aparecer en el ranking."}
        </p>
        {ranking.length > 0 && (
          <ol className="divide-y divide-stone-200">
            {ranking.map((fila, numero) => (
              <li
                key={numero}
                className={`flex items-center justify-between gap-3 rounded-lg px-2 py-3 text-sm ${fila.propia ? "bg-teal-50 font-semibold" : ""}`}
              >
                <span>
                  {fila.posicion}.{" "}
                  {fila.propia ? `${fila.nombre} (tú)` : fila.nombre}
                </span>
                <span>{fila.saldo} pts</span>
              </li>
            ))}
          </ol>
        )}
        <Link
          href="/destinos"
          className="inline-block text-sm font-semibold underline underline-offset-4"
        >
          Explorar destinos
        </Link>
      </section>
    </>
  );
}

export default function PaginaMiPerfil(props: Props) {
  return (
    <div className="-m-8 min-h-dvh bg-[#f8f4ea] text-[#173b32]">
      <Navbar />
      <main className="mx-auto max-w-4xl space-y-5 px-5 py-8 sm:px-8">
        <Suspense
          fallback={
            <div
              role="status"
              className="h-48 rounded-3xl bg-teal-100 motion-safe:animate-pulse"
            >
              <span className="sr-only">Cargando perfil</span>
            </div>
          }
        >
          <ContenidoPerfil {...props} />
        </Suspense>
      </main>
      <PiePagina />
    </div>
  );
}
