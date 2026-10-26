import { useState, useEffect } from "react"
import { traerProvincias, separarZona, buscarDirecciones, textoDeDireccion, nombreCorto } from "../api/direcciones"
import { ENVIO_DOMICILIO, RETIRO_LOCAL } from "../api/entrega"
import CampoFormulario from "./CampoFormulario"

// Cómo se recibe la compra: envío a domicilio (con la dirección y su autocompletado) o retiro por el local.
// Vive en el carrito, debajo del total. Solo dibuja y avisa: quien lo usa guarda el tipo de entrega y la dirección.
//   tipoEntrega: ENVIO_DOMICILIO o RETIRO_LOCAL.
//   direccion: el texto de la dirección. Lo que ya estaba guardada se toma como elegida (no se buscan sugerencias).
//   error: el aviso de la dirección (por ejemplo, si falta para el envío).
//   onTipoEntrega(tipo), onDireccion(texto): los avisos de cada cambio.
const EntregaCompra = ({ tipoEntrega, direccion, error, onTipoEntrega, onDireccion }) => {

    const [provincias, setProvincias] = useState([])
    const [sugerencias, setSugerencias] = useState([])
    const [buscando, setBuscando] = useState(false)
    // Una dirección que ya viene escrita no es algo recién tecleado: no hay que salir a buscar sugerencias por ella.
    const [elegida, setElegida] = useState(direccion !== "")

    // Las provincias salen de la API de direcciones y no dependen de nada: una sola vez.
    useEffect(() => {
        traerProvincias().then(setProvincias)
    }, [])

    // Autocompletado. El setTimeout de 400 ms es el "debounce": no se consulta en cada tecla sino cuando la
    // persona deja de escribir, y el clearTimeout del return cancela la consulta pendiente si sigue tecleando.
    useEffect(() => {
        if (elegida) return

        const { calle, provincia } = separarZona(direccion, provincias)
        if (calle.length < 4) return

        const temporizador = setTimeout(() => {
            setBuscando(true)
            buscarDirecciones(calle, provincia)
                .then(setSugerencias)
                .finally(() => setBuscando(false))
        }, 400)

        return () => clearTimeout(temporizador)
    }, [direccion, elegida, provincias])

    const escribirDireccion = (e) => {
        onDireccion(e.target.value)
        setElegida(false)
    }

    const elegirSugerencia = (sugerida) => {
        onDireccion(textoDeDireccion(sugerida))
        setElegida(true)
        setSugerencias([])
    }

    const zona = separarZona(direccion, provincias)

    // Con la dirección corta no hay sugerencias que valgan, aunque haya quedado alguna de antes.
    const sugerenciasVisibles = zona.calle.length >= 4 ? sugerencias : []

    return (
        <div>
            <p className="catalog-number muted" style={{ marginBottom: "var(--sm)" }}>Cómo la recibís</p>

            <div className="fila">
                <span
                    className={"chip" + (tipoEntrega === ENVIO_DOMICILIO ? " activo" : "")}
                    onClick={() => onTipoEntrega(ENVIO_DOMICILIO)}>
                    Envío a domicilio
                </span>
                <span
                    className={"chip" + (tipoEntrega === RETIRO_LOCAL ? " activo" : "")}
                    onClick={() => onTipoEntrega(RETIRO_LOCAL)}>
                    Retiro por el local
                </span>
            </div>

            {/* La dirección solo aparece si elige envío: si retira, no hace falta. */}
            {tipoEntrega === ENVIO_DOMICILIO && (
                <div className="autocompletar" style={{ marginTop: "var(--md)" }}>
                    <CampoFormulario
                        etiqueta="Dirección de entrega"
                        value={direccion}
                        error={error}
                        onChange={escribirDireccion} />

                    <p className="body-sm muted" style={{ marginTop: "var(--xs)" }}>
                        Si no aparece, agregá la provincia después de una coma: “Florida 500, CABA”.
                    </p>

                    {zona.provincia && (
                        <p className="body-sm muted">Buscando solo en {nombreCorto(zona.provincia)}.</p>
                    )}

                    {zona.desconocida && (
                        <p className="body-sm muted">“{zona.desconocida}” no es una provincia: busco en todo el país.</p>
                    )}

                    {buscando && <div className="autocompletar-buscando">Buscando…</div>}

                    {sugerenciasVisibles.length > 0 && (
                        <div className="desplegable-panel completo">
                            <ul className="desplegable-lista">
                                {sugerenciasVisibles.map((sugerida) => (
                                    <li
                                        key={textoDeDireccion(sugerida)}
                                        className="desplegable-opcion"
                                        onClick={() => elegirSugerencia(sugerida)}>
                                        {textoDeDireccion(sugerida)}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}

            {tipoEntrega === RETIRO_LOCAL && (
                <p className="body-sm muted">Retirás la obra por el local, sin costo de envío.</p>
            )}
        </div>
    )
}

export default EntregaCompra
