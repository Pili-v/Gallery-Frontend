import { descuentoVigente, varianteParaMostrar } from "./precio"
import { optimizada } from "./formato"
import { portadaDe } from "../redux/fotos"

// Lo que muestra la tarjeta de una obra (Catálogo, Perfil del artista, obras relacionadas). La obra llega del back
// con sus variantes y sus imágenes (la primera es la portada); los nombres del artista y del estilo salen de sus
// listas (la API manda ids).
//   artistas : state.artistas.items
//   estilos  : state.estilos.items
//   rango    : el filtro de precio del Catálogo ({ min, max }); con rango, se muestra el tamaño que entra en él.
// Devuelve { obra, variante, imagen }. El descuento de la variante llega ya resuelto: 0 si no está vigente.
export const armarTarjeta = (obra, { artistas, estilos, rango }) => {
    const variante = varianteParaMostrar(obra.variantes ?? [], rango)
    const artista = artistas.find((a) => a.id === obra.artista_id)
    const estilo = estilos.find((e) => (obra.estilo_ids ?? []).includes(e.id))
    const portada = portadaDe(obra)

    return {
        obra: {
            ...obra,
            estilo: estilo ? estilo.nombre_estilo : "",
            artistaId: obra.artista_id,
            nombre_artistico: artista ? artista.nombre_artistico : "Artista"
        },
        variante: variante ? { ...variante, porcentaje_descuento: descuentoVigente(variante) } : null,
        imagen: portada ? optimizada(portada, 600) : null
    }
}
