import test from 'node:test';
import assert from 'node:assert/strict';
import * as demo from './encargosDemo.js';

function memoria() {
  const datos = new Map();
  return { getItem: clave => datos.get(clave) ?? null, setItem: (clave, valor) => datos.set(clave, valor) };
}
const cliente = { usuario_id: 101, artista_id: null };
const artista = { usuario_id: 201, artista_id: 1 };
const pedido = {
  artista_id: 1, tamanio_id: 2, marco_id: 1,
  tipo_pintura: 'ACUARELA', tipo_lienzo: 'PAPEL', descripcion_encargo: 'Flores azules para el comedor.',
};

test('lista y detalle comparten el mismo encargo de la maqueta', () => {
  const storage = memoria();
  const lista = demo.leerEncargosDemo(storage);
  assert.ok(lista.some(item => item.id === 12));
  const detalle = demo.obtenerEncargoDemo('12', storage);
  assert.equal(detalle.descripcion_encargo, 'Algo en la línea de la serie de ocres, con más presencia de verdes. Para un living con luz de tarde.');
  assert.equal(detalle.mensajes.length, 3);
  assert.equal(detalle.estado_encargo, 'EN_PROCESO');
});

test('crea pedidos consultables sin perder los creados con la versión anterior', () => {
  const storage = memoria();
  storage.setItem('gallery.encargos.demo.v1', JSON.stringify([{ ...pedido, id: 13, estado_encargo: 'PENDIENTE', fecha_creacion_encargo: '2026-10-05T20:00:00.000Z' }]));
  const nuevo = demo.guardarEncargoDemo(pedido, storage);
  assert.equal(nuevo.id, 14);
  const anterior = demo.obtenerEncargoDemo(13, storage);
  assert.equal(anterior.descripcion_encargo, pedido.descripcion_encargo);
  assert.deepEqual(anterior.mensajes, []);
  assert.equal(anterior.usuario_id, 101);
  assert.equal(demo.obtenerEncargoDemo(14, storage).marco_id, 1);
});

test('mensaje de cada participante persiste sin alterar la descripción ni otro encargo', () => {
  const storage = memoria();
  demo.enviarMensajeDemo(12, '  Gracias, prefiero verde oliva.  ', cliente, storage);
  demo.enviarMensajeDemo(12, 'Lo tengo en cuenta.', artista, storage);
  const detalle = demo.obtenerEncargoDemo(12, storage);
  assert.equal(detalle.mensajes.length, 5);
  assert.equal(detalle.mensajes[3].usuario_emisor_id, 101);
  assert.equal(detalle.mensajes[3].contenido_mensaje, 'Gracias, prefiero verde oliva.');
  assert.equal(detalle.mensajes[4].usuario_emisor_id, 201);
  assert.ok(detalle.mensajes[4].fecha_demo);
  assert.equal(detalle.descripcion_encargo, 'Algo en la línea de la serie de ocres, con más presencia de verdes. Para un living con luz de tarde.');
  assert.equal(demo.obtenerEncargoDemo(9, storage).mensajes.length, 0);
});

test('rechaza mensajes vacíos y de personas ajenas al pedido', () => {
  const storage = memoria();
  for (const texto of ['', '  \n\t ']) {
    assert.throws(() => demo.enviarMensajeDemo(12, texto, cliente, storage), /mensaje/i);
  }
  assert.throws(() => demo.enviarMensajeDemo(12, 'Hola', { usuario_id: 999 }, storage), /permiso/i);
  assert.equal(demo.obtenerEncargoDemo(12, storage).mensajes.length, 3);
});

test('solo el artista dueño puede cambiar el estado y se conserva al releer la lista', () => {
  const storage = memoria();
  assert.throws(() => demo.cambiarEstadoDemo(12, 'TERMINADO', cliente, storage), /artista/i);
  assert.throws(() => demo.cambiarEstadoDemo(12, 'TERMINADO', { usuario_id: 202, artista_id: 2 }, storage), /artista/i);
  demo.cambiarEstadoDemo(12, 'TERMINADO', artista, storage);
  assert.equal(demo.leerEncargosDemo(storage).find(item => item.id === 12).estado_encargo, 'TERMINADO');
  assert.equal(demo.obtenerEncargoDemo(9, storage).estado_encargo, 'PENDIENTE');
});

test('no permite saltos de estado, retrocesos ni reabrir estados finales', () => {
  const storage = memoria();
  assert.throws(() => demo.cambiarEstadoDemo(9, 'TERMINADO', artista, storage), /estado/i);
  assert.throws(() => demo.cambiarEstadoDemo(12, 'PENDIENTE', artista, storage), /estado/i);
  for (const id of [4, 2]) {
    for (const estado of ['PENDIENTE', 'EN_PROCESO', 'TERMINADO', 'CANCELADO']) {
      assert.throws(() => demo.cambiarEstadoDemo(id, estado, artista, storage), /estado/i);
    }
  }
  demo.cambiarEstadoDemo(9, 'EN_PROCESO', artista, storage);
  demo.cambiarEstadoDemo(9, 'CANCELADO', artista, storage);
  assert.equal(demo.obtenerEncargoDemo(9, storage).estado_encargo, 'CANCELADO');
});

test('IDs inexistentes o inválidos no abren otro pedido por accidente', () => {
  const storage = memoria();
  for (const id of [999, '12abc', '0', '1.5', '']) {
    assert.equal(demo.obtenerEncargoDemo(id, storage), null);
  }
});

test('errores de almacenamiento no borran los pedidos ni simulan un guardado exitoso', () => {
  const storage = memoria();
  storage.setItem('gallery.encargos.demo.v1', '{malformado');
  assert.throws(() => demo.leerEncargosDemo(storage));
  assert.equal(storage.getItem('gallery.encargos.demo.v1'), '{malformado');
  const bloqueado = { getItem: () => null, setItem: () => { throw new Error('Sin espacio'); } };
  assert.throws(() => demo.enviarMensajeDemo(12, 'Hola', cliente, bloqueado), /Sin espacio/);
});
