import {
  PanelBeneficios,
  type ConsultaGestionBeneficios,
} from "@/features/beneficios/panel-beneficios";
export default function Pagina({
  searchParams,
}: {
  searchParams: Promise<ConsultaGestionBeneficios>;
}) {
  return <PanelBeneficios global consulta={searchParams} />;
}
