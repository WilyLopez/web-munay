import type { FotoResena } from "./adjuntar-foto-resena";

type Borrador = {
  slug: string;
  venceEn: number;
  calificacion: number;
  comentario: string;
  foto?: FotoResena;
};
async function almacen() {
  return new Promise<IDBDatabase>((resolver, rechazar) => {
    const solicitud = indexedDB.open("munay-borradores", 1);
    solicitud.onupgradeneeded = () =>
      solicitud.result.createObjectStore("resenas", { keyPath: "slug" });
    solicitud.onsuccess = () => resolver(solicitud.result);
    solicitud.onerror = () =>
      rechazar(
        new Error("No pudimos guardar el borrador en este dispositivo."),
      );
  });
}
async function operar<T>(
  modo: IDBTransactionMode,
  accion: (tabla: IDBObjectStore) => IDBRequest<T>,
) {
  const base = await almacen();
  try {
    return await new Promise<T>((resolver, rechazar) => {
      const transaccion = base.transaction("resenas", modo);
      const solicitud = accion(transaccion.objectStore("resenas"));
      transaccion.oncomplete = () => resolver(solicitud.result);
      transaccion.onerror = transaccion.onabort = () =>
        rechazar(
          new Error(
            "No pudimos conservar el borrador. Revisa el almacenamiento de tu navegador.",
          ),
        );
    });
  } finally {
    base.close();
  }
}
export async function guardarBorrador(
  slug: string,
  calificacion: number,
  comentario: string,
  foto?: FotoResena,
) {
  await operar("readwrite", (tabla) =>
    tabla.put({
      slug,
      calificacion,
      comentario,
      foto,
      venceEn: Date.now() + 86400000,
    } satisfies Borrador),
  );
}
export async function borrarBorrador(slug: string) {
  await operar("readwrite", (tabla) => tabla.delete(slug));
}
export async function leerBorrador(slug: string) {
  const datos = await operar<Borrador | undefined>("readonly", (tabla) =>
    tabla.get(slug),
  );
  if (datos && datos.venceEn > Date.now()) return datos;
  if (datos) await borrarBorrador(slug);
  return undefined;
}
