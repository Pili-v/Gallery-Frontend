import test from 'node:test';
import assert from 'node:assert/strict';
import { permisosEncargo } from './encargoSesion.mjs';

test('el cliente solo puede escribir en su encargo', () => {
  assert.deepEqual(permisosEncargo({ usuario_id: 10, artista_id: 7 }, { id: 10, rol_usuario: 'CLIENTE' }, null), { puedeVer: true, puedeEscribir: true, puedeCambiarEstado: false });
});
test('se usa el id del perfil de artista, no el id del usuario', () => {
  assert.deepEqual(permisosEncargo({ usuario_id: 10, artista_id: 7 }, { id: 20, rol_usuario: 'ARTISTA_CLIENTE' }, { id: 7 }), { puedeVer: true, puedeEscribir: true, puedeCambiarEstado: true });
});
test('un artista ajeno no obtiene permisos por su rol', () => {
  assert.deepEqual(permisosEncargo({ usuario_id: 10, artista_id: 7 }, { id: 7, rol_usuario: 'ARTISTA' }, { id: 30 }), { puedeVer: false, puedeEscribir: false, puedeCambiarEstado: false });
});
test('administracion puede consultar y escribir, pero no cambiar el estado de un encargo ajeno', () => {
  assert.deepEqual(permisosEncargo({ usuario_id: 10, artista_id: 7 }, { id: 99, rol_usuario: 'ADMIN' }, null), { puedeVer: true, puedeEscribir: true, puedeCambiarEstado: false });
});
