import { Suspense } from "react";
import { FormularioAcceso } from "@/features/autenticacion/formulario-acceso";

const avisos: Record<string, string> = {
  registro:
    "Si tu correo puede registrarse, recibirás un enlace para confirmarlo. Luego podrás iniciar sesión.",
  confirmado: "Correo confirmado. Ya puedes iniciar sesión.",
  "confirmacion-invalida":
    "El enlace de confirmación no es válido o ya venció.",
  salida: "Cerraste sesión.",
  "salida-incompleta":
    "Cerraste la sesión en este navegador. No se pudo confirmar el cierre en el servidor.",
  inactividad: "Tu sesión terminó por inactividad. Vuelve a iniciar sesión.",
  sesion: "Inicia sesión para continuar.",
};

async function ContenidoIngreso({ searchParams }: PageProps<"/ingresar">) {
  const { aviso } = await searchParams;

  return (
    <FormularioAcceso
      registro={false}
      aviso={
        typeof aviso === "string" && Object.hasOwn(avisos, aviso)
          ? avisos[aviso]
          : undefined
      }
    />
  );
}

export default function PaginaIngreso(propiedades: PageProps<"/ingresar">) {
  return (
    <Suspense fallback={<p>Cargando el formulario…</p>}>
      <ContenidoIngreso {...propiedades} />
    </Suspense>
  );
}
