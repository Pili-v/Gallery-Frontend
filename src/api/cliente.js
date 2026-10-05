// Todo lo que sale hacia la API pasa por acá: un solo lugar que sabe la
// dirección del backend y que le pone el token a cada pedido.

import { getToken, cerrarSesion } from "./sesion"

const API = "http://localhost:8080"

// Hace el pedido y devuelve el JSON ya convertido en objeto.
// Si la API responde con error, corta con el mensaje que mandó el backend.
const pedir = async (ruta, opciones = {}) => {
    const token = getToken()

    const respuesta = await fetch(API + ruta, {
        ...opciones,
        headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: "Bearer " + token } : {}),
            ...opciones.headers
        }
    })

    // 401 = el token no sirve. Se borra la sesión y se vuelve al login.
    if (respuesta.status === 401) {
        cerrarSesion()
        window.location.href = "/login"
        return
    }

    if (!respuesta.ok) {
        const cuerpo = await respuesta.json().catch(() => ({}))
        throw new Error(cuerpo.message || "Error " + respuesta.status)
    }

    // Un DELETE suele venir sin cuerpo.
    if (respuesta.status === 204) return null
    return respuesta.json().catch(() => null)
}

export const api = {
    get: (ruta) => pedir(ruta),
    post: (ruta, datos) => pedir(ruta, { method: "POST", body: JSON.stringify(datos) }),
    put: (ruta, datos) => pedir(ruta, { method: "PUT", body: JSON.stringify(datos) }),
    patch: (ruta, datos) => pedir(ruta, { method: "PATCH", body: JSON.stringify(datos) }),
    delete: (ruta) => pedir(ruta, { method: "DELETE" })
}

// Para subir fotos no se manda JSON: el navegador arma el multipart solo.
export const subirArchivo = async (ruta, formData) => {
    const token = getToken()
    const respuesta = await fetch(API + ruta, {
        method: "POST",
        headers: token ? { Authorization: "Bearer " + token } : {},
        body: formData
    })
    if (!respuesta.ok) throw new Error("No se pudo subir el archivo")
    return respuesta.json()
}
