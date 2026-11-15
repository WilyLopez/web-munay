import { Suspense } from "react";
import { TablaUsuarios } from "@/features/usuarios/tabla";

export default function Layout({ children }: LayoutProps<"/superadmin/usuarios">) {
  return (
    <Suspense fallback={<p role="status">Cargando usuarios…</p>}>
      <TablaUsuarios />
      {children}
    </Suspense>
  );
}
