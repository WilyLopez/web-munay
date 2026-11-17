import Link from "next/link";
import type { ReactNode } from "react";
import { Navbar } from "@/features/navegacion/navbar";
import { PiePagina } from "@/features/navegacion/pie-pagina";

export default function LayoutLegal({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-[#fdfcf7] text-[#173b32]">
      <Navbar />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
        <article className="space-y-6 rounded-2xl border border-stone-200 bg-[#fffdf7] p-5 text-[#314941] sm:p-10 [&_a]:font-semibold [&_a]:underline [&_h1]:text-2xl sm:[&_h1]:text-3xl [&_h1]:font-bold [&_h2]:text-lg sm:[&_h2]:text-xl [&_h2]:font-semibold [&_p]:leading-relaxed [&_section]:space-y-3">
          {children}
        </article>
        <Link
          href="/"
          className="mt-6 inline-flex min-h-12 items-center font-semibold text-[#173b32] underline hover:text-[#0b6b52]"
        >
          Volver al inicio
        </Link>
      </main>
      <PiePagina />
    </div>
  );
}
