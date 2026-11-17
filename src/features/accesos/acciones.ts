"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { solicitarVisitas } from "@/features/visitas/api";
import { solicitarSesion } from "@/features/autenticacion/sesion";
import {
  borrarCookiesSesion,
  crearSupabaseServidor,
} from "@/features/autenticacion/supabase/servidor";
import { mensajeInvitacionNoDisponible, type DetalleInvitacion } from "./tipos";
import {
  aceptarAsignacion,
  borrarActivacion,
  codificarActivacion,
  guardarActivacion,
  obtenerActivacion,
} from "./activacion-pendiente";

type Estado = { mensaje: string; ok: boolean; enlace?: string };
const leer = (datos: FormData, campo: string) =>
  String(datos.get(campo) ?? "").trim();

function leerPropuesta(datos: FormData) {
  const coordenada = (campo: string) => {
    const valor = leer(datos, campo);
    return valor ? Number(valor.replace(",", ".")) : null;
  };
  return {
    nombre: leer(datos, "nombre"),
    descripcion: leer(datos, "descripcion"),
    ubicacion: leer(datos, "ubicacion"),
    distrito: leer(datos, "distrito"),
    categoria: leer(datos, "categoria"),
    provincia: leer(datos, "provincia"),
    latitud: coordenada("latitud"),
    longitud: coordenada("longitud"),
  };
}

export async function enviarSolicitud(
  _estado: Estado,
  datos: FormData,
): Promise<Estado> {
  const nuevo = leer(datos, "tipo") === "nuevo";
  const resultado = await solicitarVisitas("/gestion-accesos/solicitudes", {
    destinoId: nuevo ? null : leer(datos, "destinoId"),
    motivo: leer(datos, "motivo"),
    contacto: leer(datos, "contacto"),
    ...(nuevo && { propuesta: leerPropuesta(datos) }),
  });
  if (!resultado.ok) return { mensaje: resultado.mensaje, ok: false };
  revalidatePath("/solicitar-acceso");
  return {
    mensaje:
      "Enviamos tu solicitud al equipo de Munay. Puedes seguir su estado en esta página.",
    ok: true,
  };
}

export async function enviarInvitacion(
  _estado: Estado,
  datos: FormData,
): Promise<Estado> {
  const resultado = await solicitarVisitas<{
    enlace: string;
    enviado: boolean;
  }>("/gestion-accesos/invitaciones", {
    correo: leer(datos, "correo"),
    destinoId: leer(datos, "destinoId"),
    nuevo: leer(datos, "tipo") === "nuevo",
  });
  if (!resultado.ok) return { mensaje: resultado.mensaje, ok: false };
  revalidatePath("/superadmin/accesos");
  return {
    mensaje: resultado.datos.enviado
      ? "Invitación enviada. El enlace vence en 72 horas."
      : "Invitación creada. El correo no se pudo enviar. Puedes compartir el enlace con el encargado.",
    enlace: resultado.datos.enlace,
    ok: true,
  };
}

export async function resolverAcceso(
  id: string,
  _estado: Estado,
  datos: FormData,
): Promise<Estado> {
  const decision = leer(datos, "decision");
  const resultado = await solicitarVisitas(
    `/gestion-accesos/${encodeURIComponent(id)}/resolver`,
    {
      decision,
      observacion: leer(datos, "observacion"),
    },
    { metodo: "PUT" },
  );
  if (!resultado.ok) return { mensaje: resultado.mensaje, ok: false };
  revalidatePath("/superadmin/accesos");
  revalidatePath("/superadmin/usuarios");
  if (decision === "aprobar") revalidatePath("/destinos");
  return { mensaje: "Decisión registrada.", ok: true };
}

export async function aceptarInvitacion(
  _estado: Estado,
  datos: FormData,
): Promise<Estado> {
  const resultado = await aceptarAsignacion(
    leer(datos, "token"),
    datos.has("nombre") ? leerPropuesta(datos) : undefined,
  );
  if (!resultado.ok) return { mensaje: resultado.mensaje, ok: false };
  revalidatePath("/", "layout");
  redirect("/administracion");
}

