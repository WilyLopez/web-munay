"use server";

import { createClient } from "@supabase/supabase-js";
import { obtenerConfiguracionSupabase } from "./supabase/configuracion";
import { esCorreoValido, leerCampo, type EstadoFormulario } from "./validacion";

type Solicitud = { mensaje?: string; enviado?: boolean };
type Restablecimiento = EstadoFormulario & {
  actualizado?: boolean;
  nuevoEnlace?: boolean;
};

function clienteRecuperacion() {
  const { url, clave } = obtenerConfiguracionSupabase();
  return createClient(url, clave, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

export async function solicitarRecuperacion(
  _anterior: Solicitud,
  datos: FormData,
): Promise<Solicitud> {
  const correo = leerCampo(datos, "correoElectronico").trim().toLowerCase();
  if (!esCorreoValido(correo)) return { mensaje: "Ingresa un correo válido." };
  try {
    const { error } =
      await clienteRecuperacion().auth.resetPasswordForEmail(correo);
    if (error?.status === 429)
      return { mensaje: "Espera un momento antes de solicitar otro enlace." };
    if (error && (!error.status || error.status >= 500)) {
      return {
        mensaje:
          "El servicio de correo no está disponible. Inténtalo en unos minutos.",
      };
    }
    return { enviado: true };
  } catch {
    return {
      mensaje:
        "No pudimos conectar con el servicio de recuperación. Intenta nuevamente.",
    };
  }
}

export async function restablecerContrasena(
  token: string,
  _anterior: Restablecimiento,
  datos: FormData,
): Promise<Restablecimiento> {
  if (!token || token.length > 256)
    return {
      nuevoEnlace: true,
      mensaje: "Este enlace no es válido o ya venció.",
    };
  const contrasena = leerCampo(datos, "contrasena");
  const confirmacion = leerCampo(datos, "confirmarContrasena");
  const errores: NonNullable<EstadoFormulario["errores"]> = {};
  if (contrasena.length < 8) errores.contrasena = "Usa al menos 8 caracteres.";
  if (!confirmacion || contrasena !== confirmacion)
    errores.confirmarContrasena = "Las contraseñas deben coincidir.";
  if (Object.keys(errores).length) return { errores };

  try {
    const supabase = clienteRecuperacion();
    const verificacion = await supabase.auth.verifyOtp({
      token_hash: token,
      type: "recovery",
    });
    if (
      verificacion.error &&
      (!verificacion.error.status || verificacion.error.status >= 500)
    ) {
      return {
        mensaje:
          "No pudimos verificar el enlace. Inténtalo nuevamente en unos minutos.",
      };
    }
    if (verificacion.error?.status === 429)
      return { mensaje: "Espera un momento antes de volver a intentarlo." };
    if (verificacion.error || !verificacion.data.session) {
      return {
        nuevoEnlace: true,
        mensaje: "El enlace venció, no es válido o ya se usó.",
      };
    }

    const { error } = await supabase.auth.updateUser({ password: contrasena });
    if (error) {
      await supabase.auth.signOut({ scope: "local" }).catch(() => null);
      return {
        nuevoEnlace: true,
        mensaje: ["same_password", "weak_password"].includes(error.code ?? "")
          ? "Elige una contraseña nueva que sea distinta a la anterior y cumpla la política de seguridad. Solicita otro enlace para continuar."
          : "No pudimos guardar la contraseña. Solicita un nuevo enlace para intentarlo otra vez.",
      };
    }
    await supabase.auth.signOut({ scope: "global" }).catch(() => null);
    return { actualizado: true };
  } catch {
    return {
      mensaje:
        "Se interrumpió la conexión. Intenta nuevamente o solicita otro enlace.",
    };
  }
}
