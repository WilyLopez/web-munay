import Link from "next/link";
import type { ReactNode } from "react";

export function DocumentoLegal({
  titulo,
  children,
}: {
  titulo: string;
  children: ReactNode;
}) {
  return (
    <main className="mx-auto max-w-3xl rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:p-10">
      <p className="mb-2 text-sm font-semibold text-amber-800">
        Borrador para pruebas del Sprint 1
      </p>
      <h1 className="text-3xl font-bold">{titulo}</h1>
      <div className="mt-6 space-y-4 text-slate-700 [&_h2]:text-xl [&_h2]:font-semibold">
        {children}
      </div>
      <Link
        className="mt-8 inline-block font-semibold text-teal-800 underline"
        href="/registro"
      >
        Volver al registro
      </Link>
    </main>
  );
}
