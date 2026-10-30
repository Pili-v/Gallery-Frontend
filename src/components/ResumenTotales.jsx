import { pesos } from "../api/formato"

// El resumen de importes de una compra. Lo que se pase como contenido (children) se dibuja entre el total y el
// botón: el carrito lo usa para mostrar ahí cómo se recibe la compra. Con botonDeshabilitado el botón no se puede apretar
// (la nota de abajo suele decir por qué).
const ResumenTotales = ({
    subtotal,
    etiquetaSubtotal = "Obras",
    marcos,
    envio,
    total,
    boton,
    onBoton,
    botonDeshabilitado = false,
    nota,
    children
}) => {
    return (
        <div className="resumen">
            <h3 className="headline-sm" style={{ marginBottom: "var(--sm)" }}>
                Resumen
            </h3>

            <div className="resumen-fila">
                <span className="muted">{etiquetaSubtotal}</span>
                <span>{pesos(subtotal)}</span>
            </div>

            {marcos > 0 && (
                <div className="resumen-fila">
                    <span className="muted">Marcos</span>
                    <span>{pesos(marcos)}</span>
                </div>
            )}

            {envio > 0 && (
                <div className="resumen-fila">
                    <span className="muted">Envío a domicilio</span>
                    <span>{pesos(envio)}</span>
                </div>
            )}

            <div className="resumen-fila resumen-total">
                <span className="price-lg">Total</span>
                <span className="price-lg">{pesos(total)}</span>
            </div>

            {children && (
                <div style={{ borderTop: "1px solid var(--border)", marginTop: "var(--md)", paddingTop: "var(--md)" }}>
                    {children}
                </div>
            )}

            {boton && (
                <button
                    className={"boton boton-bloque " + (botonDeshabilitado ? "boton-deshabilitado" : "boton-primario")}
                    style={{ marginTop: "var(--md)" }}
                    disabled={botonDeshabilitado}
                    onClick={onBoton}
                >
                    {boton}
                </button>
            )}

            {nota && (
                <p className="body-sm muted" style={{ marginTop: "var(--sm)" }}>
                    {nota}
                </p>
            )}
        </div>
    )
}

export default ResumenTotales
