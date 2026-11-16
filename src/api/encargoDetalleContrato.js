// Cómo se dibuja cada estado (solo el estilo: el texto y los cambios posibles los manda el back en cada encargo).
export const estiloDeEstado = {
    PENDIENTE: "pendiente",
    APROBADO: "proceso",
    PAGADO: "terminado",
    EN_PROCESO: "proceso",
    TERMINADO: "terminado",
    CANCELADO: "cancelado"
}

// POST /api/mensajes: el emisor lo determina la sesión, no viaja en el body.
// Devuelve { cuerpo } si el mensaje sirve o { error } con el motivo (no lanza: una validación no es una excepción).
export function prepararMensaje(encargoId, texto) {
    const id = Number(encargoId)
    if (!Number.isSafeInteger(id) || id <= 0) return { error: "El encargo no es válido." }
    const contenido = typeof texto === "string" ? texto.trim() : ""
    if (!contenido) return { error: "Escribí un mensaje antes de enviar." }
    // La columna actual del backend es VARCHAR(255) y MensajeRequest también lo valida.
    if (contenido.length > 255) return { error: "El mensaje puede tener hasta 255 caracteres." }
    return { cuerpo: { encargo_id: id, contenido } }
}

// PATCH /api/encargos/{id}/estado: respeta CambiarEstadoRequest. Los estados posibles salen del encargo
// (estados_siguientes), que los calcula el back; si se elige otro, el back igual lo rechaza.
// Devuelve { cuerpo } o { error }.
export function prepararCambioEstado(estadosSiguientes, nuevoEstado) {
    if (!estadosSiguientes.some((estado) => estado.valor === nuevoEstado)) {
        return { error: "Ese cambio de estado no está permitido." }
    }
    return { cuerpo: { nuevoEstado } }
}
