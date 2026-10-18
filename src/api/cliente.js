// Todo lo que sale hacia la API pasa por acá: un solo lugar que sabe la
// dirección del backend y que le pone el token a cada pedido.

import { getToken } from "./sesion"

const API = "http://localhost:8080"

// Nombre del aviso que se emite cuando el back dice que la sesión ya no sirve.
// Lo escucha el componente SesionVencida, que muestra el cartel.
export const SESION_VENCIDA = "sesion-vencida"

// Arma el error con el mensaje que mandó el backend y el código HTTP en error.status.
// El backend responde de tres formas: JSON con "mensaje", texto plano (casi todos los
// 400 y 409) o nada (los 403). Con el código se puede distinguir un caso de otro:
// por ejemplo, un 404 es algo que no existe. Una lista vacía llega como 204 sin cuerpo
// (api.get devuelve null y lista(null) es []).
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
            // Con un FormData (fotos) el navegador arma solo el Content-Type, con su separador.
            ...(opciones.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
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

                // Había una sesión y el token venció o dejó de ser válido: se avisa con la ruta
                // actual (para volver acá después de ingresar) y la pantalla se queda como está.
                // Sin token no hay sesión que vencer: es una ruta que pedía iniciar sesión.
                if (token) {
                    window.dispatchEvent(new CustomEvent(SESION_VENCIDA, {
                        detail: window.location.pathname + window.location.search
                    }))
                }

                return crearError(respuesta).then(error => {
                    throw error
                })
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
// Para subir fotos no se manda JSON sino un FormData (multipart). Pasa por el mismo pedir() que
// el resto: mensajes de error del back, falta de conexión y sesión vencida se tratan igual.
export const subirArchivo = (ruta, formData, metodo = "POST") => pedir(ruta, { method: metodo, body: formData })
