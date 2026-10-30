// Estilos — se piden una sola vez para toda la app (Catálogo, Artistas, Perfil, Detalle...).

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit"
import { obtenerLista } from "./pedidos"

export const fetchEstilos = createAsyncThunk(
    "estilos/fetchEstilos",
    async () => {
        const estilos = await obtenerLista("/api/estilos")
        return estilos
    },
    {
        // Si ya llegaron (o ya están en camino) no se vuelve a pedir. Si falló, el siguiente intento sí pide.
        condition: (_, { getState }) => {
            const { cargado, loading } = getState().estilos
            return !cargado && !loading
        }
    }
)

const estilosSlice = createSlice({
    name: "estilos",
    initialState: { items: [], cargado: false, error: null, loading: false },
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchEstilos.pending, (state) => {
                state.loading = true
                state.error = null
            })
            .addCase(fetchEstilos.fulfilled, (state, action) => {
                state.loading = false
                state.cargado = true
                state.items = action.payload
            })
            .addCase(fetchEstilos.rejected, (state, action) => {
                state.loading = false
                state.error = action.error.message
            })
    }
})

export default estilosSlice.reducer
