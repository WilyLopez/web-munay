import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { solicitarVisitas } from "@/features/visitas/api";
import { BotonCopiarEnlaceTransmision } from "@/features/visitas/boton-copiar-transmision";
import { PantallaQr } from "@/features/visitas/pantalla-qr";
import type { DestinoVisita } from "@/features/visitas/tipos";

async function Administracion({
  consulta,
}: {
  consulta: Promise<{ destino?: string }>;
}) {
  await connection();
  const [{ destino }, respuesta] = await Promise.all([
    consulta,
    solicitarVisitas<DestinoVisita[]>("/visitas/administracion"),
  ]);
  if (!respuesta.ok) {
    if (respuesta.estado === 401) redirect("/ingresar?aviso=sesion");
    return (
      <p role="alert">
        {respuesta.estado === 403
          ? "Esta pantalla requiere una cuenta administradora."
          : respuesta.mensaje}
      </p>
    );
  }

  const destinos = respuesta.datos;
  if (!destinos.length)
    return <p>Tu cuenta todavía no tiene destinos asignados.</p>;
  const seleccionado = destino
    ? destinos.find(({ slug }) => slug === destino)
    : destinos[0];

  return (
    <>
      <nav aria-label="Destinos administrados" className="flex flex-wrap gap-3">
        {destinos.map(({ id, nombre, slug }) => (
          <Link
            key={id}
            href={`?destino=${encodeURIComponent(slug)}`}
            aria-current={seleccionado?.slug === slug ? "page" : undefined}
            className="rounded-full border border-teal-900 px-4 py-2 text-sm font-semibold text-teal-950 aria-[current=page]:bg-teal-950 aria-[current=page]:text-white"
          >
            {nombre}
          </Link>
        ))}
      </nav>
      {seleccionado ? (
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-teal-200 bg-teal-50/80 p-4 sm:p-5">
            <div>
              <h3 className="font-semibold text-teal-950">
                📺 Modo Transmisión (Tablet / Pantalla para Guías)
              </h3>
              <p className="mt-1 text-sm text-teal-800">
                Usa este enlace para proyectar el QR en tablets o pantallas. Detecta escaneos en tiempo real, alerta al guía y renueva el código automáticamente.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              <Link
                href={`/pantalla-qr?destino=${encodeURIComponent(seleccionado.slug)}`}
                target="_blank"
                className="inline-flex min-h-11 items-center justify-center rounded-xl bg-teal-950 px-4 text-sm font-semibold text-white hover:bg-teal-900 shadow-sm active:scale-95 transition-transform"
              >
                Abrir pantalla para tablet ↗
              </Link>
              <BotonCopiarEnlaceTransmision slug={seleccionado.slug} />
            </div>
          </div>

          <h2 className="text-2xl font-bold text-teal-950">
            {seleccionado.nombre}
          </h2>
          <PantallaQr key={seleccionado.slug} slug={seleccionado.slug} />
        </section>
      ) : (
        <p role="alert">El destino no está disponible para esta cuenta.</p>
      )}
    </>
  );
}

export default function PaginaAdministracionVisitas({
  searchParams,
}: {
  searchParams: Promise<{ destino?: string }>;
}) {
  return (
    <main className="mx-auto max-w-6xl space-y-5 py-8">
      <h1 className="text-3xl font-bold text-teal-950">QR de visitas</h1>
      <Suspense
        fallback={<p role="status">Cargando destinos administrados…</p>}
      >
        <Administracion consulta={searchParams} />
      </Suspense>
    </main>
  );
}
