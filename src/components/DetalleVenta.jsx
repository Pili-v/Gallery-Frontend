import { fecha, optimizada } from "../api/formato"

import Estado from "./Estado"
import LineaItem from "./LineaItem"

// Lo que se ve al abrir una venta del artista: quién la compró, cómo y cuándo, y qué obras llevó.
// entrada: { detalle } cuando ya llegó, { error } si falló, vacía mientras se pide.
// El detalle trae todo junto (comprador, entrega y obras con su nombre y portada). No pide nada por su cuenta.
const DetalleVenta = ({ entrada }) => {
    if (entrada.error) return <Estado tipo="error" mensaje={entrada.error} />
    if (!entrada.detalle) return <Estado tipo="cargando" />

    const detalle = entrada.detalle

    return (
        <div>
            <p className="body-sm muted" style={{ marginBottom: "var(--sm)" }}>
                Comprado el {fecha(detalle.fecha_compra)} por {detalle.nombre_comprador} ·{" "}
                {detalle.tipo_entrega === "ENVIO_DOMICILIO"
                    ? "Envío a domicilio: " + detalle.direccion_entrega
                    : "Retiro en el local"}
            </p>
            {detalle.items.map((item) => (
                <LineaItem key={item.id} item={item} imagen={optimizada(item.portada_url, 160)} />
            ))}
        </div>
    )
}

export default DetalleVenta
