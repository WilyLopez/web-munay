import { Suspense } from "react";
import { redirect } from "next/navigation";
import { accesoPanel } from "@/features/administracion/acceso";
import { FormularioPerfilAdmin } from "@/features/administracion/formulario-perfil";
import { BotonActualizarPanel } from "@/features/visitas/boton-actualizar-panel";
import { solicitarVisitas } from "@/features/visitas/api";

async function DatosPerfil() {
  const perfil = await accesoPanel();
  if (!perfil) return <p role="alert">No pudimos consultar tu cuenta.</p>;
  if (perfil.rol === "SUPER_ADMIN") redirect("/superadmin/perfil");
  const respuesta = await solicitarVisitas<{
    nombreCompleto: string;
    correo: string | null;
  }>("/autenticacion/sesion/perfil-admin");
  if (!respuesta.ok) {
    if (respuesta.estado === 401) redirect("/ingresar?aviso=sesion");
    return (
      <div className="space-y-3 rounded-2xl border border-amber-200 bg-amber-50 p-5">
        <p role="alert">{respuesta.mensaje}</p>
        <BotonActualizarPanel reintentar />
      </div>
    );
  }
  const { nombreCompleto, correo } = respuesta.datos;

  return (
    <>
      <dl className="grid gap-4 rounded-2xl border border-[#dce3da] bg-white p-5 text-sm sm:grid-cols-2 sm:p-6">
        <div>
          <dt className="font-semibold">Correo de la cuenta</dt>
          <dd className="mt-1 wrap-anywhere text-[#4d665b]">
            {correo ?? "Correo no disponible"}
          </dd>
        </div>
        <div>
          <dt className="font-semibold">Rol</dt>
          <dd className="mt-1 text-[#4d665b]">Admin</dd>
        </div>
      </dl>
      <FormularioPerfilAdmin nombreCompleto={nombreCompleto} />
    </>
  );
}

export default function PaginaPerfil() {
  return (
    <main className="max-w-3xl space-y-5">
      <h1 className="font-serif text-4xl tracking-tight">Mi perfil</h1>
      <Suspense
        fallback={
          <div
            role="status"
            className="h-24 rounded-2xl border border-[#dce3da] bg-[#e0e9e0] motion-safe:animate-pulse"
          >
            <span className="sr-only">Cargando perfil</span>
          </div>
        }
      >
        <DatosPerfil />
      </Suspense>
    </main>
  );
}
