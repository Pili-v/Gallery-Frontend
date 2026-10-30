// Perfil del artista — Área 3 · Catálogo
// Todo lo que viene del backend pasa por Redux: esta pantalla solo despacha acciones y lee el estado.
// El artista sale de la lista de artistas (que se pide una sola vez para toda la app) y sus obras de
// GET /api/obras?artistaId=, que devuelve la misma forma que el catálogo y está paginado.
// Las variantes y las imágenes se piden solo de las obras de la página que se ve:
// pedir las listas completas traería las fotos de todas las obras de la base.

import { useState, useEffect } from "react"
import { useParams, Link } from "react-router-dom"
import { useDispatch, useSelector } from "react-redux"
import { fetchEstilos } from "../redux/estilosSlice"
import { fetchArtistas } from "../redux/artistasSlice"
import { cargarObrasDeArtista } from "../redux/obrasDeArtistaSlice"
import { optimizada } from "../api/formato"
import TarjetaObra from "../components/TarjetaObra"
import Estado from "../components/Estado"
import Boton from "../components/Boton"
import Paginador from "../components/Paginador"

const POR_PAGINA = 6

// La key hace que, al pasar de un artista a otro, la pantalla arranque de cero (vuelve a la primera página).
export default function PerfilArtista() {
    const { id } = useParams()
    return <PerfilDeArtista key={id} id={id} />
}

function PerfilDeArtista({ id }) {
    const dispatch = useDispatch()
    const [pagina, setPagina] = useState(0)

    const artistas = useSelector((state) => state.artistas)
    const estilos = useSelector((state) => state.estilos)
    const {
        items,
        totalPaginas,
        totalObras,
        loading: cargandoObras,
        error: errorObras
    } = useSelector((state) => state.obrasDeArtista)

    // El artista y los estilos: una sola vez (si otra pantalla ya los pidió, no se vuelven a pedir)
    useEffect(() => {
        dispatch(fetchArtistas())
        dispatch(fetchEstilos())
    }, [dispatch])

    // Las obras de la página visible, con sus variantes e imágenes
    useEffect(() => {
        dispatch(cargarObrasDeArtista({ artistaId: id, pagina, size: POR_PAGINA }))
    }, [dispatch, id, pagina])

    const error = artistas.error || estilos.error || errorObras
    const cargando = !error && !(artistas.cargado && estilos.cargado)
    const artista = artistas.items.find((a) => String(a.id) === String(id))

    // Si el artista no está en la lista, puede ser uno recién creado: el Reintentar vuelve a pedirla.
    const reintentar = () => {
        dispatch(fetchArtistas({ forzar: true }))
        dispatch(fetchEstilos())
        dispatch(cargarObrasDeArtista({ artistaId: id, pagina, size: POR_PAGINA }))
    }

    if (cargando)
        return (
            <div className="seccion">
                <div className="contenido">
                    <Estado tipo="cargando" />
                </div>
            </div>
        )
    if (error || !artista) {
        return (
            <div className="seccion">
                <div className="contenido">
                    <Estado
                        tipo="error"
                        mensaje={error || "No se encontró al artista."}
                        accion="Reintentar"
                        onAccion={reintentar}
                    />
                </div>
            </div>
        )
    }

    const armarTarjeta = (item) => {
        const portada = [...item.imagenes].sort((a, b) => (a.orden_imagen ?? 0) - (b.orden_imagen ?? 0))[0]
        const estilo = estilos.items.find((e) => (item.obra.estilo_ids ?? []).includes(e.id))
        return {
            obra: {
                ...item.obra,
                estilo: estilo ? estilo.nombre_estilo : "",
                artistaId: artista.id,
                nombre_artistico: artista.nombre_artistico
            },
            variante: item.variante,
            imagen: portada ? optimizada(portada.url, 600) : null
        }
    }

    return (
        <div className="seccion">
            <div className="contenido apilado">
                <header className="encabezado" style={{ alignItems: "flex-start" }}>
                    <div className="vendedor" style={{ gap: "var(--md)" }}>
                        <div className="avatar" style={{ width: 64, height: 64, fontSize: 24 }}>
                            {(artista.nombre_artistico ?? "A")[0]}
                        </div>
                        <div>
                            <h1 className="headline-lg">{artista.nombre_artistico}</h1>
                            <p className="body-lg muted">
                                {artista.acepta_encargos ? "Acepta encargos" : "Por ahora no acepta encargos"}
                            </p>
                        </div>
                    </div>

                    {artista.acepta_encargos && (
                        <Link to={"/encargos/nuevo?artistaId=" + artista.id}>
                            <Boton tipo="primario">Pedirle un encargo</Boton>
                        </Link>
                    )}
                </header>

                <hr className="divisor" />

                <section>
                    <p className="catalog-number muted" style={{ marginBottom: "var(--lg)" }}>
                        Obras publicadas — {totalObras} resultados
                    </p>

                    {cargandoObras ? (
                        <Estado tipo="cargando" />
                    ) : items.length === 0 ? (
                        <Estado tipo="vacio" mensaje="Este artista todavía no publicó obras." />
                    ) : (
                        <div className="grilla-obras">
                            {items.map((item) => {
                                const tarjeta = armarTarjeta(item)
                                const variante = tarjeta.variante || {}
                                return (
                                    <TarjetaObra
                                        key={tarjeta.obra.id}
                                        id={tarjeta.obra.id}
                                        nombreObra={tarjeta.obra.nombre_obra}
                                        estilo={tarjeta.obra.estilo}
                                        artistaId={tarjeta.obra.artistaId}
                                        nombreArtistico={tarjeta.obra.nombre_artistico}
                                        nombreTamanio={variante.nombre_tamanio}
                                        precio={variante.precio_variante}
                                        porcentajeDescuento={variante.porcentaje_descuento}
                                        stock={variante.stock_variante}
                                        imagen={tarjeta.imagen}
                                    />
                                )
                            })}
                        </div>
                    )}

                    {!cargandoObras && <Paginador pagina={pagina} totalPaginas={totalPaginas} onCambiar={setPagina} />}
                </section>
            </div>
        </div>
    )
}