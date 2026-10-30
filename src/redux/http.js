// Axios: el único lugar que sabe la dirección del backend y que le pone el token a cada pedido.
// Reemplaza a fetch (api/cliente.js) para todo lo que pasa por Redux. Los slices importan `http` desde acá.
//
// Los errores salen con el mensaje que mandó el backend y con el código HTTP en error.code (como texto,
// por ejemplo "404"). Se usa `code` porque createAsyncThunk, al rechazar, solo guarda name, message y code:
// en los slices queda disponible como action.error.message y action.error.code.

import axios from "axios"
import { getToken } from "../api/sesion"
// Por ahora el aviso de sesión vencida sigue viviendo en cliente.js (lo escucha el componente SesionVencida).
// Cuando cliente.js desaparezca, esta constante se mueve a api/sesion.js y se cambia el import en los dos lugares.
import { SESION_VENCIDA } from "../api/cliente"

export const http = axios.create({ baseURL: "http://localhost:8080" })

// Una lista puede llegar como [ {...} ] o, paginada, como { content: [ {...} ] }. Un 204 llega como null.
// Esta función deja siempre un array.
export const lista = (respuesta) => {
    if (Array.isArray(respuesta)) return respuesta
    return respuesta?.content ?? []
}

// Antes de cada pedido: si hay sesión, se manda el token. Con un FormData (fotos) axios arma solo el
// Content-Type multipart, y con un objeto arma el JSON.
http.interceptors.request.use((config) => {
    const token = getToken()
    if (token) config.headers.Authorization = "Bearer " + token
    return config
})

// El backend responde el error de tres formas: JSON con "mensaje", texto plano (casi todos los 400 y 409)
// o nada (los 403).
const mensajeDe = (status, cuerpo) => {
    let mensaje = ""
    if (typeof cuerpo === "string") mensaje = cuerpo
    else if (cuerpo && typeof cuerpo === "object") mensaje = cuerpo.mensaje || cuerpo.message || ""

    if (!mensaje && status === 403) mensaje = "No tenés permiso para hacer esto."
    return mensaje || "Error " + status
}

http.interceptors.response.use(
    (respuesta) => {
        // Un 204 (lista vacía) no trae cuerpo: se normaliza a null.
        if (respuesta.status === 204) respuesta.data = null
        return respuesta
    },
    (error) => {
        // Sin respuesta del servidor: no hay conexión (o se canceló el pedido).
        if (!error.response) {
            if (axios.isCancel(error)) return Promise.reject(error)
            const sinConexion = new Error("No se pudo conectar con el servidor.")
            sinConexion.code = "ERR_NETWORK"
            return Promise.reject(sinConexion)
        }

        const { status, data } = error.response
        const token = getToken()
        let mensaje = mensajeDe(status, data)

        if (status === 401) {
            if (error.config.url.includes("/api/v1/auth/authenticate")) {
                // Mail o contraseña mal: no es una sesión vencida.
                mensaje = typeof data === "string" && data ? data : "Mail o contraseña incorrectos"
            } else if (token) {
                // Había una sesión y el token venció: se avisa con la ruta actual (para volver acá
                // después de ingresar) y la pantalla se queda como está. Sin token no hay sesión que vencer.
                window.dispatchEvent(
                    new CustomEvent(SESION_VENCIDA, {
                        detail: window.location.pathname + window.location.search
                    })
                )
            }
        }

        const errorFinal = new Error(mensaje)
        errorFinal.code = String(status)
        return Promise.reject(errorFinal)
    }
)
