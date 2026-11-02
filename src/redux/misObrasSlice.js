// Mis obras (pantalla del artista) — una página de sus obras cada vez que cambia un filtro o la página, y las
// variantes de cada obra que se abre. El backend saca el artista del token, por eso no se manda el id.

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit"
import { parametrosDeFiltros } from "../api/filtros"
import { obtenerLista, obtenerPagina } from "./pedidos"

// filtros: { nombreObra, enVenta ("true", "false" o ""), sinStock ("true" o ""), estiloId: [ids] }.
// Sin obras el back responde 204 y un 404 también se toma como lista vacía (obtenerPagina deja []).
export const fetchMisObras = createAsyncThunk("misObras/fetchMisObras", async ({ pagina, size, filtros }) => {
    const resultado = await obtenerPagina(
        "/api/artistas/me/obras?page=" + pagina + "&size=" + size + parametrosDeFiltros(filtros)
    )
    return resultado
})

// Las variantes de una obra: se piden la primera vez que se abre. Si ya llegaron (o están en camino) no se repite;
// si falló, abrirla de nuevo reintenta.
export const fetchVariantesDeObra = createAsyncThunk(
    "misObras/fetchVariantesDeObra",
    async (obraId) => {
        const variantes = await obtenerLista("/api/variantes?obraId=" + obraId)
        return variantes
    },
    {
        condition: (obraId, { getState }) => {
            const entrada = getState().misObras.variantes[obraId]
            return !entrada || Boolean(entrada.error)
        }
    }
)

const misObrasSlice = createSlice({
    name: "misObras",
    initialState: {
        items: [], // las obras de la página actual
        totalPaginas: 1,
        totalObras: 0, // las que cumplen los filtros, no solo las de esta página
        loading: true,
        error: null,
        requestId: null,
        // Por id de obra: { loading, items, error }. Sin entrada es que nunca se abrió.
        variantes: {}
    },
    reducers: {
        // Al entrar a la pantalla: las variantes pudieron cambiar desde la última vez (por ejemplo, al editar una obra).
        olvidarVariantes: (state) => {
            state.variantes = {}
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchMisObras.pending, (state, action) => {
                state.loading = true
                state.error = null
                state.requestId = action.meta.requestId
            })
            .addCase(fetchMisObras.fulfilled, (state, action) => {
                // Si mientras tanto se pidió otra página u otro filtro, esta respuesta quedó vieja.
                if (state.requestId !== action.meta.requestId) return
                state.loading = false
                state.items = action.payload.items
                state.totalPaginas = action.payload.totalPaginas
                state.totalObras = action.payload.totalElementos
            })
            .addCase(fetchMisObras.rejected, (state, action) => {
                if (state.requestId !== action.meta.requestId) return
                state.loading = false
                state.items = []
                state.totalObras = 0
                state.error = action.error.message
            })
            .addCase(fetchVariantesDeObra.pending, (state, action) => {
                state.variantes[action.meta.arg] = { loading: true, items: [], error: null }
            })
            .addCase(fetchVariantesDeObra.fulfilled, (state, action) => {
                state.variantes[action.meta.arg] = { loading: false, items: action.payload, error: null }
            })
            .addCase(fetchVariantesDeObra.rejected, (state, action) => {
                state.variantes[action.meta.arg] = { loading: false, items: [], error: action.error.message }
            })
    }
})

export const { olvidarVariantes } = misObrasSlice.actions

export default misObrasSlice.reducer
