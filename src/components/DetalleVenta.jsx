import { fecha } from "../api/formato"

import Estado from "./Estado"
import LineaItem from "./LineaItem"

// Lo que se ve al abrir una venta del artista: cómo y cuándo se compró y qué obras llevó.
// entrada: { compra, items } cuando ya llegó, { error } si falló, vacía mientras se pide.
// lineas: lo que Ventas guardó de cada obra, por id de item: { linea }, { error } o vacío.
// No pide nada por su cuenta.
const DetalleVenta = ({ entrada, lineas }) => {
    if (entrada.error) return <Estado tipo="error" mensaje={entrada.error} />
    if (!entrada.compra) return <Estado tipo="cargando" />

    const compra = entrada.compra

    return (
        <div>
            <p className="body-sm muted" style={{ marginBottom: "var(--sm)" }}>
                Comprado el {fecha(compra.fecha_compra)} ·{" "}
                {compra.tipo_entrega === "ENVIO_DOMICILIO"
                    ? "Envío a domicilio: " + compra.direccion_entrega
                    : "Retiro en el local"}
            </p>
            {entrada.items.map((item) => {
                const estado = lineas[item.id] || {}

                if (estado.error) return <Estado key={item.id} tipo="error" mensaje={estado.error} />
                if (!estado.linea) return <Estado key={item.id} tipo="cargando" />

                return <LineaItem key={item.id} item={estado.linea} imagen={estado.linea.imagen} />
            })}
        </div>
    )
}

export default DetalleVenta
