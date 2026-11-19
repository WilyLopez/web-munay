"use client";

import { createClient } from "@supabase/supabase-js";
import Image from "next/image";
import { useState } from "react";
import { obtenerConfiguracionSupabase } from "@/features/autenticacion/supabase/configuracion";
import { prepararSubidaDestino } from "./ficha-operativa";

export function SubirFotoDestino({
  destinoId,
  nombre,
  valor,
  etiqueta,
  requerido,
  cambiarOcupacion,
  alSubir,
}: {
  destinoId: string;
  nombre: string;
  valor?: string | null;
  etiqueta: string;
  requerido?: boolean;
  cambiarOcupacion: (variacion: number) => void;
  alSubir?: (url: string) => void;
}) {
  const [enlace, cambiarEnlace] = useState(valor ?? "");
  const [subiendo, cambiarSubiendo] = useState(false);
  const [mensaje, cambiarMensaje] = useState("");

  async function subir(foto: File) {
    if (
      !["image/jpeg", "image/png", "image/webp"].includes(foto.type) ||
      !foto.size ||
      foto.size > 5 * 1024 * 1024
    ) {
      cambiarMensaje("Elige una imagen JPG, PNG o WebP de hasta 5 MB.");
      return;
    }
    cambiarMensaje("");
    cambiarSubiendo(true);
    cambiarOcupacion(1);
    try {
      const imagen = await createImageBitmap(foto);
      if (
        !imagen.width ||
        !imagen.height ||
        imagen.width * imagen.height > 40000000
      ) {
        imagen.close();
        throw new Error("Elige una foto de hasta 40 megapíxeles.");
      }
      const escala = Math.min(1, 2000 / Math.max(imagen.width, imagen.height));
      const lienzo = document.createElement("canvas");
      lienzo.width = Math.round(imagen.width * escala);
      lienzo.height = Math.round(imagen.height * escala);
      const contexto = lienzo.getContext("2d");
      if (!contexto) {
        imagen.close();
        throw new Error("No pudimos preparar la imagen. Prueba con otra foto.");
      }
      contexto.drawImage(imagen, 0, 0, lienzo.width, lienzo.height);
      imagen.close();
      const optimizada = await new Promise<Blob | null>((resolver) =>
        lienzo.toBlob(resolver, "image/webp", 0.85),
      );
      if (!optimizada)
        throw new Error("No pudimos preparar la imagen. Prueba con otra foto.");
      const subida = await prepararSubidaDestino(destinoId, optimizada.type);
      if (!subida.token) throw new Error(subida.error);
      const { url, clave } = obtenerConfiguracionSupabase();
      const supabase = createClient(url, clave, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
      });
      const { error } = await supabase.storage
        .from("destinos")
        .uploadToSignedUrl(subida.archivo, subida.token, optimizada, {
          contentType: optimizada.type,
          cacheControl: "86400",
        });
      if (error) throw new Error("No pudimos subir la imagen.");
      cambiarEnlace(subida.url);
      alSubir?.(subida.url);
    } catch (error) {
      cambiarMensaje(
        error instanceof Error ? error.message : "No pudimos subir la imagen.",
      );
    } finally {
      cambiarSubiendo(false);
      cambiarOcupacion(-1);
    }
  }

  return (
    <div className="space-y-2 rounded-xl bg-stone-50 p-3">
      <label className="grid gap-2 text-sm font-semibold">
        {etiqueta}
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          disabled={subiendo}
          className="min-w-0 text-xs file:mr-2 file:rounded-lg file:border-0 file:bg-teal-100 file:px-3 file:py-2"
          onChange={(evento) => {
            const foto = evento.target.files?.[0];
            if (foto) void subir(foto);
            evento.target.value = "";
          }}
        />
      </label>
      <input type="hidden" name={nombre} value={enlace} />
      {subiendo && (
        <p role="status" className="text-xs">
          Subiendo foto…
        </p>
      )}
      {mensaje && (
        <p role="alert" className="text-sm text-rose-900">
          {mensaje}
        </p>
      )}
      {enlace ? (
        <>
          <Image
            src={enlace}
            alt="Vista previa de la imagen seleccionada"
            width={320}
            height={180}
            unoptimized
            className="aspect-video w-full rounded-lg object-cover"
          />
          <div className="flex gap-3 text-xs">
            <a
              href={enlace}
              target="_blank"
              rel="noreferrer"
              className="underline"
            >
              Ver imagen
            </a>
            {!requerido && (
              <button
                type="button"
                disabled={subiendo}
                className="underline"
                onClick={() => {
                  cambiarEnlace("");
                  cambiarOcupacion(0);
                }}
              >
                Quitar
              </button>
            )}
          </div>
        </>
      ) : (
        !subiendo && <p className="text-xs">JPG, PNG o WebP · máximo 5 MB</p>
      )}
    </div>
  );
}
