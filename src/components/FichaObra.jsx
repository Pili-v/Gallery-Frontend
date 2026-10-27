import { Link } from "react-router-dom"
import { pesos } from "../api/formato"

// La ficha de la publicación: número, obra, vendedor, medidas, precio y stock.
// Es la pieza que da identidad al sitio y aparece en toda pantalla con una obra.
// Cada dato llega en su propia prop (no como objetos obra y variante): id, nombreObra, estilo, artistaId,
// nombreArtistico, nombreTamanio, precio, porcentajeDescuento y stock. Los de la variante pueden faltar.

export default function FichaObra({
    id,
    nombreObra,
    estilo,
    artistaId,
    nombreArtistico,
    nombreTamanio,
    precio,
    porcentajeDescuento: descuento,
    stock
}) {
    const precioFinal = descuento ? precio * (1 - descuento / 100) : precio

    return (
        <div className="cartela">
            <div className="cartela-fila">
                <span className="cartela-meta">{estilo ?? ""}</span>
            </div>

            <div className="cartela-fila" style={{ display: "block" }}>
                <Link
                    to={`/obra/${id}`}
                    className="title-work"
                    style={{ display: "block", color: "inherit", textDecoration: "none" }}
                >
                    {nombreObra}
                </Link>

                {artistaId ? (
                    <Link
                        to={`/artista/${artistaId}`}
                        className="vendedor"
                        style={{ marginTop: 4, textDecoration: "none" }}
                    >
                        <span className="avatar">{(nombreArtistico ?? "A")[0]}</span>
                        <span className="cartela-artist">{nombreArtistico ?? "Artista"}</span>
                    </Link>
                ) : (
                    // Sin artistaId (por ejemplo, en el propio perfil del artista) no tiene
                    // sentido linkear a sí mismo: se muestra como texto plano, no como link.
                    <div className="vendedor" style={{ marginTop: 4 }}>
                        <span className="avatar">{(nombreArtistico ?? "A")[0]}</span>
                        <span className="cartela-artist">{nombreArtistico ?? "Artista"}</span>
                    </div>
                )}
            </div>

            <div className="cartela-fila">
                <span className="cartela-meta">{nombreTamanio ?? ""}</span>
                <span className="price-md">
                    {descuento > 0 && <span className="precio-tachado cartela-meta">{pesos(precio)}</span>}
                    {pesos(precioFinal)}
                </span>
            </div>

            <div className="cartela-fila">
                <Disponibilidad stock={stock} />
            </div>
        </div>
    )
}

function Disponibilidad({ stock }) {
    if (stock == null) return <span className="cartela-meta">Sin tamaños cargados</span>
    if (stock === 0) return <span className="cartela-meta">Sin stock</span>
    if (stock === 1) return <span className="cartela-meta disponible poco">Última unidad</span>
    return <span className="cartela-meta disponible">{stock} disponibles</span>
}
