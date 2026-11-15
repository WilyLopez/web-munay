import { Suspense } from "react";
import {
  EsqueletoAcceso,
  type DatosAviso,
} from "@/features/autenticacion/aviso-acceso";
import { FormularioAcceso } from "@/features/autenticacion/formulario-acceso";
import { regresoQrVisita } from "@/features/visitas/enlace-qr";

export const metadata = { title: "Iniciar sesión · Munay" };

const avisos: Record<string, DatosAviso> = {
  registro: {
    mensaje: "Revisa tu correo y la carpeta de spam para confirmar tu cuenta.",
    tipo: "exito",
    reenviar: true,
  },
  confirmado: {
    mensaje: "Correo confirmado. Ya puedes iniciar sesión.",
    tipo: "exito",
  },
  "confirmacion-invalida": {
    mensaje: "Este enlace de confirmación ya no es válido. Solicita uno nuevo.",
    tipo: "error",
    reenviar: true,
  },
  "confirmacion-solicitada": {
    mensaje:
      "Si tu cuenta tiene una confirmación pendiente, recibirás un nuevo enlace. Revisa también la carpeta de spam.",
    tipo: "informacion",
  },
  salida: { mensaje: "Tu sesión se cerró correctamente.", tipo: "exito" },
  "salida-incompleta": {
    mensaje:
      "Cerraste sesión en este navegador. El servidor aún no confirmó el cierre.",
    tipo: "informacion",
  },
  inactividad: {
    mensaje: "Tu sesión venció por inactividad. Vuelve a iniciar sesión.",
    tipo: "informacion",
  },
  sesion: { mensaje: "Inicia sesión para continuar.", tipo: "informacion" },
};

async function ContenidoIngreso({ searchParams }: PageProps<"/ingresar">) {
  const { aviso, volver: destino } = await searchParams;
  const volver = typeof destino === "string" ? destino : undefined;
  const codigo =
    typeof aviso === "string" && Object.hasOwn(avisos, aviso)
      ? aviso
      : undefined;
  const contexto =
    volver && regresoQrVisita(volver)
      ? {
          mensaje:
            "Inicia sesión para continuar con la verificación de tu visita.",
          tipo: "informacion" as const,
        }
      : undefined;
  return (
    <FormularioAcceso
      registro={false}
      volver={volver}
      aviso={
        codigo && codigo !== "sesion"
          ? avisos[codigo]
          : (contexto ?? (codigo ? avisos[codigo] : undefined))
      }
    />
  );
}

export default function PaginaIngreso(props: PageProps<"/ingresar">) {
  return (
    <Suspense fallback={<EsqueletoAcceso />}>
      <ContenidoIngreso {...props} />
    </Suspense>
  );
}
