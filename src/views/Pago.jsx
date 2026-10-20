// Pago del carrito — Área 4 · Compra
// La consigna pide simular el pago: el formulario es la tarjeta misma (ver FormularioPago). Nada de lo
// que se escribe en ella se guarda ni se envía. Lo que sí es real es el POST /api/checkout,
// que descuenta el stock y emite una factura por cada artista.


import { useState, useEffect } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { api, lista } from "../api/cliente"
import { getUsuario } from "../api/sesion"
import FormularioPago from "../components/FormularioPago"
import Estado from "../components/Estado"

const Pago = () => {

    const [items, setItems] = useState([])
    const [cargando, setCargando] = useState(true)
    const [error, setError] = useState("")

    const usuario = getUsuario()
    const navegar = useNavigate()
    const ubicacion = useLocation()

    // El tipo de entrega lo eligió la pantalla anterior y viajó hasta acá.
    // Si alguien entra directo por la URL, se asume envío a domicilio.
    const tipoEntrega = ubicacion.state?.tipoEntrega || "ENVIO_DOMICILIO"

    // El backend cobra $1.500 por envio a domicilio. El retiro por el local no cuesta.
    const envio = tipoEntrega === "ENVIO_DOMICILIO" ? 1500 : 0

    // El primer .then() devuelve el pedido siguiente: los items necesitan el
    // id que trajo el carrito, asi que uno espera al otro.
    useEffect(() => {
        api.get("/api/usuarios/" + usuario.id + "/carrito")
            .then((miCarrito) => api.get("/api/carritos/" + miCarrito.id + "/items"))
            .then((susItems) => setItems(lista(susItems)))
            .catch((e) => setError(e.message))
            .finally(() => setCargando(false))
    }, [])

    // Quién compra sale del token, igual que en el backend.
    const pagar = () => api.post("/api/checkout", { tipo_entrega: tipoEntrega })
        .then((compra) => navegar("/compra/" + compra.id))

    const subtotal = items.reduce((suma, item) => suma + item.precio_unitario * item.cantidad, 0)
    const marcos = items.reduce((suma, item) => suma + item.precio_marco * item.cantidad, 0)
    const total = items.reduce((suma, item) => suma + item.subtotal, 0) + envio

    if (cargando) return <div className="seccion"><div className="contenido"><Estado tipo="cargando" /></div></div>

    return (
        <FormularioPago
            titulo="Pago"
            subtitulo="Último paso. Al confirmar se descuenta el stock."
            subtotal={subtotal}
            marcos={marcos}
            envio={envio}
            total={total}
            nota="El pago es una simulación: no se procesa ni se guarda nada."
            onPagar={pagar}
            textoVolver="Volver"
            onVolver={() => navegar("/checkout")}
            pista={tipoEntrega === "ENVIO_DOMICILIO" ? "Envío a domicilio" : "Retiro por el local"}
            errorCarga={error} />
    )
}

export default Pago
