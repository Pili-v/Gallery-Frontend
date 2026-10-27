import { fecha, optimizada } from "../api/formato"

import Estado from "./Estado"
import LineaItem from "./LineaItem"

// Lo que se ve al abrir una venta del artista: quién la compró, cómo y cuándo, y qué obras llevó.
// error: el mensaje si falló; cargado: si ya llegó el detalle (mientras se pide, se muestra "cargando").
// fechaCompra, nombreComprador, tipoEntrega y direccionEntrega: los datos de la compra, cada uno en su prop.
// items: las obras vendidas, ya con su nombre, tamaño, marco y portada. No pide nada por su cuenta.
const DetalleVenta = ({ error, cargado, fechaCompra, nombreComprador, tipoEntrega, direccionEntrega, items }) => {
    if (error) return <Estado tipo="error" mensaje={error} />
    if (!cargado) return <Estado tipo="cargando" />

    return (
        <div>
            <p className="body-sm muted" style={{ marginBottom: "var(--sm)" }}>
                Comprado el {fecha(fechaCompra)} por {nombreComprador} ·{" "}
                {tipoEntrega === "ENVIO_DOMICILIO"
                    ? "Envío a domicilio: " + direccionEntrega
                    : tipoEntrega
                      ? "Retiro en el local"
                      : "Encargo a medida, sin envío"}
            </p>
            {items.map((item) => (
                <LineaItem
                    key={item.id}
                    id={item.id}
                    nombreObra={item.nombre_obra}
                    nombreTamanio={item.nombre_tamanio}
                    nombreMarco={item.nombre_marco}
                    cantidad={item.cantidad}
                    subtotal={item.subtotal}
                    imagen={optimizada(item.portada_url, 160)}
                />
            ))}
        </div>
    )
}

export default DetalleVenta
