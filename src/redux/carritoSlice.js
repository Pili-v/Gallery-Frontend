// Carrito — Área 4 · Compra. El carrito del usuario, sus ítems (con la disponibilidad de hoy) y las portadas
// de sus obras. Vive en el estado global porque lo consume más de una pantalla.
//
// Los pedidos que escriben (cambiar cantidad, quitar, vaciar, guardar la dirección) son thunks: el efecto
// secundario ocurre en el middleware, no en el componente. La pantalla solo despacha desde el handler.

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit"
import { http } from "./http"
import { cambioDeUsuario } from "./sesionSlice"
import { obtenerLista } from "./pedidos"

const pedirItems = (carritoId) => obtenerLista("/api/carritos/" + carritoId + "/items")

// Las obras del carrito que todavía no tienen su portada guardada (cada obra una vez, aunque esté en más de un ítem).
// Las pantallas que muestran las miniaturas (Carrito y Pago) piden solo esas; el Header, que muestra el contador, no.
export const obrasSinPortada = (items, imagenes) =>
    [...new Set(items.map((item) => item.obra_id))].filter((obraId) => !imagenes.some((img) => img.obra_id === obraId))

// arg: ids de obra. Las portadas, en un solo pedido.
export const fetchPortadasCarrito = createAsyncThunk("carrito/fetchPortadasCarrito", async (obraIds) => {
    const imagenes = await obtenerLista("/api/imagenes?portada=true&" + obraIds.map((id) => "obraId=" + id).join("&"))
    return imagenes
})

// Carga inicial: el carrito del usuario y después sus ítems. El id del usuario sale de la sesión, no de la
// URL: así nadie puede mirar el carrito de otro cambiando un número a mano.
// Lo piden el Header (para el contador) y la pantalla del carrito: si ya hay una carga en camino (por ejemplo, al
// recargar la página estando en el carrito), no se lanza otra, porque la que viaja trae lo mismo. El carrito de un
// usuario es siempre el mismo: si ya está guardado se reutiliza y se piden solo sus ítems (al cerrar sesión el slice
// se vacía, así que es siempre el del usuario actual).
export const cargarCarrito = createAsyncThunk(
    "carrito/cargarCarrito",
    async (usuarioId, { getState }) => {
        let carrito = getState().carrito.carrito
        if (!carrito) {
            const respuesta = await http.get("/api/usuarios/" + usuarioId + "/carrito")
            carrito = respuesta.data
        }
        const items = await pedirItems(carrito.id)
        return { carrito, items }
    },
    {
        condition: (_, { getState }) => !getState().carrito.cargando
    }
)

// Al volver a la pantalla: se piden de nuevo los ítems para ver si algo dejó de estar disponible.
// No toca el loading: es una actualización silenciosa, la pantalla ya está dibujada.
export const recargarItems = createAsyncThunk("carrito/recargarItems", async (carritoId) => {
    const items = await pedirItems(carritoId)
    return { items }
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

// Agregar una obra desde su detalle: primero se pide el carrito propio y después se agrega el ítem. La pantalla
// lleva después al carrito, que se pide de nuevo al entrar (con la portada y la disponibilidad de cada ítem).
export const agregarAlCarrito = createAsyncThunk("carrito/agregarAlCarrito", async ({ varianteId, marcoId }) => {
    const miCarrito = await http.get("/api/carritos/me")
    const respuesta = await http.post("/api/items-carrito", {
        carrito_id: miCarrito.data.id,
        variante_id: varianteId,
        marco_id: marcoId,
        cantidad: 1
    })
    return respuesta.data
})

// Convierte el carrito en una compra. El back saca el usuario del token y, en una sola transacción, crea la
// compra, agrupa por artista, emite una factura por cada uno, descuenta el stock y vacía el carrito.
export const confirmarCompra = createAsyncThunk("carrito/confirmarCompra", async (tipoEntrega) => {
    const { data: compra } = await http.post("/api/checkout", { tipo_entrega: tipoEntrega })
    return compra
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
        cargando: false, // si hay una carga en camino (para no lanzar otra igual)
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
                state.cargando = true
            })
            .addCase(cargarCarrito.fulfilled, (state, action) => {
                if (state.requestId !== action.meta.requestId) return
                state.loading = false
                state.cargando = false
                state.carrito = action.payload.carrito
                state.items = action.payload.items
            })
            .addCase(cargarCarrito.rejected, (state, action) => {
                if (state.requestId !== action.meta.requestId) return
                state.loading = false
                state.cargando = false
                state.error = action.error.message
                state.codigo = action.error.code ?? null
            })

            // --- Recarga silenciosa (al volver a la pantalla) ---
            // Si falla se deja lo que ya había en pantalla: por eso no hay addCase para su rejected.
            // Las portadas que llegaron se suman a las guardadas.
            .addCase(fetchPortadasCarrito.fulfilled, (state, action) => {
                const llegaron = action.meta.arg
                state.imagenes = [...state.imagenes.filter((img) => !llegaron.includes(img.obra_id)), ...action.payload]
            })
            .addCase(recargarItems.fulfilled, (state, action) => {
                state.items = action.payload.items
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

                        // --- Confirmar la compra (checkout) ---
            .addCase(confirmarCompra.pending, (state) => {
                state.error = null
            })
            .addCase(confirmarCompra.fulfilled, (state) => {
                // El back vació el carrito al cobrarlo: el estado global tiene que reflejarlo.
                state.items = []
                state.imagenes = []
            })
            .addCase(confirmarCompra.rejected, (state, action) => {
                state.error = action.error.message
            })

            // Son datos del usuario: al cerrar sesión o entrar con otro, se vuelve al estado inicial.
            .addMatcher(cambioDeUsuario, () => carritoSlice.getInitialState())
    }
})

export default carritoSlice.reducer