type DispositivosCamara = Pick<MediaDevices, "getUserMedia">;

export function solicitarCamaraVisita(dispositivos?: DispositivosCamara) {
  if (!dispositivos?.getUserMedia) {
    throw new DOMException(
      "La captura de cámara no está disponible.",
      "NotSupportedError",
    );
  }
  return dispositivos.getUserMedia({
    audio: false,
    video: { facingMode: { ideal: "environment" } },
  });
}

export function mensajeErrorCamara(error: unknown) {
  switch (error instanceof Error ? error.name : undefined) {
    case "NotSupportedError":
      return "Para usar la cámara, abre Munay en un navegador compatible desde su dirección HTTPS.";
    case "NotAllowedError":
    case "SecurityError":
      return "Necesitas permitir el acceso a la cámara para escanear aquí. Abre los permisos de Munay junto a la barra de direcciones o en los ajustes del navegador, cambia Cámara a Permitir y vuelve a pulsar «Activar cámara».";
    case "NotFoundError":
      return "El navegador no encontró una cámara. Conecta una cámara o abre Munay en otro dispositivo y vuelve a intentarlo.";
    case "NotReadableError":
    case "AbortError":
      return "No pudimos iniciar la cámara. Cierra otras aplicaciones que la estén usando y vuelve a pulsar «Activar cámara».";
    default:
      return "No pudimos abrir la cámara. Comprueba que esté disponible y vuelve a intentarlo.";
  }
}
