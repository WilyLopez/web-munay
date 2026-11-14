import Link from "next/link";
import type { ReactNode } from "react";
import { Navbar } from "@/features/navegacion/navbar";
import { PiePagina } from "@/features/navegacion/pie-pagina";

export default function LayoutLegal({ children }: { children: ReactNode }) {
  return (
    <div className="-m-8 flex min-h-screen flex-col">
      <Navbar />
      <main className="mx-auto w-full max-w-4xl flex-1 px-5 py-10 sm:px-8">
        <article className="space-y-6 rounded-2xl border border-stone-200 bg-[#fffdf7] p-5 text-[#314941] sm:p-10 [&_a]:font-semibold [&_a]:underline [&_h1]:text-3xl [&_h1]:font-bold [&_h2]:text-xl [&_h2]:font-semibold [&_p]:leading-relaxed [&_section]:space-y-3">
          {children}
        </article>
        <Link href="/" className="mt-6 inline-block font-semibold underline">
          Volver al inicio
        </Link>
      </main>
      <PiePagina />
    </div>
  );
}
