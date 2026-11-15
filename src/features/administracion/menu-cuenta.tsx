"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { cerrarSesion } from "@/features/autenticacion/acciones";

const opcion =
  "block w-full rounded-lg px-3 py-2 text-left text-sm font-medium hover:bg-[#edf3ec] focus-visible:outline-2 focus-visible:-outline-offset-2";

export function MenuCuenta({
  nombre,
  global,
}: {
  nombre: string;
  global: boolean;
}) {
  const [abierto, cambiar] = useState(false);
  const contenedor = useRef<HTMLDivElement>(null);
  const boton = useRef<HTMLButtonElement>(null);
  const id = useId();
  const base = global ? "/superadmin" : "/administracion";

  useEffect(() => {
    if (!abierto) return;
    function cerrarFuera(evento: PointerEvent) {
      if (
        evento.target instanceof Node &&
        !contenedor.current?.contains(evento.target)
      )
        cambiar(false);
    }
    document.addEventListener("pointerdown", cerrarFuera);
    return () => document.removeEventListener("pointerdown", cerrarFuera);
  }, [abierto]);

  return (
    <div
      ref={contenedor}
      className="relative min-w-0"
      onBlur={(evento) => {
        if (!evento.currentTarget.contains(evento.relatedTarget))
          cambiar(false);
      }}
      onKeyDown={(evento) => {
        if (evento.key !== "Escape" || !abierto) return;
        evento.stopPropagation();
        cambiar(false);
        boton.current?.focus();
      }}
    >
      <button
        ref={boton}
        type="button"
        aria-label={`Opciones de cuenta de ${nombre}`}
        aria-expanded={abierto}
        aria-controls={id}
        onClick={() => cambiar(!abierto)}
        className="flex min-w-0 items-center gap-2 rounded-full border border-[#ccd9cf] bg-white p-1.5 pr-2 hover:bg-[#edf3ec] focus-visible:outline-2 focus-visible:outline-offset-2 sm:pr-3"
      >
        <span
          aria-hidden="true"
          className="grid size-7 shrink-0 place-items-center rounded-full bg-[#dbece0]"
        >
          <svg
            viewBox="0 0 24 24"
            className="size-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          >
            <circle cx="12" cy="8" r="3" />
            <path d="M5 19a7 7 0 0 1 14 0" />
          </svg>
        </span>
        <span className="hidden max-w-40 truncate text-sm font-semibold sm:block">
          {nombre}
        </span>
        <svg
          viewBox="0 0 20 20"
          aria-hidden="true"
          className={`size-4 shrink-0 motion-safe:transition-transform ${abierto ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
        >
          <path d="m5 7.5 5 5 5-5" />
        </svg>
      </button>
      <div
        id={id}
        hidden={!abierto}
        className="absolute top-full right-0 z-40 mt-2 w-64 max-w-[calc(100vw-2.5rem)] rounded-2xl border border-[#dce3da] bg-white p-1.5 shadow-lg"
      >
        <div className="border-b border-[#dce3da] px-3 py-2.5">
          <p className="wrap-anywhere text-sm font-semibold">{nombre}</p>
          <p className="text-xs text-[#4d665b]">
            {global ? "Super Administrador" : "Admin"}
          </p>
        </div>
        <div className="py-1">
          <Link
            href={`${base}/perfil`}
            className={opcion}
            onClick={() => cambiar(false)}
          >
            Mi perfil
          </Link>
          <Link
            href={`${base}/configuracion`}
            className={opcion}
            onClick={() => cambiar(false)}
          >
            Configuración
          </Link>
        </div>
        <form action={cerrarSesion} className="border-t border-[#dce3da] pt-1">
          <button
            type="submit"
            className={`${opcion} text-rose-800 hover:bg-rose-50`}
          >
            Cerrar sesión
          </button>
        </form>
      </div>
    </div>
  );
}
