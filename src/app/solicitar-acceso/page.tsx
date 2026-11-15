import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { FormularioSolicitud } from "@/features/accesos/formularios";
import {
  estados,
  principal,
  secundario,
  type ListadoAccesos,
  type OpcionDestino,
} from "@/features/accesos/tipos";
import { Navbar } from "@/features/navegacion/navbar";
import { PiePagina } from "@/features/navegacion/pie-pagina";
import { BotonActualizarPanel } from "@/features/visitas/boton-actualizar-panel";
import { solicitarVisitas } from "@/features/visitas/api";

async function Solicitudes() {
  await connection();
  const propias = await solicitarVisitas<ListadoAccesos>(
    "/gestion-accesos/mis-solicitudes",
  );
  if (!propias.ok) {
    if (propias.estado === 401)
      return (
        <section className="space-y-4 rounded-3xl border border-[#dce3da] bg-white p-6 sm:p-8">
          <h2 className="font-serif text-2xl">Accede con tu cuenta Munay</h2>
          <p className="text-sm text-[#4d665b]">
            Inicia sesión con un correo confirmado para enviar una solicitud y
            ver su estado.
          </p>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/ingresar?volver=/solicitar-acceso"
              className={principal}
            >
              Iniciar sesión
            </Link>
            <Link href="/registro" className={secundario}>
              Crear cuenta
            </Link>
          </div>
        </section>
      );
    return (
      <div className="space-y-2">
        <p role="alert">{propias.mensaje}</p>
        <BotonActualizarPanel reintentar />
      </div>
    );
  }
  const catalogo = await solicitarVisitas<{
    destinos: OpcionDestino[];
    sesion: { perfil: { rol: string } };
  }>("/destinos");
  if (!catalogo.ok)
    return (
      <div className="space-y-2">
        <p role="alert">{catalogo.mensaje}</p>
        <BotonActualizarPanel reintentar />
      </div>
    );
  if (catalogo.datos.sesion.perfil.rol === "SUPER_ADMIN")
    return (
      <Link href="/superadmin/accesos" className={principal}>
        Abrir gestión de accesos
      </Link>
    );
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(16rem,0.55fr)]">
      <section className="space-y-4 rounded-3xl border border-[#dce3da] bg-white p-5 sm:p-7">
        <h2 className="font-serif text-2xl">Nueva solicitud</h2>
        <FormularioSolicitud destinos={catalogo.datos.destinos} />
      </section>
      <section className="self-start rounded-3xl border border-[#dce3da] bg-white p-5 sm:p-7">
        <h2 className="mb-3 font-serif text-2xl">Mis accesos</h2>
        {propias.datos.filas.length ? (
          <ul className="divide-y divide-[#dce3da]">
            {propias.datos.filas.map((fila) => (
              <li key={fila.id} className="space-y-1 py-3 text-sm">
                <p className="font-semibold">
                  {fila.destino?.nombre ??
                    fila.propuesta?.nombre ??
                    "Atractivo"}
                </p>
                <p>{estados[fila.estado]}</p>
                {fila.observacion && (
                  <p className="wrap-anywhere text-[#4d665b]">
                    {fila.observacion}
                  </p>
                )}
                {fila.estado === "aprobada" && (
                  <Link
                    href="/administracion"
                    className="font-semibold underline underline-offset-4"
                  >
                    Ir a Mis atractivos
                  </Link>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-[#4d665b]">
            Aquí aparecerán tus solicitudes y las invitaciones que aceptes.
          </p>
        )}
      </section>
    </div>
  );
}

export default function PaginaSolicitarAcceso() {
  return (
    <div className="-m-8 min-h-dvh bg-[#f8f4ea] text-[#173b32]">
      <Navbar />
      <main className="mx-auto max-w-6xl space-y-6 px-5 py-10 sm:px-8">
        <header className="space-y-3 rounded-3xl bg-[#174238] p-6 text-white sm:p-10">
          <h1 className="font-serif text-4xl sm:text-5xl">
            Gestiona tu atractivo en Munay
          </h1>
          <p className="max-w-2xl text-sm leading-relaxed text-[#dfebe3] sm:text-base">
            Solicita acceso a un atractivo del catálogo o propón uno nuevo. El
            equipo revisará tu vínculo con el lugar antes de habilitar su
            gestión.
          </p>
        </header>
        <Suspense
          fallback={
            <div
              role="status"
              className="h-48 rounded-3xl bg-[#e0e9e0] motion-safe:animate-pulse"
            >
              <span className="sr-only">Cargando solicitudes</span>
            </div>
          }
        >
          <Solicitudes />
        </Suspense>
      </main>
      <PiePagina />
    </div>
  );
}
