"use client";

import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import type { Destino } from "./tipos";

export function ConsultasUsuarios({ children }: { children: ReactNode }) {
  const [cliente] = useState(
    () =>
      new QueryClient({
        defaultOptions: { queries: { staleTime: 15_000, retry: false } },
      }),
  );
  return <QueryClientProvider client={cliente}>{children}</QueryClientProvider>;
}

export async function consultar<T>(
  ruta: string,
  signal: AbortSignal,
): Promise<T> {
  const respuesta = await fetch(`/api/superadmin/usuarios${ruta}`, {
    signal,
    cache: "no-store",
  });
  if (!respuesta.ok) {
    const cuerpo = (await respuesta.json().catch(() => null)) as {
      mensaje?: string;
    } | null;
    throw new Error(
      cuerpo?.mensaje ?? "No pudimos cargar los datos. Intenta de nuevo.",
    );
  }
  return respuesta.json() as Promise<T>;
}

export function useDestinos() {
  return useQuery({
    queryKey: ["destinos-asignables"],
    queryFn: ({ signal }) => consultar<Destino[]>("/destinos", signal),
  });
}
