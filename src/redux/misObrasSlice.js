// Mis obras (pantalla del artista) — la página de sus obras que se ve y sus filtros. El backend saca el artista del
// token, por eso no se manda el id.
//
// Criterio de datos (docs/datos-con-redux.md):
//   - La página se pide al entrar y con cada filtro o página. Cada obra llega con sus variantes y su portada; acá
//     quedan solo sus ids (las obras se guardan en obrasSlice). Mientras llega se muestra "cargando".
//   - Los filtros y la página viven acá: al ir a otra pantalla (por ejemplo, a editar una obra) y volver, siguen
//     iguales.
//   - Son datos del artista: al cerrar sesión (o entrar con otro usuario) el slice vuelve a su estado inicial.

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit"
import { parametrosDeFiltros } from "../api/filtros"
import { obtenerPagina } from "./pedidos"
import { cambioDeUsuario } from "./sesionSlice"

// filtros: { nombreObra, enVenta ("true", "false" o ""), sinStock ("true" o ""), estiloId: [ids] }.
// Sin obras el back responde 204 y un 404 también se toma como lista vacía (obtenerPagina deja []).
export const fetchMisObras = createAsyncThunk("misObras/fetchMisObras", async ({ pagina, size, filtros }) => {
    const resultado = await obtenerPagina(
        "/api/artistas/me/obras?page=" + pagina + "&size=" + size + parametrosDeFiltros(filtros)
    )
    return resultado
})

const FILTROS_INICIALES = {
    pagina: 0, // empieza en 0, como en el back
    textoEscrito: "", // lo que se está escribiendo en el buscador
    nombreBuscado: "", // lo que se buscó (se aplica con Buscar o Enter)
    estadoDeVenta: "todas", // "todas", "si" o "no"
    estadoDeStock: "todas", // "todas" o "sin"
    estiloIds: []
}

const ESTADO_INICIAL = {
    ids: [], // las obras de la página que se ve (están en obrasSlice)
    totalPaginas: 1,
    totalObras: 0, // las que cumplen los filtros, no solo las de esta página
    loading: true,
    error: null,
    requestId: null,
    filtros: FILTROS_INICIALES
}

const misObrasSlice = createSlice({
    name: "misObras",
    initialState: ESTADO_INICIAL,
    reducers: {
        // Con otro filtro vuelve a la primera página: la que se estaba viendo puede no existir con menos resultados.
        setPagina: (state, action) => {
            state.filtros.pagina = action.payload
        },
        setTextoEscrito: (state, action) => {
            state.filtros.textoEscrito = action.payload
        },
        buscarPorNombre: (state) => {
            state.filtros.nombreBuscado = state.filtros.textoEscrito.trim()
            state.filtros.pagina = 0
        },
        setEstadoDeVenta: (state, action) => {
            state.filtros.estadoDeVenta = action.payload
            state.filtros.pagina = 0
        },
        setEstadoDeStock: (state, action) => {
            state.filtros.estadoDeStock = action.payload
            state.filtros.pagina = 0
        },
        setEstiloIds: (state, action) => {
            state.filtros.estiloIds = action.payload
            state.filtros.pagina = 0
        },
        quitarFiltros: (state) => {
            state.filtros = FILTROS_INICIALES
        }
    },
    extraReducers: (builder) => {
        builder
            // La página. Si mientras tanto se pidió otra, la respuesta vieja se descarta (requestId).
            .addCase(fetchMisObras.pending, (state, action) => {
                state.loading = true
                state.error = null
                state.requestId = action.meta.requestId
            })
            .addCase(fetchMisObras.fulfilled, (state, action) => {
                if (state.requestId !== action.meta.requestId) return
                state.loading = false
                state.ids = action.payload.items.map((obra) => obra.id)
                state.totalPaginas = action.payload.totalPaginas
                state.totalObras = action.payload.totalElementos
                // La página pedida ya no existe (por ejemplo, quedaron menos obras): se pasa a la última.
                const { pagina } = action.meta.arg
                if (pagina > 0 && pagina >= action.payload.totalPaginas) {
                    state.filtros.pagina = Math.max(action.payload.totalPaginas - 1, 0)
                }
            })
            .addCase(fetchMisObras.rejected, (state, action) => {
                if (state.requestId !== action.meta.requestId) return
                state.loading = false
                state.ids = []
                state.totalObras = 0
                state.error = action.error.message
            })
            .addMatcher(cambioDeUsuario, () => ESTADO_INICIAL)
    }
})

export const {
    setPagina,
    setTextoEscrito,
    buscarPorNombre,
    setEstadoDeVenta,
    setEstadoDeStock,
    setEstiloIds,
    quitarFiltros
} = misObrasSlice.actions

export default misObrasSlice.reducer
