// Confirmar compra — Área 4 · Compra
// Repasa lo que se está por comprar, pide la dirección y deja elegir
// si la obra se envía o se retira por el local. Después pasa al pago.
// Todo lo que sabe de direcciones vive en ../api/direcciones.

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { api, lista } from "../api/cliente"
import { getUsuario } from "../api/sesion"
import {
    traerProvincias,
    separarZona,
    buscarDirecciones,
    textoDeDireccion,
    nombreCorto
} from "../api/direcciones"
import { optimizada, portadaDe } from "../api/formato"
import LineaItem from "../components/LineaItem"
import ResumenTotales from "../components/ResumenTotales"
import CampoFormulario from "../components/CampoFormulario"
import Estado from "../components/Estado"

// Una lista vacía no es una falla: el backend la informa con 404 o con 409
// según el endpoint. En los dos casos devolvemos [].
const listaVacia = (promesa) =>
    promesa.catch((e) => {
        if (e.status === 404 || e.status === 409) return []
        throw e
    })

const ConfirmarCompra = () => {

    const [carrito, setCarrito] = useState(null)
    const [items, setItems] = useState([])
    const [imagenes, setImagenes] = useState([])
    const [provincias, setProvincias] = useState([])
    const [direccion, setDireccion] = useState("")
    const [sugerencias, setSugerencias] = useState([])
    const [buscando, setBuscando] = useState(false)
    const [elegida, setElegida] = useState(false)
    const [tipoEntrega, setTipoEntrega] = useState("ENVIO_DOMICILIO")
    const [cargando, setCargando] = useState(true)
    const [error, setError] = useState("")

    const usuario = getUsuario()
    const navegar = useNavigate()

    // El carrito, sus ítems y las fotos para la miniatura. Encadenados porque
    // cada paso necesita el id del anterior.
    useEffect(() => {
        api.get("/api/usuarios/" + usuario.id + "/carrito")
            .then((miCarrito) => {
                setCarrito(miCarrito)
                setDireccion(miCarrito.direccion_cliente || "")
                // Una dirección ya guardada no es algo recién tecleado:
                // no hay que salir a buscar sugerencias por ella.
                if (miCarrito.direccion_cliente) setElegida(true)
                return listaVacia(api.get("/api/carritos/" + miCarrito.id + "/items"))
            })
            .then((susItems) => {
                setItems(lista(susItems))
                return listaVacia(api.get("/api/imagenes"))
            })
            .then((lasImagenes) => setImagenes(lista(lasImagenes)))
            .catch((e) => setError(e.message))
            .finally(() => setCargando(false))
    }, [])

    // Las provincias no dependen del carrito: efecto aparte, en paralelo.
    useEffect(() => {
        traerProvincias().then(setProvincias)
    }, [])

    // Autocompletado. El setTimeout de 400 ms es el "debounce": no se consulta
    // en cada tecla sino cuando la persona deja de escribir, y el clearTimeout
    // del return cancela la consulta pendiente si sigue tecleando.
    useEffect(() => {
        if (elegida) return

        const { calle, provincia } = separarZona(direccion, provincias)
        if (calle.length < 4) { setSugerencias([]); return }

        const temporizador = setTimeout(() => {
            setBuscando(true)
            buscarDirecciones(calle, provincia)
                .then(setSugerencias)
                .finally(() => setBuscando(false))
        }, 400)

        return () => clearTimeout(temporizador)
    }, [direccion, elegida, provincias])

    const escribirDireccion = (e) => {
        setDireccion(e.target.value)
        setElegida(false)
    }

    const elegirSugerencia = (sugerida) => {
        setDireccion(textoDeDireccion(sugerida))
        setElegida(true)
        setSugerencias([])
    }

    // Guarda la dirección en el carrito y pasa al pago. El tipo de entrega
    // viaja a la pantalla siguiente, que es la que hace el POST /api/checkout.
    const irAlPago = () => {
        if (tipoEntrega === "ENVIO_DOMICILIO" && direccion.trim() === "") {
            setError("Para el envío a domicilio hace falta una dirección.")
            return
        }

        api.put("/api/carritos/" + carrito.id, { direccion_cliente: direccion })
            .then(() => navegar("/checkout/pago", { state: { tipoEntrega } }))
            .catch((e) => setError(e.message))
    }

    // La miniatura: el ítem trae el obra_id y la foto sale de la lista de imágenes (su portada).
    const fotoDe = (obraId) => {
        const imagen = portadaDe(imagenes, obraId)
        return imagen ? optimizada(imagen.url, 160) : null
    }

    // El backend cobra $1.500 por envío a domicilio. El retiro por el local no cuesta.
    const envio = tipoEntrega === "ENVIO_DOMICILIO" ? 1500 : 0
    const subtotal = items.reduce((suma, item) => suma + item.precio_unitario * item.cantidad, 0)
    const marcos = items.reduce((suma, item) => suma + item.precio_marco * item.cantidad, 0)
    const total = items.reduce((suma, item) => suma + item.subtotal, 0) + envio

    const zona = separarZona(direccion, provincias)

    if (cargando) return <div className="seccion"><div className="contenido"><Estado tipo="cargando" /></div></div>

    if (items.length === 0) {
        return (
            <div className="seccion">
                <div className="contenido">
                    <h1 className="headline-lg" style={{ marginBottom: "var(--lg)" }}>Confirmar compra</h1>
                    <Estado tipo="vacio" mensaje="No hay nada para comprar." accion="Ir al catálogo" onAccion={() => navegar("/")} />
                </div>
            </div>
        )
    }

    return (
        <div className="seccion">
            <div className="contenido">

                <h1 className="headline-lg">Confirmar compra</h1>
                <p className="body-lg muted" style={{ margin: "var(--xs) 0 var(--xl)" }}>
                    Revisá el detalle antes de cerrar.
                </p>

                {error && <div style={{ marginBottom: "var(--md)" }}><Estado tipo="error" mensaje={error} /></div>}

                <div className="dos-columnas">
                    <div>
                        <div className="cartela" style={{ padding: "var(--lg)", marginBottom: "var(--lg)" }}>
                            <p className="catalog-number muted" style={{ marginBottom: "var(--sm)" }}>Cómo la recibís</p>

                            <div className="fila" style={{ marginBottom: "var(--md)" }}>
                                <span
                                    className={"chip" + (tipoEntrega === "ENVIO_DOMICILIO" ? " activo" : "")}
                                    onClick={() => setTipoEntrega("ENVIO_DOMICILIO")}>
                                    Envío a domicilio
                                </span>
                                <span
                                    className={"chip" + (tipoEntrega === "RETIRO_LOCAL" ? " activo" : "")}
                                    onClick={() => setTipoEntrega("RETIRO_LOCAL")}>
                                    Retiro por el local
                                </span>
                            </div>

                            {/* La dirección solo aparece si elige envío: si retira, no hace falta. */}
                            {tipoEntrega === "ENVIO_DOMICILIO" && (
                                <div className="autocompletar">
                                    <CampoFormulario
                                        etiqueta="Dirección de entrega"
                                        value={direccion}
                                        onChange={escribirDireccion} />

                                    <p className="body-sm muted" style={{ marginTop: "var(--xs)" }}>
                                        Si no aparece, agregá la provincia después de una coma:
                                        “Florida 500, CABA”.
                                    </p>

                                    {zona.provincia && (
                                        <p className="body-sm muted">
                                            Buscando solo en {nombreCorto(zona.provincia)}.
                                        </p>
                                    )}

                                    {zona.desconocida && (
                                        <p className="body-sm muted">
                                            “{zona.desconocida}” no es una provincia: busco en todo el país.
                                        </p>
                                    )}

                                    {buscando && <div className="autocompletar-buscando">Buscando…</div>}

                                    {sugerencias.length > 0 && (
                                        <ul className="autocompletar-lista">
                                            {sugerencias.map((sugerida) => (
                                                <li
                                                    key={textoDeDireccion(sugerida)}
                                                    onClick={() => elegirSugerencia(sugerida)}>
                                                    {textoDeDireccion(sugerida)}
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            )}
                        </div>

                        {items.map((item) => (
                            <LineaItem key={item.id} item={item} imagen={fotoDe(item.obra_id)} />
                        ))}

                        <p className="body-sm muted" style={{ marginTop: "var(--md)" }}>
                            Esta compra genera una factura por cada artista involucrado.
                        </p>
                    </div>

                    <ResumenTotales
                        subtotal={subtotal}
                        marcos={marcos}
                        envio={envio}
                        total={total}
                        boton="Ir al pago"
                        onBoton={irAlPago}
                        nota="Al continuar vas a simular el pago." />
                </div>

            </div>
        </div>
    )
}

export default ConfirmarCompra