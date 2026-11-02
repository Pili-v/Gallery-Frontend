// Tu carrito — Área 4 · Compra
// Muestra los ítems del carrito del usuario logueado, deja cambiar cantidades, quitar ítems y vaciarlo, y elegir
// cómo se recibe la compra (envío o retiro, con la dirección). El botón lleva directo al pago.
// El carrito y sus ítems viven en el estado global (carritoSlice): la pantalla despacha acciones y se suscribe.
// Los ítems se piden al entrar y cada vez que se vuelve a la pantalla después de haberla dejado (otra pestaña u otra
// ventana): así se ve enseguida si algo dejó de estar disponible. Mientras haya ítems sin disponibilidad no se puede
// ir al pago.

import { useState, useEffect } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { useDispatch, useSelector } from "react-redux"
import {
    cargarCarrito,
    recargarItems,
    cambiarCantidad,
    quitarItem,
    vaciarCarrito,
    guardarDireccion
} from "../redux/carritoSlice"
import { getUsuario } from "../api/sesion"
import { optimizada, portadaDe } from "../api/formato"
import { ENVIO_DOMICILIO, costoDeEnvio } from "../api/entrega"
import LineaItem from "../components/LineaItem"
import ResumenTotales from "../components/ResumenTotales"
import EntregaCompra from "../components/EntregaCompra"
import Estado from "../components/Estado"
import Boton from "../components/Boton"

