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
export function prepararMensaje(encargoId, texto) {
    const id = Number(encargoId)
    if (!Number.isSafeInteger(id) || id <= 0) throw new Error("El encargo no es válido.")
    const contenido = typeof texto === "string" ? texto.trim() : ""
    if (!contenido) throw new Error("Escribí un mensaje antes de enviar.")
    // La columna actual del backend es VARCHAR(255).
    if (contenido.length > 255) throw new Error("El mensaje puede tener hasta 255 caracteres.")
    return { encargo_id: id, contenido }
}

// PATCH /api/encargos/{id}/estado: respeta CambiarEstadoRequest. Los estados posibles salen del encargo
// (estados_siguientes), que los calcula el back; si se elige otro, el back igual lo rechaza.
export function prepararCambioEstado(estadosSiguientes, nuevoEstado) {
    if (!estadosSiguientes.some((estado) => estado.valor === nuevoEstado)) {
        throw new Error("Ese cambio de estado no está permitido.")
    }
    return { nuevoEstado }
}
