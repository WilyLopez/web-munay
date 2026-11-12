import Link from "next/link";

export function EnlaceVisitas({ rol }: { rol: string }) {
  const turista = rol === "TURISTA";
  return (
    <Link
      href={turista ? "/verificar-visita" : "/administracion/visitas"}
      className="rounded-lg border border-teal-900 px-3 py-2 font-semibold text-teal-900"
    >
      {turista ? "Escanear QR" : "QR de visitas"}
    </Link>
  );
}
