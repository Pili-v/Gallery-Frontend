// Detalle de una compra — Compra confirmada. Una compra, sus facturas (una por artista) y el nombre de
// cada artista. Los tres pedidos viven en el thunk: la pantalla solo despacha y se suscribe.

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit"
import { http } from "./http"
import { obtenerLista } from "./pedidos"

export const cargarCompra = createAsyncThunk("compraDetalle/cargarCompra", async (id) => {
    // La compra se pide con http.get directo: acá un 404 es un error de verdad (esa compra no existe
    // o no es del usuario), no una lista vacía.
    const { data: compra } = await http.get("/api/compras/" + id)
    const facturas = await obtenerLista("/api/facturas/compra/" + id)

    // Cada factura trae el id del artista, no su nombre. Se piden todos juntos con Promise.all, porque no
    // dependen entre sí: uno atrás del otro tardaría más sin ninguna ventaja.
    const artistas = await Promise.all(facturas.map((factura) => http.get("/api/artistas/" + factura.artista_id)))

    return {
        compra,
        facturas: facturas.map((factura, i) => ({
            ...factura,
            nombre_artistico: artistas[i].data.nombre_artistico
        }))
    }
})

const compraDetalleSlice = createSlice({
    name: "compraDetalle",
    initialState: {
        compra: null,
        facturas: [], // cada una con el nombre_artistico ya resuelto
        loading: true,
        error: null,
        codigo: null, // código HTTP del error ("403", "404"...)
        requestId: null
    },
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(cargarCompra.pending, (state, action) => {
                state.loading = true
                state.error = null
                state.codigo = null
                state.requestId = action.meta.requestId
            })
            .addCase(cargarCompra.fulfilled, (state, action) => {
                // Si el usuario ya navegó a otra compra, esta respuesta quedó vieja.
                if (state.requestId !== action.meta.requestId) return
                state.loading = false
                state.compra = action.payload.compra
                state.facturas = action.payload.facturas
            })
            .addCase(cargarCompra.rejected, (state, action) => {
                if (state.requestId !== action.meta.requestId) return
                state.loading = false
                state.compra = null
                state.facturas = []
                state.error = action.error.message
                state.codigo = action.error.code ?? null
            })
    }
})

export default compraDetalleSlice.reducer