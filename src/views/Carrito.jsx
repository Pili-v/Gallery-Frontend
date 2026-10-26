// Tu carrito — Área 4 · Compra
// Muestra los ítems del carrito del usuario logueado, deja cambiar cantidades, quitar ítems y vaciarlo, y elegir
// cómo se recibe la compra (envío o retiro, con la dirección). El botón lleva directo al pago.
// Los ítems se piden una sola vez al entrar: cada cambio actualiza la lista que ya está en pantalla con lo que
// responde el back, sin volver a pedir el carrito.

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
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

    // Trae el carrito del usuario y después sus ítems (y las portadas de sus obras).
    // El id del usuario sale de la sesión, no de la URL: así nadie
    // puede mirar el carrito de otro cambiando un número a mano.
    // useEffect con [] vacío: se ejecuta una sola vez, cuando la pantalla aparece.
    useEffect(() => {
        api.get("/api/usuarios/" + usuario.id + "/carrito")
            .then((miCarrito) => {
                setCarrito(miCarrito)
                setDireccion(miCarrito.direccion_cliente || "")
                return listaVacia(api.get("/api/carritos/" + miCarrito.id + "/items"))
            })
            .then((susItems) => {
                const losItems = lista(susItems)
                setItems(losItems)
                // Solo las portadas de las obras que hay en el carrito, en un solo pedido
                if (losItems.length === 0) return []
                return listaVacia(api.get("/api/imagenes?portada=true&" + losItems.map((item) => "obraId=" + item.obra_id).join("&")))
            })
            .then((lasImagenes) => setImagenes(lista(lasImagenes)))
            .catch((e) => setError(e.message))
            .finally(() => setCargando(false))
    }, [])

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
                if (vigente) setItems((previos) => previos.map((otro) => otro.id === cambio.itemId ? actualizado : otro))
            })
            .catch((e) => { if (vigente) setError(e.message) })

        return () => { vigente = false }
    }, [cambio, carrito])

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
        if (yendo) return

        if (tipoEntrega === ENVIO_DOMICILIO && direccion.trim() === "") {
            setErrorDireccion("Para el envío a domicilio hace falta una dirección.")
            return
        }

        setYendo(true)
        setError("")
        api.put("/api/carritos/" + carrito.id, { direccion_cliente: direccion })
            .then(() => navegar("/checkout/pago", { state: { tipoEntrega, items } }))
            .catch((e) => { setError(e.message); setYendo(false) })
    }

    // La miniatura: el ítem trae el obra_id y la foto sale de la lista de imágenes (su portada).
    const fotoDe = (obraId) => {
        const imagen = portadaDe(imagenes, obraId)
        return imagen ? optimizada(imagen.url, 160) : null
    }

    // Los totales se calculan con lo que ya devuelve la API por cada ítem: al cambiar la lista se recalculan solos.
    const envio = costoDeEnvio(tipoEntrega)
    const subtotal = items.reduce((suma, item) => suma + item.precio_unitario * item.cantidad, 0)
    const marcos = items.reduce((suma, item) => suma + item.precio_marco * item.cantidad, 0)
    const total = items.reduce((suma, item) => suma + item.subtotal, 0) + envio

    if (cargando) return <div className="seccion"><div className="contenido"><Estado tipo="cargando" /></div></div>

    return (
        <div className="seccion">
            <div className="contenido">

                {error && <div style={{ marginBottom: "var(--md)" }}><Estado tipo="error" mensaje={error} /></div>}

                {items.length === 0
                    ? <>
                        <h1 className="headline-lg titulo-oculto">Tu carrito</h1>
                        <Estado
                            tipo="vacio"
                            mensaje="Todavía no agregaste ninguna obra."
                            accion="Ir al catálogo"
                            onAccion={() => navegar("/")} />
                    </>

                    : <div className="dos-columnas">
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
                                    onCambiarCantidad={cambiarCantidad}
                                    onQuitar={quitarItem} />
                            ))}

                            <div className="fila" style={{ marginTop: "var(--md)" }}>
                                <Boton tipo="secundario" onClick={vaciarCarrito}>Vaciar carrito</Boton>
                                <a href="#" className="body-sm" style={{ color: "var(--bordo)" }}
                                    onClick={(e) => { e.preventDefault(); navegar("/") }}>
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
                            onBoton={irAlPago}>
                            <EntregaCompra
                                tipoEntrega={tipoEntrega}
                                direccion={direccion}
                                error={errorDireccion}
                                onTipoEntrega={(tipo) => { setTipoEntrega(tipo); setErrorDireccion("") }}
                                onDireccion={(texto) => { setDireccion(texto); setErrorDireccion("") }} />
                        </ResumenTotales>
                    </div>}

            </div>
        </div>
    )
}

export default Carrito
