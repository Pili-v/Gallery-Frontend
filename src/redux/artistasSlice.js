// Artistas — tres cosas del mismo recurso:
//   items      : todos los artistas, una sola vez (nombres para las tarjetas, el contador, las sugerencias del buscador)
//   resultados : la página que muestra la pantalla Artistas (con búsqueda por nombre y filtro de estilos)
//   resumen    : las obras con las que la pantalla Artistas arma cada tarjeta (solo ids: las obras, con su portada,
//                se guardan en obrasSlice)

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit"
import { obtenerLista, obtenerPagina } from "./pedidos"

// Con { forzar: true } se vuelve a pedir aunque ya hayan llegado (por ejemplo, un botón Reintentar).
export const fetchArtistas = createAsyncThunk(
    "artistas/fetchArtistas",
    async () => {
        const artistas = await obtenerLista("/api/artistas")
        return artistas
    },
    {
        condition: (opciones, { getState }) => {
            const { cargado, loading } = getState().artistas
            if (loading) return false
            return opciones?.forzar === true || !cargado
        }
    }
)

// La página de artistas. El backend busca por nombre artístico (q) y por estilos (estiloId=1,2: alguno de ellos).
// Como el resto del catálogo público (docs/datos-con-redux.md), si se vuelve a la pantalla con la misma búsqueda y
// la misma página, no se pide de nuevo.
const claveDe = (arg) => JSON.stringify(arg)

export const buscarArtistas = createAsyncThunk(
    "artistas/buscarArtistas",
    async ({ pagina, size, busqueda, estiloIds }) => {
        const partes = ["page=" + pagina, "size=" + size]
        if (busqueda !== "") partes.push("q=" + encodeURIComponent(busqueda))
        if (estiloIds.length > 0) partes.push("estiloId=" + estiloIds.join(","))

        const resultado = await obtenerPagina("/api/artistas?" + partes.join("&"))
        return resultado
    },
    {
        condition: (arg, { getState }) => getState().artistas.resultados.cargada !== claveDe(arg)
    }
)

// Las obras de todos los artistas (cada una trae su portada): se agrupan en la pantalla, así no se pide por tarjeta.
// Como el Catálogo, se pide una vez y se reutiliza, salvo que un cambio propio lo haya dejado viejo (ver version en
// obrasSlice); si ya hay un pedido en camino, no se repite.
export const fetchResumenArtistas = createAsyncThunk(
    "artistas/fetchResumenArtistas",
    async (_, { getState }) => {
        const version = getState().obras.version
        const obras = await obtenerLista("/api/obras")
        return { obras, version }
    },
    {
        condition: (_, { getState }) => {
            const { cargado, loading, version } = getState().artistas.resumen
            return !loading && !(cargado && version === getState().obras.version)
        }
    }
)

// Los filtros de la pantalla Artistas viven acá (state.artistas.filtros): al entrar a un artista y volver, se conservan.
// texto es lo que se escribe; busqueda es lo aplicado (lo que se manda al back). reinicio cambia la key del buscador para vaciarlo.
const FILTROS_INICIALES = { pagina: 0, texto: "", busqueda: "", artistaElegido: "", reinicio: 0, estiloIds: [] }

const artistasSlice = createSlice({
    name: "artistas",
    initialState: {
        items: [],
        cargado: false,
        error: null,
        loading: false,
        // cargada: la búsqueda que se muestra (ver claveDe), para no volver a pedirla.
        resultados: {
            items: [],
            totalPaginas: 1,
            total: 0,
            error: null,
            loading: true,
            requestId: null,
            cargada: null
        },
        resumen: { ids: [], cargado: false, loading: false, version: null },
        filtros: FILTROS_INICIALES
    },
    reducers: {
        // Cualquier cambio de búsqueda o de estilo vuelve a la primera página
        setPagina: (state, action) => {
            state.filtros.pagina = action.payload
        },
        setTexto: (state, action) => {
            state.filtros.texto = action.payload
        },
        aplicarBusqueda: (state) => {
            state.filtros.busqueda = state.filtros.texto.trim()
            state.filtros.pagina = 0
        },
        setEstiloIds: (state, action) => {
            state.filtros.estiloIds = action.payload
            state.filtros.pagina = 0
        },
        // Elegir un nombre de la lista filtra enseguida. payload: { id, nombre } (nombre = undefined si no se encontró)
        elegirArtista: (state, action) => {
            const { id, nombre } = action.payload
            state.filtros.artistaElegido = id
            if (nombre !== undefined) {
                state.filtros.busqueda = nombre
                state.filtros.pagina = 0
            }
        },
        quitarFiltro: (state, action) => {
            const f = state.filtros
            if (action.payload === "busqueda") {
                f.texto = ""
                f.busqueda = ""
                f.artistaElegido = ""
                f.reinicio += 1
            } else {
                f.estiloIds = f.estiloIds.filter((id) => "estilo" + id !== action.payload)
            }
            f.pagina = 0
        },
        quitarFiltros: (state) => {
            const f = state.filtros
            f.texto = ""
            f.busqueda = ""
            f.artistaElegido = ""
            f.reinicio += 1
            if (f.estiloIds.length > 0) f.estiloIds = []
            f.pagina = 0
        }
    },
    extraReducers: (builder) => {
        builder
            // Todos los artistas
            .addCase(fetchArtistas.pending, (state) => {
                state.loading = true
                state.error = null
            })
            .addCase(fetchArtistas.fulfilled, (state, action) => {
                state.loading = false
                state.cargado = true
                state.items = action.payload
            })
            .addCase(fetchArtistas.rejected, (state, action) => {
                state.loading = false
                state.error = action.error.message
            })

            // La página visible. Si se pidió otra mientras tanto, la respuesta vieja se descarta (requestId).
            .addCase(buscarArtistas.pending, (state, action) => {
                // Mientras llega otra búsqueda, lo que se ve ya no es una búsqueda cerrada: volver a ella la pide.
                state.resultados.cargada = null
                state.resultados.loading = true
                state.resultados.error = null
                state.resultados.requestId = action.meta.requestId
            })
            .addCase(buscarArtistas.fulfilled, (state, action) => {
                if (state.resultados.requestId !== action.meta.requestId) return
                state.resultados.loading = false
                state.resultados.items = action.payload.items
                state.resultados.totalPaginas = action.payload.totalPaginas
                state.resultados.total = action.payload.totalElementos
                state.resultados.cargada = claveDe(action.meta.arg)
            })
            .addCase(buscarArtistas.rejected, (state, action) => {
                if (state.resultados.requestId !== action.meta.requestId) return
                state.resultados.loading = false
                state.resultados.items = []
                state.resultados.total = 0
                state.resultados.error = action.error.message
            })

            // El resumen de cada artista. Si falla, las tarjetas quedan sin fotos ni estilos pero la lista se ve igual.
            .addCase(fetchResumenArtistas.pending, (state) => {
                state.resumen.loading = true
            })
            .addCase(fetchResumenArtistas.fulfilled, (state, action) => {
                state.resumen.loading = false
                state.resumen.cargado = true
                state.resumen.ids = action.payload.obras.map((obra) => obra.id)
                state.resumen.version = action.payload.version
            })
            .addCase(fetchResumenArtistas.rejected, (state) => {
                state.resumen.loading = false
            })
    }
})

export const { setPagina, setTexto, aplicarBusqueda, setEstiloIds, elegirArtista, quitarFiltro, quitarFiltros } =
    artistasSlice.actions

export default artistasSlice.reducer
