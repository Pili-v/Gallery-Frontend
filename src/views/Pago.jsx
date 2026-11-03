// Pago del carrito — Área 4 · Compra
// La consigna pide simular el pago: el formulario es la tarjeta misma (ver FormularioPago). Nada de lo
// que se escribe en ella se guarda ni se envía. Lo que sí es real es el POST /api/checkout,
// que descuenta el stock y emite una factura por cada artista.
// Los ítems salen del estado global: los dejó ahí la pantalla del carrito, así que no se vuelven a pedir.
// Solo si alguien entra directo por la URL (el store todavía vacío) se piden acá.

import { useEffect } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { useDispatch, useSelector } from "react-redux"
import { cargarCarrito, confirmarCompra } from "../redux/carritoSlice"
import { getUsuario } from "../api/sesion"
import { costoDeEnvio, ENVIO_DOMICILIO } from "../api/entrega"
import { optimizada, portadaDe } from "../api/formato"
import FormularioPago from "../components/FormularioPago"
import Estado from "../components/Estado"

const Pago = () => {
    const usuario = getUsuario()
    const navegar = useNavigate()
    const ubicacion = useLocation()

    const dispatch = useDispatch()
    const { carrito, items, imagenes, loading: cargando, error } = useSelector((state) => state.carrito)

    // El tipo de entrega lo eligió la pantalla anterior y viajó hasta acá por el router: es una decisión de
    // esa pantalla, no un dato del back. Si alguien entra directo por la URL, se asume envío a domicilio.
    const tipoEntrega = ubicacion.state?.tipoEntrega || ENVIO_DOMICILIO

    const envio = costoDeEnvio(tipoEntrega)

    // Entrada directa por la URL: el store todavía no tiene el carrito, así que se pide.
    // Viniendo del carrito no se despacha nada: los ítems ya están en el estado global.
    useEffect(() => {
        if (carrito === null) dispatch(cargarCarrito(usuario.id))
    }, [dispatch, carrito, usuario.id])

    // Quién compra sale del token, igual que en el backend.
    // Si el back rechaza la compra porque algo ya no está disponible (alguien compró lo último mientras tanto),
    // responde 409 y se vuelve al carrito con el aviso: el carrito se pide de nuevo y marca cuáles son los ítems.
    // unwrap() convierte el resultado del dispatch en una promesa común, para poder navegar o avisar.
    const pagar = () =>
        dispatch(confirmarCompra(tipoEntrega))
            .unwrap()
            .then((compra) => navegar("/compra/" + compra.id))
            .catch((fallo) => {
                if (fallo.code === "409") {
                    navegar("/carrito", { state: { sinDisponibilidad: fallo.message } })
                }
                throw fallo
            })

    const subtotal = items.reduce((suma, item) => suma + item.precio_unitario * item.cantidad, 0)
    const marcos = items.reduce((suma, item) => suma + item.precio_marco * item.cantidad, 0)
    const total = items.reduce((suma, item) => suma + item.subtotal, 0) + envio

    // Las obras que se pagan, con su portada, para el resumen.
    const lineas = items.map((item) => {
        const portada = portadaDe(imagenes, item.obra_id)
        return {
            id: item.id,
            nombre: item.nombre_obra,
            detalle:
                item.nombre_tamanio +
                " · " +
                (item.nombre_marco ? item.nombre_marco : "Sin marco") +
                (item.cantidad > 1 ? " · ×" + item.cantidad : ""),
            imagen: portada ? optimizada(portada.url, 120) : null,
            importe: item.subtotal
        }
    })

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
            lineas={lineas}
            nota="Se emite una factura por cada artista."
            subtotal={subtotal}
            marcos={marcos}
            envio={envio}
            total={total}
            onPagar={pagar}
            onVolver={() => navegar("/carrito")}
            textoVolver="Volver al carrito"
            entrega={
                tipoEntrega === ENVIO_DOMICILIO
                    ? carrito && carrito.direccion_cliente
                        ? "Se entrega en " + carrito.direccion_cliente
                        : "Envío a domicilio"
                    : "Retiro en el local, sin cargo"
            }
            errorCarga={error}
        />
    )
}

export default Pago
