"use client";

import { useEffect, useRef, useState } from "react";

export function CamaraFotoResena({
  cerrar,
  tomar,
  usarCamaraDispositivo,
}: {
  cerrar: () => void;
  tomar: (archivo: File) => void;
  usarCamaraDispositivo: () => void;
}) {
  const modal = useRef<HTMLDialogElement>(null);
  const visor = useRef<HTMLVideoElement>(null);
  const flujo = useRef<MediaStream>(null);
  const abierta = useRef(true);
  const [frontal, cambiarFrontal] = useState(true);
  const [estado, cambiarEstado] = useState<
    "preparando" | "activa" | "capturando" | "error"
  >("preparando");
  const [error, cambiarError] = useState("");

  useEffect(() => {
    abierta.current = true;
    const dialogo = modal.current;
    if (dialogo && !dialogo.open) dialogo.showModal();
    return () => {
      abierta.current = false;
    };
  }, []);

  useEffect(() => {
    let vigente = true;
    let camara: MediaStream | undefined;
    async function iniciar() {
      try {
        camara = await (navigator.mediaDevices?.getUserMedia({
          audio: false,
          video: {
            facingMode: { ideal: frontal ? "user" : "environment" },
            width: { ideal: 1280 },
            height: { ideal: 960 },
          },
        }) ?? Promise.reject(new Error("No disponible")));
        if (!vigente) {
          camara.getTracks().forEach((pista) => pista.stop());
          return;
        }
        flujo.current = camara;
        camara.getVideoTracks().forEach((pista) =>
          pista.addEventListener(
            "ended",
            () => {
              if (!vigente) return;
              cambiarError(
                "La cámara se cerró. Puedes volver a abrirla o elegir una foto de tu galería.",
              );
              cambiarEstado("error");
            },
            { once: true },
          ),
        );
        const video = visor.current;
        if (!video) return;
        video.srcObject = camara;
        await video.play();
        if (vigente) cambiarEstado("activa");
      } catch (fallo) {
        camara?.getTracks().forEach((pista) => pista.stop());
        if (!vigente) return;
        cambiarEstado("error");
        cambiarError(
          fallo instanceof Error &&
            ["NotAllowedError", "SecurityError"].includes(fallo.name)
            ? "Permite el acceso a la cámara en tu navegador para tomar la foto. También puedes usar la cámara del dispositivo o elegir una foto guardada."
            : "No pudimos abrir la cámara. Puedes usar la cámara del dispositivo o elegir una foto de tu galería.",
        );
      }
    }
    void iniciar();
    return () => {
      vigente = false;
      camara?.getTracks().forEach((pista) => pista.stop());
      flujo.current = null;
    };
  }, [frontal]);

  async function capturar() {
    const video = visor.current;
    if (!video?.videoWidth || estado !== "activa") return;
    cambiarEstado("capturando");
    try {
      const lienzo = document.createElement("canvas");
      lienzo.width = video.videoWidth;
      lienzo.height = video.videoHeight;
      const contexto = lienzo.getContext("2d");
      if (!contexto) throw new Error("No pudimos preparar la foto.");
      contexto.drawImage(video, 0, 0);
      const imagen = await new Promise<Blob>((resolver, rechazar) =>
        lienzo.toBlob(
          (foto) =>
            foto
              ? resolver(foto)
              : rechazar(new Error("No pudimos tomar la foto.")),
          "image/jpeg",
          0.9,
        ),
      );
      if (!abierta.current) return;
      flujo.current?.getTracks().forEach((pista) => pista.stop());
      tomar(new File([imagen], "mi-visita.jpg", { type: "image/jpeg" }));
    } catch {
      cambiarError("No pudimos capturar la foto. Inténtalo otra vez.");
      cambiarEstado("activa");
    }
  }

  return (
    <dialog
      ref={modal}
      onClose={cerrar}
      aria-labelledby="camara-foto-resena"
      className="fixed inset-0 m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-xl overflow-y-auto rounded-2xl border border-[#d5e0d6] bg-white p-4 text-[#14382e] shadow-xl backdrop:bg-black/60 sm:p-6"
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 id="camara-foto-resena" className="font-serif text-2xl">
            Tu foto en el lugar
          </h2>
          <p className="mt-1 text-sm text-stone-600">
            Inclúyete en la foto y muestra el lugar que visitas.
          </p>
        </div>
        <button
          type="button"
          onClick={cerrar}
          className="min-h-11 rounded-lg px-3 text-sm font-semibold hover:bg-stone-100"
        >
          Cerrar cámara
        </button>
      </div>
      <div className="relative overflow-hidden rounded-xl bg-[#14382e]">
        <video
          ref={visor}
          muted
          playsInline
          autoPlay
          aria-label="Vista previa de la cámara para tu foto"
          className="aspect-[4/3] w-full object-contain"
        />
        {estado === "preparando" && (
          <p
            role="status"
            className="absolute inset-0 grid place-items-center px-5 text-center text-sm text-white"
          >
            Abriendo cámara… Si aparece un permiso, pulsa «Permitir».
          </p>
        )}
      </div>
      {error && (
        <p
          role="alert"
          className="mt-3 rounded-xl bg-amber-50 p-3 text-sm text-amber-950"
        >
          {error}
        </p>
      )}
      {estado === "error" ? (
        <button
          type="button"
          onClick={usarCamaraDispositivo}
          className="mt-4 min-h-12 w-full rounded-xl bg-[#174238] px-4 text-sm font-semibold text-white"
        >
          Usar cámara del dispositivo
        </button>
      ) : (
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <button
            type="button"
            disabled={estado !== "activa"}
            onClick={() => void capturar()}
            className="min-h-12 rounded-xl bg-[#174238] px-4 text-sm font-semibold text-white disabled:opacity-60"
          >
            {estado === "capturando" ? "Preparando foto…" : "Tomar foto"}
          </button>
          <button
            type="button"
            disabled={estado !== "activa"}
            onClick={() => {
              cambiarEstado("preparando");
              cambiarError("");
              cambiarFrontal(!frontal);
            }}
            className="min-h-12 rounded-xl border border-[#bdcfc2] px-4 text-sm font-semibold disabled:opacity-60"
          >
            Cambiar cámara
          </button>
        </div>
      )}
      <p className="mt-3 text-xs text-stone-600">
        Podrás revisar la foto antes de publicar tu reseña.
      </p>
    </dialog>
  );
}
