const codigoVisita =
  /^munay:visita:([a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12})$/;
const identificador = /^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/;

export function rutaQrVisita(id: string) {
  return identificador.test(id) ? `/verificar-visita?codigo=${id}` : null;
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
  const coincidencia = /^\/verificar-visita\?codigo=([a-f0-9-]{36})$/.exec(
    valor,
  );
  return coincidencia ? rutaQrVisita(coincidencia[1]) : null;
}
