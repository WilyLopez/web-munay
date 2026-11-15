import { NextResponse, type NextRequest } from "next/server";
import { crearSupabaseServidor } from "@/features/autenticacion/supabase/servidor";

const cabeceras = {
  "Cache-Control": "private, no-store",
  "X-Content-Type-Options": "nosniff",
};

export async function GET(solicitud: NextRequest) {
  try {
    const supabase = await crearSupabaseServidor();
    const { data } = await supabase.auth.getSession();
    if (!data.session)
      return NextResponse.redirect(
        new URL("/ingresar?aviso=sesion", solicitud.url),
        { headers: cabeceras },
      );

    const url = new URL(
      "/anclajes-resenas/exportar",
      process.env.NEXT_PUBLIC_API_URL,
    );
    for (const campo of ["estado", "buscar"]) {
      const valor = solicitud.nextUrl.searchParams.get(campo);
      if (valor) url.searchParams.set(campo, valor);
    }
    const resultado = await fetch(url, {
      headers: { Authorization: `Bearer ${data.session.access_token}` },
      cache: "no-store",
      signal: solicitud.signal,
    });
    if (resultado.status === 401)
      return NextResponse.redirect(
        new URL("/ingresar?aviso=sesion", solicitud.url),
        { headers: cabeceras },
      );
    if (resultado.status === 403)
      return NextResponse.json(
        { mensaje: "Tu cuenta no tiene permiso para descargar la auditoría." },
        { status: 403, headers: cabeceras },
      );
    if (!resultado.ok || !resultado.body)
      throw new Error("No fue posible descargar la auditoría.");

    return new Response(resultado.body, {
      headers: {
        ...cabeceras,
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition":
          'attachment; filename="munay-auditoria-blockchain.csv"',
      },
    });
  } catch {
    return NextResponse.json(
      { mensaje: "No pudimos descargar la auditoría. Intenta nuevamente." },
      { status: 503, headers: cabeceras },
    );
  }
}
