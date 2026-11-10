import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { cerrarSesion } from "@/features/autenticacion/acciones";
import { AvisoExpiracion } from "@/features/autenticacion/aviso-expiracion";
import { consultarSesion } from "@/features/autenticacion/sesion";
import { crearSupabaseServidor } from "@/features/autenticacion/supabase/servidor";

async function DestinosProtegidos() {
  const supabase = await crearSupabaseServidor();
  const { data } = await supabase.auth.getSession();

  if (!data.session) {
    redirect("/ingresar?aviso=sesion");
  }

  let sesion;

  try {
    sesion = await consultarSesion(data.session.access_token);
  } catch {
    return (
      <main className="mx-auto max-w-3xl py-10">
        <h1 className="text-2xl font-bold">No pudimos comprobar tu sesión</h1>
        <Link
          className="mt-4 inline-block font-semibold text-teal-800 underline"
          href="/destinos"
        >
          Reintentar
        </Link>
      </main>
    );
  }

  if (!sesion) {
    redirect("/ingresar?aviso=sesion");
  }

  return (
    <main className="mx-auto max-w-3xl py-10">
      <AvisoExpiracion venceEn={sesion.venceEn} />
      <p className="text-sm font-semibold text-teal-800">Cuenta activa</p>
      <h1 className="text-3xl font-bold">
        Hola, {sesion.perfil.nombreCompleto}
      </h1>
      <h2 className="mt-6 text-xl font-semibold">Destinos</h2>
      <p className="mt-2 text-slate-700">
        El catálogo de destinos se habilitará en el siguiente incremento.
      </p>
      <form action={cerrarSesion} className="mt-6">
        <button
          type="submit"
          className="rounded-xl bg-teal-800 px-4 py-2.5 font-semibold text-white"
        >
          Cerrar sesión
        </button>
      </form>
    </main>
  );
}

export default function PaginaDestinos() {
  return (
    <Suspense fallback={<p>Comprobando el acceso…</p>}>
      <DestinosProtegidos />
    </Suspense>
  );
}
