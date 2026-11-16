const bloque = "rounded-lg bg-[#dfd9cd]";

export function EsqueletoCatalogo() {
  return (
    <div role="status" className="space-y-5 py-5 sm:py-7">
      <span className="sr-only">Cargando catálogo de destinos</span>
      <div aria-hidden="true" className="space-y-6 motion-safe:animate-pulse">
        <div className="grid items-end gap-3 sm:grid-cols-[minmax(0,1fr)_10rem]">
          <div className={`${bloque} h-11`} />
          <div className={`${bloque} h-13`} />
        </div>
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3, 4, 5].map((id) => (
            <div key={id} className="h-11 w-20 rounded-full bg-[#dfd9cd]" />
          ))}
        </div>
        <div className={`${bloque} h-11`} />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((id) => (
            <div
              key={id}
              className="overflow-hidden rounded-2xl border border-stone-200 bg-white"
            >
              <div className="aspect-[16/9] bg-[#dfd9cd]" />
              <div className="space-y-3 p-5">
                <div className={`${bloque} h-5 w-4/5`} />
                <div className={`${bloque} h-3 w-1/2`} />
                <div className={`${bloque} h-3 w-full`} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function EsqueletoFicha() {
  return (
    <div role="status" className="mx-auto max-w-6xl space-y-8 py-6 sm:py-10">
      <span className="sr-only">Cargando ficha del destino</span>
      <div aria-hidden="true" className="space-y-8 motion-safe:animate-pulse">
        <div className={`${bloque} h-5 w-32`} />
        <div className="space-y-3">
          <div className={`${bloque} h-4 w-20`} />
          <div className={`${bloque} h-10 w-full max-w-xl sm:h-12`} />
          <div className={`${bloque} h-4 w-2/3 max-w-72`} />
        </div>
        <div className="grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <div className="space-y-4">
            <div className="aspect-[16/9] rounded-3xl bg-[#dfd9cd]" />
            <div className={`${bloque} h-4 w-4/5`} />
          </div>
          <div className="space-y-4 rounded-3xl border border-stone-200 bg-white p-6">
            <div className={`${bloque} h-7 w-3/4`} />
            {[1, 2, 3].map((id) => (
              <div key={id} className={`${bloque} h-9`} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
