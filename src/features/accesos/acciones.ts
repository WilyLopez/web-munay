"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { solicitarVisitas } from "@/features/visitas/api";

type Estado = { mensaje: string; ok: boolean; enlace?: string };
const leer = (datos: FormData, campo: string) =>
  String(datos.get(campo) ?? "").trim();

export async function enviarSolicitud(
  _estado: Estado,
  datos: FormData,
): Promise<Estado> {
  const nuevo = leer(datos, "tipo") === "nuevo";
  const valorCoordenada = (campo: string) => {
    const valor = leer(datos, campo);
    return valor ? Number(valor.replace(",", ".")) : null;
  };
  const resultado = await solicitarVisitas("/gestion-accesos/solicitudes", {
    destinoId: nuevo ? null : leer(datos, "destinoId"),
    motivo: leer(datos, "motivo"),
    contacto: leer(datos, "contacto"),
    ...(nuevo && {
      propuesta: {
        nombre: leer(datos, "nombre"),
        descripcion: leer(datos, "descripcion"),
        ubicacion: leer(datos, "ubicacion"),
        categoria: leer(datos, "categoria"),
        provincia: leer(datos, "provincia"),
        latitud: valorCoordenada("latitud"),
        longitud: valorCoordenada("longitud"),
      },
    }),
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
  const resultado = await solicitarVisitas("/gestion-accesos/aceptar", {
    token: leer(datos, "token"),
  });
  if (!resultado.ok) return { mensaje: resultado.mensaje, ok: false };
  revalidatePath("/", "layout");
  redirect("/administracion");
}
