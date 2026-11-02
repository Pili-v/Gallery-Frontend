// Mis ventas (pantalla del artista) — una página de las facturas emitidas a su nombre cada vez que cambia un filtro o
// la página, con lo vendido en total, y el detalle de cada venta que se abre. El backend saca el artista del token.

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit"
import { parametrosDeFiltros } from "../api/filtros"
import { http, lista } from "./http"

// filtros: { entrega ("envio", "retiro", "encargo" o ""), desde (aaaa-mm-dd o "") }.
// Además de la página, el back manda total_vendido: lo vendido con TODAS las facturas que cumplen los filtros.
// Sin ventas responde 204 (llega como null) y un 404 también se toma como "no hay ventas".
export const fetchMisVentas = createAsyncThunk("misVentas/fetchMisVentas", async ({ pagina, size, filtros }) => {
    const respuesta = await http.get(
        "/api/artistas/me/facturas?page=" + pagina + "&size=" + size + parametrosDeFiltros(filtros),
        { validateStatus: (status) => (status >= 200 && status < 300) || status === 404 }
    )
    const cuerpo = respuesta.status === 404 ? null : respuesta.data
    const facturas = lista(cuerpo)

    return {
        facturas,
        totalPaginas: cuerpo && cuerpo.totalPages ? cuerpo.totalPages : 1,
        totalFacturas: cuerpo && cuerpo.totalElements ? cuerpo.totalElements : 0,
        totalVendido: cuerpo && cuerpo.total_vendido ? Number(cuerpo.total_vendido) : 0
    }
})

// El detalle de una venta (comprador, entrega y obras con nombre y portada), en un solo pedido. Una factura emitida
// no cambia: si ya llegó (o está en camino) no se vuelve a pedir; si falló, abrirla de nuevo reintenta.
export const fetchDetalleDeVenta = createAsyncThunk(
    "misVentas/fetchDetalleDeVenta",
    async (facturaId) => {
        const respuesta = await http.get("/api/facturas/" + facturaId + "/detalle")
        return respuesta.data
    },
    {
        condition: (facturaId, { getState }) => {
            const entrada = getState().misVentas.detalles[facturaId]
            return !entrada || Boolean(entrada.error)
        }
    }
)

const misVentasSlice = createSlice({
    name: "misVentas",
    initialState: {
        items: [], // las facturas de la página actual
        totalPaginas: 1,
        totalFacturas: 0,
        totalVendido: 0,
        loading: true,
        error: null,
        requestId: null,
        // Por id de factura: { loading, detalle, error }. Sin entrada es que nunca se abrió.
        detalles: {}
    },
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchMisVentas.pending, (state, action) => {
                state.loading = true
                state.error = null
                state.requestId = action.meta.requestId
            })
            .addCase(fetchMisVentas.fulfilled, (state, action) => {
                // Si mientras tanto se pidió otra página u otro filtro, esta respuesta quedó vieja.
                if (state.requestId !== action.meta.requestId) return
                state.loading = false
                state.items = action.payload.facturas
                state.totalPaginas = action.payload.totalPaginas
                state.totalFacturas = action.payload.totalFacturas
                state.totalVendido = action.payload.totalVendido
            })
            .addCase(fetchMisVentas.rejected, (state, action) => {
                if (state.requestId !== action.meta.requestId) return
                state.loading = false
                state.items = []
                state.totalFacturas = 0
                state.totalVendido = 0
                state.error = action.error.message
            })
            .addCase(fetchDetalleDeVenta.pending, (state, action) => {
                state.detalles[action.meta.arg] = { loading: true, detalle: null, error: null }
            })
            .addCase(fetchDetalleDeVenta.fulfilled, (state, action) => {
                state.detalles[action.meta.arg] = { loading: false, detalle: action.payload, error: null }
            })
            .addCase(fetchDetalleDeVenta.rejected, (state, action) => {
                state.detalles[action.meta.arg] = { loading: false, detalle: null, error: action.error.message }
            })
    }
})

export default misVentasSlice.reducer
