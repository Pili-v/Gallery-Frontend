// Marcos — estado global compartido por las pantallas que utilizan marcos.

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit"

import { obtenerLista } from "./pedidos"
import { http } from "./http"


// -------------------------
// OBTENER MARCOS
// -------------------------

export const fetchMarcos = createAsyncThunk(
    "marcos/fetchMarcos",
    async () => {
        const marcos = await obtenerLista("/api/marcos")
        return marcos
    },
    {
        condition: (_, { getState }) => {
            const { cargado, loading } =
                getState().marcos

            return !cargado && !loading
        }
    }
)


// -------------------------
// CREAR MARCO
// -------------------------

export const crearMarco = createAsyncThunk(
    "marcos/crearMarco",
    async (formData) => {
        // Axios detecta FormData y configura multipart automáticamente.
        const respuesta = await http.post(
            "/api/marcos",
            formData
        )

        return respuesta.data
    }
)


// -------------------------
// ACTUALIZAR MARCO
// -------------------------

export const actualizarMarco = createAsyncThunk(
    "marcos/actualizarMarco",
    async ({ id, formData }) => {
        const respuesta = await http.put(
            "/api/marcos/" + id,
            formData
        )

        return respuesta.data
    }
)


// -------------------------
// ELIMINAR MARCO
// -------------------------

export const eliminarMarco = createAsyncThunk(
    "marcos/eliminarMarco",
    async (id) => {
        await http.delete("/api/marcos/" + id)

        return id
    }
)


const marcosSlice = createSlice({
    name: "marcos",

    initialState: {
        items: [],
        cargado: false,
        loading: false,

        guardando: false,
        eliminandoId: null,

        error: null
    },

    reducers: {
        limpiarErrorMarcos: (state) => {
            state.error = null
        }
    },

    extraReducers: (builder) => {
        builder

            // -------------------------
            // GET
            // -------------------------

            .addCase(fetchMarcos.pending, (state) => {
                state.loading = true
                state.error = null
            })

            .addCase(fetchMarcos.fulfilled, (state, action) => {
                state.loading = false
                state.cargado = true
                state.items = action.payload
            })

            .addCase(fetchMarcos.rejected, (state, action) => {
                state.loading = false
                state.error = action.error.message
            })


            // -------------------------
            // POST
            // -------------------------

            .addCase(crearMarco.pending, (state) => {
                state.guardando = true
                state.error = null
            })

            .addCase(crearMarco.fulfilled, (state, action) => {
                state.guardando = false
                state.items.push(action.payload)
            })

            .addCase(crearMarco.rejected, (state, action) => {
                state.guardando = false
                state.error = action.error.message
            })


            // -------------------------
            // PUT
            // -------------------------

            .addCase(actualizarMarco.pending, (state) => {
                state.guardando = true
                state.error = null
            })

            .addCase(actualizarMarco.fulfilled, (state, action) => {
                state.guardando = false

                const indice = state.items.findIndex(
                    (marco) =>
                        marco.id === action.payload.id
                )

                if (indice !== -1) {
                    state.items[indice] = action.payload
                }
            })

            .addCase(actualizarMarco.rejected, (state, action) => {
                state.guardando = false
                state.error = action.error.message
            })


            // -------------------------
            // DELETE
            // -------------------------

            .addCase(eliminarMarco.pending, (state, action) => {
                state.eliminandoId = action.meta.arg
                state.error = null
            })

            .addCase(eliminarMarco.fulfilled, (state, action) => {
                state.eliminandoId = null

                state.items = state.items.filter(
                    (marco) =>
                        marco.id !== action.payload
                )
            })

            .addCase(eliminarMarco.rejected, (state, action) => {
                state.eliminandoId = null
                state.error = action.error.message
            })
    }
})


export const {
    limpiarErrorMarcos
} = marcosSlice.actions

export default marcosSlice.reducer
