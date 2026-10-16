// Todo lo que sale hacia la API pasa por acá: un solo lugar que sabe la
// dirección del backend y que le pone el token a cada pedido.

import { getToken, cerrarSesion } from "./sesion"

const API = "http://localhost:8080"

// Arma el error con el mensaje que mandó el backend y el código HTTP en error.status.
// El backend responde de tres formas: JSON con "mensaje", texto plano (casi todos los
// 400 y 409) o nada (los 403). Con el código se puede distinguir un caso de otro:
// por ejemplo, una lista vacía llega como 404 y no es una falla.
const crearError = (respuesta) => {
    return respuesta.text()
        .catch(() => "")
        .then(texto => {
            let mensaje = texto

            try {
                const cuerpo = JSON.parse(texto)
                if (cuerpo && typeof cuerpo === "object") {
                    mensaje = cuerpo.mensaje || cuerpo.message || ""
                }
            } catch {
                // Si no es JSON, conservamos el texto.
            }

            if (!mensaje && respuesta.status === 403) {
                mensaje = "No tenés permiso para hacer esto."
            }

            if (!mensaje) mensaje = "Error " + respuesta.status

            const error = new Error(mensaje)
            error.status = respuesta.status
            return error
        })
}

// Hace el pedido y devuelve el JSON ya convertido en objeto.
// Si la API responde con error, corta con el mensaje que mandó el backend (ver crearError).
const pedir = (ruta, opciones = {}) => {
    const token = getToken()

    return fetch(API + ruta, {
        ...opciones,
        headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: "Bearer " + token } : {}),
            ...opciones.headers
        }
    })
        .catch(() => {
            throw new Error("No se pudo conectar con el servidor.")
        })
        .then(respuesta => {
            if (respuesta.status === 401) {
                if (ruta === "/api/v1/auth/authenticate") {
                    return respuesta.text().then(mensaje => {
                        throw new Error(
                            mensaje || "Mail o contraseña incorrectos"
                        )
                    })
                }

                cerrarSesion()
                window.location.href = "/login"
                return
            }

            if (!respuesta.ok) {
                return crearError(respuesta).then(error => {
                    throw error
                })
            }

            if (respuesta.status === 204) return null

            return respuesta.json().catch(() => null)
        })
}

export const api = {
    get: (ruta) => pedir(ruta),
    post: (ruta, datos) => pedir(ruta, { method: "POST", body: JSON.stringify(datos) }),
    put: (ruta, datos) => pedir(ruta, { method: "PUT", body: JSON.stringify(datos) }),
    patch: (ruta, datos) => pedir(ruta, { method: "PATCH", body: JSON.stringify(datos) }),
    delete: (ruta) => pedir(ruta, { method: "DELETE" })
}


// El backend ahora pagina las listas: en vez de [ {...} ] devuelve { content: [ {...} ] }.
// Esta funcion deja siempre un array, le llegue la forma nueva o la vieja.
export const lista = (respuesta) => {
    if (Array.isArray(respuesta)) return respuesta
    return respuesta?.content ?? []
}
// Para subir fotos no se manda JSON: el navegador arma el multipart solo.
export const subirArchivo = (ruta, formData) => {
    const token = getToken()

    return fetch(API + ruta, {
        method: "POST",
        headers: token ? { Authorization: "Bearer " + token } : {},
        body: formData
    }).then(respuesta => {
        if (!respuesta.ok) {
            throw new Error("No se pudo subir el archivo")
        }

        return respuesta.json()
    })
}
