// Pago — Área 4 · Compra
// La consigna dice "sin procesamiento de pago", así que el formulario existe
// y valida el formato, pero los datos de la tarjeta no se guardan ni se envían.
// Lo que sí es real es el POST /api/checkout, que descuenta el stock y emite
// una factura por cada artista.

import { useState, useEffect } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { api } from "../api/cliente"
import { getUsuario } from "../api/sesion"
import ResumenTotales from "../components/ResumenTotales"
import CampoFormulario from "../components/CampoFormulario"
import Estado from "../components/Estado"
import Boton from "../components/Boton"

const Pago = () => {

    const [items, setItems] = useState([])
    const [tarjeta, setTarjeta] = useState({ numero: "", titular: "", vencimiento: "", codigo: "" })
    const [cargando, setCargando] = useState(true)
    const [pagando, setPagando] = useState(false)
    const [error, setError] = useState("")

    const usuario = getUsuario()
    const navegar = useNavigate()
    const ubicacion = useLocation()

    // El tipo de entrega lo eligió la pantalla anterior y viajó hasta acá.
    // Si alguien entra directo por la URL, se asume envío a domicilio.
    const tipoEntrega = ubicacion.state?.tipoEntrega || "ENVIO_DOMICILIO"

    useEffect(() => {
        const cargar = async () => {
            try {
                const miCarrito = await api.get("/api/usuarios/" + usuario.id + "/carrito")
                setItems(await api.get("/api/carritos/" + miCarrito.id + "/items"))
            } catch (e) {
                setError(e.message)
            } finally {
                setCargando(false)
            }
        }
        cargar()
    }, [])

    // Un solo manejador para los cuatro campos de la tarjeta: cada input
    // dice su propio nombre y se actualiza solo esa parte del estado.
    const cambiarCampo = (e) => {
        setTarjeta({ ...tarjeta, [e.target.name]: e.target.value })
    }

    const pagar = async () => {
        if (tarjeta.numero.trim() === "" || tarjeta.titular.trim() === "") {
            setError("Completá los datos de la tarjeta.")
            return
        }
        setPagando(true)
        setError("")
        try {
            // Acá no va nada de la tarjeta: solo el tipo de entrega.
            // Quién compra sale del token, igual que en el backend.
            const compra = await api.post("/api/checkout", { tipo_entrega: tipoEntrega })
            navegar("/compra/" + compra.id)
        } catch (e) {
            setError(e.message)
            setPagando(false)
        }
    }

    const subtotal = items.reduce((suma, item) => suma + item.precio_unitario * item.cantidad, 0)
    const marcos = items.reduce((suma, item) => suma + item.precio_marco * item.cantidad, 0)
    const total = items.reduce((suma, item) => suma + item.subtotal, 0)

    if (cargando) return <div className="seccion"><div className="contenido"><Estado tipo="cargando" /></div></div>

    return (
        <div className="seccion">
            <div className="contenido">

                <h1 className="headline-lg">Pago</h1>
                <p className="body-lg muted" style={{ margin: "var(--xs) 0 var(--xl)" }}>
                    Último paso. Al confirmar se descuenta el stock.
                </p>

                <div className="dos-columnas">
                    <div>
                        <div className="aviso" style={{ marginBottom: "var(--lg)" }}>
                            <span className="catalog-number cartela-num">Simulación</span>
                            <p className="body-sm" style={{ marginTop: 4 }}>
                                No se procesa ningún pago real. Los datos de la tarjeta no se guardan
                                ni se envían a ningún lado: el formulario está para completar el flujo.
                            </p>
                        </div>

                        {error && <div style={{ marginBottom: "var(--md)" }}><Estado tipo="error" mensaje={error} /></div>}

                        <div className="cartela" style={{ padding: "var(--lg)" }}>
                            <CampoFormulario etiqueta="Número de tarjeta" name="numero"
                                value={tarjeta.numero} onChange={cambiarCampo} />

                            <CampoFormulario etiqueta="Titular, como figura en la tarjeta" name="titular"
                                value={tarjeta.titular} onChange={cambiarCampo} />

                            <div className="fila-campos">
                                <CampoFormulario etiqueta="Vencimiento" name="vencimiento"
                                    value={tarjeta.vencimiento} onChange={cambiarCampo} />

                                <CampoFormulario etiqueta="Código de seguridad" name="codigo"
                                    value={tarjeta.codigo} onChange={cambiarCampo} />
                            </div>
                        </div>

                        <div className="fila" style={{ marginTop: "var(--lg)" }}>
                            <Boton tipo="secundario" onClick={() => navegar("/checkout")}>Volver</Boton>
                            <span className="cartela-meta">
                                {tipoEntrega === "ENVIO_DOMICILIO" ? "Envío a domicilio" : "Retiro por el local"}
                            </span>
                        </div>
                    </div>

                    <ResumenTotales
                        subtotal={subtotal}
                        marcos={marcos}
                        total={total}
                        boton={pagando ? "Confirmando..." : "Pagar y confirmar"}
                        onBoton={pagando ? undefined : pagar}
                        nota="Al confirmar se descuenta el stock y se emiten las facturas." />
                </div>

            </div>
        </div>
    )
}

export default Pago