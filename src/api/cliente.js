// Todo lo que sale hacia la API pasa por acá: un solo lugar que sabe la
// dirección del backend y que le pone el token a cada pedido.

import { getToken, cerrarSesion } from "./sesion"

const API = "http://localhost:8080"

// Arma el error con el mensaje que mandó el backend y el código HTTP en error.status.
// El backend responde de tres formas: JSON con "mensaje", texto plano (casi todos los
// 400 y 409) o nada (los 403). Con el código se puede distinguir un caso de otro:
// por ejemplo, una lista vacía llega como 404 y no es una falla.
const crearError = async (respuesta) => {
    const texto = await respuesta.text().catch(() => "")
    let mensaje = texto

    try {
        const cuerpo = JSON.parse(texto)
        // Un texto plano como "404" o "true" también es JSON válido: solo un objeto trae campos.
        if (cuerpo && typeof cuerpo === "object") mensaje = cuerpo.mensaje || cuerpo.message || ""
    } catch {
        // No era JSON: queda el texto plano tal cual.
    }

    if (!mensaje && respuesta.status === 403) mensaje = "No tenés permiso para hacer esto."
    if (!mensaje) mensaje = "Error " + respuesta.status

    const error = new Error(mensaje)
    error.status = respuesta.status
    return error
}

// Hace el pedido y devuelve el JSON ya convertido en objeto.
// Si la API responde con error, corta con el mensaje que mandó el backend (ver crearError).
const pedir = async (ruta, opciones = {}) => {
    const token = getToken()

    const respuesta = await fetch(API + ruta, {
        ...opciones,
        headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: "Bearer " + token } : {}),
            ...opciones.headers
        }
    }).catch(() => {
        // fetch solo falla así cuando no hay conexión con el backend.
        throw new Error("No se pudo conectar con el servidor.")
    })

    // 401 = el token no sirve. Se borra la sesión y se vuelve al login.
    if (respuesta.status === 401) {

        // Si el error ocurre intentando iniciar sesión,
        // mostramos el mensaje y no recargamos la página.
        if (ruta === "/api/v1/auth/authenticate") {
            const mensaje = await respuesta.text()

            throw new Error(
                mensaje || "Mail o contraseña incorrectos"
            )
        }

        // Si ya había una sesión y el token dejó de ser válido,
        // cerramos la sesión y volvemos al login.
        cerrarSesion()
        window.location.href = "/login"
        return
    }

    if (!respuesta.ok) {
        throw await crearError(respuesta)
    }

    // Un DELETE suele venir sin cuerpo.
    if (respuesta.status === 204) return null
    return respuesta.json().catch(() => null)
}

export const api = {
    get: (ruta) => pedir(ruta),

    // Pide una lista y devuelve siempre un array. El backend avisa que no hay elementos con un
    // 404 (o 204, sin cuerpo) y eso no es una falla: acá se vuelve []. Cualquier otro error
    // sigue cortando. `vacios` son los códigos que significan "no hay nada": un carrito sin
    // items, por ejemplo, responde 409.
    getLista: (ruta, vacios = [404]) =>
        pedir(ruta)
            .then((respuesta) => lista(respuesta))
            .catch((e) => {
                if (vacios.includes(e.status)) return []
                throw e
            }),
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
