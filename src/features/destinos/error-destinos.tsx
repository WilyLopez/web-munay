"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import Link from "next/link";

export function ErrorDestinos({
  titulo,
  regreso,
}: {
  titulo: string;
  regreso?: string;
}) {
  const router = useRouter();
  const [pendiente, iniciar] = useTransition();

  return (
    <main className="mx-auto my-10 max-w-3xl space-y-4 rounded-2xl border border-stone-200 bg-white p-6 sm:p-9">
      <div role="alert">
        <h1 className="text-2xl font-bold text-teal-950">{titulo}</h1>
        <p className="mt-2 text-stone-700">
          Intenta cargar la información de nuevo.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <button
          type="button"
          disabled={pendiente}
          onClick={() => iniciar(() => router.refresh())}
          className="rounded-full bg-teal-950 px-5 py-3 font-semibold text-white disabled:opacity-60"
        >
          {pendiente ? "Cargando…" : "Reintentar"}
        </button>
        {regreso && (
          <Link
            href={regreso}
            className="font-semibold text-teal-900 underline"
          >
            Volver a explorar
          </Link>
        )}
      </div>
    </main>
  );
}
