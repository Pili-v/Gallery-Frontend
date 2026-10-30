// Obras relacionadas — fila de hasta 4 tarjetas debajo del detalle de una obra.
// Sirve para dos secciones: "Más obras de <artista>" y "Obras parecidas" (mismo estilo).
// Es un complemento: si algo falla, la sección simplemente no se muestra y el detalle sigue
// funcionando. Todo lo que viene del backend pasa por Redux (obrasRelacionadasSlice): acá solo se
// despacha y se lee. Los nombres de artistas y estilos salen de sus slices (que se piden una sola vez).
//
// Props:
//   titulo           : encabezado de la sección
//   consultas        : filtros de /api/obras, uno por pedido. Ej: ["artistaId=3"] o ["estiloId=1", "estiloId=2"]
//   excluirId        : id de la obra que se está viendo (no se repite)
//   excluirArtistaId : (opcional) descarta las obras de ese artista, para que "parecidas" sean de otros
//   maximo           : cuántas tarjetas mostrar (4 por defecto)
//
// Usarlo con key={obra.id}: así, al pasar a otra obra, la sección se arma de nuevo.

import { useEffect } from "react"
import { useDispatch, useSelector } from "react-redux"
import { fetchArtistas } from "../redux/artistasSlice"
import { fetchEstilos } from "../redux/estilosSlice"
import { cargarRelacionadas } from "../redux/obrasRelacionadasSlice"
import { optimizada } from "../api/formato"
import TarjetaObra from "./TarjetaObra"

export default function ObrasRelacionadas({ titulo, consultas, excluirId, excluirArtistaId = null, maximo = 4 }) {
    const dispatch = useDispatch()

    // Cada sección guarda su resultado bajo su propia clave (hay dos a la vez en el detalle).
    const clave = consultas.join("|") + "#" + excluirId + "#" + excluirArtistaId + "#" + maximo
    const grupo = useSelector((state) => state.obrasRelacionadas.porClave[clave])
    const artistas = useSelector((state) => state.artistas.items)
    const estilos = useSelector((state) => state.estilos.items)

    useEffect(() => {
        dispatch(fetchArtistas())
        dispatch(fetchEstilos())
    }, [dispatch])

    // La clave ya resume las consultas, la obra excluida y el máximo: cambia cuando cambia cualquiera de ellos.
    useEffect(() => {
        if (consultas.length > 0) {
            dispatch(cargarRelacionadas({ clave, consultas, excluirId, excluirArtistaId, maximo }))
        }
    }, [dispatch, clave, excluirId, excluirArtistaId, maximo])

    // Se arma lo que muestra cada tarjeta: los ids se traducen a nombres y se elige la portada.
    const items = (grupo?.items ?? []).map(({ obra, variante, imagenes }) => {
        const portada = [...imagenes].sort((x, y) => (x.orden_imagen ?? 0) - (y.orden_imagen ?? 0))[0]
        const artista = artistas.find((a) => a.id === obra.artista_id)
        const estilo = estilos.find((e) => (obra.estilo_ids ?? []).includes(e.id))

        return {
            obra: {
                ...obra,
                estilo: estilo ? estilo.nombre_estilo : "",
                artistaId: obra.artista_id,
                nombre_artistico: artista ? artista.nombre_artistico : "Artista"
            },
            variante,
            imagen: portada ? optimizada(portada.url, 600) : null
        }
    })

    if (items.length === 0) return null

    return (
        <section>
            <h2 className="headline-md" style={{ marginBottom: "var(--lg)" }}>
                {titulo}
            </h2>
            <div className="grilla-obras cuatro">
                {items.map((item) => {
                    const variante = item.variante || {}
                    return (
                        <TarjetaObra
                            key={item.obra.id}
                            id={item.obra.id}
                            nombreObra={item.obra.nombre_obra}
                            estilo={item.obra.estilo}
                            artistaId={item.obra.artistaId}
                            nombreArtistico={item.obra.nombre_artistico}
                            nombreTamanio={variante.nombre_tamanio}
                            precio={variante.precio_variante}
                            porcentajeDescuento={variante.porcentaje_descuento}
                            stock={variante.stock_variante}
                            imagen={item.imagen}
                        />
                    )
                })}
            </div>
        </section>
    )
}