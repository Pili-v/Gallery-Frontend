// El precio de una variante como lo cobra el back (PrecioVigente): las tarjetas y el detalle de obra usan estas mismas
// reglas, así el precio que se ve es el que después aparece en el carrito.

// Un descuento siempre tiene fecha de fin y vale hasta ese día inclusive: sin fecha, o ya vencido, no se aplica.
// Las fechas llegan como "AAAA-MM-DD", así que se comparan como texto.
export const descuentoVigente = (variante) => {
    const hoy = new Date().toLocaleDateString("en-CA") // AAAA-MM-DD en la hora local
    const vigente = Boolean(variante.descuento_hasta) && variante.descuento_hasta >= hoy
    return vigente ? Number(variante.porcentaje_descuento || 0) : 0
}

export const precioVigente = (variante) => Number(variante.precio_variante) * (1 - descuentoVigente(variante) / 100)

// La variante que se muestra de una obra: la más barata con stock (la que define el orden "menor precio") y, con un rango
// de precio aplicado ({ min, max }, "" = sin límite), la más barata con stock DENTRO del rango, así el precio que se ve
// es el que se filtró. Si ninguna tiene stock, la más barata igual. null si la obra no tiene variantes.
export const varianteParaMostrar = (variantes, rango = { min: "", max: "" }) => {
    const enRango = variantes.filter((variante) => {
        const precio = precioVigente(variante)
        return (rango.min === "" || precio >= Number(rango.min)) && (rango.max === "" || precio <= Number(rango.max))
    })
    const candidatas = enRango.length > 0 ? enRango : variantes
    const conStock = candidatas.filter((variante) => variante.stock_variante > 0)
    const opciones = conStock.length > 0 ? conStock : candidatas
    if (opciones.length === 0) return null

    return [...opciones].sort((a, b) => precioVigente(a) - precioVigente(b))[0]
}
