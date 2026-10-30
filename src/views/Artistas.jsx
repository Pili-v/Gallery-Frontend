// Artistas — lista completa de artistas, visible para visitante, cliente y artista.
// Cada artista es una tarjeta horizontal, una debajo de la otra, con:
// 3 portadas chicas de sus obras, hasta 4 estilos que trabaja y la cantidad de obras.
// Todo lo que viene del backend pasa por Redux: esta pantalla solo despacha acciones y lee el estado.
// Las obras, imágenes y estilos se piden UNA sola vez y se agrupan acá por artista, así no se hacen pedidos
// por tarjeta. GET /api/artistas viene paginado y se puede buscar por nombre artístico (q) y filtrar por
// estilo (estiloId): lo resuelve el backend, sobre todos los artistas.

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { useDispatch, useSelector } from "react-redux"
import { fetchEstilos } from "../redux/estilosSlice"
import { fetchArtistas, buscarArtistas, fetchResumenArtistas } from "../redux/artistasSlice"
import { optimizada } from "../api/formato"
import Estado from "../components/Estado"
import Boton from "../components/Boton"
import Paginador from "../components/Paginador"
import FiltroEstilos from "../components/FiltroEstilos"
import BuscadorArtista from "../components/BuscadorArtista"

const POR_PAGINA = 3
const MAX_PORTADAS = 3
const MAX_ESTILOS = 4

