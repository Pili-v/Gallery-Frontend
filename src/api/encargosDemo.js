import { prepararEncargo } from './encargoContrato.mjs';
import { estadosEncargo, prepararMensaje, prepararCambioEstado } from './encargoDetalleContrato.mjs';

// Datos exclusivamente locales. Estos IDs no pertenecen a la base del backend.
export const artistasDemo = [
  { id: 1, usuario_id: 201, nombre: 'Ana Gorriti' },
  { id: 2, usuario_id: 101, nombre: 'Lucía Varela' },
];
export const clientesDemo = [{ id: 101, nombre: 'Lucía Varela' }, { id: 102, nombre: 'Bruno Ledesma' }];
export const tamaniosDemo = [{ id: 1, nombre: '140 × 105 cm' }, { id: 2, nombre: '90 × 70 cm' }];
export const marcosDemo = [{ id: 1, nombre: 'Negro simple' }, { id: 2, nombre: 'Roble' }];
export const clienteDemo = { usuario_id: 101, artista_id: null };
export const artistaDemo = { usuario_id: 201, artista_id: 1 };
const clave = 'gallery.encargos.demo.v1';

function ejemplos() {
  const filas = [
    [12, 101, 'OLEO', 'LIENZO', 'EN_PROCESO', '2026-09-21', 'Algo en la línea de la serie de ocres, con más presencia de verdes. Para un living con luz de tarde.'],
    [11, 102, 'ACRILICO', 'MADERA', 'PENDIENTE', '2026-09-18', 'Un paisaje de montaña con tonos cálidos para el comedor.'],
    [9, 101, 'ACUARELA', 'PAPEL', 'PENDIENTE', '2026-09-12', 'Flores silvestres en tonos suaves para un dormitorio luminoso.'],
    [7, 102, 'ACUARELA', 'PAPEL', 'TERMINADO', '2026-09-05', 'Una vista del río al atardecer, con azules y violetas.'],
    [4, 101, 'ACRILICO', 'MADERA', 'TERMINADO', '2026-08-28', 'Una composición geométrica en verdes para el estudio.'],
    [2, 101, 'GRAFITI', 'TELA', 'CANCELADO', '2026-08-14', 'Una composición urbana con letras y colores vivos.'],
  ];
  return filas.map(([id, usuario_id, tipo_pintura, tipo_lienzo, estado_encargo, fecha, descripcion_encargo]) => ({
    id, usuario_id, artista_id: 1, tamanio_id: id === 12 ? 1 : 2, marco_id: 1,
    tipo_pintura, tipo_lienzo, estado_encargo, descripcion_encargo,
    fecha_creacion_encargo: `${fecha}T12:00:00-03:00`,
    mensajes: id === 12 ? [
      { id: 1, encargo_id: 12, usuario_emisor_id: 101, contenido_mensaje: '¿Llegarías para fin de octubre?', fecha_demo: '2026-09-21T14:20:00-03:00' },
      { id: 2, encargo_id: 12, usuario_emisor_id: 201, contenido_mensaje: 'Sí, arranco esta semana. Te mando una foto cuando tenga la base.', fecha_demo: '2026-09-21T18:05:00-03:00' },
      { id: 3, encargo_id: 12, usuario_emisor_id: 101, contenido_mensaje: 'Perfecto, gracias.', fecha_demo: '2026-09-22T09:10:00-03:00' },
    ] : [],
  }));
}

export function leerEncargosDemo(storage = sessionStorage) {
  const texto = storage.getItem(clave);
  const guardados = texto ? JSON.parse(texto) : [];
  if (!Array.isArray(guardados)) throw new Error('Los encargos locales no tienen un formato válido.');
  const porId = new Map(ejemplos().map(item => [item.id, item]));
  for (const item of guardados) {
    if (!item || !Number.isSafeInteger(item.id) || item.id <= 0 || !Object.hasOwn(estadosEncargo, item.estado_encargo)) {
      throw new Error('Hay un encargo local con datos inválidos.');
    }
    // Compatibilidad con los pedidos creados antes de agregar el detalle.
    const encargo = { usuario_id: clienteDemo.usuario_id, mensajes: [], ...item };
    if (!Array.isArray(encargo.mensajes)) throw new Error('Los mensajes locales no tienen un formato válido.');
    porId.set(item.id, encargo);
  }
  return [...porId.values()].sort((a, b) => b.id - a.id);
}

export function obtenerEncargoDemo(id, storage = sessionStorage) {
  const numero = Number(id);
  if (!Number.isSafeInteger(numero) || numero <= 0) return null;
  return leerEncargosDemo(storage).find(item => item.id === numero) ?? null;
}

export function guardarEncargoDemo(formulario, storage = sessionStorage) {
  const { datos, errores } = prepararEncargo(formulario);
  if (!datos) throw new Error(Object.values(errores)[0]);
  const encargos = leerEncargosDemo(storage);
  const encargo = {
    ...datos, id: Math.max(12, ...encargos.map(item => item.id)) + 1,
    usuario_id: clienteDemo.usuario_id, estado_encargo: 'PENDIENTE',
    fecha_creacion_encargo: new Date().toISOString(), mensajes: [],
  };
  storage.setItem(clave, JSON.stringify([...encargos, encargo]));
  return encargo;
}

export function esArtistaDelEncargo(encargo, participante) {
  const artista = artistasDemo.find(item => item.id === encargo.artista_id);
  return encargo.artista_id === participante.artista_id && artista?.usuario_id === participante.usuario_id;
}

export function puedeVerEncargo(encargo, participante) {
  return encargo.usuario_id === participante.usuario_id || esArtistaDelEncargo(encargo, participante);
}

function actualizarEncargo(id, modificar, storage) {
  const encargos = leerEncargosDemo(storage);
  const indice = encargos.findIndex(item => item.id === Number(id));
  if (indice === -1) throw new Error('No encontramos ese encargo.');
  const actualizado = modificar(encargos[indice]);
  encargos[indice] = actualizado;
  storage.setItem(clave, JSON.stringify(encargos));
  return actualizado;
}

export function enviarMensajeDemo(id, texto, participante, storage = sessionStorage) {
  const request = prepararMensaje(id, texto);
  return actualizarEncargo(request.encargo_id, encargo => {
    if (!puedeVerEncargo(encargo, participante)) throw new Error('No tenés permiso para escribir en este encargo.');
    const mensaje = {
      id: Math.max(0, ...encargo.mensajes.map(item => item.id)) + 1,
      encargo_id: request.encargo_id, usuario_emisor_id: participante.usuario_id,
      contenido_mensaje: request.contenido,
      // MensajeResponse no devuelve fecha: este dato es solo de la demo.
      fecha_demo: new Date().toISOString(),
    };
    return { ...encargo, mensajes: [...encargo.mensajes, mensaje] };
  }, storage);
}

export function cambiarEstadoDemo(id, nuevoEstado, participante, storage = sessionStorage) {
  return actualizarEncargo(id, encargo => {
    if (!esArtistaDelEncargo(encargo, participante)) throw new Error('Solo el artista del encargo puede cambiar el estado.');
    const request = prepararCambioEstado(encargo.estado_encargo, nuevoEstado);
    return { ...encargo, estado_encargo: request.nuevoEstado };
  }, storage);
}
