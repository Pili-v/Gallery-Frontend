// Tamaños de lienzo — estado global compartido del catálogo.

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit"

import { obtenerLista } from "./pedidos"
import { http } from "./http"


// -------------------------
// OBTENER TAMAÑOS
// -------------------------

export const fetchTamanios = createAsyncThunk(
    "tamanios/fetchTamanios",
    async () => {
        const tamanios = await obtenerLista(
            "/api/tamanios-lienzo"
        )

        return tamanios
    },
    {
        condition: (_, { getState }) => {
            const { cargado, loading } =
                getState().tamanios

            return !cargado && !loading
        }
    }
)


// -------------------------
// CREAR TAMAÑO
// -------------------------

export const crearTamanio = createAsyncThunk(
    "tamanios/crearTamanio",
    async (datos) => {
        const respuesta = await http.post(
            "/api/tamanios-lienzo",
            datos
        )

        return respuesta.data
    }
)


// -------------------------
// ACTUALIZAR TAMAÑO
// -------------------------

export const actualizarTamanio = createAsyncThunk(
    "tamanios/actualizarTamanio",
    async ({ id, datos }) => {
        const respuesta = await http.put(
            "/api/tamanios-lienzo/" + id,
            datos
        )

        return respuesta.data
    }
)


// -------------------------
// ELIMINAR TAMAÑO
// -------------------------

export const eliminarTamanio = createAsyncThunk(
    "tamanios/eliminarTamanio",
    async (id) => {
        await http.delete(
            "/api/tamanios-lienzo/" + id
        )

        return id
    }
)


const tamaniosSlice = createSlice({
    name: "tamanios",

    initialState: {
        items: [],
        cargado: false,
        loading: false,

        guardando: false,
        eliminandoId: null,

        error: null
    },

    reducers: {
        limpiarErrorTamanios: (state) => {
            state.error = null
        }
    },

    extraReducers: (builder) => {
        builder

            // -------------------------
            // GET
            // -------------------------

            .addCase(fetchTamanios.pending, (state) => {
                state.loading = true
                state.error = null
            })

            .addCase(fetchTamanios.fulfilled, (state, action) => {
                state.loading = false
                state.cargado = true
                state.items = action.payload
            })

            .addCase(fetchTamanios.rejected, (state, action) => {
                state.loading = false
                state.error = action.error.message
            })


            // -------------------------
            // POST
            // -------------------------

            .addCase(crearTamanio.pending, (state) => {
                state.guardando = true
                state.error = null
            })

            .addCase(crearTamanio.fulfilled, (state, action) => {
                state.guardando = false
                state.items.push(action.payload)
            })

            .addCase(crearTamanio.rejected, (state, action) => {
                state.guardando = false
                state.error = action.error.message
            })


            // -------------------------
            // PUT
            // -------------------------

            .addCase(actualizarTamanio.pending, (state) => {
                state.guardando = true
                state.error = null
            })

            .addCase(actualizarTamanio.fulfilled, (state, action) => {
                state.guardando = false

                const indice = state.items.findIndex(
                    (tamanio) =>
                        tamanio.id === action.payload.id
                )

                if (indice !== -1) {
                    state.items[indice] = action.payload
                }
            })

            .addCase(actualizarTamanio.rejected, (state, action) => {
                state.guardando = false
                state.error = action.error.message
            })


            // -------------------------
            // DELETE
            // -------------------------

            .addCase(eliminarTamanio.pending, (state, action) => {
                state.eliminandoId = action.meta.arg
                state.error = null
            })

            .addCase(eliminarTamanio.fulfilled, (state, action) => {
                state.eliminandoId = null

                state.items = state.items.filter(
                    (tamanio) =>
                        tamanio.id !== action.payload
                )
            })

            .addCase(eliminarTamanio.rejected, (state, action) => {
                state.eliminandoId = null
                state.error = action.error.message
            })
    }
})


export const {
    limpiarErrorTamanios
} = tamaniosSlice.actions

export default tamaniosSlice.reducer