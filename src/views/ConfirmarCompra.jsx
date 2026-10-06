// Confirmar compra — Área 4 · Compra
// Repasa lo que se está por comprar, pide la dirección y deja elegir
// si la obra se envía o se retira por el local. Después pasa al pago.

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { api } from "../api/cliente"
import { getUsuario } from "../api/sesion"
import LineaItem from "../components/LineaItem"
import ResumenTotales from "../components/ResumenTotales"
import CampoFormulario from "../components/CampoFormulario"
import Estado from "../components/Estado"

const ConfirmarCompra = () => {

    const [carrito, setCarrito] = useState(null)
    const [items, setItems] = useState([])
    const [direccion, setDireccion] = useState("")
    const [tipoEntrega, setTipoEntrega] = useState("ENVIO_DOMICILIO")
    const [cargando, setCargando] = useState(true)
    const [error, setError] = useState("")

    const usuario = getUsuario()
    const navegar = useNavigate()

    // Mismo par de llamadas que en el carrito: primero el carrito, después sus ítems.
    useEffect(() => {
        const cargar = async () => {
            try {
                const miCarrito = await api.get("/api/usuarios/" + usuario.id + "/carrito")
                const susItems = await api.get("/api/carritos/" + miCarrito.id + "/items")
                setCarrito(miCarrito)
                setItems(susItems)
                setDireccion(miCarrito.direccion_cliente || "")
            } catch (e) {
                setError(e.message)
            } finally {
                setCargando(false)
            }
        }
        cargar()
    }, [])

    // Guarda la dirección en el carrito y pasa al pago.
    // El tipo de entrega viaja a la pantalla siguiente, que es la que
    // hace el POST /api/checkout.
    const irAlPago = async () => {
        if (tipoEntrega === "ENVIO_DOMICILIO" && direccion.trim() === "") {
            setError("Para el envío a domicilio hace falta una dirección.")
            return
        }
        try {
            await api.put("/api/carritos/" + carrito.id, { direccion_cliente: direccion })
            navegar("/checkout/pago", { state: { tipoEntrega } })
        } catch (e) {
            setError(e.message)
        }
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
                                <CampoFormulario
                                    etiqueta="Dirección de entrega"
                                    value={direccion}
                                    onChange={(e) => setDireccion(e.target.value)} />
                            )}
                        </div>

                        {items.map((item) => (
                            <LineaItem key={item.id} item={item} />
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