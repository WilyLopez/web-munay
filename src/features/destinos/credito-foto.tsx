const fotografias: Record<
  string,
  { autor: string; archivo: string; licencia: string }
> = {
  "/destinos/tumbas-reales.webp": {
    autor: "Bruno Girin",
    archivo: "Museum_Tumbas_Reales_de_Sipan.jpg",
    licencia: "2.0",
  },
  "/destinos/tumbas-reales-exterior.webp": {
    autor: "Velvet",
    archivo: "Lambayeque museo tumbas reales de sipan.jpg",
    licencia: "4.0",
  },
  "/destinos/tucume.webp": {
    autor: "Antonio Velasco",
    archivo: "PirámidesTúcume_lou.jpg",
    licencia: "3.0",
  },
  "/destinos/tucume-museo.webp": {
    autor: "Velvet",
    archivo: "Tucume museo.jpg",
    licencia: "4.0",
  },
  "/destinos/bosque-de-pomac.webp": {
    autor: "Josefito123",
    archivo: "20250629_105537_Bosque_de_Pomac.jpg",
    licencia: "4.0",
  },
  "/destinos/bosque-de-pomac-paisaje.webp": {
    autor: "Josefito123",
    archivo: "20250629 090841 Bosque de Pomac.jpg",
    licencia: "4.0",
  },
};
export function CreditoFoto({ imagenUrl }: { imagenUrl: string | null }) {
  const fotografia = imagenUrl ? fotografias[imagenUrl] : undefined;
  if (!fotografia) return null;
  return (
    <p className="text-xs text-stone-600">
      Foto adaptada de{" "}
      <a
        className="underline"
        href={`https://commons.wikimedia.org/wiki/File:${encodeURIComponent(fotografia.archivo)}`}
      >
        {fotografia.autor}
      </a>
      {" · "}
      <a
        className="underline"
        href={`https://creativecommons.org/licenses/by-sa/${fotografia.licencia}/`}
      >
        CC BY-SA {fotografia.licencia}
      </a>
    </p>
  );
}
