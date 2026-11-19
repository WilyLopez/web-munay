import { redirect } from "next/navigation";
import { Suspense } from "react";
import { accesoPanel } from "@/features/administracion/acceso";
import { solicitarVisitas } from "@/features/visitas/api";
import type { DestinoVisita } from "@/features/visitas/tipos";
import { BotonActualizarPanel } from "@/features/visitas/boton-actualizar-panel";

async function FichaAsignada() {
  const perfil = await accesoPanel();
  if (perfil?.rol === "SUPER_ADMIN") redirect("/superadmin/destinos");
  if (!perfil) redirect("/administracion");

  const respuesta = await solicitarVisitas<DestinoVisita[]>(
    "/visitas/administracion",
  );
  const destino = respuesta.ok ? respuesta.datos[0] : undefined;
  if (!respuesta.ok)
    return (
      <div className="space-y-3">
        <p role="alert">{respuesta.mensaje}</p>
        {![401, 403, 404].includes(respuesta.estado) && (
          <BotonActualizarPanel reintentar />
        )}
      </div>
    );
  return redirect(
    destino
      ? `/administracion/atractivos/${encodeURIComponent(destino.slug)}`
      : "/administracion",
  );
}

export default function PaginaMiAtractivo() {
  return (
    <Suspense
      fallback={<p role="status">Abriendo la ficha de tu atractivo…</p>}
    >
      <FichaAsignada />
    </Suspense>
  );
}
