import { fecha } from "../api/formato"

import Estado from "./Estado"
import LineaItem from "./LineaItem"

// Lo que se ve al abrir una venta del artista: cómo y cuándo se compró y qué obras llevó.
// error: el mensaje si falló; cargado: si ya llegó la compra (mientras se pide, se muestra "cargando").
// fechaCompra, tipoEntrega y direccionEntrega: los datos de la compra, cada uno en su prop.
// items: los ítems de la factura. lineas: lo que Ventas guardó de cada obra, por id de item:
// { linea }, { error } o vacío. No pide nada por su cuenta.
const DetalleVenta = ({ error, cargado, fechaCompra, tipoEntrega, direccionEntrega, items, lineas }) => {
    if (error) return <Estado tipo="error" mensaje={error} />
    if (!cargado) return <Estado tipo="cargando" />

    return (
        <div>
            <p className="body-sm muted" style={{ marginBottom: "var(--sm)" }}>
                Comprado el {fecha(fechaCompra)} ·{" "}
                {tipoEntrega === "ENVIO_DOMICILIO"
                    ? "Envío a domicilio: " + direccionEntrega
                    : "Retiro en el local"}
            </p>
            {items.map((item) => {
                const estado = lineas[item.id] || {}

                if (estado.error) return <Estado key={item.id} tipo="error" mensaje={estado.error} />
                if (!estado.linea) return <Estado key={item.id} tipo="cargando" />

                return (
                    <LineaItem
                        key={item.id}
                        id={estado.linea.id}
                        nombreObra={estado.linea.nombre_obra}
                        nombreTamanio={estado.linea.nombre_tamanio}
                        nombreMarco={estado.linea.nombre_marco}
                        cantidad={estado.linea.cantidad}
                        subtotal={estado.linea.subtotal}
                        imagen={estado.linea.imagen}
                    />
                )
            })}
        </div>
    )
}

export default DetalleVenta
