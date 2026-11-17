import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { Navbar } from "@/features/navegacion/navbar";
import { PiePagina } from "@/features/navegacion/pie-pagina";
import { FormularioResena } from "@/features/resenas/formulario-resena";
import { enlaceEscribirResena } from "@/features/resenas/enlaces";
import type { PreparacionResena } from "@/features/resenas/tipos";
import { solicitarVisitas } from "@/features/visitas/api";
import { BotonActualizarPanel } from "@/features/visitas/boton-actualizar-panel";

export const metadata: Metadata = {
  title: "Comparte tu visita · Munay",
  robots: { index: false, follow: false },
};

async function Contenido({
  consulta,
}: {
  consulta: Promise<{ destino?: string }>;
}) {
  await connection();
  const { destino } = await consulta;
  if (typeof destino !== "string" || !destino)
    redirect("/mi-perfil?seccion=visitas");
  const respuesta = await solicitarVisitas<PreparacionResena>(
    `/resenas/escribir/${encodeURIComponent(destino)}`,
  );
  if (!respuesta.ok) {
    if (respuesta.estado === 401)
      redirect(
        `/ingresar?aviso=sesion&volver=${encodeURIComponent(enlaceEscribirResena(destino))}`,
      );
    return (
      <div className="space-y-3 rounded-2xl border border-stone-200 bg-white p-5">
        <p role="alert">{respuesta.mensaje}</p>
        <BotonActualizarPanel reintentar />
      </div>
    );
  }
  const datos = respuesta.datos;
  return (
    <div className="space-y-5">
      <header className="flex min-w-0 items-center gap-4 rounded-2xl border border-[#d5e0d6] bg-white p-4 sm:p-5">
        {datos.destino.imagenUrl && (
          <Image
            src={datos.destino.imagenUrl}
            alt=""
            width={96}
            height={96}
            unoptimized
            className="size-16 shrink-0 rounded-xl object-cover sm:size-20"
          />
        )}
        <div className="min-w-0">
          <p className="text-sm font-medium text-[#526a60]">
            {datos.fechaVisita
              ? "Tu visita está verificada"
              : "Comparte tu experiencia"}
          </p>
          <h1 className="mt-1 wrap-anywhere font-serif text-2xl text-[#14382e] sm:text-3xl">
            {datos.destino.nombre}
          </h1>
        </div>
      </header>
      {datos.estado === "habilitada" ? (
        <FormularioResena
          slug={datos.destino.slug}
          fechaVisita={datos.fechaVisita}
          puntosResena={datos.puntosResena}
          puntosSelfie={datos.puntosSelfie}
        />
      ) : (
        <section className="space-y-3 rounded-2xl border border-[#d5e0d6] bg-white p-5">
          <h2 className="font-serif text-2xl">
            {datos.estado === "publicada"
              ? "Gracias por compartir tu experiencia"
              : datos.estado === "retirada"
                ? "Tu reseña fue retirada"
                : "Primero verifica tu visita"}
          </h2>
          <p className="text-sm text-stone-700">
            {datos.estado === "publicada"
              ? "Tu reseña ya está publicada. Puedes consultar los puntos desde tu perfil."
              : datos.estado === "retirada"
                ? "Esta visita ya tiene una reseña registrada que dejó de estar publicada."
                : "Escanea el QR del lugar y confirma tu ubicación para habilitar el formulario."}
          </p>
          {datos.estado === "publicada" && datos.resenaId && (
            <Link
              href={`/resenas/${datos.resenaId}`}
              className="inline-flex min-h-11 items-center rounded-xl bg-[#174238] px-4 text-sm font-semibold text-white"
            >
              Ver mi reseña
            </Link>
          )}
          {datos.estado === "bloqueada" && (
            <Link
              href={`/verificar-visita?destino=${encodeURIComponent(destino)}`}
              className="inline-flex min-h-11 items-center rounded-xl bg-[#174238] px-4 text-sm font-semibold text-white"
            >
              Verificar mi visita
            </Link>
          )}
        </section>
      )}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
        <Link
          href="/destinos"
          className="inline-flex min-h-11 items-center text-sm font-semibold text-[#174238] underline underline-offset-4"
        >
          Ahora no, seguir explorando
        </Link>
        <Link
          href="/mi-perfil"
          className="inline-flex min-h-11 items-center text-sm font-semibold text-[#174238] underline underline-offset-4"
        >
          Ir a mi perfil
        </Link>
      </div>
    </div>
  );
}

export default function PaginaEscribirResena({
  searchParams,
}: {
  searchParams: Promise<{ destino?: string }>;
}) {
  return (
    <div className="flex min-h-dvh flex-col bg-[#f4f6f0] text-[#173b32]">
      <Navbar />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
        <Suspense
          fallback={
            <div
              role="status"
              className="h-96 rounded-2xl bg-[#e0e9e0] motion-safe:animate-pulse"
            >
              <span className="sr-only">Preparando tu reseña…</span>
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
