// Detalle de una obra — la obra con sus variantes e imágenes, y el "agregar al carrito".
// Los marcos y los artistas se piden aparte (marcosSlice y artistasSlice), una sola vez para toda la app.

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit"
import { http } from "./http"
import { obtenerLista } from "./pedidos"

export const fetchObraDetalle = createAsyncThunk("obraDetalle/fetchObraDetalle", async (id) => {
    // Una obra que no existe es un 404 de verdad (sube como error); sin variantes o sin imágenes, la lista queda vacía.
    const [respuestaObra, variantes, imagenes] = await Promise.all([
        http.get("/api/obras/" + id),
        obtenerLista("/api/variantes?obraId=" + id),
        obtenerLista("/api/imagenes?obraId=" + id)
    ])

    return { obra: respuestaObra.data, variantes, imagenes }
})

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
        id: null, // de qué obra son estos datos (texto, como llega de la URL)
        obra: null,
        variantes: [],
        imagenes: [],
        loading: false,
        error: null,
        requestId: null,
        agregando: false,
        errorCarrito: null
    },
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchObraDetalle.pending, (state, action) => {
                state.id = String(action.meta.arg)
                state.obra = null
                state.variantes = []
                state.imagenes = []
                state.loading = true
                state.error = null
                state.errorCarrito = null
                state.requestId = action.meta.requestId
            })
            .addCase(fetchObraDetalle.fulfilled, (state, action) => {
                if (state.requestId !== action.meta.requestId) return
                state.loading = false
                state.obra = action.payload.obra
                state.variantes = action.payload.variantes
                state.imagenes = action.payload.imagenes
            })
            .addCase(fetchObraDetalle.rejected, (state, action) => {
                if (state.requestId !== action.meta.requestId) return
                state.loading = false
                state.error = action.error.message
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
    }
})

export default obraDetalleSlice.reducer
