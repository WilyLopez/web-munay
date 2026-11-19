"use client";
import { useRouter } from "next/navigation";
import { useTransition, type FormEvent } from "react";

const campo =
  "min-h-12 w-full min-w-0 rounded-lg border border-[#b9c4b9] bg-white px-3 text-base font-normal text-[#193b33] focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-60 sm:text-sm";

export function FiltrosResenas({
  ruta,
  destino,
  orden,
  regreso,
  destinos,
  mostrarDestinos,
}: {
  ruta: string;
  destino?: string;
  orden?: string;
  regreso?: string;
  destinos: { slug: string; nombre: string }[];
  mostrarDestinos: boolean;
}) {
  const router = useRouter();
  const [pendiente, iniciarTransicion] = useTransition();
  function aplicar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const datos = new FormData(evento.currentTarget);
    const parametros = new URLSearchParams();
    const elegido = String(datos.get("destino") ?? "");
    if (mostrarDestinos && elegido) parametros.set("destino", elegido);
    parametros.set(
      "orden",
      datos.get("orden") === "calificacion" ? "calificacion" : "fecha",
    );
    if (regreso) parametros.set("volver", regreso);
    iniciarTransicion(() =>
      router.replace(`${ruta}?${parametros}#opiniones`, { scroll: false }),
    );
  }
  return (
    <form
      key={`${destino ?? ""}:${orden ?? "fecha"}`}
      action={`${ruta}#opiniones`}
      onSubmit={aplicar}
      onChange={(evento) => evento.currentTarget.requestSubmit()}
      aria-label="Filtros de reseñas"
      aria-busy={pendiente}
      className="grid items-end gap-3 rounded-2xl border border-[#dedacf] bg-[#fffdf6] p-4 sm:grid-cols-[repeat(auto-fit,minmax(10rem,1fr))] sm:p-5"
    >
      {regreso && <input type="hidden" name="volver" value={regreso} />}
      {mostrarDestinos && (
        <label className="grid min-w-0 gap-1.5 text-sm font-semibold">
          Destino
          <select
            name="destino"
            defaultValue={destino ?? ""}
            disabled={pendiente}
            className={campo}
          >
            <option value="">Todos los atractivos</option>
            {destinos.map((lugar) => (
              <option key={lugar.slug} value={lugar.slug}>
                {lugar.nombre}
              </option>
            ))}
          </select>
        </label>
      )}
      <label className="grid min-w-0 gap-1.5 text-sm font-semibold">
        Ordenar por
        <select
          name="orden"
          defaultValue={orden === "calificacion" ? orden : "fecha"}
          disabled={pendiente}
          className={campo}
        >
          <option value="fecha">Más recientes</option>
          <option value="calificacion">Mejor calificadas</option>
        </select>
      </label>
      <p role="status" className="text-xs text-[#526a60] sm:col-span-full">
        {pendiente
          ? "Actualizando reseñas…"
          : "Las reseñas se actualizan al cambiar una opción."}
      </p>
      <noscript>
        <button
          type="submit"
          className="min-h-12 rounded-lg bg-[#174238] px-4 font-semibold text-white"
        >
          Aplicar filtros
        </button>
      </noscript>
    </form>
  );
}