export async function activarCuentaInvitada(
  _estado: Estado,
  datos: FormData,
): Promise<Estado> {
  const token = leer(datos, "token");
  const correo = leer(datos, "correo").toLowerCase();
  const contrasena = leer(datos, "contrasena");
  const modo = leer(datos, "modo");
  const nombreCompleto = leer(datos, "nombreCompleto");

  if (!token || !correo || !contrasena || !["registro", "ingreso"].includes(modo)) {
    return { mensaje: "Completa todos los campos requeridos.", ok: false };
  }

  const consulta = await consultarDetalleInvitacion(token);
  if (!consulta.detalle?.valida || consulta.detalle.vencida) {
    return {
      ok: false,
      mensaje: consulta.detalle ? mensajeInvitacionNoDisponible(consulta.detalle) : consulta.mensaje ?? "La invitación no está disponible.",
    };
  }
  if (consulta.detalle.correo.toLowerCase() !== correo) {
    return { ok: false, mensaje: "Usa el correo al que se envió la invitación." };
  }
  const propuesta = datos.has("nombre") ? leerPropuesta(datos) : undefined;
  const supabase = await crearSupabaseServidor();
  let sesion;

  if (modo === "registro") {
    const confirmarContrasena = leer(datos, "confirmarContrasena");
    if (contrasena.length < 8) {
      return {
        mensaje: "La contraseña debe tener al menos 8 caracteres.",
        ok: false,
      };
    }
    if (contrasena !== confirmarContrasena) {
      return { mensaje: "Las contraseñas no coinciden.", ok: false };
    }

    const activacion = codificarActivacion({ correo, token, propuesta });
    if (activacion.length > 3800) {
      return { ok: false, mensaje: "Acorta la descripción del atractivo para continuar." };
    }
    const { data: registroData, error: registroError } =
      await supabase.auth.signUp({
        email: correo,
        password: contrasena,
        options: { data: { nombreCompleto: nombreCompleto || "Administrador" } },
      });

    if (registroError) {
      if (
        ["user_already_exists", "email_exists"].includes(
          registroError.code ?? "",
        )
      ) {
        return {
          mensaje:
            "Este correo ya está registrado en Munay. Selecciona la opción 'Ya tengo cuenta' para ingresar.",
          ok: false,
        };
      }
      return {
        mensaje: "No se pudo registrar la cuenta. Intenta nuevamente.",
        ok: false,
      };
    }

    if (registroData.user?.identities?.length === 0) {
      return {
        mensaje:
          "Este correo ya está registrado en Munay. Selecciona la opción 'Ya tengo cuenta' para ingresar.",
        ok: false,
      };
    }
    sesion = registroData.session;
    if (!sesion) {
      await guardarActivacion(activacion);
      return {
        mensaje: "Revisa tu correo y abre el enlace de confirmación en este navegador. Al confirmar, activaremos tu acceso y te llevaremos al panel.",
        ok: true,
      };
    }
  } else {
    const acceso = await supabase.auth.signInWithPassword({ email: correo, password: contrasena });
    if (acceso.error || !acceso.data.session) {
      return {
        mensaje: acceso.error?.code === "email_not_confirmed"
          ? "Confirma tu correo antes de continuar con la invitación."
          : "No se pudo iniciar sesión. Revisa tu contraseña e inténtalo de nuevo.",
        ok: false,
      };
    }
    sesion = acceso.data.session;
  }

  try {
    const respuestaSesion = await solicitarSesion(
      sesion.access_token,
      "POST",
    );
    if (!respuestaSesion.ok) {
      await borrarCookiesSesion();
      return {
        mensaje: "No se pudo sincronizar la sesión en el servidor.",
        ok: false,
      };
    }
  } catch {
    await borrarCookiesSesion();
    return { mensaje: "Error de conexión al sincronizar la sesión.", ok: false };
  }

  const resultadoAceptar = await aceptarAsignacion(token, propuesta, sesion.access_token);
  if (!resultadoAceptar.ok) {
    return { mensaje: resultadoAceptar.mensaje, ok: false };
  }
  if ((await obtenerActivacion(correo))?.token === token) await borrarActivacion();

  revalidatePath("/", "layout");
  redirect("/administracion");
}

export async function consultarDetalleInvitacion(
  token: string,
): Promise<{ ok: boolean; detalle?: DetalleInvitacion; mensaje?: string }> {
  if (!token) return { ok: false, mensaje: "Token no proporcionado." };
  const resultado = await solicitarVisitas<DetalleInvitacion>(
    `/gestion-accesos/invitacion/${encodeURIComponent(token)}`,
    undefined,
    { publica: true },
  );
  if (!resultado.ok) {
    return { ok: false, mensaje: resultado.mensaje };
  }
  return { ok: true, detalle: resultado.datos };
}
