import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { Navbar } from "@/features/navegacion/navbar";
import { PiePagina } from "@/features/navegacion/pie-pagina";
import { FormularioResena } from "@/features/resenas/formulario-resena";
import { RecompensaPublicada } from "@/features/resenas/recompensa-publicada";
import { enlaceEscribirResena } from "@/features/resenas/enlaces";
import type { PreparacionResena } from "@/features/resenas/tipos";
import { rutaEscanerVisita } from "@/features/visitas/enlace-qr";
import { tokenVisitaInvitada } from "@/features/visitas/invitada";
import { solicitarVisitas } from "@/features/visitas/api";
import { BotonActualizarPanel } from "@/features/visitas/boton-actualizar-panel";

export const metadata: Metadata = {
  title: "Comparte tu visita · Munay",
  robots: { index: false, follow: false },
};

async function Contenido({
  consulta,
}: {
  consulta: Promise<{ destino?: string; aviso?: string }>;
}) {
  await connection();
  const { destino, aviso } = await consulta;
  if (
    typeof destino !== "string" ||
    destino.length > 180 ||
    !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(destino)
  )
    redirect("/destinos");
  let respuesta = await solicitarVisitas<PreparacionResena>(
    `/resenas/escribir/${encodeURIComponent(destino)}`,
  );
  const invitado = !respuesta.ok && respuesta.estado === 401;
  if (invitado) {
    const token = await tokenVisitaInvitada();
    if (!token) redirect(rutaEscanerVisita(destino));
    if (token)
      respuesta = await solicitarVisitas<PreparacionResena>(
        "/visitas/invitadas/estado",
        { token, destino },
        { publica: true },
      );
  }
  if (!respuesta.ok) {
    if (respuesta.estado === 401)
      redirect(
        `/ingresar?aviso=sesion&volver=${encodeURIComponent(enlaceEscribirResena(destino, aviso === "visita-verificada"))}`,
      );
    return (
      <div className="space-y-3 rounded-2xl border border-stone-200 bg-white p-5">
        <p role="alert">{respuesta.mensaje}</p>
        {invitado && respuesta.estado === 410 ? (
          <Link
            href={rutaEscanerVisita(destino)}
            className="inline-flex min-h-12 items-center rounded-xl bg-[#174238] px-4 text-sm font-semibold text-white"
          >
            Verificar mi visita
          </Link>
        ) : (
          <BotonActualizarPanel reintentar />
        )}
      </div>
    );
  }
  const datos = respuesta.datos;
  return (
    <div className="space-y-5">
      {aviso === "visita-verificada" && datos.fechaVisita && (
        <section
          role="status"
          aria-labelledby="aviso-visita-previa"
          className="flex gap-3 rounded-2xl border border-[#bdd4c4] bg-[#edf6ef] p-4 text-[#174238]"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            className="mt-0.5 size-6 shrink-0"
          >
            <circle cx="12" cy="12" r="9" />
            <path d="m8 12 2.5 2.5L16 9" />
          </svg>
          <div>
            <h2 id="aviso-visita-previa" className="font-semibold">
              Tu visita ya estaba verificada
            </h2>
            <p className="mt-1 text-sm leading-relaxed">
              Conservamos la fecha original y no registramos otra visita.{" "}
              {datos.estado === "publicada"
                ? "Tu reseña ya está publicada; puedes consultarla a continuación."
                : datos.estado === "retirada"
                  ? "Puedes consultar a continuación el estado de tu reseña."
                  : "Puedes continuar con tu reseña a continuación."}
            </p>
          </div>
        </section>
      )}

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
          key={`${datos.destino.slug}:${invitado ? "invitado" : "sesion"}`}
          invitado={invitado}
          visitaPrevia={
            aviso === "visita-verificada" && Boolean(datos.fechaVisita)
          }
          slug={datos.destino.slug}
          fechaVisita={datos.fechaVisita}
          puntosResena={datos.puntosResena}
          puntosSelfie={datos.puntosSelfie}
        />
      ) : datos.estado === "publicada" && datos.resenaId ? (
        <RecompensaPublicada id={datos.resenaId} />
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
          {datos.estado === "publicada" && (
            <Link
              href={`/destinos/${encodeURIComponent(destino)}#opiniones`}
              className="inline-flex min-h-11 items-center text-sm font-semibold text-[#174238] underline underline-offset-4"
            >
              Ver opiniones del destino
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
  searchParams: Promise<{ destino?: string; aviso?: string }>;
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
