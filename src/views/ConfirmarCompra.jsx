// Confirmar compra — Área 4 · Compra
// Repasa lo que se está por comprar, pide la dirección y deja elegir
// si la obra se envía o se retira por el local. Después pasa al pago.
// Sin async/await: cada pedido se encadena con .then().

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { api, lista } from "../api/cliente"
import { getUsuario } from "../api/sesion"
import LineaItem from "../components/LineaItem"
import ResumenTotales from "../components/ResumenTotales"
import CampoFormulario from "../components/CampoFormulario"
import Estado from "../components/Estado"

// Como se muestra cada sugerencia: calle, altura y localidad, que es lo que
// uno escribiria en un sobre. La "nomenclatura" que devuelve Georef incluye la
// comuna y queda larga de leer.
const textoDeDireccion = (sugerida) => {
    const altura = sugerida.altura?.valor ? " " + sugerida.altura.valor : ""
    const lugar = sugerida.localidad_censal?.nombre ?? sugerida.departamento?.nombre ?? ""

    return sugerida.calle.nombre + altura
        + (lugar ? ", " + lugar : "")
        + ", " + sugerida.provincia.nombre
}

const ConfirmarCompra = () => {

    const [carrito, setCarrito] = useState(null)
    const [items, setItems] = useState([])
    const [imagenes, setImagenes] = useState([])
    const [direccion, setDireccion] = useState("")
    const [tipoEntrega, setTipoEntrega] = useState("ENVIO_DOMICILIO")
    const [cargando, setCargando] = useState(true)
    const [error, setError] = useState("")

    // Autocompletado de la dirección.
    const [sugerencias, setSugerencias] = useState([])
    const [buscando, setBuscando] = useState(false)
    const [elegida, setElegida] = useState(false)

    const usuario = getUsuario()
    const navegar = useNavigate()

    // Mismo par de llamadas que en el carrito: primero el carrito, después sus ítems.
    // El segundo pedido necesita el id que trajo el primero, por eso se devuelve
    // adentro del .then() en vez de pedirse todo junto.
    useEffect(() => {
        api.get("/api/usuarios/" + usuario.id + "/carrito")
            .then((miCarrito) => {
                setCarrito(miCarrito)
                setDireccion(miCarrito.direccion_cliente || "")
                setElegida(true)
                return api.get("/api/carritos/" + miCarrito.id + "/items")
            })
            .then((susItems) => {
                setItems(lista(susItems))
                return api.get("/api/imagenes")
            })
            .then((lasImagenes) => setImagenes(lista(lasImagenes)))
            .catch((e) => setError(e.message))
            .finally(() => setCargando(false))
    }, [])

    // Autocompletado contra Georef, la API de direcciones del Estado argentino:
    // es gratis, no pide clave y busca en todo el país. Va con fetch directo y
    // no por cliente.js, porque cliente.js está hecho para nuestro backend: le
    // pega el token y entiende sus errores, y nada de eso aplica acá.
    //
    // No se busca en cada tecla: se esperan 400 ms desde la última. El return
    // del useEffect cancela el temporizador anterior cada vez que el texto
    // cambia, así sale un solo pedido cuando la persona deja de escribir.
    useEffect(() => {
        if (elegida) return
        if (direccion.trim().length < 4) {
            setSugerencias([])
            return
        }

        const temporizador = setTimeout(() => {
            setBuscando(true)

            const url = "https://apis.datos.gob.ar/georef/api/direcciones"
                + "?max=8&direccion=" + encodeURIComponent(direccion)

            fetch(url)
                .then((respuesta) => respuesta.json())
                .then((datos) => {
                    const encontradas = datos.direcciones ?? []

                    // Georef devuelve la misma calle una vez por cada tramo. Nos
                    // quedamos con una sola de cada texto: no tiene sentido ofrecer
                    // dos veces lo mismo, y React necesita que la key sea única.
                    const textos = encontradas.map(textoDeDireccion)
                    const unicas = encontradas.filter((sugerida, indice) =>
                        textos.indexOf(textos[indice]) === indice)

                    setSugerencias(unicas)
                })
                // Si Georef no responde, no pasa nada: la dirección se escribe
                // a mano igual. Un servicio externo caído no frena una compra.
                .catch(() => setSugerencias([]))
                .finally(() => setBuscando(false))
        }, 400)

        return () => clearTimeout(temporizador)
    }, [direccion, elegida])

    const escribirDireccion = (e) => {
        setDireccion(e.target.value)
        setElegida(false)
    }

    const elegirSugerencia = (sugerida) => {
        setDireccion(textoDeDireccion(sugerida))
        setSugerencias([])
        setElegida(true)
    }

    // Guarda la dirección en el carrito y pasa al pago.
    // El tipo de entrega viaja a la pantalla siguiente, que es la que
    // hace el POST /api/checkout.
    const irAlPago = () => {
        if (tipoEntrega === "ENVIO_DOMICILIO" && direccion.trim() === "") {
            setError("Para el envío a domicilio hace falta una dirección.")
            return
        }

        api.put("/api/carritos/" + carrito.id, { direccion_cliente: direccion })
            .then(() => navegar("/checkout/pago", { state: { tipoEntrega } }))
            .catch((e) => setError(e.message))
    }

    // La miniatura: el ítem trae el obra_id y la foto sale de la lista de imágenes.
    const fotoDe = (obraId) => {
        const imagen = imagenes.find((i) => i.obra_id === obraId)
        return imagen ? "data:image/jpeg;base64," + imagen.contenido_imagen : null
    }

    // El backend cobra $1.500 por envío a domicilio. El retiro por el local no cuesta.
    const envio = tipoEntrega === "ENVIO_DOMICILIO" ? 1500 : 0
    const subtotal = items.reduce((suma, item) => suma + item.precio_unitario * item.cantidad, 0)
    const marcos = items.reduce((suma, item) => suma + item.precio_marco * item.cantidad, 0)
    const total = items.reduce((suma, item) => suma + item.subtotal, 0) + envio

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
                                        onChange={escribirDireccion}
                                        autoComplete="off"
                                        placeholder="Calle y altura, por ejemplo Mitre 750" />

                                    {sugerencias.length > 0 && (
                                        <div className="autocompletar-lista">
                                            {sugerencias.map((sugerida) => (
                                                <button
                                                    key={textoDeDireccion(sugerida)}
                                                    type="button"
                                                    onClick={() => elegirSugerencia(sugerida)}>
                                                    {textoDeDireccion(sugerida)}
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    {buscando && <span className="autocompletar-buscando">Buscando…</span>}
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