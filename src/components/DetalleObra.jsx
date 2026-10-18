import { pesos, fecha } from "../api/formato"

import Estado from "./Estado"

// Lo que se ve al abrir una obra de Mis obras: una fila por cada variante (tamaño).
// variantes: la lista que ya pidió la pantalla; null si ese pedido falló.
const DetalleObra = ({ variantes }) => {
    if (variantes === null) return <Estado tipo="error" mensaje="No se pudieron cargar las variantes." />
    if (variantes.length === 0) {
        return <p className="body-sm muted">Esta obra todavía no tiene variantes: agregá variantes desde Editar.</p>
    }

    return (
        <table className="tabla">
            <thead>
                <tr>
                    <th>Tamaño</th>
                    <th>Precio</th>
                    <th>Stock</th>
                    <th>Descuento</th>
                </tr>
            </thead>
            <tbody>
                {variantes.map((variante) => (
                    <tr key={variante.id}>
                        <td>{variante.nombre_tamanio}</td>
                        <td className="price-md">{pesos(variante.precio_variante)}</td>
                        <td style={variante.stock_variante === 0 ? { color: "var(--error)" } : {}}>
                            {variante.stock_variante}
                        </td>
                        <td>
                            {variante.porcentaje_descuento
                                ? variante.porcentaje_descuento + "%" +
                                  (variante.descuento_hasta ? " hasta el " + fecha(variante.descuento_hasta) : "")
                                : "—"}
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    )
}

export default DetalleObra
