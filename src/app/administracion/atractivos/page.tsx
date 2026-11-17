import { redirect } from "next/navigation";
import { Suspense } from "react";
import { accesoPanel } from "@/features/administracion/acceso";
import { solicitarVisitas } from "@/features/visitas/api";
import type { DestinoVisita } from "@/features/visitas/tipos";

async function FichaAsignada() {
  const perfil = await accesoPanel();
  if (perfil?.rol === "SUPER_ADMIN") redirect("/superadmin/destinos");
  if (!perfil) redirect("/administracion");

  const respuesta = await solicitarVisitas<DestinoVisita[]>(
    "/visitas/administracion",
  );
  const destino = respuesta.ok ? respuesta.datos[0] : undefined;
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
