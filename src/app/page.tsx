import Link from "next/link";

export default function Home() {
  return (
    <main>
      <h1 className="text-3xl font-bold">Munay</h1>
      <nav aria-label="Acceso a Munay" className="mt-4 flex gap-4">
        <Link
          href="/ingresar"
          className="font-semibold text-teal-800 underline"
        >
          Iniciar sesión
        </Link>
        <Link
          href="/registro"
          className="font-semibold text-teal-800 underline"
        >
          Crear cuenta
        </Link>
      </nav>
    </main>
  );
}
