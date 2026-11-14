// Detalle de una obra — la obra con sus variantes e imágenes, y el "agregar al carrito".
// Los marcos y los artistas se piden aparte (marcosSlice y artistasSlice), una sola vez para toda la app.
//
// Cada obra se guarda por su id (porId). Si se vuelve a entrar a una obra ya vista, no se vuelve a pedir:
// lo guardado dura hasta que se recarga la página o se vacía (ver cache.js).

import { createSlice, createAsyncThunk, isAnyOf } from "@reduxjs/toolkit"
import { http } from "./http"
import { obtenerLista } from "./pedidos"
import { invalidarCacheObras } from "./cache"
import { actualizarTamanio, eliminarTamanio } from "./tamaniosSlice"
import { confirmarCompra } from "./carritoSlice"

export const fetchObraDetalle = createAsyncThunk(
    "obraDetalle/fetchObraDetalle",
    async (id) => {
        // Una obra que no existe es un 404 de verdad (sube como error); sin variantes o sin imágenes, la lista queda vacía.
        const [respuestaObra, variantes, imagenes] = await Promise.all([
            http.get("/api/obras/" + id),
            obtenerLista("/api/variantes?obraId=" + id),
            obtenerLista("/api/imagenes?obraId=" + id)
        ])

        return { obra: respuestaObra.data, variantes, imagenes }
    },
    {
        // Solo se pide si esa obra nunca se pidió o si el último intento falló. Si ya llegó o está en camino
        // (por ejemplo, el doble efecto de StrictMode en desarrollo), no se repite.
        condition: (id, { getState }) => {
            const guardada = getState().obraDetalle.porId[String(id)]
            return !guardada || Boolean(guardada.error)
        }
    }
)

// Agregar al carrito es lo único que escribe: primero se pide el carrito propio y después se agrega el ítem.
export const agregarAlCarrito = createAsyncThunk("obraDetalle/agregarAlCarrito", async ({ varianteId, marcoId }) => {
    const miCarrito = await http.get("/api/carritos/me")
    const respuesta = await http.post("/api/items-carrito", {
        carrito_id: miCarrito.data.id,
        variante_id: varianteId,
        marco_id: marcoId,
        cantidad: 1
    })

    return respuesta.data
})

const obraDetalleSlice = createSlice({
    name: "obraDetalle",
    initialState: {
        // id de la obra (texto, como llega de la URL) -> { obra, variantes, imagenes, loading, error, requestId }
        porId: {},
        agregando: false,
        errorCarrito: null
    },
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchObraDetalle.pending, (state, action) => {
                state.porId[String(action.meta.arg)] = {
                    obra: null,
                    variantes: [],
                    imagenes: [],
                    loading: true,
                    error: null,
                    requestId: action.meta.requestId
                }
                state.errorCarrito = null
            })
            .addCase(fetchObraDetalle.fulfilled, (state, action) => {
                const guardada = state.porId[String(action.meta.arg)]
                // Si el cache se vació mientras llegaba la respuesta, o ya hay un pedido más nuevo, esta quedó vieja.
                if (!guardada || guardada.requestId !== action.meta.requestId) return
                guardada.loading = false
                guardada.obra = action.payload.obra
                guardada.variantes = action.payload.variantes
                guardada.imagenes = action.payload.imagenes
            })
            .addCase(fetchObraDetalle.rejected, (state, action) => {
                const guardada = state.porId[String(action.meta.arg)]
                if (!guardada || guardada.requestId !== action.meta.requestId) return
                guardada.loading = false
                guardada.error = action.error.message
            })

            .addCase(agregarAlCarrito.pending, (state) => {
                state.agregando = true
                state.errorCarrito = null
            })
            .addCase(agregarAlCarrito.fulfilled, (state) => {
                state.agregando = false
            })
            .addCase(agregarAlCarrito.rejected, (state, action) => {
                state.agregando = false
                state.errorCarrito = action.error.message
            })

            // Los matchers van siempre después de los casos.
            .addMatcher(
                isAnyOf(invalidarCacheObras, actualizarTamanio.fulfilled, eliminarTamanio.fulfilled, confirmarCompra.fulfilled),
                (state) => {
                    state.porId = {}
                }
            )
    }
})

export default obraDetalleSlice.reducer
