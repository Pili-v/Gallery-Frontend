import { Link } from "react-router-dom"
import { pesos } from "../api/formato"

// La ficha de la publicación, debajo de la imagen: el nombre de la obra, quién la hizo y en qué tamaño, el precio y,
// si hace falta, un aviso de disponibilidad (sin stock o última unidad). Texto simple, sin recuadro: la imagen es la
// protagonista. Aparece en el catálogo, en el perfil del artista y en las obras relacionadas.
// Cada dato llega en su propia prop (no como objetos obra y variante): id, nombreObra, estilo, artistaId,
// nombreArtistico, nombreTamanio, precio, porcentajeDescuento y stock. Los de la variante pueden faltar.
// Con conArtista en false no se nombra al artista (en su propio perfil ya está arriba).

export default function FichaObra({
    id,
    nombreObra,
    estilo,
    artistaId,
    nombreArtistico,
    nombreTamanio,
    precio,
    porcentajeDescuento: descuento,
    stock,
    conArtista = true
}) {
    const detalle = [nombreTamanio, estilo].filter(Boolean)
    const precioFinal = descuento ? precio * (1 - descuento / 100) : precio

    return (
        <div className="ficha-obra">
            <Link to={`/obra/${id}`} className="title-work ficha-obra-titulo">
                {nombreObra}
            </Link>

            <p className="ficha-obra-meta">
                {/* Sin artistaId no se linkea: queda el nombre como texto. */}
                {conArtista &&
                    (artistaId ? (
                        <Link to={`/artista/${artistaId}`}>{nombreArtistico || "Artista"}</Link>
                    ) : (
                        <span>{nombreArtistico || "Artista"}</span>
                    ))}
                {detalle.length > 0 && (conArtista ? " · " : "") + detalle.join(" · ")}
            </p>

            {precio != null && (
                <p className="price-md ficha-obra-precio">
                    {descuento > 0 && <span className="precio-tachado">{pesos(precio)}</span>}
                    {pesos(precioFinal)}
                </p>
            )}

            <Disponibilidad stock={stock} />
        </div>
    )
}

// Solo se avisa lo que cambia la decisión de compra: sin stock, la última unidad o que todavía no tiene tamaños.
function Disponibilidad({ stock }) {
    if (stock == null) return <p className="cartela-meta">Sin tamaños cargados</p>
    if (stock === 0) return <p className="cartela-meta">Sin stock</p>
    if (stock === 1) return <p className="cartela-meta disponible poco">Última unidad</p>
    return null
}
