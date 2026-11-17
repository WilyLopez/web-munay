"use client";

import { useId, useState } from "react";

export function TextoResena({
  texto,
  compacto = false,
}: {
  texto: string;
  compacto?: boolean;
}) {
  const [expandido, cambiarExpandido] = useState(false);
  const id = useId();
  const extenso =
    texto.length > (compacto ? 220 : 420) ||
    texto.split("\n").length > (compacto ? 3 : 5);
  return (
    <div>
      <p
        id={id}
        className={`max-w-prose wrap-anywhere whitespace-pre-wrap leading-relaxed text-stone-700 ${compacto ? "text-sm" : "text-[0.95rem]"} ${extenso && !expandido ? (compacto ? "line-clamp-3" : "line-clamp-5") : ""}`}
      >
        {texto}
      </p>
      {extenso && (
        <button
          type="button"
          aria-expanded={expandido}
          aria-controls={id}
          onClick={() => cambiarExpandido(!expandido)}
          className="mt-1 min-h-11 text-sm font-semibold text-[#174238] underline underline-offset-4"
        >
          {expandido ? "Mostrar menos" : "Leer más"}
        </button>
      )}
    </div>
  );
}
