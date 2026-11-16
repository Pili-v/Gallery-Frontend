// Catálogo — la página de obras que se ve. Cada obra llega con sus variantes y su portada; acá quedan solo sus ids:
// las obras se guardan en obrasSlice, una sola vez. Los estilos y los artistas viven en sus propios slices.
// Regla de negocio (docs/datos-con-redux.md): el catálogo no tiene que estar al día al instante. La página se pide al
// cambiar un filtro, el orden o la página; al volver a la pantalla con la misma búsqueda no se pide de nuevo, salvo
// que un cambio propio (ver version en obrasSlice) la haya dejado vieja.

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit"
import { obtenerPagina } from "./pedidos"

// Los filtros de la pantalla viven acá (state.catalogo.filtros): al ir a otra pantalla y volver, el Catálogo los
// encuentra igual.
// precioMin/precioMax/texto es lo que se está escribiendo; rango/busqueda es lo que está aplicado y lo que se manda al back.
const SIN_RANGO = { min: "", max: "" }
const FILTROS_INICIALES = {
    pagina: 0,
    estiloIds: [], // varios estilos: se muestran las obras de ALGUNO de ellos
    precioMin: "",
    precioMax: "",
    rango: SIN_RANGO,
    errorPrecio: "",
    orden: "recientes",
    texto: "",
    busqueda: ""
}

// Texto del error si el rango escrito no es válido ("" si está bien). Lo usan el reducer y la pantalla (para cerrar el panel).
export const errorDeRango = (min, max) => {
    min = min.trim()
    max = max.trim()
    if ((min !== "" && Number(min) < 0) || (max !== "" && Number(max) < 0)) return "Los precios no pueden ser negativos."
    if (min !== "" && max !== "" && Number(min) > Number(max)) return "El mínimo no puede ser mayor que el máximo."
    return ""
}

const hayFiltros = ({ estiloIds, rango, busqueda }) =>
    estiloIds.length > 0 || rango.min !== "" || rango.max !== "" || busqueda !== ""

// Si el filtro no devuelve nada el back responde 204 (llega como lista vacía); un filtro inválido es un 400.
// Un 404 se deja subir como error: aviso de filtro en la pantalla (por ejemplo, un estilo que ya no existe).
// La búsqueda que trae un pedido: si es la misma que ya se cargó (y nada cambió), no se vuelve a pedir.
const claveDe = (arg) => JSON.stringify(arg)

export const fetchCatalogo = createAsyncThunk("catalogo/fetchCatalogo", async ({ pagina, size, orden, estiloIds, rango, busqueda }, { getState }) => {
    const version = getState().obras.version
    const partes = ["page=" + pagina, "size=" + size, "orden=" + orden]
    if (estiloIds.length > 0) partes.push("estiloId=" + estiloIds.join(","))
    if (rango.min !== "") partes.push("precioMin=" + rango.min)
    if (rango.max !== "") partes.push("precioMax=" + rango.max)
    if (busqueda !== "") partes.push("q=" + encodeURIComponent(busqueda))

    const resultado = await obtenerPagina("/api/obras?" + partes.join("&"), { sin404: false })
    return { ...resultado, version }
}, {
    condition: (arg, { getState }) => {
        const { cargada } = getState().catalogo
        return !(cargada && cargada.clave === claveDe(arg) && cargada.version === getState().obras.version)
    }
})

