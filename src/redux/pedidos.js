// Pedidos que se repiten en varios slices. Siempre devuelven datos ya listos (arrays y objetos simples).
// Sin try/catch: si algo falla el error sube hasta el createAsyncThunk, que lo deja en action.error.

import { http, lista } from "./http"
import { descuentoVigente, varianteParaMostrar } from "../api/precio"

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

// De cada obra se necesita la variante que se muestra (ver varianteParaMostrar) y su portada.
// Solo se piden las obras que no están en el cache (guardadas = state.variantes.porObra):
// las portadas de todas las que faltan van en un solo pedido (portada=true); las variantes, de a una obra.
// rango es el filtro de precio del catálogo ({ min, max }, "" = sin límite); las demás pantallas no lo mandan.
// Devuelve:
//   datos: [{ id, variante, imagenes }] en el mismo orden que las obras
//   nuevas: { [obraId]: { variantes, portada } } lo que se acaba de pedir, para que variantesSlice lo guarde
export const extrasDeObras = async (obras, rango = { min: "", max: "" }, guardadas = {}) => {
    if (obras.length === 0) return { datos: [], nuevas: {} }

    const faltan = obras.filter((obra) => !guardadas[obra.id])
    const nuevas = {}

    if (faltan.length > 0) {
        const [portadas, variantes] = await Promise.all([
            obtenerLista("/api/imagenes?portada=true&" + faltan.map((obra) => "obraId=" + obra.id).join("&")),
            Promise.all(faltan.map((obra) => obtenerLista("/api/variantes?obraId=" + obra.id)))
        ])
        faltan.forEach((obra, i) => {
            nuevas[obra.id] = {
                variantes: variantes[i],
                portada: portadas.filter((p) => p.obra_id === obra.id)
            }
        })
    }

    // La variante a mostrar se calcula ahora, con el rango de este pedido, sobre la lista (nueva o guardada).
    const datos = obras.map((obra) => {
        const entrada = nuevas[obra.id] ?? guardadas[obra.id]
        const variante = varianteParaMostrar(entrada.variantes, rango)
        // El descuento llega ya resuelto: 0 si no está vigente
        return {
            id: obra.id,
            variante: variante ? { ...variante, porcentaje_descuento: descuentoVigente(variante) } : null,
            imagenes: entrada.portada
        }
    })

    return { datos, nuevas }
}
