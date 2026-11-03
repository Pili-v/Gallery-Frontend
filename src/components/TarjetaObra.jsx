import { Link } from "react-router-dom"
import FichaObra from "./FichaObra"
import Badge from "./Badge"

// Imagen + sello + ficha. Es lo que se repite en la grilla del catálogo,
// en el perfil del artista y en el panel del artista.
// Cada dato llega en su propia prop (no como objetos obra y variante): id, nombreObra, estilo, artistaId,
// nombreArtistico, nombreTamanio, precio, porcentajeDescuento, stock e imagen. Los de la variante pueden faltar.
// conArtista pasa a la ficha: en false no nombra al artista.
export default function TarjetaObra({
    id,
    nombreObra,
    estilo,
    artistaId,
    nombreArtistico,
    nombreTamanio,
    precio,
    porcentajeDescuento,
    stock,
    imagen,
    conArtista = true
}) {
    const sinStock = stock === 0
    const descuento = porcentajeDescuento > 0

    return (
        <div className="tarjeta-obra">
            <Link className="sin-subrayado bloque" to={`/obra/${id}`}>
                <div className="obra-imagen">
                    {imagen && <img src={imagen} alt={nombreObra} />}
                    {sinStock && <Badge tipo="sinstock">Sin stock</Badge>}
                    {!sinStock && descuento && <Badge tipo="descuento">−{porcentajeDescuento}%</Badge>}
                </div>
            </Link>
            <FichaObra
                id={id}
                nombreObra={nombreObra}
                estilo={estilo}
                artistaId={artistaId}
                nombreArtistico={nombreArtistico}
                nombreTamanio={nombreTamanio}
                precio={precio}
                porcentajeDescuento={porcentajeDescuento}
                stock={stock}
                conArtista={conArtista}
            />
        </div>
    )
}
