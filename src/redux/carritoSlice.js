// Carrito — Área 4 · Compra. El carrito del usuario, sus ítems (con la disponibilidad de hoy) y las portadas
// de sus obras. Vive en el estado global porque lo consume más de una pantalla.
//
// Los pedidos que escriben (cambiar cantidad, quitar, vaciar, guardar la dirección) son thunks: el efecto
// secundario ocurre en el middleware, no en el componente. La pantalla solo despacha desde el handler.

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit"
import { http } from "./http"
import { obtenerLista } from "./pedidos"

// Los ítems del carrito y las portadas de sus obras, en un solo pedido cada uno.
const itemsConPortadas = async (carritoId) => {
    const items = await obtenerLista("/api/carritos/" + carritoId + "/items")
    if (items.length === 0) return { items, imagenes: [] }

    const imagenes = await obtenerLista(
        "/api/imagenes?portada=true&" + items.map((item) => "obraId=" + item.obra_id).join("&")
    )
    return { items, imagenes }
}

// Carga inicial: el carrito del usuario y después sus ítems. El id del usuario sale de la sesión, no de la
// URL: así nadie puede mirar el carrito de otro cambiando un número a mano.
export const cargarCarrito = createAsyncThunk("carrito/cargarCarrito", async (usuarioId) => {
    const { data: carrito } = await http.get("/api/usuarios/" + usuarioId + "/carrito")
    const { items, imagenes } = await itemsConPortadas(carrito.id)
    return { carrito, items, imagenes }
})

// Al volver a la pantalla: se piden de nuevo los ítems para ver si algo dejó de estar disponible.
// No toca el loading: es una actualización silenciosa, la pantalla ya está dibujada.
export const recargarItems = createAsyncThunk("carrito/recargarItems", async (carritoId) => {
    return await itemsConPortadas(carritoId)
})

// El back responde con el ítem ya actualizado (cantidad y subtotal): ese reemplaza al de la lista.
export const cambiarCantidad = createAsyncThunk(
    "carrito/cambiarCantidad",
    async ({ carritoId, itemId, varianteId, marcoId, cantidad }) => {
        const { data: actualizado } = await http.put("/api/items-carrito/" + itemId, {
            carrito_id: carritoId,
            variante_id: varianteId,
            marco_id: marcoId,
            cantidad
        })
        return actualizado
    }
)

export const quitarItem = createAsyncThunk("carrito/quitarItem", async (itemId) => {
    await http.delete("/api/items-carrito/" + itemId)
    return itemId
})

export const vaciarCarrito = createAsyncThunk("carrito/vaciarCarrito", async (carritoId) => {
    await http.delete("/api/carritos/" + carritoId + "/items")
})

export const guardarDireccion = createAsyncThunk("carrito/guardarDireccion", async ({ carritoId, direccion }) => {
    await http.put("/api/carritos/" + carritoId, { direccion_cliente: direccion })
    return direccion
})

const carritoSlice = createSlice({
    name: "carrito",
    initialState: {
        carrito: null,
        items: [],
        imagenes: [], // las portadas de las obras que hay en el carrito
        loading: true,
        error: null,
        codigo: null, // código HTTP del error ("409", "403"...)
        requestId: null, // el de la carga
        cambioId: null // el del último cambio de cantidad pedido
    },
    reducers: {},
    extraReducers: (builder) => {
        builder
            // --- Carga ---
            .addCase(cargarCarrito.pending, (state, action) => {
                state.loading = true
                state.error = null
                state.codigo = null
                state.requestId = action.meta.requestId
            })
            .addCase(cargarCarrito.fulfilled, (state, action) => {
                if (state.requestId !== action.meta.requestId) return
                state.loading = false
                state.carrito = action.payload.carrito
                state.items = action.payload.items
                state.imagenes = action.payload.imagenes
            })
            .addCase(cargarCarrito.rejected, (state, action) => {
                if (state.requestId !== action.meta.requestId) return
                state.loading = false
                state.error = action.error.message
                state.codigo = action.error.code ?? null
            })

            // --- Recarga silenciosa (al volver a la pantalla) ---
            // Si falla se deja lo que ya había en pantalla: por eso no hay addCase para su rejected.
            .addCase(recargarItems.fulfilled, (state, action) => {
                state.items = action.payload.items
                state.imagenes = action.payload.imagenes
            })

            // --- Cambiar la cantidad ---
            .addCase(cambiarCantidad.pending, (state, action) => {
                state.error = null
                state.cambioId = action.meta.requestId
            })
            .addCase(cambiarCantidad.fulfilled, (state, action) => {
                // Dos clics seguidos: solo vale la respuesta del último cambio pedido.
                if (state.cambioId !== action.meta.requestId) return
                state.items = state.items.map((item) => (item.id === action.payload.id ? action.payload : item))
            })
            .addCase(cambiarCantidad.rejected, (state, action) => {
                if (state.cambioId !== action.meta.requestId) return
                state.error = action.error.message
            })

            // --- Quitar un ítem ---
            .addCase(quitarItem.pending, (state) => {
                state.error = null
            })
            .addCase(quitarItem.fulfilled, (state, action) => {
                state.items = state.items.filter((item) => item.id !== action.payload)
            })
            .addCase(quitarItem.rejected, (state, action) => {
                state.error = action.error.message
            })

            // --- Vaciar el carrito ---
            .addCase(vaciarCarrito.pending, (state) => {
                state.error = null
            })
            .addCase(vaciarCarrito.fulfilled, (state) => {
                state.items = []
                state.imagenes = []
            })
            .addCase(vaciarCarrito.rejected, (state, action) => {
                state.error = action.error.message
            })

            // --- Guardar la dirección (antes de ir al pago) ---
            .addCase(guardarDireccion.pending, (state) => {
                state.error = null
            })
            .addCase(guardarDireccion.fulfilled, (state, action) => {
                if (state.carrito) state.carrito.direccion_cliente = action.payload
            })
            .addCase(guardarDireccion.rejected, (state, action) => {
                state.error = action.error.message
            })
    }
})

export default carritoSlice.reducer