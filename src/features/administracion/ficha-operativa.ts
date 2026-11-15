"use server";

import { revalidatePath, updateTag } from "next/cache";
import { gruposInformacion } from "@/features/destinos/informacion";
import { crearSupabaseServidor } from "@/features/autenticacion/supabase/servidor";
import { solicitarVisitas } from "@/features/visitas/api";

export async function prepararSubidaDestino(id: string, tipo: string) {
  const extensiones: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
  };
  const extension = extensiones[tipo];
  if (!/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(id) || !extension)
    return { error: "Selecciona una imagen JPG, PNG o WebP." };
  const supabase = await crearSupabaseServidor();
  const archivo = `${id}/${crypto.randomUUID()}.${extension}`;
  const almacen = supabase.storage.from("destinos");
  const respuesta = await almacen.createSignedUploadUrl(archivo);
  if (respuesta.error)
    return {
      error:
        "No pudimos preparar la subida. Comprueba tu sesión e inténtalo de nuevo.",
    };
  return {
    archivo,
    token: respuesta.data.token,
    url: almacen.getPublicUrl(archivo).data.publicUrl,
  };
}

export async function guardarFichaOperativa(
  slug: string,
  _estado: { mensaje: string; error: boolean },
  formulario: FormData,
) {
  const leer = (campo: string) => {
    const valor = formulario.get(campo);
    return typeof valor === "string" ? valor.trim() || null : null;
  };
  const numero = (campo: string) => {
    const valor = leer(campo);
    return valor === null ? null : Number(valor);
  };
  const fotos = ["url", "alt", "descripcion", "autor", "licencia"];
  const galeria = formulario
    .getAll("foto-url")
    .flatMap((url, indice) =>
      typeof url === "string" && url.trim()
        ? [
            Object.fromEntries(
              fotos.map((campo) => [
                campo,
                String(formulario.getAll(`foto-${campo}`)[indice] ?? "").trim(),
              ]),
            ),
          ]
        : [],
    );
  const informacion = Object.fromEntries(
    gruposInformacion.flatMap(([, campos]) =>
      campos.map(([clave]) => [clave, leer(clave)]),
    ),
  );
  const enviarRevision = formulario.get("decision") === "revision";
  const resultado = await solicitarVisitas(
    `/destinos/administracion/${encodeURIComponent(slug)}/ficha`,
    {
      horario: leer("horario"),
      diasAtencion: formulario.getAll("diasAtencion").map(Number),
      tarifaGeneral: leer("tarifaGeneral")?.replace(",", ".") ?? null,
      tarifaEstudiantes: leer("tarifaEstudiantes")?.replace(",", ".") ?? null,
      enviarRevision,
      datos: {
        ...Object.fromEntries(
          [
            "nombre",
            "descripcion",
            "ubicacion",
            "categoria",
            "provincia",
            "imagenUrl",
            "rutaDesdeChiclayo",
            "fuenteRutaUrl",
            "recomendacion",
          ].map((campo) => [campo, leer(campo)]),
        ),
        latitud: numero("latitud"),
        longitud: numero("longitud"),
        distanciaKm: numero("distanciaKm"),
        duracionMinutos: numero("duracionMinutos"),
      },
      informacion: { ...informacion, galeria },
    },
    { metodo: "PUT" },
  );
  if (!resultado.ok) return { mensaje: resultado.mensaje, error: true };
  updateTag("destinos");
  revalidatePath(`/administracion/atractivos/${encodeURIComponent(slug)}`);
  revalidatePath("/destinos");
  revalidatePath(`/destinos/${encodeURIComponent(slug)}`);
  return {
    mensaje: enviarRevision
      ? "Destino enviado a revisión."
      : "Cambios guardados.",
    error: false,
  };
}

export async function resolverFichaDestino(
  slug: string,
  _estado: { mensaje: string; error: boolean },
  datos: FormData,
) {
  const resultado = await solicitarVisitas(
    `/destinos/administracion/${encodeURIComponent(slug)}/estado`,
    { estado: datos.get("estado") },
    { metodo: "PUT" },
  );
  if (!resultado.ok) return { mensaje: resultado.mensaje, error: true };
  updateTag("destinos");
  revalidatePath("/superadmin/destinos");
  revalidatePath(`/superadmin/destinos/${encodeURIComponent(slug)}`);
  return { mensaje: "Estado actualizado.", error: false };
}
