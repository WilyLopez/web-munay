import { MarcoPanel } from "@/features/administracion/marco-panel";
import { ConsultasUsuarios } from "@/features/usuarios/consultas";

export default function Layout({ children }: LayoutProps<"/superadmin">) {
  return (
    <MarcoPanel global>
      <ConsultasUsuarios>{children}</ConsultasUsuarios>
    </MarcoPanel>
  );
}
