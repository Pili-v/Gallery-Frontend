import { pesos } from "../api/formato"

// La ficha de la publicación: número, obra, vendedor, medidas, precio y stock.
// Es la pieza que le da identidad al sitio y aparece en toda pantalla con una obra.
const FichaObra = ({ obra, variante }) => {

    const precio = variante?.precio_variante
    const descuento = variante?.porcentaje_descuento
    const precioFinal = descuento > 0 ? precio * (1 - descuento / 100) : precio

    return (
        <div className="cartela">
            <div className="cartela-fila">
                <span className="catalog-number cartela-num">Nº {String(obra.id).padStart(3, "0")}</span>
                <span className="cartela-meta">{obra.estilo}</span>
            </div>

            <div className="cartela-fila" style={{ display: "block" }}>
                <div className="title-work">{obra.nombre_obra}</div>
                <div className="vendedor" style={{ marginTop: 4 }}>
                    <span className="avatar">{(obra.nombre_artistico || "A")[0]}</span>
                    <span className="cartela-artist">{obra.nombre_artistico || "Artista"}</span>
                </div>
            </div>

            <div className="cartela-fila">
                <span className="cartela-meta">{variante?.nombre_tamanio}</span>
                <span className="price-md">
                    {descuento > 0 && <span className="precio-tachado cartela-meta">{pesos(precio)}</span>}
                    {pesos(precioFinal)}
                </span>
            </div>

            <div className="cartela-fila">
                <Disponibilidad stock={variante?.stock_variante} />
            </div>
        </div>
    )
}

// En un marketplace el stock es lo que decide la compra, así que se muestra siempre.
const Disponibilidad = ({ stock }) => {
    if (stock === 0) return <span className="cartela-meta">Sin stock</span>
    if (stock === 1) return <span className="cartela-meta disponible poco">Última unidad</span>
    return <span className="cartela-meta disponible">{stock} disponibles</span>
}

export default FichaObra
