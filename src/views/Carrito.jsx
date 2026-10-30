// Tu carrito — Área 4 · Compra
// Muestra los ítems del carrito del usuario logueado, deja cambiar cantidades, quitar ítems y vaciarlo, y elegir
// cómo se recibe la compra (envío o retiro, con la dirección). El botón lleva directo al pago.
// Los ítems se piden al entrar y cada vez que se vuelve a la pantalla después de haberla dejado (otra pestaña u otra
// ventana): así se ve enseguida si algo dejó de estar disponible. Cada cambio de cantidad actualiza la lista que ya está
// en pantalla con lo que responde el back. Mientras haya ítems sin disponibilidad no se puede ir al pago.

import { useState, useEffect } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { api, lista } from "../api/cliente"
import { getUsuario } from "../api/sesion"
import { optimizada, portadaDe } from "../api/formato"
import { ENVIO_DOMICILIO, costoDeEnvio } from "../api/entrega"
import LineaItem from "../components/LineaItem"
import ResumenTotales from "../components/ResumenTotales"
import EntregaCompra from "../components/EntregaCompra"
import Estado from "../components/Estado"
import Boton from "../components/Boton"

// Una lista vacía no es una falla. El backend la informa de dos maneras según
// el endpoint: 404 (no hay registros) o 409 (el carrito existe pero está vacío).
// En los dos casos acá devolvemos [] y la pantalla muestra su estado vacío.
const listaVacia = (promesa) =>
    promesa.catch((e) => {
        if (e.status === 404 || e.status === 409) return []
        throw e
    })

// Los ítems del carrito (con su disponibilidad de hoy) y las portadas de sus obras, en un solo pedido cada uno.
const pedirItemsConPortadas = (idDelCarrito) =>
    listaVacia(api.get("/api/carritos/" + idDelCarrito + "/items")).then((susItems) => {
        const items = lista(susItems)
        // Solo las portadas de las obras que hay en el carrito, en un solo pedido
        if (items.length === 0) return { items, imagenes: [] }

        return listaVacia(
            api.get("/api/imagenes?portada=true&" + items.map((item) => "obraId=" + item.obra_id).join("&"))
        ).then((imagenes) => ({ items, imagenes: lista(imagenes) }))
    })

