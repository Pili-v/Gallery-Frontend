// Estilos — estado global compartido por las distintas pantallas de la app.

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit"

import { obtenerLista } from "./pedidos"
import { http } from "./http"


// -------------------------
// OBTENER ESTILOS
// -------------------------

export const fetchEstilos = createAsyncThunk(
    "estilos/fetchEstilos",
    async () => {
        const estilos = await obtenerLista("/api/estilos")
        return estilos
    },
    {
        // Si ya llegaron o están en camino, evitamos repetir el GET.
        condition: (_, { getState }) => {
            const { cargado, loading } = getState().estilos
            return !cargado && !loading
        }
    }
)


// -------------------------
// CREAR ESTILO
// -------------------------

export const crearEstilo = createAsyncThunk(
    "estilos/crearEstilo",
    async (datos) => {
        const respuesta = await http.post(
            "/api/estilos",
            datos
        )

        return respuesta.data
    }
)


// -------------------------
// ACTUALIZAR ESTILO
// -------------------------

export const actualizarEstilo = createAsyncThunk(
    "estilos/actualizarEstilo",
    async ({ id, datos }) => {
        const respuesta = await http.put(
            "/api/estilos/" + id,
            datos
        )

        return respuesta.data
    }
)


// -------------------------
// ELIMINAR ESTILO
// -------------------------

export const eliminarEstilo = createAsyncThunk(
    "estilos/eliminarEstilo",
    async (id) => {
        await http.delete("/api/estilos/" + id)

        // El DELETE responde sin contenido.
        // Devolvemos el id para saber qué elemento sacar del Store.
        return id
    }
)


const estilosSlice = createSlice({
    name: "estilos",

    initialState: {
        items: [],
        cargado: false,
        loading: false,

        // Estados de las operaciones del administrador.
        guardando: false,
        eliminandoId: null,

        error: null
    },

    reducers: {
        limpiarErrorEstilos: (state) => {
            state.error = null
        }
    },

    extraReducers: (builder) => {
        builder

            // -------------------------
            // GET
            // -------------------------

            .addCase(fetchEstilos.pending, (state) => {
                state.loading = true
                state.error = null
            })

            .addCase(fetchEstilos.fulfilled, (state, action) => {
                state.loading = false
                state.cargado = true
                state.items = action.payload
            })

            .addCase(fetchEstilos.rejected, (state, action) => {
                state.loading = false
                state.error = action.error.message
            })


            // -------------------------
            // POST
            // -------------------------

            .addCase(crearEstilo.pending, (state) => {
                state.guardando = true
                state.error = null
            })

            .addCase(crearEstilo.fulfilled, (state, action) => {
                state.guardando = false

                // Agregamos al Store lo que devuelve el backend.
                state.items.push(action.payload)
            })

            .addCase(crearEstilo.rejected, (state, action) => {
                state.guardando = false
                state.error = action.error.message
            })


            // -------------------------
            // PUT
            // -------------------------

            .addCase(actualizarEstilo.pending, (state) => {
                state.guardando = true
                state.error = null
            })

            .addCase(actualizarEstilo.fulfilled, (state, action) => {
                state.guardando = false

                // Encontramos el estilo actualizado y lo reemplazamos.
                const indice = state.items.findIndex(
                    (estilo) =>
                        estilo.id === action.payload.id
                )

                if (indice !== -1) {
                    state.items[indice] = action.payload
                }
            })

            .addCase(actualizarEstilo.rejected, (state, action) => {
                state.guardando = false
                state.error = action.error.message
            })


            // -------------------------
            // DELETE
            // -------------------------

            .addCase(eliminarEstilo.pending, (state, action) => {
                state.eliminandoId = action.meta.arg
                state.error = null
            })

            .addCase(eliminarEstilo.fulfilled, (state, action) => {
                state.eliminandoId = null

                state.items = state.items.filter(
                    (estilo) =>
                        estilo.id !== action.payload
                )
            })

            .addCase(eliminarEstilo.rejected, (state, action) => {
                state.eliminandoId = null
                state.error = action.error.message
            })
    }
})


export const {
    limpiarErrorEstilos
} = estilosSlice.actions

export default estilosSlice.reducer
