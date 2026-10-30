// Obras de un artista (pantalla Perfil del artista) — una página cada vez, con la variante y la portada de cada obra.

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit"
import { obtenerPagina, extrasDeObras } from "./pedidos"

export const cargarObrasDeArtista = createAsyncThunk(
    "obrasDeArtista/cargarObrasDeArtista",
    async ({ artistaId, pagina, size }) => {
        const { items, totalPaginas, totalElementos } = await obtenerPagina(
            "/api/obras?artistaId=" + artistaId + "&page=" + pagina + "&size=" + size
        )
        const datos = await extrasDeObras(items)

        return {
            obras: items.map((obra, i) => ({ obra, variante: datos[i].variante, imagenes: datos[i].imagenes })),
            totalPaginas,
            totalElementos
        }
    }
)

const obrasDeArtistaSlice = createSlice({
    name: "obrasDeArtista",
    initialState: { items: [], totalPaginas: 1, totalObras: 0, error: null, loading: true, requestId: null },
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(cargarObrasDeArtista.pending, (state, action) => {
                state.loading = true
                state.error = null
                state.requestId = action.meta.requestId
            })
            .addCase(cargarObrasDeArtista.fulfilled, (state, action) => {
                if (state.requestId !== action.meta.requestId) return
                state.loading = false
                state.items = action.payload.obras
                state.totalPaginas = action.payload.totalPaginas
                state.totalObras = action.payload.totalElementos
            })
            .addCase(cargarObrasDeArtista.rejected, (state, action) => {
                if (state.requestId !== action.meta.requestId) return
                state.loading = false
                state.items = []
                state.error = action.error.message
            })
    }
})

export default obrasDeArtistaSlice.reducer
