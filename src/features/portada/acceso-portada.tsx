import Link from "next/link";
import { cerrarSesion } from "@/features/autenticacion/acciones";
import { AvisoExpiracion } from "@/features/autenticacion/aviso-expiracion";
import { solicitarSesion } from "@/features/autenticacion/sesion";
import { crearSupabaseServidor } from "@/features/autenticacion/supabase/servidor";
import { EnlaceVisitas } from "@/features/visitas/enlace-visitas";

type SesionPortada = {
  perfil: { nombreCompleto: string; rol: string };
  venceEn: string;
};

export function AccesoVisitante() {
  return (
    <div className="flex flex-wrap items-center justify-end gap-2 text-sm font-semibold">
      <Link
        href="/ingresar"
        className="rounded-full px-3 py-2 hover:bg-[#e9e6d9]"
      >
        Iniciar sesión
      </Link>
      <Link
        href="/registro"
        className="rounded-full bg-[#174238] px-4 py-2 text-white hover:bg-[#23574a]"
      >
        Crear cuenta
      </Link>
    </div>
  );
}

export async function AccesoPortada() {
  let sesion: SesionPortada | null = null;

  try {
    const supabase = await crearSupabaseServidor();
    const { data } = await supabase.auth.getSession();

    if (data.session) {
      const respuesta = await solicitarSesion(data.session.access_token, "GET");
      if (respuesta.ok) sesion = (await respuesta.json()) as SesionPortada;
    }
  } catch {
    sesion = null;
  }

  if (!sesion) return <AccesoVisitante />;

  return (
    <div className="flex min-w-0 flex-wrap items-center justify-end gap-2 text-sm">
      <AvisoExpiracion venceEn={sesion.venceEn} />
      <p
        className="max-w-44 truncate font-semibold"
        title={sesion.perfil.nombreCompleto}
      >
        Hola, {sesion.perfil.nombreCompleto}
      </p>
      <EnlaceVisitas rol={sesion.perfil.rol} />
      <form action={cerrarSesion}>
        <button
          type="submit"
          className="rounded-full border border-[#174238] px-4 py-2 font-semibold hover:bg-[#e9e6d9]"
        >
          Cerrar sesión
        </button>
      </form>
    </div>
  );
}
