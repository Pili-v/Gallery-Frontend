// Contrato de POST /api/encargos. Las etiquetas traducidas nunca viajan a la API.
// Los tipos de pintura y de lienzo válidos los manda el back (GET /api/encargos/opciones): acá no se repiten.
export function prepararEncargo(formulario, pinturas, lienzos) {
    const errores = {}
    const datos = {}
    for (const campo of ["artista_id", "tamanio_id", "marco_id"]) {
        const valor = Number(formulario[campo])
        if (!Number.isSafeInteger(valor) || valor <= 0) errores[campo] = "Seleccioná una opción válida."
        datos[campo] = valor
    }
    for (const [campo, opciones] of [
        ["tipo_pintura", pinturas],
        ["tipo_lienzo", lienzos]
    ]) {
        if (!opciones.some((opcion) => opcion.valor === formulario[campo])) {
            errores[campo] = "Seleccioná una opción válida."
        }
        datos[campo] = formulario[campo]
    }
    const descripcion = typeof formulario.descripcion_encargo === "string" ? formulario.descripcion_encargo.trim() : ""
    if (!descripcion) errores.descripcion_encargo = "Contale al artista qué cuadro querés encargar."
    else if (descripcion.length > 255) errores.descripcion_encargo = "Usá hasta 255 caracteres."
    datos.descripcion_encargo = descripcion
    return { datos: Object.keys(errores).length ? null : datos, errores }
}
