import assert from "node:assert/strict";
import { test } from "node:test";
import {
  textoTarifa,
  optimizarFoto,
} from "../src/features/destinos/presentacion-ficha.ts";

test("una tarifa desconocida no implica ingreso gratuito", () => {
  assert.equal(textoTarifa(null), "Por confirmar");
  assert.equal(textoTarifa(undefined), "Por confirmar");
  assert.equal(textoTarifa(NaN), "Por confirmar");
  assert.equal(textoTarifa(-1), "Por confirmar");
});
test("la gratuidad necesita un cero o una modalidad libre explícita", () => {
  assert.equal(textoTarifa(0), "Entrada libre");
  assert.equal(textoTarifa(null, "libre"), "Entrada libre");
  assert.equal(textoTarifa(null, "pago"), "Por confirmar");
  assert.match(textoTarifa(12.5), /12[.,]50/);
});
test("la optimización solo acepta imágenes locales o hosts configurados", () => {
  const anterior = process.env.NEXT_PUBLIC_SUPABASE_URL;
  try {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://proyecto.supabase.co";
    assert.equal(optimizarFoto("/destinos/tucume.webp"), true);
    assert.equal(
      optimizarFoto(
        "https://proyecto.supabase.co/storage/v1/object/public/destinos/imagen.webp",
      ),
      true,
    );
    assert.equal(
      optimizarFoto("https://upload.wikimedia.org/imagen.jpg"),
      true,
    );
    assert.equal(
      optimizarFoto("https://proyecto.supabase.co.otro.com/imagen.webp"),
      false,
    );
    assert.equal(optimizarFoto("//otro.com/imagen.jpg"), false);
  } finally {
    if (anterior === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    else process.env.NEXT_PUBLIC_SUPABASE_URL = anterior;
  }
});
