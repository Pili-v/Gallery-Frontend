import { pesos } from "../api/formato"

// Una fila de compra. El MISMO componente se usa en el carrito, en confirmar
// compra, en la compra confirmada y dentro de cada factura.
// La única diferencia entre esas cuatro pantallas es la prop editable.
// Cada dato llega como su propia prop (no como un objeto item): id, nombreObra, nombreTamanio,
// nombreMarco, cantidad y subtotal. Los callbacks avisan con el id del ítem.
const LineaItem = ({ id, nombreObra, nombreTamanio, nombreMarco, cantidad, subtotal, imagen, editable = false, onCambiarCantidad, onQuitar }) => {
    return (
        <div className="linea-item">
            <div className="linea-mini">{imagen && <img src={imagen} alt="" />}</div>

            <div>
                <div className="title-work" style={{ fontSize: 17, lineHeight: "24px" }}>
                    {nombreObra}
                </div>
                <div className="cartela-meta">
                    {nombreTamanio}{nombreMarco && " · Marco: " + nombreMarco}
                </div>
                {editable && (
                    <a href="#" className="body-sm" style={{ color: "var(--bordo)" }}
                        onClick={(e) => { e.preventDefault(); onQuitar(id) }}>
                        Quitar
                    </a>
                )}
            </div>

            <div>
                {editable
                    ? <div className="contador">
                        <button onClick={() => onCambiarCantidad(id, cantidad - 1)}>−</button>
                        <span>{cantidad}</span>
                        <button onClick={() => onCambiarCantidad(id, cantidad + 1)}>+</button>
                    </div>
                    : <span className="cartela-meta">× {cantidad}</span>}
            </div>

            <div className="price-md" style={{ minWidth: 100, textAlign: "right" }}>
                {pesos(subtotal)}
            </div>
        </div>
    )
}

export default LineaItem
