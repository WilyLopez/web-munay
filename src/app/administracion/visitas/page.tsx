import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { solicitarVisitas } from "@/features/visitas/api";
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
      <Link href="/destinos" className="font-semibold text-teal-900 underline">
        Volver a destinos
      </Link>
      <h1 className="text-3xl font-bold text-teal-950">QR de visitas</h1>
      <Suspense
        fallback={<p role="status">Cargando destinos administrados…</p>}
      >
        <Administracion consulta={searchParams} />
      </Suspense>
    </main>
  );
}
