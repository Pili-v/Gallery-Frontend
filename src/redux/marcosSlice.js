// Marcos — se piden una sola vez (los usa el detalle de una obra).

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit"
import { obtenerLista } from "./pedidos"

export const fetchMarcos = createAsyncThunk(
    "marcos/fetchMarcos",
    async () => {
        const marcos = await obtenerLista("/api/marcos")
        return marcos
    },
    {
        condition: (_, { getState }) => {
            const { cargado, loading } = getState().marcos
            return !cargado && !loading
        }
    }
)

const marcosSlice = createSlice({
    name: "marcos",
    initialState: { items: [], cargado: false, error: null, loading: false },
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchMarcos.pending, (state) => {
                state.loading = true
                state.error = null
            })
            .addCase(fetchMarcos.fulfilled, (state, action) => {
                state.loading = false
                state.cargado = true
                state.items = action.payload
            })
            .addCase(fetchMarcos.rejected, (state, action) => {
                state.loading = false
                state.error = action.error.message
            })
    }
})

export default marcosSlice.reducer
