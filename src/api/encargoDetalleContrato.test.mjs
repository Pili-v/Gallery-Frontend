import test from 'node:test';
import assert from 'node:assert/strict';
import { prepararMensaje, prepararCambioEstado } from './encargoDetalleContrato.mjs';

test('el mensaje prepara solo los campos y tipos que recibe MensajeRequest', () => {
  assert.deepEqual(prepararMensaje('12', '  Hola, Ana.  '), { encargo_id: 12, contenido: 'Hola, Ana.' });
  for (const id of ['', '1.5', 'abc', '-1', '9007199254740993']) assert.throws(() => prepararMensaje(id, 'Hola'));
  for (const texto of [null, undefined, '', ' \t\n ', 'a'.repeat(256)]) assert.throws(() => prepararMensaje(12, texto));
});

test('el cambio de estado mantiene el nombre nuevoEstado y los enums exactos', () => {
  assert.deepEqual(prepararCambioEstado('PENDIENTE', 'EN_PROCESO'), { nuevoEstado: 'EN_PROCESO' });
  assert.deepEqual(prepararCambioEstado('EN_PROCESO', 'TERMINADO'), { nuevoEstado: 'TERMINADO' });
  assert.throws(() => prepararCambioEstado('PENDIENTE', 'En proceso'));
  assert.throws(() => prepararCambioEstado('EN_PROCESO', 'PENDIENTE'));
});
