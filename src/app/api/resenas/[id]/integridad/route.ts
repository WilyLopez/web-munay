import { NextResponse, type NextRequest } from "next/server";
import { resolverUrlApi } from "@/lib/api-url";

export async function GET(
  solicitud: NextRequest,
  contexto: RouteContext<"/api/resenas/[id]/integridad">,
) {
  const { id } = await contexto.params;
  const headers = { "Cache-Control": "no-store" };
  if (!/^[\da-f]{8}(?:-[\da-f]{4}){3}-[\da-f]{12}$/i.test(id)) {
    return NextResponse.json(
      { mensaje: "La reseña no está disponible." },
      { status: 404, headers },
    );
  }
  try {
    const destino = resolverUrlApi(`/anclajes-resenas/${id}/verificar`);
    const respuesta = await fetch(destino, {
      cache: "no-store",
      signal: AbortSignal.any([solicitud.signal, AbortSignal.timeout(10000)]),
    });
    if (respuesta.status === 404) {
      return NextResponse.json(
        { mensaje: "La reseña no está disponible." },
        { status: 404, headers },
      );
    }
    if (!respuesta.ok) throw new Error("La consulta falló.");
    return NextResponse.json(await respuesta.json(), { headers });
  } catch {
    return NextResponse.json(
      {
        mensaje:
          "No pudimos consultar el registro de Sepolia. Intenta nuevamente.",
      },
      { status: 503, headers },
    );
  }
}
