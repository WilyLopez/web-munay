import demostracion from "./sentimiento-demo.json";

const categorias = [
  ["positiva", "Positivas"],
  ["neutra", "Neutras"],
  ["negativa", "Negativas"],
] as const;

export function TarjetaSentimiento({ slug }: { slug: string }) {
  const destinos = demostracion.destinos;
  if (!Object.hasOwn(destinos, slug)) return null;
  const { total, distribucion } = destinos[slug as keyof typeof destinos];

  return (
    <section
      aria-labelledby="titulo-sentimiento"
      className="space-y-4 rounded-3xl border border-teal-200 bg-teal-50 p-5 sm:p-8"
    >
      <h2 id="titulo-sentimiento" className="text-2xl font-bold text-teal-950">
        Sentimiento de reseñas
      </h2>
      <p className="text-sm text-teal-950">
        Demostración de IA con {total} comentarios sintéticos.
      </p>
      <dl className="grid grid-cols-3 gap-2">
        {categorias.map(([clave, etiqueta]) => (
          <div key={clave} className="rounded-xl bg-white p-3 text-center">
            <dt className="text-sm text-stone-700">{etiqueta}</dt>
            <dd className="text-xl font-bold text-teal-950">
              {distribucion[clave]}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
