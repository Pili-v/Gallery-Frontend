export const estadosEncargo = {
  PENDIENTE: { clase: 'pendiente', texto: 'Pendiente' },
  EN_PROCESO: { clase: 'proceso', texto: 'En proceso' },
  TERMINADO: { clase: 'terminado', texto: 'Terminado' },
  CANCELADO: { clase: 'cancelado', texto: 'Cancelado' },
};

export function estadosPermitidos(estado) {
  if (estado === 'PENDIENTE') return ['EN_PROCESO', 'CANCELADO'];
  if (estado === 'EN_PROCESO') return ['TERMINADO', 'CANCELADO'];
  return [];
}

// POST /api/mensajes: el emisor lo determina la sesión, no viaja en el body.
export function prepararMensaje(encargoId, texto) {
  const id = Number(encargoId);
  if (!Number.isSafeInteger(id) || id <= 0) throw new Error('El encargo no es válido.');
  const contenido = typeof texto === 'string' ? texto.trim() : '';
  if (!contenido) throw new Error('Escribí un mensaje antes de enviar.');
  // La columna actual del backend es VARCHAR(255).
  if (contenido.length > 255) throw new Error('El mensaje puede tener hasta 255 caracteres.');
  return { encargo_id: id, contenido };
}

// PATCH /api/encargos/{id}/estado: respeta CambiarEstadoRequest.
export function prepararCambioEstado(estadoActual, nuevoEstado) {
  if (!estadosPermitidos(estadoActual).includes(nuevoEstado)) {
    throw new Error('Ese cambio de estado no está permitido.');
  }
  return { nuevoEstado };
}
