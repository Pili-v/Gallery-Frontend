// Pago del carrito — Área 4 · Compra
// La consigna pide simular el pago: el formulario es la tarjeta misma (ver FormularioPago). Nada de lo
// que se escribe en ella se guarda ni se envía. Lo que sí es real es el POST /api/checkout,
// que descuenta el stock y emite una factura por cada artista.
// Los ítems y el tipo de entrega llegan desde el carrito (por el estado de la navegación): no se vuelven a pedir.
// Solo si alguien entra directo por la URL se piden acá.

import { useState, useEffect } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { api, lista } from "../api/cliente"
import { getUsuario } from "../api/sesion"
import { costoDeEnvio } from "../api/entrega"
import FormularioPago from "../components/FormularioPago"
import Estado from "../components/Estado"

const Pago = () => {
    const usuario = getUsuario()
    const navegar = useNavigate()
    const ubicacion = useLocation()

    // Lo que mandó el carrito. Si no hay nada (entrada directa por la URL), hay que pedirlo.
    const itemsRecibidos = ubicacion.state ? ubicacion.state.items : null

    const [items, setItems] = useState(itemsRecibidos || [])
    const [cargando, setCargando] = useState(!itemsRecibidos)
    const [error, setError] = useState("")

    // El tipo de entrega lo eligió la pantalla anterior y viajó hasta acá.
    // Si alguien entra directo por la URL, se asume envío a domicilio.
    const tipoEntrega = ubicacion.state?.tipoEntrega || "ENVIO_DOMICILIO"

    const envio = costoDeEnvio(tipoEntrega)

    // El primer .then() devuelve el pedido siguiente: los items necesitan el
    // id que trajo el carrito, asi que uno espera al otro.
    useEffect(() => {
        if (itemsRecibidos) return

        api.get("/api/usuarios/" + usuario.id + "/carrito")
            .then((miCarrito) => api.get("/api/carritos/" + miCarrito.id + "/items"))
            .then((susItems) => setItems(lista(susItems)))
            .catch((e) => setError(e.message))
            .finally(() => setCargando(false))
    }, [])

    // Quién compra sale del token, igual que en el backend.
    // Si el back rechaza la compra porque algo ya no está disponible (alguien compró lo último mientras tanto), vuelve al
    // carrito con el aviso: el carrito se pide de nuevo y marca cuáles son los ítems.
    const pagar = () =>
        api
            .post("/api/checkout", { tipo_entrega: tipoEntrega })
            .then((compra) => navegar("/compra/" + compra.id))
            .catch((e) => {
                if (e.status === 409 && e.detalle && e.detalle.items) {
                    navegar("/carrito", { state: { sinDisponibilidad: e.detalle.mensaje } })
                }
                throw e
            })

    const subtotal = items.reduce((suma, item) => suma + item.precio_unitario * item.cantidad, 0)
    const marcos = items.reduce((suma, item) => suma + item.precio_marco * item.cantidad, 0)
    const total = items.reduce((suma, item) => suma + item.subtotal, 0) + envio

    if (cargando)
        return (
            <div className="seccion">
                <div className="contenido">
                    <Estado tipo="cargando" />
                </div>
            </div>
        )

    return (
        <FormularioPago
            titulo="Pago"
            subtitulo="Último paso. Al confirmar se descuenta el stock."
            subtotal={subtotal}
            marcos={marcos}
            envio={envio}
            total={total}
            onPagar={pagar}
            textoVolver="Volver"
            onVolver={() => navegar("/carrito")}
            pista={tipoEntrega === "ENVIO_DOMICILIO" ? "Envío a domicilio" : "Retiro por el local"}
            errorCarga={error}
        />
    )
}

export default Pago
