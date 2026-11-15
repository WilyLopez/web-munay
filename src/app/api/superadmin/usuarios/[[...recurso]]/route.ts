import { NextResponse, type NextRequest } from "next/server";
import { solicitarVisitas } from "@/features/visitas/api";

export async function GET(
  solicitud: NextRequest,
  contexto: RouteContext<"/api/superadmin/usuarios/[[...recurso]]">,
) {
  const { recurso = [] } = await contexto.params;
  const [clave] = recurso;
  if (
    recurso.length > 1 ||
    (clave &&
      !/^(?:destinos|perfil|[\da-f]{8}(?:-[\da-f]{4}){3}-[\da-f]{12})$/i.test(
        clave,
      ))
  ) {
    return NextResponse.json(
      { mensaje: "La cuenta no está disponible." },
      { status: 404 },
    );
  }
  const sufijo = clave ? `/${clave}` : solicitud.nextUrl.search;
  const respuesta = await solicitarVisitas(`/superadmin/usuarios${sufijo}`);
  return NextResponse.json(
    respuesta.ok ? respuesta.datos : { mensaje: respuesta.mensaje },
    {
      status: respuesta.ok ? 200 : respuesta.estado || 503,
      headers: { "Cache-Control": "private, no-store" },
    },
  );
}
