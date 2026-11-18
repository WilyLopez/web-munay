"use client";

import Image from "next/image";
import { createClient } from "@supabase/supabase-js";
import { useRef, useState } from "react";
import { obtenerConfiguracionSupabase } from "@/features/autenticacion/supabase/configuracion";
import { CamaraFotoResena } from "./camara-foto-resena";
import { prepararFotoResena } from "./acciones";

export type FotoResena = {
  blob?: Blob;
  archivo: string;
  url: string;
  selfie: boolean;
  consentimiento: boolean;
};

async function optimizarFoto(archivo: File) {
  const imagen = await createImageBitmap(archivo);
  try {
    const escala = Math.min(1, 1600 / Math.max(imagen.width, imagen.height));
    const lienzo = document.createElement("canvas");
    lienzo.width = Math.max(1, Math.round(imagen.width * escala));
    lienzo.height = Math.max(1, Math.round(imagen.height * escala));
    const contexto = lienzo.getContext("2d");
    if (!contexto) throw new Error("No pudimos preparar la foto.");
    contexto.fillStyle = "#ffffff";
    contexto.fillRect(0, 0, lienzo.width, lienzo.height);
    contexto.drawImage(imagen, 0, 0, lienzo.width, lienzo.height);
    return await new Promise<Blob>((resolver, rechazar) =>
      lienzo.toBlob(
        (foto) =>
          foto
            ? resolver(foto)
            : rechazar(new Error("No pudimos preparar la foto.")),
        "image/jpeg",
        0.85,
      ),
    );
  } finally {
    imagen.close();
  }
}

