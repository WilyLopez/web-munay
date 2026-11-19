import assert from "node:assert/strict";
import { test } from "node:test";
import { registerHooks } from "node:module";
registerHooks({
  resolve(especificador, contexto, siguiente) {
    if (especificador.startsWith("@/"))
      return siguiente(
        new URL(`../src/${especificador.slice(2)}.ts`, import.meta.url).href,
        contexto,
      );
    return siguiente(especificador, contexto);
  },
});
const { construirPrevia, erroresFicha, advertenciaUbicacion, resumirCambios } =
  await import("../src/features/administracion/datos-ficha.ts");
const ficha = {
  id: "destino",
  nombre: "Anterior",
  descripcion: "Anterior",
  ubicacion: "Anterior",
  categoria: "CULTURA",
  provincia: "LAMBAYEQUE",
  latitud: -6.7,
  longitud: -79.8,
  imagenUrl: null,
  informacion: {},
  fotosAdicionales: [],
  diasAtencion: [],
};
function formulario(campos) {
  const datos = new FormData();
  for (const [clave, valor] of Object.entries(campos))
    for (const item of Array.isArray(valor) ? valor : [valor])
      datos.append(clave, String(item));
  return datos;
}
test("la vista previa incluye contacto, servicios, mapa, galería ordenada, días y recorrido", () => {
  const datos = formulario({
    nombre: "Museo actualizado",
    descripcion: "Nueva historia",
    ubicacion: "Nueva dirección",
    correo: "museo@example.com",
    servicios: "Baños\nGuías",
    latitud: "-6.8",
    longitud: "-79.9",
    diasAtencion: ["1", "3"],
    distanciaKm: "12",
    duracionMinutos: "30",
    recomendacion: "Llevar agua",
    "foto-url": ["https://example.com/b.jpg", "https://example.com/a.jpg"],
    "foto-alt": ["Segunda", "Primera"],
    "foto-autor": ["B", "A"],
  });
  const previa = construirPrevia(ficha, datos);
  assert.equal(previa.informacion.correo, "museo@example.com");
  assert.equal(previa.informacion.servicios, "Baños\nGuías");
  assert.equal(previa.latitud, -6.8);
  assert.equal(previa.distanciaKm, 12);
  assert.deepEqual(previa.diasAtencion, [1, 3]);
  assert.equal(previa.informacion.galeria[0].url, "https://example.com/b.jpg");
  assert.equal(previa.informacion.galeria[0].autor, "B");
  assert.ok(resumirCambios(ficha, previa).includes("Galería y orden de fotos"));
  assert.ok(resumirCambios(ficha, previa).includes("Días de atención"));
});
test("las reglas de negocio señalan el campo que debe corregirse", () => {
  assert.ok(
    erroresFicha(formulario({ modalidadIngreso: "libre", tarifaGeneral: 10 }))
      .tarifaGeneral,
  );
  assert.ok(
    erroresFicha(formulario({ modalidadIngreso: "reserva" })).reservaUrl,
  );
  assert.ok(erroresFicha(formulario({ condicion: "cerrado" })).motivoCierre);
  assert.ok(erroresFicha(formulario({ avisoDesde: "2026-12-01" })).aviso);
  assert.ok(
    erroresFicha(
      formulario({ instagram: "https://instagram.com.falso.com/museo" }),
    ).instagram,
  );
  assert.ok(
    erroresFicha(formulario({ latitudIngreso: 95, longitudIngreso: -79 }))
      .latitudIngreso,
  );
  assert.equal(
    erroresFicha(formulario({ instagram: "https://www.instagram.com/museo" }))
      .instagram,
    undefined,
  );
});
test("advierte coordenadas alejadas sin bloquear entradas cercanas", () => {
  assert.match(
    advertenciaUbicacion({
      ...ficha,
      informacion: { latitudIngreso: "-6", longitudIngreso: "-79" },
    }),
    /más de 1 km/,
  );
  assert.equal(
    advertenciaUbicacion({
      ...ficha,
      informacion: { latitudIngreso: "-6.7", longitudIngreso: "-79.8" },
    }),
    null,
  );
});
