import { importLibrary, setOptions } from "@googlemaps/js-api-loader";

const clave = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim();
let configurado = false;

export const googleMapsDisponible = Boolean(clave);

export function cargarGoogleMaps() {
  if (!clave)
    return Promise.reject(new Error("Google Maps no está configurado."));
  if (!configurado) {
    setOptions({ key: clave, v: "weekly" });
    configurado = true;
  }
  return Promise.all([importLibrary("maps"), importLibrary("marker")]);
}
