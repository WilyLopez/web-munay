import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { Navbar } from "@/features/navegacion/navbar";
import { PiePagina } from "@/features/navegacion/pie-pagina";
import { solicitarVisitas } from "@/features/visitas/api";

type Resumen = {
  nombre: string;
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

async function ContenidoPerfil() {
  await connection();
  const respuesta = await solicitarVisitas<Resumen>("/puntos/mi-resumen");
  if (!respuesta.ok) {
    if (respuesta.estado === 401) redirect("/ingresar?aviso=sesion");
    if (respuesta.estado === 403) redirect("/destinos");
    return <p role="alert">{respuesta.mensaje}</p>;
  }
  const { saldo, nombre, posicion, ranking } = respuesta.datos;
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

export default function PaginaMiPerfil() {
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
          <ContenidoPerfil />
        </Suspense>
      </main>
      <PiePagina />
    </div>
  );
}
