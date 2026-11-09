import { createAsyncThunk, createSlice } from "@reduxjs/toolkit"

import { http } from "./http"
import {
    getToken,
    getUsuario,
    getPerfilArtista,
    guardarSesion
} from "../api/sesion"


// -------------------------
// LOGIN
// -------------------------

export const iniciarSesion = createAsyncThunk(
    "sesion/iniciarSesion",
    async (datos) => {
        // Primero autenticamos al usuario y obtenemos el token.
        const respuestaAuth = await http.post("/api/v1/auth/authenticate", datos)
        const token = respuestaAuth.data.access_token

        // El token se guarda en localStorage para que la sesión sobreviva a un F5.
        // También hace falta guardarlo antes del /me para que http.js pueda enviarlo.
        localStorage.setItem("token", token)

        // Con el token obtenemos los datos completos del usuario.
        const respuestaPerfil = await http.get("/api/usuarios/me")
        const perfil = respuestaPerfil.data

        // Por ahora sesion.js sigue encargado de persistir la sesión en localStorage.
        guardarSesion(token, perfil)

        return {
            token,
            usuario: perfil.usuario,
            perfilArtista: perfil.perfil_artista ?? null
        }
    }
)


// -------------------------
// REGISTRO
// -------------------------

export const registrarUsuario = createAsyncThunk(
    "sesion/registrarUsuario",
    async (datos) => {
        const respuestaAuth = await http.post("/api/v1/auth/register", datos)
        const token = respuestaAuth.data.access_token

        // Se persiste el token para poder recuperarlo después de una recarga.
        localStorage.setItem("token", token)

        const respuestaPerfil = await http.get("/api/usuarios/me")
        const perfil = respuestaPerfil.data

        guardarSesion(token, perfil)

        return {
            token,
            usuario: perfil.usuario,
            perfilArtista: perfil.perfil_artista ?? null
        }
    }
)


// -------------------------
// CARGAR USUARIO ACTUAL
// -------------------------

export const fetchSesionActual = createAsyncThunk(
    "sesion/fetchSesionActual",
    async () => {
        const respuesta = await http.get("/api/usuarios/me")
        const perfil = respuesta.data

        guardarSesion(getToken(), perfil)

        return {
            usuario: perfil.usuario,
            perfilArtista: perfil.perfil_artista ?? null
        }
    }
)


// -------------------------
// MODIFICAR MI CUENTA
// -------------------------

export const actualizarUsuario = createAsyncThunk(
    "sesion/actualizarUsuario",
    async (datos, { getState }) => {
        const respuesta = await http.patch("/api/usuarios/me", datos)
        const usuarioActualizado = respuesta.data

        // Actualizamos también la copia persistida de la sesión.
        guardarSesion(getToken(), {
            usuario: usuarioActualizado,
            perfil_artista: getState().sesion.perfilArtista
        })

        return usuarioActualizado
    }
)


// -------------------------
// MODIFICAR PERFIL ARTISTA
// -------------------------

export const actualizarPerfilArtista = createAsyncThunk(
    "sesion/actualizarPerfilArtista",
    async (datos, { getState }) => {
        const respuesta = await http.patch("/api/artistas/me", datos)
        const perfilActualizado = respuesta.data

        guardarSesion(getToken(), {
            usuario: getState().sesion.usuario,
            perfil_artista: perfilActualizado
        })

        return perfilActualizado
    }
)


// -------------------------
// CAMBIAR CONTRASEÑA
// -------------------------

export const cambiarContrasenia = createAsyncThunk(
    "sesion/cambiarContrasenia",
    async (datos) => {
        await http.patch("/api/usuarios/me/contrasenia", datos)
    }
)


// Al iniciar Redux recuperamos lo que quedó persistido en el navegador.
// De esta forma un F5 no deja el Store vacío.
const initialState = {
    token: getToken(),
    usuario: getUsuario(),
    perfilArtista: getPerfilArtista(),

    loading: false,
    operacion: null,
    error: null
}


const sesionSlice = createSlice({
    name: "sesion",

    initialState,

    reducers: {
        // Permite borrar un error anterior cuando el usuario vuelve a escribir.
        limpiarErrorSesion: (state) => {
            state.error = null
        }
    },

    extraReducers: (builder) => {
        builder

            // -------------------------
            // LOGIN
            // -------------------------

            .addCase(iniciarSesion.pending, (state) => {
                state.loading = true
                state.operacion = "login"
                state.error = null
            })

            .addCase(iniciarSesion.fulfilled, (state, action) => {
                state.loading = false
                state.operacion = null

                state.token = action.payload.token
                state.usuario = action.payload.usuario
                state.perfilArtista = action.payload.perfilArtista
            })

            .addCase(iniciarSesion.rejected, (state, action) => {
                state.loading = false
                state.operacion = null
                state.error = action.error.message
            })


            // -------------------------
            // REGISTRO
            // -------------------------

            .addCase(registrarUsuario.pending, (state) => {
                state.loading = true
                state.operacion = "registro"
                state.error = null
            })

            .addCase(registrarUsuario.fulfilled, (state, action) => {
                state.loading = false
                state.operacion = null

                state.token = action.payload.token
                state.usuario = action.payload.usuario
                state.perfilArtista = action.payload.perfilArtista
            })

            .addCase(registrarUsuario.rejected, (state, action) => {
                state.loading = false
                state.operacion = null
                state.error = action.error.message
            })


            // -------------------------
            // CARGAR SESIÓN
            // -------------------------

            .addCase(fetchSesionActual.pending, (state) => {
                state.loading = true
                state.operacion = "cargarSesion"
                state.error = null
            })

            .addCase(fetchSesionActual.fulfilled, (state, action) => {
                state.loading = false
                state.operacion = null

                state.usuario = action.payload.usuario
                state.perfilArtista = action.payload.perfilArtista
            })

            .addCase(fetchSesionActual.rejected, (state, action) => {
                state.loading = false
                state.operacion = null
                state.error = action.error.message
            })


            // -------------------------
            // ACTUALIZAR USUARIO
            // -------------------------

            .addCase(actualizarUsuario.pending, (state) => {
                state.loading = true
                state.operacion = "actualizarUsuario"
                state.error = null
            })

            .addCase(actualizarUsuario.fulfilled, (state, action) => {
                state.loading = false
                state.operacion = null
                state.usuario = action.payload
            })

            .addCase(actualizarUsuario.rejected, (state, action) => {
                state.loading = false
                state.operacion = null
                state.error = action.error.message
            })


            // -------------------------
            // ACTUALIZAR ARTISTA
            // -------------------------

            .addCase(actualizarPerfilArtista.pending, (state) => {
                state.loading = true
                state.operacion = "actualizarArtista"
                state.error = null
            })

            .addCase(actualizarPerfilArtista.fulfilled, (state, action) => {
                state.loading = false
                state.operacion = null
                state.perfilArtista = action.payload
            })

            .addCase(actualizarPerfilArtista.rejected, (state, action) => {
                state.loading = false
                state.operacion = null
                state.error = action.error.message
            })


            // -------------------------
            // CONTRASEÑA
            // -------------------------

            .addCase(cambiarContrasenia.pending, (state) => {
                state.loading = true
                state.operacion = "contrasenia"
                state.error = null
            })

            .addCase(cambiarContrasenia.fulfilled, (state) => {
                state.loading = false
                state.operacion = null
            })

            .addCase(cambiarContrasenia.rejected, (state, action) => {
                state.loading = false
                state.operacion = null
                state.error = action.error.message
            })
    }
})


export const { limpiarErrorSesion } = sesionSlice.actions

export default sesionSlice.reducer