export default function Artistas() {
    const dispatch = useDispatch()

    // Lo que viene del backend (Redux)
    const estilos = useSelector((state) => state.estilos.items)
    const todos = useSelector((state) => state.artistas.items) // todos los artistas, solo para sugerir nombres
    const resultados = useSelector((state) => state.artistas.resultados) // la página visible
    const { obras, imagenes } = useSelector((state) => state.artistas.resumen)

    const { items: artistas, totalPaginas, loading: cargando, error } = resultados

    const [pagina, setPagina] = useState(0)

    // Búsqueda: lo que se escribe, lo que está aplicado, el artista elegido en la lista y los estilos elegidos
    const [texto, setTexto] = useState("")
    const [busqueda, setBusqueda] = useState("")
    const [artistaElegido, setArtistaElegido] = useState("")
    const [reinicio, setReinicio] = useState(0) // cambia la key del buscador para vaciarlo
    const [estiloIds, setEstiloIds] = useState([]) // varios estilos: artistas con obras de ALGUNO de ellos
    const hayFiltros = busqueda !== "" || estiloIds.length > 0

    const todosLosArtistas = todos.map((a) => ({ id: a.id, nombre: a.nombre_artistico }))

    // Datos de apoyo para armar las tarjetas (una sola vez). Si fallan, las tarjetas quedan sin fotos ni
    // estilos, pero la lista se ve igual.
    useEffect(() => {
        dispatch(fetchEstilos())
        dispatch(fetchArtistas())
        dispatch(fetchResumenArtistas())
    }, [dispatch])

    // Los artistas de la página visible
    useEffect(() => {
        dispatch(buscarArtistas({ pagina, size: POR_PAGINA, busqueda, estiloIds }))
    }, [dispatch, pagina, busqueda, estiloIds])

    const reintentar = () => {
        dispatch(fetchResumenArtistas())
        dispatch(buscarArtistas({ pagina, size: POR_PAGINA, busqueda, estiloIds }))
    }

    // Cualquier cambio de búsqueda o de estilo vuelve a la primera página
    const buscar = (e) => {
        e.preventDefault()
        setBusqueda(texto.trim())
        setPagina(0)
    }

    const cambiarEstilos = (ids) => {
        setEstiloIds(ids)
        setPagina(0)
    }

    // Al elegir un nombre de la lista se filtra enseguida; si solo se escribe, se aplica con "Buscar".
    const elegirDeLaLista = (id) => {
        setArtistaElegido(id)
        const elegido = todosLosArtistas.find((a) => String(a.id) === id)
        if (elegido) {
            setBusqueda(elegido.nombre)
            setPagina(0)
        }
    }

    const quitarFiltros = () => {
        setTexto("")
        setBusqueda("")
        setArtistaElegido("")
        setReinicio((n) => n + 1)
        setEstiloIds([])
        setPagina(0)
    }

    // Lo que muestra la tarjeta de un artista
    const resumenDe = (artista) => {
        const susObras = obras.filter((o) => o.artista_id === artista.id)

        // Portadas: la imagen de menor orden de cada obra, hasta 3 obras
        const portadas = []
        susObras.forEach((obra) => {
            if (portadas.length >= MAX_PORTADAS) return
            const portada = imagenes
                .filter((i) => i.obra_id === obra.id)
                .sort((a, b) => (a.orden_imagen ?? 0) - (b.orden_imagen ?? 0))[0]
            if (portada) {
                portadas.push({
                    id: obra.id,
                    nombre: obra.nombre_obra,
                    src: optimizada(portada.url, 600)
                })
            }
        })

        // Estilos sin repetir, en el orden en que aparecen
        const idsEstilos = []
        susObras.forEach((obra) => {
            ;(obra.estilo_ids ?? []).forEach((idEstilo) => {
                if (!idsEstilos.includes(idEstilo)) idsEstilos.push(idEstilo)
            })
        })
        const nombresEstilos = idsEstilos
            .map((idEstilo) => estilos.find((e) => e.id === idEstilo)?.nombre_estilo)
            .filter(Boolean)

        return {
            cantidad: susObras.length,
            portadas,
            estilosVisibles: nombresEstilos.slice(0, MAX_ESTILOS),
            estilosOcultos: Math.max(nombresEstilos.length - MAX_ESTILOS, 0)
        }
    }

    let cuerpo
    if (cargando) {
        cuerpo = <Estado tipo="cargando" />
    } else if (error) {
        cuerpo = <Estado tipo="error" mensaje={error} accion="Reintentar" onAccion={reintentar} />
    } else if (artistas.length === 0 && hayFiltros) {
        const nombresEstilos = estilos.filter((e) => estiloIds.includes(e.id)).map((e) => e.nombre_estilo)
        const partes = []
        if (busqueda !== "") partes.push("que coincidan con “" + busqueda + "”")
        if (nombresEstilos.length > 0) {
            partes.push(
                (busqueda !== "" ? "y tengan" : "con") +
                    " obras " +
                    (nombresEstilos.length === 1 ? "del estilo " : "de los estilos ") +
                    nombresEstilos.join(" o ")
            )
        }
        cuerpo = (
            <Estado
                tipo="vacio"
                mensaje={"No hay artistas " + partes.join(" ") + "."}
                accion="Quitar filtros"
                onAccion={quitarFiltros}
            />
        )
    } else if (artistas.length === 0) {
        cuerpo = <Estado tipo="vacio" mensaje="Todavía no hay artistas registrados." />
    } else {
        cuerpo = (
            <div className="apilado">
                {artistas.map((artista) => {
                    const resumen = resumenDe(artista)

                    return (
                        <Link key={artista.id} to={"/artista/" + artista.id} className="cartela tarjeta-artista">
                            {/* Quién es */}
                            <div style={{ minWidth: 0 }}>
                                <div className="vendedor" style={{ gap: "var(--md)" }}>
                                    <span className="avatar">{(artista.nombre_artistico ?? "A")[0]}</span>
                                    <span className="title-work">{artista.nombre_artistico}</span>
                                </div>
                                <p className="cartela-meta" style={{ marginTop: "var(--sm)" }}>
                                    {resumen.cantidad === 1
                                        ? "1 obra publicada"
                                        : resumen.cantidad + " obras publicadas"}
                                    {" · "}
                                    {artista.acepta_encargos ? "Acepta encargos" : "Por ahora no acepta encargos"}
                                </p>
                                {/* Sus estilos, en una línea de texto: sin cajas, siempre en el mismo lugar de la tarjeta. */}
                                {resumen.estilosVisibles.length > 0 && (
                                    <p className="cartela-meta tarjeta-artista-estilos">
                                        {resumen.estilosVisibles.join(" · ")}
                                        {resumen.estilosOcultos > 0 && " · +" + resumen.estilosOcultos}
                                    </p>
                                )}
                            </div>

                            {/* Muestra de su obra */}
                            <div className="fila tarjeta-artista-portadas">
                                {resumen.portadas.map((portada) => (
                                    <img
                                        key={portada.id}
                                        src={portada.src}
                                        alt={portada.nombre}
                                        style={{
                                            width: 72,
                                            height: 72,
                                            objectFit: "contain",
                                            background: "var(--canvas)"
                                        }}
                                    />
                                ))}
                            </div>
                        </Link>
                    )
                })}
            </div>
        )
    }

    return (
        <div className="seccion">
            <div className="contenido apilado">
                <div className="titulo-oculto">
                    <h1 className="headline-lg">Artistas</h1>
                    <p className="body-lg muted">Quienes pintan y venden su obra en la galería.</p>
                </div>

                {/* Buscador por nombre artístico (con sugerencias) y filtro por estilos (siempre visibles) */}
                <form className="filtros" onSubmit={buscar} role="search">
                    <div style={{ flex: "1 1 280px", maxWidth: 420 }}>
                        <BuscadorArtista
                            key={reinicio}
                            artistas={todosLosArtistas}
                            value={artistaElegido}
                            onChange={elegirDeLaLista}
                            onSearch={setTexto}
                            required={false}
                            enviarConEnter
                        />
                    </div>
                    <button type="submit" className="boton boton-secundario">
                        Buscar
                    </button>
                    <FiltroEstilos estilos={estilos} seleccionados={estiloIds} onCambiar={cambiarEstilos} />
                    {hayFiltros && (
                        <Boton type="button" tipo="secundario" onClick={quitarFiltros}>
                            Quitar filtros
                        </Boton>
                    )}
                </form>

                {cuerpo}

                {!cargando && !error && <Paginador pagina={pagina} totalPaginas={totalPaginas} onCambiar={setPagina} />}
            </div>
        </div>
    )
}