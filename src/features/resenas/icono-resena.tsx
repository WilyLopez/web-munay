export function IconoResena({
  tipo,
}: {
  tipo: "util" | "compartir" | "responder";
}) {
  return (
    <svg
      aria-hidden="true"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="shrink-0"
    >
      {tipo === "util" ? (
        <>
          <path d="M7 10v10H3V10zM7 10l5-7c2 0 3 2 2 5h5a2 2 0 0 1 2 2l-2 9a2 2 0 0 1-2 1H7" />
        </>
      ) : tipo === "compartir" ? (
        <>
          <path d="M12 16V3m-5 5 5-5 5 5M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6" />
        </>
      ) : (
        <path d="M21 11a8 8 0 0 1-8 8H8l-5 3V7a4 4 0 0 1 4-4h6a8 8 0 0 1 8 8Z" />
      )}
    </svg>
  );
}
