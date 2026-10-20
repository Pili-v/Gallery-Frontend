// Las acciones de una fila de un catálogo: Editar y Eliminar, y la confirmación del borrado en el mismo lugar.
// Van como enlaces en bordó, igual que las acciones de las demás tablas (Editar en Mis obras, Ver detalle en
// Mis compras, Quitar en el carrito). Solo dibuja y avisa: quien lo usa hace el pedido.
//   confirmando: true si la fila está esperando que se confirme el borrado.
//   eliminando: true mientras se borra (el enlace queda apagado).
//   onEditar(), onEliminar(), onConfirmar(), onCancelar(): lo que hace cada enlace.
const AccionesCatalogo = ({ confirmando, eliminando, onEditar, onEliminar, onConfirmar, onCancelar }) => {

    // Un enlace que no navega: hace su acción y listo.
    const enlace = (texto, accion, apagado = false) => (
        <a href="#" className="body-sm" style={{ color: apagado ? "var(--ink-muted)" : "var(--bordo)", pointerEvents: apagado ? "none" : "auto" }}
            onClick={(e) => { e.preventDefault(); accion() }}>
            {texto}
        </a>
    )

    return (
        <div className="fila" style={{ justifyContent: "flex-end", gap: "var(--md)" }}>
            {confirmando ? (
                <>
                    <span className="body-sm muted">¿Eliminar?</span>
                    {enlace(eliminando ? "Eliminando..." : "Confirmar", onConfirmar, eliminando)}
                    {enlace("Cancelar", onCancelar)}
                </>
            ) : (
                <>
                    {enlace("Editar", onEditar)}
                    {enlace("Eliminar", onEliminar)}
                </>
            )}
        </div>
    )
}

export default AccionesCatalogo
