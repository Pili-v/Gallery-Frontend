// Obras de un artista (pantalla Perfil del artista) — la página que se ve. Cada obra llega con sus variantes y su
// portada; acá quedan solo sus ids (las obras se guardan en obrasSlice). Como el Catálogo, al volver a la misma
// página no se pide de nuevo, salvo que un cambio propio la haya dejado vieja (docs/datos-con-redux.md).
// La página que se ve vive acá (vista): al entrar a una obra y volver, el perfil sigue en la misma. Es la de un
// artista: en otro perfil se empieza por la primera.

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit"
import { obtenerPagina } from "./pedidos"

const claveDe = ({ artistaId, pagina, size }) => JSON.stringify([String(artistaId), pagina, size])

export const fetchObrasDeArtista = createAsyncThunk(
    "obrasDeArtista/fetchObrasDeArtista",
    async ({ artistaId, pagina, size }, { getState }) => {
        const version = getState().obras.version
        const resultado = await obtenerPagina("/api/obras?artistaId=" + artistaId + "&page=" + pagina + "&size=" + size)
        return { ...resultado, version }
    },
    {
        condition: (arg, { getState }) => {
            const { cargada } = getState().obrasDeArtista
            return !(cargada && cargada.clave === claveDe(arg) && cargada.version === getState().obras.version)
        }
    }
)

const obrasDeArtistaSlice = createSlice({
    name: "obrasDeArtista",
    initialState: {
        ids: [], // las obras de la página que se ve (están en obrasSlice)
        totalPaginas: 1,
        totalObras: 0,
        error: null,
        loading: true,
        requestId: null,
        cargada: null, // { clave, version }: la página que se muestra y con qué version de las obras llegó
        vista: { artistaId: null, pagina: 0 }
    },
    reducers: {
        // payload: { artistaId, pagina }
        setPagina: (state, action) => {
            state.vista = { artistaId: String(action.payload.artistaId), pagina: action.payload.pagina }
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchObrasDeArtista.pending, (state, action) => {
                // Igual que en el Catálogo: mientras llega otra página, la guardada ya no es la que se ve.
                state.cargada = null
                state.loading = true
                state.error = null
                state.requestId = action.meta.requestId
            })
            .addCase(fetchObrasDeArtista.fulfilled, (state, action) => {
                if (state.requestId !== action.meta.requestId) return
                state.loading = false
                state.ids = action.payload.items.map((obra) => obra.id)
                state.cargada = { clave: claveDe(action.meta.arg), version: action.payload.version }
                state.totalPaginas = action.payload.totalPaginas
                state.totalObras = action.payload.totalElementos
            })
            .addCase(fetchObrasDeArtista.rejected, (state, action) => {
                if (state.requestId !== action.meta.requestId) return
                state.loading = false
                state.ids = []
                state.cargada = null
                state.error = action.error.message
            })
    }
})

export const { setPagina } = obrasDeArtistaSlice.actions

export default obrasDeArtistaSlice.reducer
