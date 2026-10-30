import { pesos } from "../api/formato"

// Una fila de compra. El MISMO componente se usa en el carrito, en confirmar
// compra, en la compra confirmada y dentro de cada factura.
// La única diferencia entre esas cuatro pantallas es la prop editable.
// Cada dato llega como su propia prop (no como un objeto item): id, nombreObra, nombreTamanio,
// nombreMarco, cantidad y subtotal. Los callbacks avisan con el id del ítem.
// Si el ítem ya no se puede comprar, el carrito pasa el aviso (por qué) y, si hay una salida, su texto y su callback
// (por ejemplo, "Ajustar a 2 unidades"). Con maximo, el "+" se apaga al llegar a las unidades que quedan.
// Con disponibles se muestra cuántas quedan (salvo que haya un aviso, que ya lo dice).
const LineaItem = ({
    id,
    nombreObra,
    nombreTamanio,
    nombreMarco,
    cantidad,
    subtotal,
    imagen,
    editable = false,
    aviso = null,
    accionAviso = null,
    maximo,
    disponibles,
    onCambiarCantidad,
    onQuitar,
    onAccionAviso
}) => {
    return (
        <div className="linea-item">
            <div className="linea-mini">{imagen && <img src={imagen} alt="" />}</div>

            <div>
                <div className="title-work" style={{ fontSize: 17, lineHeight: "24px" }}>
                    {nombreObra}
                </div>
                <div className="cartela-meta">
                    {nombreTamanio}
                    {nombreMarco && " · Marco: " + nombreMarco}
                </div>
                {disponibles !== undefined && !aviso && (
                    <div className="cartela-meta" style={disponibles <= 3 ? { color: "var(--bordo)" } : undefined}>
                        {disponibles === 1 ? "Última unidad disponible" : disponibles + " unidades disponibles"}
                    </div>
                )}
                {aviso && (
                    <div className="body-sm" style={{ color: "var(--error)" }} role="alert">
                        {aviso}
                        {accionAviso && (
                            <>
                                {" "}
                                <a
                                    href="#"
                                    style={{ color: "var(--bordo)" }}
                                    onClick={(e) => {
                                        e.preventDefault()
                                        onAccionAviso(id)
                                    }}
                                >
                                    {accionAviso}
                                </a>
                            </>
                        )}
                    </div>
                )}
                {editable && (
                    <a
                        href="#"
                        className="body-sm"
                        style={{ color: "var(--bordo)" }}
                        onClick={(e) => {
                            e.preventDefault()
                            onQuitar(id)
                        }}
                    >
                        Quitar
                    </a>
                )}
            </div>

            <div>
                {editable ? (
                    <div className="contador">
                        <button
                            disabled={cantidad <= 1}
                            aria-label="Restar una unidad"
                            onClick={() => onCambiarCantidad(id, cantidad - 1)}
                        >
                            −
                        </button>
                        <span>{cantidad}</span>
                        <button
                            disabled={maximo !== undefined && cantidad >= maximo}
                            aria-label="Sumar una unidad"
                            onClick={() => onCambiarCantidad(id, cantidad + 1)}
                        >
                            +
                        </button>
                    </div>
                ) : (
                    <span className="cartela-meta">× {cantidad}</span>
                )}
            </div>

            <div className="price-md" style={{ minWidth: 100, textAlign: "right" }}>
                {pesos(subtotal)}
            </div>
        </div>
    )
}

export default LineaItem
