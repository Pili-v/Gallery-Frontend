import { pesos } from "../api/formato"

// Una fila de compra. El MISMO componente se usa en el carrito, en confirmar
// compra, en la compra confirmada y dentro de cada factura.
// La única diferencia entre esas cuatro pantallas es la prop editable.
const LineaItem = ({ item, imagen, editable = false, onCambiarCantidad, onQuitar }) => {
    return (
        <div className="linea-item">
            <div className="linea-mini">{imagen && <img src={imagen} alt="" />}</div>

            <div>
                <div className="title-work" style={{ fontSize: 17, lineHeight: "24px" }}>
                    {item.nombre_obra}
                </div>
                <div className="cartela-meta">
                    {item.nombre_tamanio}{item.nombre_marco && " · Marco " + item.nombre_marco}
                </div>
                {editable && (
                    <a href="#" className="body-sm" style={{ color: "var(--bordo)" }}
                        onClick={(e) => { e.preventDefault(); onQuitar(item.id) }}>
                        Quitar
                    </a>
                )}
            </div>

            <div>
                {editable
                    ? <div className="contador">
                        <button onClick={() => onCambiarCantidad(item, item.cantidad - 1)}>−</button>
                        <span>{item.cantidad}</span>
                        <button onClick={() => onCambiarCantidad(item, item.cantidad + 1)}>+</button>
                    </div>
                    : <span className="cartela-meta">× {item.cantidad}</span>}
            </div>

            <div className="price-md" style={{ minWidth: 100, textAlign: "right" }}>
                {pesos(item.subtotal)}
            </div>
        </div>
    )
}

export default LineaItem
