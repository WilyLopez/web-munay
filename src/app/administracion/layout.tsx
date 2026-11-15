import { MarcoPanel } from "@/features/administracion/marco-panel";

export default function Layout({ children }: LayoutProps<"/administracion">) {
  return <MarcoPanel>{children}</MarcoPanel>;
}
