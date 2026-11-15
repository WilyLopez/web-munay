import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { enlaceAcceso } from "@/features/autenticacion/estilos-acceso";
import { PanelMunay } from "@/features/autenticacion/panel-munay";
import "./acceso.css";

export default function LayoutAcceso({ children }: { children: ReactNode }) {
  return (
    <div className="-m-8 bg-[#f8f5ec] text-[#173b32]">
      <div className="mx-auto grid min-h-dvh max-w-[100rem] gap-4 p-4 sm:p-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <main className="flex min-w-0 items-center justify-center rounded-[1.75rem] border border-[#e7e0d0] bg-[#fffdf8] px-5 py-8 sm:px-10 sm:py-12">
          <div className="w-full max-w-[28rem] space-y-6">
            <Link
              href="/"
              aria-label="Munay, inicio"
              className="inline-flex rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#174238]"
            >
              <Image
                src="/marca/logo-navbar.webp"
                width={158}
                height={52}
                alt="Munay"
                className="h-11 w-auto sm:h-13"
              />
            </Link>
            {children}
            <div className="border-t border-stone-200 pt-4 text-sm">
              <Link
                href="/destinos"
                className={`${enlaceAcceso} inline-flex min-h-11 items-center gap-2`}
              >
                <span aria-hidden="true">←</span> Explorar destinos
              </Link>
            </div>
          </div>
        </main>
        <PanelMunay />
      </div>
    </div>
  );
}
