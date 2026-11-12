import Link from "next/link";

export default function DestinoNoEncontrado() {
  return (
    <main className="mx-auto max-w-5xl space-y-4 py-10">
      <h1 className="text-2xl font-bold">Destino no disponible</h1>
      <Link href="/destinos" className="font-semibold text-teal-900 underline">
        Volver a explorar
      </Link>
    </main>
  );
}