const catalogoSlice = createSlice({
    name: "catalogo",
    initialState: {
        ids: [], // las obras de la página que se ve (están en obrasSlice)
        totalPaginas: 1,
        totalObras: 0,
        primeraObraId: null, // la obra del hero: la primera del catálogo SIN filtros y en el orden por defecto
        cargada: null, // { clave, version }: la búsqueda que se muestra y con qué version de las obras llegó
        conFiltros: false, // si el pedido que se está mostrando llevaba filtros
        loading: true,
        error: null,
        codigo: null, // código HTTP del error ("400", "404"...)
        requestId: null,
        filtros: FILTROS_INICIALES
    },
    reducers: {
        // Cualquier cambio de filtro u orden vuelve a la primera página
        setPagina: (state, action) => {
            state.filtros.pagina = action.payload
        },
        setEstiloIds: (state, action) => {
            state.filtros.estiloIds = action.payload
            state.filtros.pagina = 0
        },
        setOrden: (state, action) => {
            state.filtros.orden = action.payload
            state.filtros.pagina = 0
        },
        setTexto: (state, action) => {
            state.filtros.texto = action.payload
        },
        // Buscar por texto (nombre de obra o de artista): se aplica al enviar el formulario.
        aplicarBusqueda: (state) => {
            state.filtros.busqueda = state.filtros.texto.trim()
            state.filtros.pagina = 0
        },
        setPrecioMin: (state, action) => {
            state.filtros.precioMin = action.payload
        },
        setPrecioMax: (state, action) => {
            state.filtros.precioMax = action.payload
        },
        aplicarRango: (state) => {
            const f = state.filtros
            f.errorPrecio = errorDeRango(f.precioMin, f.precioMax)
            if (f.errorPrecio === "") {
                f.rango = { min: f.precioMin.trim(), max: f.precioMax.trim() }
                f.pagina = 0
            }
        },
        // Quitar un filtro desde su etiqueta: la búsqueda, un estilo ("estilo<id>") o el rango de precio.
        quitarFiltro: (state, action) => {
            const f = state.filtros
            const clave = action.payload
            if (clave === "busqueda") {
                f.texto = ""
                f.busqueda = ""
            } else if (clave === "precio") {
                f.precioMin = ""
                f.precioMax = ""
                f.rango = SIN_RANGO
                f.errorPrecio = ""
            } else {
                f.estiloIds = f.estiloIds.filter((id) => "estilo" + id !== clave)
            }
            f.pagina = 0
        },
        // El orden no es un filtro: queda como está al quitar filtros.
        quitarFiltros: (state) => {
            const f = state.filtros
            if (f.estiloIds.length > 0) f.estiloIds = []
            f.precioMin = ""
            f.precioMax = ""
            f.rango = SIN_RANGO
            f.errorPrecio = ""
            f.texto = ""
            f.busqueda = ""
            f.pagina = 0
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchCatalogo.pending, (state, action) => {
                // Mientras llega otra búsqueda, lo que se ve ya no es una búsqueda cerrada: si se vuelve a la anterior
                // antes de que llegue, hay que pedirla (si no, la respuesta de la otra pisaría esta pantalla).
                state.cargada = null
                state.loading = true
                state.error = null
                state.codigo = null
                state.conFiltros = hayFiltros(action.meta.arg)
                state.requestId = action.meta.requestId
            })
            .addCase(fetchCatalogo.fulfilled, (state, action) => {
                // Si el usuario ya pidió otra página u otro filtro, esta respuesta quedó vieja.
                if (state.requestId !== action.meta.requestId) return
                const { items, totalPaginas, totalElementos } = action.payload
                const { orden, pagina } = action.meta.arg

                state.loading = false
                state.ids = items.map((obra) => obra.id)
                state.cargada = { clave: claveDe(action.meta.arg), version: action.payload.version }
                state.totalPaginas = totalPaginas
                state.totalObras = totalElementos
                if (!state.conFiltros && orden === "recientes" && pagina === 0 && items.length > 0) {
                    state.primeraObraId = items[0].id
                }
            })
            .addCase(fetchCatalogo.rejected, (state, action) => {
                if (state.requestId !== action.meta.requestId) return
                state.loading = false
                state.ids = []
                state.cargada = null
                state.totalObras = 0
                state.error = action.error.message
                state.codigo = action.error.code ?? null
            })
    }
})

export const {
    setPagina,
    setEstiloIds,
    setOrden,
    setTexto,
    aplicarBusqueda,
    setPrecioMin,
    setPrecioMax,
    aplicarRango,
    quitarFiltro,
    quitarFiltros
} = catalogoSlice.actions

export default catalogoSlice.reducer
