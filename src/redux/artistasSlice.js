// Artistas — tres cosas del mismo recurso:
//   items      : todos los artistas, una sola vez (nombres para las tarjetas, el contador, las sugerencias del buscador)
//   resultados : la página que muestra la pantalla Artistas (con búsqueda por nombre y filtro de estilos)
//   resumen    : las obras y portadas con las que la pantalla Artistas arma cada tarjeta

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit"
import { obtenerLista, obtenerPagina } from "./pedidos"

// Con { forzar: true } se vuelve a pedir aunque ya hayan llegado (por ejemplo, un botón Reintentar).
export const fetchArtistas = createAsyncThunk(
    "artistas/fetchArtistas",
    async () => {
        const artistas = await obtenerLista("/api/artistas")
        return artistas
    },
    {
        condition: (opciones, { getState }) => {
            const { cargado, loading } = getState().artistas
            if (loading) return false
            return opciones?.forzar === true || !cargado
        }
    }
)

// La página de artistas. El backend busca por nombre artístico (q) y por estilos (estiloId=1,2: alguno de ellos).
export const buscarArtistas = createAsyncThunk(
    "artistas/buscarArtistas",
    async ({ pagina, size, busqueda, estiloIds }) => {
        const partes = ["page=" + pagina, "size=" + size]
        if (busqueda !== "") partes.push("q=" + encodeURIComponent(busqueda))
        if (estiloIds.length > 0) partes.push("estiloId=" + estiloIds.join(","))

        const resultado = await obtenerPagina("/api/artistas?" + partes.join("&"))
        return resultado
    }
)

// Las obras y las portadas de todos los artistas, una sola vez: se agrupan en la pantalla, así no se pide por tarjeta.
export const fetchResumenArtistas = createAsyncThunk(
    "artistas/fetchResumenArtistas",
    async () => {
        const [obras, imagenes] = await Promise.all([
            obtenerLista("/api/obras"),
            obtenerLista("/api/imagenes?portada=true")
        ])
        return { obras, imagenes }
    },
    {
        condition: (_, { getState }) => {
            const { cargado, loading } = getState().artistas.resumen
            return !cargado && !loading
        }
    }
)

const artistasSlice = createSlice({
    name: "artistas",
    initialState: {
        items: [],
        cargado: false,
        error: null,
        loading: false,
        resultados: { items: [], totalPaginas: 1, error: null, loading: true, requestId: null },
        resumen: { obras: [], imagenes: [], cargado: false, loading: false }
    },
    reducers: {},
    extraReducers: (builder) => {
        builder
            // Todos los artistas
            .addCase(fetchArtistas.pending, (state) => {
                state.loading = true
                state.error = null
            })
            .addCase(fetchArtistas.fulfilled, (state, action) => {
                state.loading = false
                state.cargado = true
                state.items = action.payload
            })
            .addCase(fetchArtistas.rejected, (state, action) => {
                state.loading = false
                state.error = action.error.message
            })

            // La página visible. Si se pidió otra mientras tanto, la respuesta vieja se descarta (requestId).
            .addCase(buscarArtistas.pending, (state, action) => {
                state.resultados.loading = true
                state.resultados.error = null
                state.resultados.requestId = action.meta.requestId
            })
            .addCase(buscarArtistas.fulfilled, (state, action) => {
                if (state.resultados.requestId !== action.meta.requestId) return
                state.resultados.loading = false
                state.resultados.items = action.payload.items
                state.resultados.totalPaginas = action.payload.totalPaginas
            })
            .addCase(buscarArtistas.rejected, (state, action) => {
                if (state.resultados.requestId !== action.meta.requestId) return
                state.resultados.loading = false
                state.resultados.items = []
                state.resultados.error = action.error.message
            })

            // El resumen de cada artista. Si falla, las tarjetas quedan sin fotos ni estilos pero la lista se ve igual.
            .addCase(fetchResumenArtistas.pending, (state) => {
                state.resumen.loading = true
            })
            .addCase(fetchResumenArtistas.fulfilled, (state, action) => {
                state.resumen.loading = false
                state.resumen.cargado = true
                state.resumen.obras = action.payload.obras
                state.resumen.imagenes = action.payload.imagenes
            })
            .addCase(fetchResumenArtistas.rejected, (state) => {
                state.resumen.loading = false
            })
    }
})

export default artistasSlice.reducer
