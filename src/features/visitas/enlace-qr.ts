const codigoVisita =
  /^munay:visita:([a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12})$/;
const identificador = /^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/;
const slugDestino = /^[a-z0-9]+(?:-+[a-z0-9]+)*$/;
const rutaVisita = "/verificar-visita";

export function rutaEscanerVisita(destino?: string, id?: string) {
  const parametros = new URLSearchParams();
  if (id && identificador.test(id)) parametros.set("codigo", id);
  if (destino && destino.length <= 160 && slugDestino.test(destino))
    parametros.set("destino", destino);
  return parametros.size ? `${rutaVisita}?${parametros}` : rutaVisita;
}

export function rutaQrVisita(id: string) {
  return identificador.test(id) ? rutaEscanerVisita(undefined, id) : null;
}

export function codigoQrVisita(id: string | undefined) {
  return id && identificador.test(id) ? `munay:visita:${id}` : null;
}

export function generarEnlaceQr(valor: string, origen: string) {
  const id = codigoVisita.exec(valor)?.[1];
  const ruta = id && rutaQrVisita(id);
  return ruta ? new URL(ruta, origen).href : valor;
}

export function leerCodigoQr(valor: string, origen: string) {
  if (codigoVisita.test(valor)) return valor;
  const url = URL.canParse(valor) ? new URL(valor) : null;
  return url?.origin === origen && url.pathname === "/verificar-visita"
    ? codigoQrVisita(url.searchParams.get("codigo") ?? undefined)
    : null;
}

export function regresoQrVisita(valor: string) {
  if (valor === rutaVisita) return rutaVisita;
  if (!valor.startsWith(`${rutaVisita}?`) || valor.length > 260) return null;
  const parametros = new URLSearchParams(valor.slice(rutaVisita.length + 1));
  const ruta = rutaEscanerVisita(
    parametros.get("destino") ?? undefined,
    parametros.get("codigo") ?? undefined,
  );
  return ruta === valor ? ruta : null;
}

export function ingresoParaVisita(destino?: string, codigo?: string) {
  const id = codigo && codigoVisita.exec(codigo)?.[1];
  return `/ingresar?${new URLSearchParams({ aviso: "sesion", volver: rutaEscanerVisita(destino, id || undefined) })}`;
}
