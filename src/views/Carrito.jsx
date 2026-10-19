// Tu carrito — Área 4 · Compra
// Muestra los ítems del carrito del usuario logueado, deja cambiar
// cantidades, quitar ítems y vaciarlo, y lleva a confirmar la compra.

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { api, lista } from "../api/cliente"
import { getUsuario } from "../api/sesion"
import { optimizada, portadaDe } from "../api/formato"
import LineaItem from "../components/LineaItem"
import ResumenTotales from "../components/ResumenTotales"
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
    const [cargando, setCargando] = useState(true)
    const [error, setError] = useState("")

    const usuario = getUsuario()
    const navegar = useNavigate()

    // Trae el carrito del usuario y después sus ítems.
    // El id del usuario sale de la sesión, no de la URL: así nadie
    // puede mirar el carrito de otro cambiando un número a mano.
    const cargarCarrito = () => {
        setError("")

        api.get("/api/usuarios/" + usuario.id + "/carrito")
            .then((miCarrito) => {
                setCarrito(miCarrito)
                return listaVacia(api.get("/api/carritos/" + miCarrito.id + "/items"))
            })
            .then((susItems) => {
                setItems(lista(susItems))
                return listaVacia(api.get("/api/imagenes"))
            })
            .then((lasImagenes) => setImagenes(lista(lasImagenes)))
            .catch((e) => setError(e.message))
            .finally(() => setCargando(false))
    }

    // useEffect con [] vacío: se ejecuta una sola vez, cuando la pantalla aparece.
    useEffect(() => { cargarCarrito() }, [])

    // Cambiar la cantidad de un ítem. Si baja a cero, se quita.
    // La fila avisa con el id del ítem; los demás datos (variante y marco) salen de la lista de ítems.
    const cambiarCantidad = (itemId, nuevaCantidad) => {
        if (nuevaCantidad < 1) return quitarItem(itemId)

        const item = items.find((otro) => otro.id === itemId)

        api.put("/api/items-carrito/" + itemId, {
            carrito_id: carrito.id,
            variante_id: item.variante_id,
            marco_id: item.marco_id,
            cantidad: nuevaCantidad
        })
            .then(() => cargarCarrito())
            .catch((e) => setError(e.message))
    }

    const quitarItem = (itemId) => {
        api.delete("/api/items-carrito/" + itemId)
            .then(() => cargarCarrito())
            .catch((e) => setError(e.message))
    }

    const vaciarCarrito = () => {
        api.delete("/api/carritos/" + carrito.id + "/items")
            .then(() => setItems([]))
            .catch((e) => setError(e.message))
    }

    // La miniatura: el ítem trae el obra_id y la foto sale de la lista de imágenes (su portada).
    const fotoDe = (obraId) => {
        const imagen = portadaDe(imagenes, obraId)
        return imagen ? optimizada(imagen.url, 160) : null
    }

    // Los totales se calculan con lo que ya devuelve la API por cada ítem.
    const subtotal = items.reduce((suma, item) => suma + item.precio_unitario * item.cantidad, 0)
    const marcos = items.reduce((suma, item) => suma + item.precio_marco * item.cantidad, 0)
    const total = items.reduce((suma, item) => suma + item.subtotal, 0)

    if (cargando) return <div className="seccion"><div className="contenido"><Estado tipo="cargando" /></div></div>

    return (
        <div className="seccion">
            <div className="contenido">

                <h1 className="headline-lg">Tu carrito</h1>

                {items.length > 0 && (
                    <p className="body-lg muted" style={{ margin: "var(--xs) 0 var(--xl)" }}>
                        {items.length === 1 ? "1 obra lista para comprar" : items.length + " obras listas para comprar"}
                    </p>
                )}

                {error && <div style={{ marginBottom: "var(--md)" }}><Estado tipo="error" mensaje={error} /></div>}

                {items.length === 0
                    ? <Estado
                        tipo="vacio"
                        mensaje="Todavía no agregaste ninguna obra."
                        accion="Ir al catálogo"
                        onAccion={() => navegar("/")} />

                    : <div className="dos-columnas">
                        <div>
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
                        </div>

                        <ResumenTotales
                            subtotal={subtotal}
                            marcos={marcos}
                            total={total}
                            boton="Confirmar compra"
                            onBoton={() => navegar("/checkout")}
                            nota="El stock se verifica al confirmar." />
                    </div>}

            </div>
        </div>
    )
}

export default Carrito