import {
    createAsyncThunk,
    createSlice
} from "@reduxjs/toolkit"

import { http } from "./http"
import { cambioDeUsuario } from "./sesionSlice"


// -------------------------
// OBTENER MÉTRICAS
// -------------------------

export const fetchMetricas = createAsyncThunk(
    "metricas/fetchMetricas",
    async () => {
        const respuesta = await http.get(
            "/api/admin/metricas"
        )

        return respuesta.data
    }
)


const metricasSlice = createSlice({
    name: "metricas",

    initialState: {
        datos: null,
        loading: false,
        error: null
    },

    reducers: {},

    extraReducers: (builder) => {
        builder

            .addCase(
                fetchMetricas.pending,
                (state) => {
                    state.loading = true
                    state.error = null
                }
            )

            .addCase(
                fetchMetricas.fulfilled,
                (state, action) => {
                    state.loading = false
                    state.datos = action.payload
                }
            )

            .addCase(
                fetchMetricas.rejected,
                (state, action) => {
                    state.loading = false
                    state.error =
                        action.error.message
                }
            )

            // Son datos del usuario: al cerrar sesión o entrar con otro, se vuelve al estado inicial.
            .addMatcher(cambioDeUsuario, () => metricasSlice.getInitialState())
    }
})


export default metricasSlice.reducer