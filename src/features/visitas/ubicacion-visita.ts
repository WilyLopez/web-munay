import type { UbicacionVisita } from "./tipos";

export function obtenerUbicacion() {
  return new Promise<UbicacionVisita>((resolver, rechazar) => {
    if (!navigator.geolocation) {
      rechazar(
        new Error(
          "La ubicación requiere un navegador compatible y una conexión HTTPS o localhost.",
        ),
      );
      return;
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) =>
        resolver({
          latitud: coords.latitude,
          longitud: coords.longitude,
          precision: coords.accuracy,
        }),
      ({ code }) =>
        rechazar(
          new Error(
            code === 1
              ? "Necesitamos tu ubicación. Habilítala en los permisos de este sitio y vuelve a intentarlo."
              : "No pudimos obtener tu ubicación. Comprueba que esté activada en el dispositivo e intenta de nuevo.",
          ),
        ),
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 },
    );
  });
}
