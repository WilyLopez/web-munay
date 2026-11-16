import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { PanelMunay } from "@/features/autenticacion/panel-munay";
import "./acceso.css";

export default function LayoutAcceso({ children }: { children: ReactNode }) {
  return (
    <div className="marco-acceso">
      <header className="cabecera-acceso">
        <Link href="/" aria-label="Inicio de Munay" className="logo-acceso">
          <Image
            src="/marca/logo-navbar.webp"
            width={158}
            height={52}
            alt=""
            loading="eager"
            unoptimized
            className="h-10 w-auto"
          />
        </Link>
        <Link href="/destinos" prefetch={false} className="volver-acceso">
          <span aria-hidden="true">←</span> Explorar destinos
        </Link>
      </header>
      <div className="distribucion-acceso">
        <main className="principal-acceso">{children}</main>
        <PanelMunay />
      </div>
    </div>
  );
}