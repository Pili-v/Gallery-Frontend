// Compras — el recurso. Cada compra del usuario está UNA sola vez, por su id (docs/datos-con-redux.md).
//   porId    : id -> la compra
//   facturas : id de compra -> sus facturas (una por artista). Solo de las compras que se abrieron.
//   lista    : Mis compras: los ids de las que cumplen los filtros, y el estado del pedido.
//   filtros  : los de Mis compras (cómo se entregó y de cuándo es). Viven acá: al ir a otra pantalla y volver,
//              siguen iguales.
// El back saca el usuario del token, por eso las rutas no llevan id. Son datos del usuario: al cerrar sesión (o entrar
// con otro) el slice vuelve a su estado inicial.

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit"
import { http } from "./http"
import { obtenerLista } from "./pedidos"
import { cambioDeUsuario } from "./sesionSlice"
import { confirmarCompra } from "./carritoSlice"
import { desdeDelPeriodo, parametrosDeFiltros } from "../api/filtros"

// Mis compras: se pide al entrar y cada vez que cambia un filtro. Una lista vacía llega como 204 (o como 404 en
// algunos endpoints): obtenerLista la deja en [].
export const fetchMisCompras = createAsyncThunk("compras/fetchMisCompras", async ({ entrega, periodo }) => {
    const filtros = {
        entrega: entrega === "todas" ? "" : entrega,
        desde: desdeDelPeriodo(periodo)
    }
    const parametros = parametrosDeFiltros(filtros)
    const compras = await obtenerLista("/api/compras/me" + (parametros ? "?" + parametros.substring(1) : ""))
    return compras
})

// Una compra con sus facturas (Compra confirmada). La compra se pide con http.get directo: acá un 404 es un error de
// verdad (esa compra no existe o no es del usuario), no una lista vacía. Los nombres de los artistas salen de la
// lista de artistas (artistasSlice), que ya está en el store.
export const fetchCompra = createAsyncThunk("compras/fetchCompra", async (id) => {
    const [respuesta, facturas] = await Promise.all([
        http.get("/api/compras/" + id),
        obtenerLista("/api/facturas/compra/" + id)
    ])
    return { compra: respuesta.data, facturas }
})

const FILTROS_INICIALES = { entrega: "todas", periodo: "0" }

const comprasSlice = createSlice({
    name: "compras",
    initialState: {
        porId: {},
        facturas: {},
        lista: { ids: [], loading: true, error: null, requestId: null },
        filtros: FILTROS_INICIALES
    },
    reducers: {
        setEntrega: (state, action) => {
            state.filtros.entrega = action.payload
        },
        setPeriodo: (state, action) => {
            state.filtros.periodo = action.payload
        },
        quitarFiltros: (state) => {
            state.filtros = FILTROS_INICIALES
        }
    },
    extraReducers: (builder) => {
        builder
            // Mis compras. Si mientras tanto se cambió un filtro, la respuesta vieja se descarta (requestId).
            .addCase(fetchMisCompras.pending, (state, action) => {
                state.lista.loading = true
                state.lista.error = null
                state.lista.requestId = action.meta.requestId
            })
            .addCase(fetchMisCompras.fulfilled, (state, action) => {
                if (state.lista.requestId !== action.meta.requestId) return
                state.lista.loading = false
                state.lista.ids = action.payload.map((compra) => compra.id)
                action.payload.forEach((compra) => {
                    state.porId[compra.id] = compra
                })
            })
            .addCase(fetchMisCompras.rejected, (state, action) => {
                if (state.lista.requestId !== action.meta.requestId) return
                state.lista.loading = false
                state.lista.ids = []
                state.lista.error = action.error.message
            })

            // Una compra con sus facturas
            .addCase(fetchCompra.fulfilled, (state, action) => {
                const { compra, facturas } = action.payload
                state.porId[compra.id] = compra
                state.facturas[compra.id] = facturas
            })

            // La compra que se acaba de confirmar en el carrito
            .addCase(confirmarCompra.fulfilled, (state, action) => {
                state.porId[action.payload.id] = action.payload
            })
            .addMatcher(cambioDeUsuario, () => comprasSlice.getInitialState())
    }
})

export const { setEntrega, setPeriodo, quitarFiltros } = comprasSlice.actions

export default comprasSlice.reducer
