// Obras relacionadas — las filas "Más obras de..." y "Obras parecidas" del detalle de una obra.
// Hay dos a la vez, cada una con sus propios filtros: por eso el estado se guarda por clave. Cada obra llega con sus
// variantes y su portada; acá quedan solo sus ids (las obras se guardan en obrasSlice). Como el Catálogo, se piden una
// vez por clave, salvo que un cambio propio las haya dejado viejas (docs/datos-con-redux.md).

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit"
import { obtenerLista } from "./pedidos"

// consultas: filtros de /api/obras, uno por pedido (["artistaId=3"] o ["estiloId=1", "estiloId=2"]).
export const fetchRelacionadas = createAsyncThunk(
    "obrasRelacionadas/fetchRelacionadas",
    async ({ consultas, excluirId, excluirArtistaId, maximo }, { getState }) => {
        const version = getState().obras.version
        // Se piden de más porque después se descartan la obra actual y las del mismo artista.
        const tamanio = maximo * 3 + 1
        const respuestas = await Promise.all(
            consultas.map((c) => obtenerLista("/api/obras?" + c + "&page=0&size=" + tamanio))
        )

        // Sin repetidas (una obra puede aparecer en dos estilos) y sin la que se está viendo
        const vistas = new Set()
        const elegidas = []
        respuestas.forEach((obras) => {
            obras.forEach((obra) => {
                if (obra.id === excluirId || obra.artista_id === excluirArtistaId || vistas.has(obra.id)) return
                vistas.add(obra.id)
                elegidas.push(obra)
            })
        })
        return { obras: elegidas.slice(0, maximo), version }
    },
    {
        condition: ({ clave }, { getState }) => {
            const grupo = getState().obrasRelacionadas.porClave[clave]
            if (!grupo) return true
            return !grupo.loading && (grupo.error !== null || grupo.version !== getState().obras.version)
        }
    }
)

const obrasRelacionadasSlice = createSlice({
    name: "obrasRelacionadas",
    initialState: { porClave: {} }, // clave -> { ids, loading, error, requestId, version }
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchRelacionadas.pending, (state, action) => {
                const { clave } = action.meta.arg
                state.porClave[clave] = {
                    ids: [],
                    loading: true,
                    error: null,
                    requestId: action.meta.requestId
                }
            })
            .addCase(fetchRelacionadas.fulfilled, (state, action) => {
                const grupo = state.porClave[action.meta.arg.clave]
                if (grupo.requestId !== action.meta.requestId) return
                grupo.loading = false
                grupo.ids = action.payload.obras.map((obra) => obra.id)
                grupo.version = action.payload.version
            })
            .addCase(fetchRelacionadas.rejected, (state, action) => {
                const grupo = state.porClave[action.meta.arg.clave]
                if (grupo.requestId !== action.meta.requestId) return
                grupo.loading = false
                grupo.ids = []
                grupo.error = action.error.message
            })
    }
})

export default obrasRelacionadasSlice.reducer