const Carrito = () => {
    // Estados locales de la pantalla.
    const [carrito, setCarrito] = useState(null)
    const [items, setItems] = useState([])
    const [imagenes, setImagenes] = useState([])
    const [tipoEntrega, setTipoEntrega] = useState(ENVIO_DOMICILIO)
    const [direccion, setDireccion] = useState("")
    const [errorDireccion, setErrorDireccion] = useState("")
    const [yendo, setYendo] = useState(false)
    // El cambio de cantidad que hay que mandarle al back: { itemId, varianteId, marcoId, cantidad }. Null si no hay ninguno.
    const [cambio, setCambio] = useState(null)
    const [cargando, setCargando] = useState(true)
    const [error, setError] = useState("")

    const usuario = getUsuario()
    const navegar = useNavigate()
    const ubicacion = useLocation()

    // Si el pago volvió acá porque algo ya no estaba disponible, trae el aviso del back (los ítems afectados se
    // marcan solos: la lista se acaba de pedir de nuevo y cada ítem trae su disponibilidad).
    const avisoDelPago = ubicacion.state ? ubicacion.state.sinDisponibilidad : null

    // Trae el carrito del usuario y después sus ítems (y las portadas de sus obras).
    // El id del usuario sale de la sesión, no de la URL: así nadie
    // puede mirar el carrito de otro cambiando un número a mano.
    // useEffect con [] vacío: se ejecuta una sola vez, cuando la pantalla aparece.
    useEffect(() => {
        api.get("/api/usuarios/" + usuario.id + "/carrito")
            .then((miCarrito) => {
                setCarrito(miCarrito)
                setDireccion(miCarrito.direccion_cliente || "")
                return pedirItemsConPortadas(miCarrito.id)
            })
            .then((resultado) => {
                setItems(resultado.items)
                setImagenes(resultado.imagenes)
            })
            .catch((e) => setError(e.message))
            .finally(() => setCargando(false))
    }, [])

    // Al volver a la pantalla después de haberla dejado (otra pestaña u otra ventana) se piden de nuevo los ítems: así
    // se ve enseguida si mientras tanto una obra se quedó sin stock o salió de la venta. Solo en ese momento, sin
    // pedidos periódicos. Si el pedido falla se deja lo que ya había en pantalla.
    useEffect(() => {
        if (carrito === null) return

        const alVolver = () => {
            if (document.visibilityState !== "visible") return

            pedirItemsConPortadas(carrito.id)
                .then((resultado) => {
                    setItems(resultado.items)
                    setImagenes(resultado.imagenes)
                })
                .catch(() => {})
        }

        document.addEventListener("visibilitychange", alVolver)
        return () => document.removeEventListener("visibilitychange", alVolver)
    }, [carrito])

    // Cambiar la cantidad de un ítem. No baja de 1: un ítem se saca con "Quitar" (la fila deshabilita el "−").
    // La fila avisa con el id del ítem; los demás datos (variante y marco) salen de la lista de ítems.
    // Acá solo se anota el cambio: el pedido al back lo hace el useEffect de abajo cuando cambia "cambio".
    const cambiarCantidad = (itemId, nuevaCantidad) => {
        if (nuevaCantidad < 1) return

        const item = items.find((otro) => otro.id === itemId)
        setError("")
        setCambio({ itemId, varianteId: item.variante_id, marcoId: item.marco_id, cantidad: nuevaCantidad })
    }

    // Se ejecuta cada vez que hay un cambio de cantidad nuevo (el segundo argumento es [cambio, carrito]).
    // El back responde con el ítem ya actualizado (cantidad y subtotal): ese reemplaza al de la lista.
    // "vigente" descarta la respuesta si mientras tanto se pidió otro cambio (por ejemplo, dos clicks seguidos):
    // queda lo último que se pidió.
    useEffect(() => {
        if (cambio === null) return

        let vigente = true

        api.put("/api/items-carrito/" + cambio.itemId, {
            carrito_id: carrito.id,
            variante_id: cambio.varianteId,
            marco_id: cambio.marcoId,
            cantidad: cambio.cantidad
        })
            .then((actualizado) => {
                if (vigente)
                    setItems((previos) => previos.map((otro) => (otro.id === cambio.itemId ? actualizado : otro)))
            })
            .catch((e) => {
                if (vigente) setError(e.message)
            })

        return () => {
            vigente = false
        }
    }, [cambio, carrito])

    // Ajusta un ítem a las unidades que quedan (cuando se pidieron más de las que hay).
    const ajustarCantidad = (itemId) => {
        const item = items.find((otro) => otro.id === itemId)
        cambiarCantidad(itemId, item.stock_disponible)
    }

    const quitarItem = (itemId) => {
        setError("")
        api.delete("/api/items-carrito/" + itemId)
            .then(() => setItems((previos) => previos.filter((otro) => otro.id !== itemId)))
            .catch((e) => setError(e.message))
    }

    const vaciarCarrito = () => {
        setError("")
        api.delete("/api/carritos/" + carrito.id + "/items")
            .then(() => setItems([]))
            .catch((e) => setError(e.message))
    }

    // Guarda la dirección en el carrito y pasa al pago. El tipo de entrega y los ítems viajan a la pantalla
    // siguiente, que es la que hace el POST /api/checkout (así no vuelve a pedir lo que ya se sabe).
    const irAlPago = () => {
        if (yendo || hayNoDisponibles) return

        if (tipoEntrega === ENVIO_DOMICILIO && direccion.trim() === "") {
            setErrorDireccion("Para el envío a domicilio hace falta una dirección.")
            return
        }

        setYendo(true)
        setError("")
        api.put("/api/carritos/" + carrito.id, { direccion_cliente: direccion })
            .then(() => navegar("/checkout/pago", { state: { tipoEntrega, items } }))
            .catch((e) => {
                setError(e.message)
                setYendo(false)
            })
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
                    <p className="aviso" role="alert" style={{ marginBottom: "var(--md)" }}>
                        No se pudo completar la compra. {avisoDelPago} Las obras afectadas están marcadas abajo.
                    </p>
                )}

                {error && (
                    <div style={{ marginBottom: "var(--md)" }}>
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
                                    onCambiarCantidad={cambiarCantidad}
                                    onQuitar={quitarItem}
                                    onAccionAviso={ajustarCantidad}
                                />
                            ))}

                            <div className="fila" style={{ marginTop: "var(--md)" }}>
                                <Boton tipo="secundario" onClick={vaciarCarrito}>
                                    Vaciar carrito
                                </Boton>
                                <a
                                    href="#"
                                    className="body-sm"
                                    style={{ color: "var(--bordo)" }}
                                    onClick={(e) => {
                                        e.preventDefault()
                                        navegar("/")
                                    }}
                                >
                                    Seguir mirando obras
                                </a>
                            </div>

                            <p className="body-sm muted" style={{ marginTop: "var(--md)" }}>
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
