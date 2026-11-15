// Pedidos que se repiten en varios slices. Siempre devuelven datos ya listos (arrays y objetos simples).
// Sin try/catch: si algo falla el error sube hasta el createAsyncThunk, que lo deja en action.error.

import { http, lista } from "./http"

// Un 404 en una lista se toma como "no hay nada": el 404 de verdad (una obra o un artista que no existe) se pide
// con http.get directo. La lista vacía normal llega como 204.
const aceptar404 = { validateStatus: (status) => (status >= 200 && status < 300) || status === 404 }

// GET de una lista. Devuelve siempre un array, sea cual sea la forma en que llegue.
export const obtenerLista = async (ruta) => {
    const respuesta = await http.get(ruta, aceptar404)
    return respuesta.status === 404 ? [] : lista(respuesta.data)
}

// GET de una lista paginada ({ content, totalPages, totalElements }).
// Con sin404: false, un 404 sube como error (por ejemplo, un artista o un estilo del filtro que no existe).
export const obtenerPagina = async (ruta, { sin404 = true } = {}) => {
    const respuesta = await http.get(ruta, sin404 ? aceptar404 : undefined)
    const cuerpo = respuesta.status === 404 ? null : respuesta.data
    const items = lista(cuerpo)
    return {
        items,
        totalPaginas: cuerpo?.totalPages ?? 1,
        totalElementos: cuerpo?.totalElements ?? items.length
    }
}
