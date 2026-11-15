// Pago de un encargo — Área 4 · Compra
// El mismo pago que el del carrito (FormularioPago: la tarjeta simulada), con otro detalle: lo que se paga es
// el precio que acordaron cliente y artista. Lo único real es el POST /api/encargos/{id}/pagar, que pasa el
// encargo de terminado a pagado. Solo lo paga el cliente que lo pidió y solo cuando el artista lo terminó.
// El encargo se pide al entrar y se lee de encargosSlice; si el pedido terminó es cosa de esta pantalla.

import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { useDispatch, useSelector } from "react-redux"
import { fetchEncargo, pagarEncargo } from "../redux/encargosSlice"
import { getUsuario } from "../api/sesion"

import FormularioPago from "../components/FormularioPago"
import Estado from "../components/Estado"
import Boton from "../components/Boton"

const PagoEncargo = () => {
    const { id } = useParams()
    const navegar = useNavigate()
    const usuario = getUsuario()

    const dispatch = useDispatch()
    const encargoGuardado = useSelector((state) => state.encargos.porId[id])
    const [pedido, setPedido] = useState({ listo: false, error: "" })

    // Se pide siempre al entrar: el estado del encargo lo cambia el artista.
    useEffect(() => {
        dispatch(fetchEncargo({ id, conMensajes: false })).then((resultado) => {
            setPedido({ listo: true, error: resultado.error ? resultado.error.message : "" })
        })
    }, [dispatch, id])

    const cargando = !pedido.listo
    const error = pedido.error
    const encargo = pedido.listo && !error ? (encargoGuardado ?? null) : null

    const volver = () => navegar("/encargos/" + id)

    if (cargando)
        return (
            <div className="seccion">
                <div className="contenido">
                    <Estado tipo="cargando" />
                </div>
            </div>
        )

    // Por qué no se puede pagar, para decírselo en lugar de mostrar un pago que el back va a rechazar.
    let motivo = ""
    if (error) motivo = error
    else if (!encargo || !usuario || encargo.usuario_id !== usuario.id)
        motivo = "Solo quien hizo el encargo puede pagarlo."
    else if (encargo.estado_encargo === "PAGADO") motivo = "Este encargo ya está pagado."
    else if (encargo.estado_encargo !== "TERMINADO") motivo = "El encargo se paga cuando el artista lo termina."

    if (motivo) {
        return (
            <div className="seccion">
                <div className="contenido col-media">
                    <h1 className="headline-lg">Pago del encargo</h1>
                    <div className="mb-lg">
                        <Estado tipo={error ? "error" : "vacio"} mensaje={motivo} />
                    </div>
                    <Boton tipo="secundario" onClick={volver}>
                        Volver al encargo
                    </Boton>
                </div>
            </div>
        )
    }

    const precio = Number(encargo.precio_acordado)

    // Quién paga sale del token, igual que en el backend; de la tarjeta no viaja nada.
    // FormularioPago espera una promesa que falle si el pago no sale (muestra el error y deja reintentar).
    const pagar = () =>
        dispatch(pagarEncargo(id)).then((resultado) => {
            if (resultado.error) throw new Error(resultado.error.message)
            navegar("/encargos/" + id, { state: { pagado: true } })
        })

    return (
        <FormularioPago
            titulo="Pago del encargo"
            subtotal={precio}
            etiquetaSubtotal={"Encargo Nº " + String(encargo.id).padStart(3, "0")}
            marcos={0}
            envio={0}
            total={precio}
            onPagar={pagar}
            textoVolver="Volver al encargo"
            onVolver={volver}
        />
    )
}

export default PagoEncargo
