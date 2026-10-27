// Lo que comparten las listas con filtros (Mis obras, Mis ventas y Mis compras): los filtros viajan al back como
// parámetros de la URL y es el back el que arma la página ya filtrada.

// Los períodos que se pueden elegir, en días hacia atrás desde hoy (0 = sin límite).
export const PERIODOS = [
    { valor: "0", texto: "Todo el tiempo", dias: 0 },
    { valor: "30", texto: "Últimos 30 días", dias: 30 },
    { valor: "180", texto: "Últimos 6 meses", dias: 180 },
    { valor: "365", texto: "Último año", dias: 365 }
]

// La fecha (aaaa-mm-dd) desde la que arranca un período, como la espera el back. "" si no tiene límite.
export const desdeDelPeriodo = (valor) => {
    const periodo = PERIODOS.find((periodoPosible) => periodoPosible.valor === valor)
    if (!periodo || periodo.dias === 0) return ""

    const desde = new Date()
    desde.setDate(desde.getDate() - periodo.dias)

    const mes = String(desde.getMonth() + 1).padStart(2, "0")
    const dia = String(desde.getDate()).padStart(2, "0")
    return desde.getFullYear() + "-" + mes + "-" + dia
}

// Los filtros como parámetros de URL ("&clave=valor&..."), para sumar a una URL que ya tiene su "?". Los que están
// vacíos no se mandan; una lista (por ejemplo, de estilos) va separada por comas.
export const parametrosDeFiltros = (filtros) => {
    let parametros = ""

    Object.keys(filtros).forEach((nombreDelFiltro) => {
        const valor = filtros[nombreDelFiltro]
        const vacio =
            valor === "" || valor === null || valor === undefined || (Array.isArray(valor) && valor.length === 0)
        if (!vacio)
            parametros =
                parametros +
                "&" +
                nombreDelFiltro +
                "=" +
                encodeURIComponent(Array.isArray(valor) ? valor.join(",") : valor)
    })

    return parametros
}