const Carrito = () => {
    // Decisiones de esta pantalla: quedan en estado local, no las consume nadie más.
    const [tipoEntrega, setTipoEntrega] = useState(ENVIO_DOMICILIO)
    const [direccion, setDireccion] = useState("")
    const [errorDireccion, setErrorDireccion] = useState("")
    const [yendo, setYendo] = useState(false)

    const usuario = getUsuario()
    const navegar = useNavigate()
    const ubicacion = useLocation()

    const dispatch = useDispatch()
    const { carrito, items, imagenes, loading: cargando, error } = useSelector((state) => state.carrito)

    // Si el pago volvió acá porque algo ya no estaba disponible, trae el aviso del back (los ítems afectados se
    // marcan solos: la lista se acaba de pedir de nuevo y cada ítem trae su disponibilidad).
    const avisoDelPago = ubicacion.state ? ubicacion.state.sinDisponibilidad : null

    // Carga inicial: una sola vez, cuando la pantalla aparece.
    useEffect(() => {
        dispatch(cargarCarrito(usuario.id))
    }, [dispatch, usuario.id])

    // La dirección guardada se copia al campo cuando llega el carrito. Depende del id y no del objeto entero
    // para que no se pise lo que la persona está escribiendo cada vez que el carrito cambia.
    useEffect(() => {
        if (carrito) setDireccion(carrito.direccion_cliente || "")
    }, [carrito?.id])

    // Al volver a la pantalla después de haberla dejado (otra pestaña u otra ventana) se piden de nuevo los ítems: así
    // se ve enseguida si mientras tanto una obra se quedó sin stock o salió de la venta. Solo en ese momento, sin
    // pedidos periódicos. Si el pedido falla se deja lo que ya había en pantalla.
    useEffect(() => {
        if (carrito === null) return

        const alVolver = () => {
            if (document.visibilityState !== "visible") return
            dispatch(recargarItems(carrito.id))
        }

        document.addEventListener("visibilitychange", alVolver)
        return () => document.removeEventListener("visibilitychange", alVolver)
    }, [dispatch, carrito])

    // Cambiar la cantidad de un ítem. No baja de 1: un ítem se saca con "Quitar" (la fila deshabilita el "−").
    // La fila avisa con el id del ítem; los demás datos (variante y marco) salen de la lista de ítems.
    // El pedido al back lo hace el thunk: acá solo se despacha.
    const alCambiarCantidad = (itemId, nuevaCantidad) => {
        if (nuevaCantidad < 1) return

        const item = items.find((otro) => otro.id === itemId)
        dispatch(
            cambiarCantidad({
                carritoId: carrito.id,
                itemId,
                varianteId: item.variante_id,
                marcoId: item.marco_id,
                cantidad: nuevaCantidad
            })
        )
    }

    // Ajusta un ítem a las unidades que quedan (cuando se pidieron más de las que hay).
    const ajustarCantidad = (itemId) => {
        const item = items.find((otro) => otro.id === itemId)
        alCambiarCantidad(itemId, item.stock_disponible)
    }

    const alQuitarItem = (itemId) => dispatch(quitarItem(itemId))

    const alVaciarCarrito = () => dispatch(vaciarCarrito(carrito.id))

    // Guarda la dirección en el carrito y pasa al pago. El tipo de entrega y los ítems viajan a la pantalla
    // siguiente, que es la que hace el POST /api/checkout (así no vuelve a pedir lo que ya se sabe).
    // unwrap() convierte el resultado del dispatch en una promesa común: resuelve si la acción terminó en
    // fulfilled y corta si terminó en rejected.
    const irAlPago = () => {
        if (yendo || hayNoDisponibles) return

        if (tipoEntrega === ENVIO_DOMICILIO && direccion.trim() === "") {
            setErrorDireccion("Para el envío a domicilio hace falta una dirección.")
            return
        }

        setYendo(true)
        dispatch(guardarDireccion({ carritoId: carrito.id, direccion }))
            .unwrap()
            .then(() => navegar("/checkout/pago", { state: { tipoEntrega, items } }))
            .catch(() => setYendo(false))
    }

    // La miniatura: el ítem trae el obra_id y la foto sale de la lista de imágenes (su portada).
    const fotoDe = (obraId) => {
        const imagen = portadaDe(imagenes, obraId)
        return imagen ? optimizada(imagen.url, 160) : null
    }

    // Con algo no disponible (sin stock, con menos unidades de las pedidas o fuera de la venta) no se puede pagar.
    const hayNoDisponibles = items.some((item) => !item.disponible)

    // Los totales se calculan con lo que ya devuelve la API por cada ítem: al cambiar la lista se recalculan solos.
    const envio = costoDeEnvio(tipoEntrega)
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
        <div className="seccion">
            <div className="contenido">
                {avisoDelPago && (
                    <p className="aviso mb-md" role="alert">
                        No se pudo completar la compra. {avisoDelPago} Las obras afectadas están marcadas abajo.
                    </p>
                )}

                {error && (
                    <div className="mb-md">
                        <Estado tipo="error" mensaje={error} />
                    </div>
                )}

                {items.length === 0 ? (
                    <>
                        <h1 className="headline-lg titulo-oculto">Tu carrito</h1>
                        <Estado
                            tipo="vacio"
                            mensaje="Todavía no agregaste ninguna obra."
                            accion="Ir al catálogo"
                            onAccion={() => navegar("/")}
                        />
                    </>
                ) : (
                    <div className="dos-columnas">
                        {/* El título y el subtítulo van arriba de la lista; el resumen arranca a su misma altura. */}
                        <div>
                            <h1 className="headline-lg titulo-oculto">Tu carrito</h1>

                            {items.map((item) => (
                                <LineaItem
                                    key={item.id}
                                    id={item.id}
                                    nombreObra={item.nombre_obra}
                                    nombreTamanio={item.nombre_tamanio}
                                    nombreMarco={item.nombre_marco}
                                    cantidad={item.cantidad}
                                    subtotal={item.subtotal}
                                    imagen={fotoDe(item.obra_id)}
                                    editable={true}
                                    aviso={item.motivo_no_disponible}
                                    accionAviso={
                                        item.stock_disponible > 0 && !item.disponible
                                            ? item.stock_disponible === 1
                                                ? "Ajustar a 1 unidad"
                                                : "Ajustar a " + item.stock_disponible + " unidades"
                                            : null
                                    }
                                    maximo={item.stock_disponible}
                                    disponibles={item.stock_disponible}
                                    onCambiarCantidad={alCambiarCantidad}
                                    onQuitar={alQuitarItem}
                                    onAccionAviso={ajustarCantidad}
                                />
                                                        ))}

                            <div className="fila mt-md">
                                <Boton tipo="secundario" onClick={alVaciarCarrito}>
                                    Vaciar carrito
                                </Boton>
                                <a
                                    href="#"
                                    className="body-sm texto-bordo"
                                    onClick={(e) => {
                                        e.preventDefault()
                                        navegar("/")
                                    }}
                                >
                                    Seguir mirando obras
                                </a>
                            </div>

                            <p className="body-sm muted mt-md">
                                Esta compra genera una factura por cada artista involucrado.
                            </p>
                        </div>

                        <ResumenTotales
                            subtotal={subtotal}
                            marcos={marcos}
                            envio={envio}
                            total={total}
                            boton={yendo ? "Guardando..." : "Ir al pago"}
                            onBoton={irAlPago}
                            botonDeshabilitado={hayNoDisponibles}
                            nota={
                                hayNoDisponibles
                                    ? "Hay obras que ya no están disponibles: quitalas o ajustá la cantidad para poder pagar."
                                    : undefined
                            }
                        >
                            <EntregaCompra
                                tipoEntrega={tipoEntrega}
                                direccion={direccion}
                                error={errorDireccion}
                                onTipoEntrega={(tipo) => {
                                    setTipoEntrega(tipo)
                                    setErrorDireccion("")
                                }}
                                onDireccion={(texto) => {
                                    setDireccion(texto)
                                    setErrorDireccion("")
                                }}
                            />
                        </ResumenTotales>
                    </div>
                )}
            </div>
        </div>
    )
}

export default Carrito