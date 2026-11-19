import Link from "next/link";
import { BotonGoogle } from "./boton-google";

export function OpcionesIdentificacion({
  volver,
  deshabilitado = false,
}: {
  volver: string;
  deshabilitado?: boolean;
}) {
  const consulta = `?${new URLSearchParams({ volver })}`;
  return (
    <div className="space-y-3">
      <BotonGoogle volver={volver} deshabilitado={deshabilitado} />
      <div className="flex flex-wrap items-center justify-center gap-x-2 text-sm text-stone-600">
        <Link
          href={`/ingresar${consulta}`}
          className="inline-flex min-h-11 items-center font-semibold text-[#174238] underline-offset-4 hover:underline"
        >
          Iniciar sesión
        </Link>
        <span aria-hidden="true">·</span>
        <Link
          href={`/registro${consulta}`}
          className="inline-flex min-h-11 items-center font-semibold text-[#174238] underline-offset-4 hover:underline"
        >
          Crear cuenta
        </Link>
      </div>
    </div>
  );
}
