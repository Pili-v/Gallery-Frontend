import { createAsyncThunk, createSlice } from "@reduxjs/toolkit"

import { http, lista } from "./http"


// -------------------------
// OBTENER USUARIOS
// -------------------------

export const fetchUsuarios = createAsyncThunk(
    "usuarios/fetchUsuarios",
    async () => {
        // Axios realiza el GET al backend.
        const respuesta = await http.get("/api/usuarios")

        // lista() normaliza la respuesta para obtener siempre un array.
        return lista(respuesta.data)
    },
    {
        // Evita repetir el GET si los usuarios ya fueron cargados.
        condition: (_, { getState }) => {
            const { cargado, loading } = getState().usuarios

            return !cargado && !loading
        }
    }
)


// -------------------------
// ACTUALIZAR ROL
// -------------------------

export const actualizarRolUsuario = createAsyncThunk(
    "usuarios/actualizarRolUsuario",
    async ({ usuarioId, rol }) => {
        const respuesta = await http.patch(
            "/api/usuarios/" +
                usuarioId +
                "/rol?rol=" +
                encodeURIComponent(rol)
        )

        return respuesta.data
    }
)


const usuariosSlice = createSlice({
    name: "usuarios",

    initialState: {
        items: [],
        cargado: false,
        loading: false,
        guardandoId: null,
        error: null
    },

    reducers: {
        limpiarErrorUsuarios: (state) => {
            state.error = null
        }
    },

    extraReducers: (builder) => {
        builder

            // -------------------------
            // GET USUARIOS
            // -------------------------

            .addCase(fetchUsuarios.pending, (state) => {
                state.loading = true
                state.error = null
            })

            .addCase(fetchUsuarios.fulfilled, (state, action) => {
                state.loading = false
                state.cargado = true
                state.items = action.payload
            })

            .addCase(fetchUsuarios.rejected, (state, action) => {
                state.loading = false
                state.error = action.error.message
            })


            // -------------------------
            // ACTUALIZAR ROL
            // -------------------------

            .addCase(actualizarRolUsuario.pending, (state, action) => {
                // Guardamos qué usuario está siendo modificado
                // para mostrar "Guardando..." solamente en esa fila.
                state.guardandoId = action.meta.arg.usuarioId
                state.error = null
            })

            .addCase(actualizarRolUsuario.fulfilled, (state, action) => {
                state.guardandoId = null

                // Buscamos al usuario modificado dentro del estado global.
                const indice = state.items.findIndex(
                    (usuario) => usuario.id === action.payload.id
                )

                // Reemplazamos solamente el usuario actualizado.
                if (indice !== -1) {
                    state.items[indice] = action.payload
                }
            })

            .addCase(actualizarRolUsuario.rejected, (state, action) => {
                state.guardandoId = null
                state.error = action.error.message
            })
    }
})


export const { limpiarErrorUsuarios } = usuariosSlice.actions

export default usuariosSlice.reducer