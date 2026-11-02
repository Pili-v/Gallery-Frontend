// Compras del usuario — Mis compras. Se pide la lista cada vez que cambian los filtros (cómo se entregó y
// de cuándo es la compra). El back saca el usuario del token, por eso la ruta no lleva id.

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit"
import { obtenerLista } from "./pedidos"
import { desdeDelPeriodo, parametrosDeFiltros } from "../api/filtros"

// Una lista vacía llega como 204 (o como 404 en algunos endpoints): obtenerLista la deja en [].
export const cargarCompras = createAsyncThunk("compras/cargarCompras", async ({ entrega, periodo }) => {
    const filtros = {
        entrega: entrega === "todas" ? "" : entrega,
        desde: desdeDelPeriodo(periodo)
    }

    return await obtenerLista("/api/compras/me?" + parametrosDeFiltros(filtros).substring(1))
})

const comprasSlice = createSlice({
    name: "compras",
    initialState: {
        items: [], // las compras que cumplen los filtros
        loading: true,
        error: null,
        codigo: null, // código HTTP del error ("403", "500"...)
        requestId: null
    },
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(cargarCompras.pending, (state, action) => {
                state.loading = true
                state.error = null
                state.codigo = null
                state.requestId = action.meta.requestId
            })
            .addCase(cargarCompras.fulfilled, (state, action) => {
                // Si el usuario ya cambió un filtro, esta respuesta quedó vieja.
                if (state.requestId !== action.meta.requestId) return
                state.loading = false
                state.items = action.payload
            })
            .addCase(cargarCompras.rejected, (state, action) => {
                if (state.requestId !== action.meta.requestId) return
                state.loading = false
                state.items = []
                state.error = action.error.message
                state.codigo = action.error.code ?? null
            })
    }
})

export default comprasSlice.reducer