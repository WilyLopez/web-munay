import assert from "node:assert/strict";
import { test } from "node:test";
import { leerPeriodo } from "../src/features/administracion/lectura-periodo.ts";

test("calcula el porcentaje sobre todo el período y acota la observación", () => {
  const lectura = leerPeriodo({
    tendencia: [
      { mes: "2026-10", total: 3 },
      { mes: "2026-11", total: 7 },
    ],
    recientes: [
      { calificacion: 5 },
      { calificacion: 4 },
      { calificacion: 2 },
      { calificacion: 3 },
    ],
  });
  assert.deepEqual(lectura.destacados, ["2026-11"]);
  assert.equal(lectura.porcentaje, 70);
  assert.match(
    lectura.observacion,
    /reseñas recientes mostradas \(4\), hay 2 con 4 o 5 estrellas y 1 con 1 o 2/,
  );
  assert.match(lectura.observacion, /oportunidades de mejora/);
});

test("conserva todos los meses empatados y su porcentaje individual", () => {
  const lectura = leerPeriodo({
    tendencia: [
      { mes: "2026-10", total: 3 },
      { mes: "2026-11", total: 3 },
    ],
    recientes: [],
  });
  assert.deepEqual(lectura.destacados, ["2026-10", "2026-11"]);
  assert.equal(lectura.porcentaje, 50);
});

test("sin visitas no destaca meses ni produce porcentajes inválidos", () => {
  for (const tendencia of [[], [{ mes: "2026-11", total: 0 }]]) {
    const lectura = leerPeriodo({ tendencia, recientes: [] });
    assert.deepEqual(lectura.destacados, []);
    assert.equal(lectura.porcentaje, 0);
    assert.match(lectura.observacion, /Aún no hay reseñas/);
  }
});

test("no atribuye sentimiento al texto ni presupone reseñas negativas", () => {
  const lectura = leerPeriodo({
    tendencia: [],
    recientes: [{ calificacion: 5 }],
  });
  assert.match(lectura.observacion, /conocer qué valoran/);
  assert.doesNotMatch(lectura.observacion, /oportunidades de mejora/);
});

