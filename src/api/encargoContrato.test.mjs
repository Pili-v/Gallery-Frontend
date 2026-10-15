import test from 'node:test';
import assert from 'node:assert/strict';
import { prepararEncargo } from './encargoContrato.mjs';

const formulario = {
  artista_id: '1', tamanio_id: '2', marco_id: '1',
  tipo_pintura: 'OLEO', tipo_lienzo: 'LIENZO',
  descripcion_encargo: '  Paisaje con verdes para el living.  ',
};

test('serializa el formulario con los nombres y tipos de EncargoRequest', () => {
  const { datos, errores } = prepararEncargo({ ...formulario, usuario_id: '99' });
  assert.deepEqual(errores, {});
  assert.deepEqual(JSON.parse(JSON.stringify(datos)), {
    artista_id: 1, tamanio_id: 2, marco_id: 1,
    tipo_pintura: 'OLEO', tipo_lienzo: 'LIENZO',
    descripcion_encargo: 'Paisaje con verdes para el living.',
  });
});

test('rechaza descripcion ausente, vacia o solo espacios', () => {
  for (const descripcion_encargo of [undefined, null, '', ' \n\t ']) {
    const resultado = prepararEncargo({ ...formulario, descripcion_encargo });
    assert.ok(resultado.errores.descripcion_encargo);
    assert.equal(resultado.datos, null);
  }
});

test('rechaza IDs vacios, fraccionarios, negativos o fuera de precision segura', () => {
  for (const campo of ['artista_id', 'tamanio_id', 'marco_id']) {
    for (const valor of ['', '0', '-1', '1.5', 'abc', '9007199254740993']) {
      const resultado = prepararEncargo({ ...formulario, [campo]: valor });
      assert.ok(resultado.errores[campo]);
      assert.equal(resultado.datos, null);
    }
  }
});

test('rechaza etiquetas visuales que no son enums del backend', () => {
  for (const [campo, valor] of [['tipo_pintura', 'Óleo'], ['tipo_lienzo', 'Lienzo']]) {
    const resultado = prepararEncargo({ ...formulario, [campo]: valor });
    assert.ok(resultado.errores[campo]);
    assert.equal(resultado.datos, null);
  }
});

test('respeta la capacidad de 255 caracteres de la descripcion', () => {
  assert.ok(prepararEncargo({ ...formulario, descripcion_encargo: 'a'.repeat(255) }).datos);
  assert.equal(prepararEncargo({ ...formulario, descripcion_encargo: 'a'.repeat(256) }).datos, null);
});
