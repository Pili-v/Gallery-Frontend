// Precios en pesos argentinos con punto de miles: $ 340.000
export const pesos = (valor) => {
    if (valor === null || valor === undefined) return ""
    return "$ " + Number(valor).toLocaleString("es-AR", { maximumFractionDigits: 0 })
}

// Fechas como 27/09/2026
export const fecha = (valor) => {
    if (!valor) return ""
    return new Date(valor).toLocaleDateString("es-AR")
}
