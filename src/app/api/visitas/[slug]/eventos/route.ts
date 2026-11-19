import { crearSupabaseServidor } from "@/features/autenticacion/supabase/servidor";
import { resolverUrlApi } from "@/lib/api-url";

export const maxDuration = 60;

export async function GET(
  peticion: Request,
  contexto: { params: Promise<{ slug: string }> },
) {
  const { slug } = await contexto.params;
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length > 180)
    return new Response(null, { status: 400 });
  const supabase = await crearSupabaseServidor();
  const { data } = await supabase.auth.getSession();
  if (!data.session) return new Response(null, { status: 401 });
  try {
    const respuesta = await fetch(
      resolverUrlApi(
        `/visitas/administracion/${encodeURIComponent(slug)}/eventos`,
      ),
      {
        headers: {
          Authorization: `Bearer ${data.session.access_token}`,
          Accept: "text/event-stream",
        },
        cache: "no-store",
        signal: AbortSignal.any([peticion.signal, AbortSignal.timeout(50000)]),
      },
    );
    if (
      !respuesta.ok ||
      !respuesta.body ||
      !respuesta.headers.get("content-type")?.includes("text/event-stream")
    )
      return new Response(null, {
        status: respuesta.ok ? 502 : respuesta.status,
      });
    return new Response(respuesta.body, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "private, no-store, no-transform",
        "X-Accel-Buffering": "no",
      },
    });
  } catch {
    return new Response(null, { status: 503 });
  }
}
