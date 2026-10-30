// Obras relacionadas — las filas "Más obras de..." y "Obras parecidas" del detalle de una obra.
// Hay dos a la vez, cada una con sus propios filtros: por eso el estado se guarda por clave.

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit"
import { obtenerLista, extrasDeObras } from "./pedidos"

// consultas: filtros de /api/obras, uno por pedido (["artistaId=3"] o ["estiloId=1", "estiloId=2"]).
export const cargarRelacionadas = createAsyncThunk(
    "obrasRelacionadas/cargarRelacionadas",
    async ({ consultas, excluirId, excluirArtistaId, maximo }) => {
        // Se piden de más porque después se descartan la obra actual y las del mismo artista.
        const tamanio = maximo * 3 + 1
        const respuestas = await Promise.all(
            consultas.map((c) => obtenerLista("/api/obras?" + c + "&page=0&size=" + tamanio))
        )

        // Sin repetidas (una obra puede aparecer en dos estilos) y sin la que se está viendo
        const vistas = new Set()
        const elegidas = []
        respuestas.forEach((obras) => {
            obras.forEach((obra) => {
                if (obra.id === excluirId || obra.artista_id === excluirArtistaId || vistas.has(obra.id)) return
                vistas.add(obra.id)
                elegidas.push(obra)
            })
        })
        const obras = elegidas.slice(0, maximo)

        const datos = await extrasDeObras(obras)
        return obras.map((obra, i) => ({ obra, variante: datos[i].variante, imagenes: datos[i].imagenes }))
    }
)

const obrasRelacionadasSlice = createSlice({
    name: "obrasRelacionadas",
    initialState: { porClave: {} }, // clave -> { items, loading, error, requestId }
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(cargarRelacionadas.pending, (state, action) => {
                const { clave } = action.meta.arg
                const anterior = state.porClave[clave]
                state.porClave[clave] = {
                    items: anterior ? anterior.items : [],
                    loading: true,
                    error: null,
                    requestId: action.meta.requestId
                }
            })
            .addCase(cargarRelacionadas.fulfilled, (state, action) => {
                const grupo = state.porClave[action.meta.arg.clave]
                if (grupo.requestId !== action.meta.requestId) return
                grupo.loading = false
                grupo.items = action.payload
            })
            .addCase(cargarRelacionadas.rejected, (state, action) => {
                const grupo = state.porClave[action.meta.arg.clave]
                if (grupo.requestId !== action.meta.requestId) return
                grupo.loading = false
                grupo.items = []
                grupo.error = action.error.message
            })
    }
})

export default obrasRelacionadasSlice.reducer
