// Tu carrito — Área 4 · Compra
// Muestra los ítems del carrito del usuario logueado, deja cambiar
// cantidades, quitar ítems y vaciarlo, y lleva a confirmar la compra.

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { api } from "../api/cliente"
import { getUsuario } from "../api/sesion"
import LineaItem from "../components/LineaItem"
import ResumenTotales from "../components/ResumenTotales"
import Estado from "../components/Estado"
import Boton from "../components/Boton"

const Carrito = () => {

    // Estados locales de la pantalla.
    const [carrito, setCarrito] = useState(null)
    const [items, setItems] = useState([])
    const [cargando, setCargando] = useState(true)
    const [error, setError] = useState("")

    const usuario = getUsuario()
    const navegar = useNavigate()

    // Trae el carrito del usuario y después sus ítems.
    // El id del usuario sale de la sesión, no de la URL: así nadie
    // puede mirar el carrito de otro cambiando un número a mano.
    const cargarCarrito = async () => {
        try {
            const miCarrito = await api.get("/api/usuarios/" + usuario.id + "/carrito")
            const susItems = await api.get("/api/carritos/" + miCarrito.id + "/items")
            setCarrito(miCarrito)
            setItems(susItems)
        } catch (e) {
            setError(e.message)
        } finally {
            setCargando(false)
        }
    }

    // useEffect con [] vacío: se ejecuta una sola vez, cuando la pantalla aparece.
    useEffect(() => { cargarCarrito() }, [])

    // Cambiar la cantidad de un ítem. Si baja a cero, se quita.
    const cambiarCantidad = async (item, nuevaCantidad) => {
        if (nuevaCantidad < 1) return quitarItem(item.id)
        try {
            await api.put("/api/items-carrito/" + item.id, {
                carrito_id: carrito.id,
                variante_id: item.variante_id,
                marco_id: item.marco_id,
                cantidad: nuevaCantidad
            })
            cargarCarrito()
        } catch (e) {
            setError(e.message)
        }
    }

    const quitarItem = async (itemId) => {
        try {
            await api.delete("/api/items-carrito/" + itemId)
            cargarCarrito()
        } catch (e) {
            setError(e.message)
        }
    }

    const vaciarCarrito = async () => {
        try {
            await api.delete("/api/carritos/" + carrito.id + "/items")
            setItems([])
        } catch (e) {
            setError(e.message)
        }
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
                                    item={item}
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