export async function subirFotoPendiente(slug: string, imagen: Blob) {
  const subida = await prepararFotoResena(slug, "image/jpeg");
  if (!subida.token) throw new Error(subida.error);
  const { url, clave } = obtenerConfiguracionSupabase();
  const supabase = createClient(url, clave, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
  const resultado = await supabase.storage
    .from("resenas")
    .uploadToSignedUrl(subida.archivo, subida.token, imagen, {
      contentType: "image/jpeg",
      cacheControl: "86400",
    });
  if (resultado.error)
    throw new Error("No pudimos subir tu foto. Inténtalo de nuevo.");
  return { archivo: subida.archivo, url: subida.url };
}

export function AdjuntarFotoResena({
  slug,
  foto,
  cambiarFoto,
  ocupado,
  cambiarSubiendo,
  bono,
  invitado = false,
}: {
  slug: string;
  foto?: FotoResena;
  cambiarFoto: (foto?: FotoResena) => void;
  ocupado: boolean;
  cambiarSubiendo: (subiendo: boolean) => void;
  bono: number;
  invitado?: boolean;
}) {
  const galeria = useRef<HTMLInputElement>(null);
  const capturaNativa = useRef<HTMLInputElement>(null);
  const [camaraAbierta, cambiarCamaraAbierta] = useState(false);
  const [consentimiento, cambiarConsentimiento] = useState(false);
  const [subiendo, cambiarEstadoSubida] = useState(false);
  const [error, cambiarError] = useState("");

  async function subir(archivo: File) {
    if (
      !["image/jpeg", "image/png", "image/webp"].includes(archivo.type) ||
      archivo.size === 0 ||
      archivo.size > 5 * 1024 * 1024
    ) {
      cambiarError("Elige una foto JPG, PNG o WebP de hasta 5 MB.");
      return;
    }
    cambiarError("");
    cambiarSubiendo(true);
    cambiarEstadoSubida(true);
    try {
      const imagen = await optimizarFoto(archivo);
      const guardada = invitado
        ? { archivo: "", url: URL.createObjectURL(imagen), blob: imagen }
        : await subirFotoPendiente(slug, imagen);
      cambiarFoto({ ...guardada, selfie: false, consentimiento: true });
    } catch (fallo) {
      cambiarError(
        fallo instanceof Error ? fallo.message : "No pudimos preparar tu foto.",
      );
    } finally {
      cambiarEstadoSubida(false);
      cambiarSubiendo(false);
    }
  }

  return (
    <fieldset
      disabled={ocupado || subiendo}
      className="space-y-3 rounded-2xl border border-[#d5e0d6] bg-white p-4 disabled:opacity-70"
    >
      <legend className="px-1 font-semibold text-[#174238]">
        Foto de tu visita · opcional
      </legend>
      <p className="text-sm leading-relaxed text-stone-700">
        Comparte una selfie en la que aparezcas en el lugar y recibe {bono}{" "}
        puntos adicionales.
      </p>
      <label className="flex items-start gap-3 text-sm">
        <input
          type="checkbox"
          checked={foto?.consentimiento ?? consentimiento}
          onChange={(evento) => {
            cambiarConsentimiento(evento.target.checked);
            if (!evento.target.checked) cambiarFoto(undefined);
          }}
          className="mt-1 size-4 shrink-0 accent-teal-900"
        />
        <span>
          Autorizo que mi foto se muestre públicamente con mi reseña. Tengo
          permiso de las personas que aparecen en ella.
        </span>
      </label>
      <div className="grid gap-2 sm:grid-cols-2">
        <button
          type="button"
          disabled={!(foto?.consentimiento ?? consentimiento)}
          onClick={() => cambiarCamaraAbierta(true)}
          className="min-h-12 rounded-xl bg-[#174238] px-4 text-sm font-semibold text-white disabled:opacity-40"
        >
          Tomar una foto
        </button>
        <button
          type="button"
          disabled={!(foto?.consentimiento ?? consentimiento)}
          onClick={() => galeria.current?.click()}
          className="min-h-12 rounded-xl border border-[#bdcfc2] px-4 text-sm font-semibold text-[#174238] hover:bg-[#edf4ed] disabled:opacity-40"
        >
          Elegir de la galería
        </button>
      </div>
      <input
        ref={galeria}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        disabled={!(foto?.consentimiento ?? consentimiento)}
        aria-label="Elegir una foto de la galería"
        hidden
        onChange={(evento) => {
          const archivo = evento.target.files?.[0];
          if (archivo) void subir(archivo);
          evento.target.value = "";
        }}
      />
      <input
        ref={capturaNativa}
        type="file"
        accept="image/*"
        capture="user"
        disabled={!(foto?.consentimiento ?? consentimiento)}
        aria-label="Tomar foto con la cámara del dispositivo"
        hidden
        onChange={(evento) => {
          const archivo = evento.target.files?.[0];
          if (archivo) void subir(archivo);
          evento.target.value = "";
        }}
      />
      {camaraAbierta && (
        <CamaraFotoResena
          cerrar={() => cambiarCamaraAbierta(false)}
          tomar={(archivo) => {
            cambiarCamaraAbierta(false);
            void subir(archivo);
          }}
          usarCamaraDispositivo={() => {
            capturaNativa.current?.click();
            cambiarCamaraAbierta(false);
          }}
        />
      )}
      <p className="text-xs text-stone-600">
        JPG, PNG o WebP, hasta 5 MB. Optimizamos la foto antes de enviarla.
      </p>
      {subiendo && (
        <p role="status" className="text-sm">
          Preparando y subiendo tu foto…
        </p>
      )}
      {error && (
        <p role="alert" className="text-sm text-rose-900">
          {error}
        </p>
      )}
      {foto && (
        <div className="space-y-3">
          <Image
            src={foto.url}
            alt="Vista previa de tu foto de visita"
            width={640}
            height={480}
            unoptimized
            className="max-h-72 w-full rounded-xl object-contain bg-stone-50"
          />
          <label className="flex items-start gap-3 text-sm">
            <input
              type="checkbox"
              checked={foto.selfie}
              onChange={(evento) =>
                cambiarFoto({ ...foto, selfie: evento.target.checked })
              }
              className="mt-1 size-4 shrink-0 accent-teal-900"
            />
            <span>
              Confirmo que aparezco en esta foto y que la tomé durante mi visita
              a este lugar.
            </span>
          </label>
          <button
            type="button"
            onClick={() => cambiarFoto(undefined)}
            className="min-h-11 text-sm font-semibold text-teal-950 underline underline-offset-4"
          >
            Quitar foto de la reseña
          </button>
        </div>
      )}
    </fieldset>
  );
}
