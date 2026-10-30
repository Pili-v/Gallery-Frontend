// Obras del Catálogo — una PÁGINA cada vez que cambia un filtro, el orden o la página. De esas obras se traen
// su variante y su portada (extras). Los estilos y los artistas viven en sus propios slices.

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit"
import { obtenerPagina, extrasDeObras } from "./pedidos"

const hayFiltros = ({ estiloIds, rango, busqueda }) =>
    estiloIds.length > 0 || rango.min !== "" || rango.max !== "" || busqueda !== ""

// Si el filtro no devuelve nada el back responde 204 (llega como lista vacía); un filtro inválido es un 400.
// Un 404 se deja subir como error: aviso de filtro en la pantalla (por ejemplo, un estilo que ya no existe).
export const cargarObras = createAsyncThunk("obras/cargarObras", async ({ pagina, size, orden, estiloIds, rango, busqueda }) => {
    const partes = ["page=" + pagina, "size=" + size, "orden=" + orden]
    if (estiloIds.length > 0) partes.push("estiloId=" + estiloIds.join(","))
    if (rango.min !== "") partes.push("precioMin=" + rango.min)
    if (rango.max !== "") partes.push("precioMax=" + rango.max)
    if (busqueda !== "") partes.push("q=" + encodeURIComponent(busqueda))

    const { items, totalPaginas, totalElementos } = await obtenerPagina("/api/obras?" + partes.join("&"), {
        sin404: false
    })
    const datos = await extrasDeObras(items)

    return { obras: items, datos, totalPaginas, totalElementos }
})

const obrasSlice = createSlice({
    name: "obras",
    initialState: {
        items: [], // las obras de la página actual
        extras: {}, // por id de obra: { id, variante, imagenes }. Se va juntando, no se borra al cambiar de página.
        totalPaginas: 1,
        totalObras: 0,
        primeraObra: null, // la obra del hero: la primera del catálogo SIN filtros y en el orden por defecto
        conFiltros: false, // si el pedido que se está mostrando llevaba filtros
        loading: true,
        error: null,
        codigo: null, // código HTTP del error ("400", "404"...)
        requestId: null
    },
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(cargarObras.pending, (state, action) => {
                state.loading = true
                state.error = null
                state.codigo = null
                state.conFiltros = hayFiltros(action.meta.arg)
                state.requestId = action.meta.requestId
            })
            .addCase(cargarObras.fulfilled, (state, action) => {
                // Si el usuario ya pidió otra página u otro filtro, esta respuesta quedó vieja.
                if (state.requestId !== action.meta.requestId) return
                const { obras, datos, totalPaginas, totalElementos } = action.payload
                const { orden, pagina } = action.meta.arg

                state.loading = false
                state.items = obras
                state.totalPaginas = totalPaginas
                state.totalObras = totalElementos
                datos.forEach((d) => {
                    state.extras[d.id] = d
                })
                if (!state.conFiltros && orden === "recientes" && pagina === 0 && obras.length > 0) {
                    state.primeraObra = obras[0]
                }
            })
            .addCase(cargarObras.rejected, (state, action) => {
                if (state.requestId !== action.meta.requestId) return
                state.loading = false
                state.items = []
                state.totalObras = 0
                state.error = action.error.message
                state.codigo = action.error.code ?? null
            })
    }
})

export default obrasSlice.reducer
