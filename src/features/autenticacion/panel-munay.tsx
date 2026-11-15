export function PanelMunay() {
  return (
    <aside
      aria-labelledby="titulo-panel-munay"
      className="panel-acceso relative isolate hidden items-center overflow-hidden rounded-[2rem] bg-[#143e34] px-10 py-16 text-[#fff9e9] lg:flex xl:px-16"
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_90%_0%,#396c51_0%,transparent_60%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-[-12rem] bottom-[-12rem] -z-10 size-[34rem] rounded-full border border-[#f0c28b]/22 ring-[3.5rem] ring-[#f0c28b]/8"
      />
      <div className="entrada-acceso mx-auto w-full max-w-[32rem] space-y-6">
        <p className="flex items-center gap-3 text-sm font-semibold tracking-wide text-[#f0c28b]">
          <span aria-hidden="true" className="h-px w-9 bg-current" />
          Lambayeque, Perú
        </p>
        <h2
          id="titulo-panel-munay"
          className="max-w-[13ch] font-serif text-[clamp(2.6rem,4vw,5.5rem)] leading-[1.04] tracking-tight"
        >
          Descubre el patrimonio de Lambayeque
        </h2>
        <p className="max-w-[34ch] text-base leading-relaxed text-[#e0ece2]">
          Guarda tus destinos favoritos y registra tus visitas con Munay.
        </p>
      </div>
    </aside>
  );
}
