import { pesos } from "../api/formato"

const ResumenTotales = ({ subtotal, marcos, total, boton, onBoton, nota }) => {
    return (
        <div className="resumen">
            <h3 className="headline-sm" style={{ marginBottom: "var(--sm)" }}>Resumen</h3>

            <div className="resumen-fila">
                <span className="muted">Obras</span><span>{pesos(subtotal)}</span>
            </div>

            {marcos > 0 && (
                <div className="resumen-fila">
                    <span className="muted">Marcos</span><span>{pesos(marcos)}</span>
                </div>
            )}

            <div className="resumen-fila resumen-total">
                <span className="price-lg">Total</span><span className="price-lg">{pesos(total)}</span>
            </div>

            {boton && (
                <button className="boton boton-primario boton-bloque" style={{ marginTop: "var(--md)" }} onClick={onBoton}>
                    {boton}
                </button>
            )}

            {nota && <p className="body-sm muted" style={{ marginTop: "var(--sm)" }}>{nota}</p>}
        </div>
    )
}

export default ResumenTotales
