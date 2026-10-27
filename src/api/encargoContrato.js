export const pinturas = [
    { valor: "OLEO", nombre: "Óleo" },
    { valor: "ACRILICO", nombre: "Acrílico" },
    { valor: "ACUARELA", nombre: "Acuarela" },
    { valor: "GRAFITI", nombre: "Grafiti" }
]
export const lienzos = [
    { valor: "LIENZO", nombre: "Lienzo" },
    { valor: "PAPEL", nombre: "Papel" },
    { valor: "MADERA", nombre: "Madera" },
    { valor: "TELA", nombre: "Tela" }
]

// Contrato de POST /api/encargos. Las etiquetas traducidas nunca viajan a la API.
export function prepararEncargo(formulario) {
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
