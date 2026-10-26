// Mis obras — Área 5 · Artista
// Las obras del artista logueado, con su estilo, sus variantes y el stock. Esta pantalla solo lee.
// La lista llega paginada y cada obra trae lo que se ve en su fila (estilos, portada y cantidad de
// variantes). El detalle de las variantes se pide recién cuando se abre la obra.

import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { api, lista } from "../api/cliente"
import { optimizada } from "../api/formato"

import Boton from "../components/Boton"
import Estado from "../components/Estado"
import FilaObra from "../components/FilaObra"
import DetalleObra from "../components/DetalleObra"
import Paginador from "../components/Paginador"

const POR_PAGINA = 10

const PanelObras = () => {
    const navegar = useNavigate()

    const [obras, setObras] = useState([])
    const [estilos, setEstilos] = useState([])
    const [cargando, setCargando] = useState(true)
    const [error, setError] = useState(null)

    // La página que se está viendo (empieza en 0, como en el back) y cuánto hay en total.
    const [pagina, setPagina] = useState(0)
    const [totalPaginas, setTotalPaginas] = useState(1)
    const [totalObras, setTotalObras] = useState(0)

    // Qué obras están abiertas, por id de obra. Puede haber varias a la vez.
    const [abiertas, setAbiertas] = useState({})

    // Las variantes de cada obra abierta, por id de obra: sin entrada es que nunca se abrió, {} que
    // se está pidiendo, { variantes } lo que llegó y { error: true } que falló (al abrirla de nuevo se reintenta).
    const [variantes, setVariantes] = useState({})

    // La lista de estilos se pide una sola vez: las obras traen solo los ids.
    useEffect(() => {
        api.get("/api/estilos")
            .then((respuesta) => setEstilos(lista(respuesta)))
            .catch(() => {})
    }, [])

    // El backend saca el artista del token, por eso no hace falta mandarle el id.
    useEffect(() => {
        let vigente = true

        api.get("/api/artistas/me/obras?page=" + pagina + "&size=" + POR_PAGINA)
            .then((respuesta) => {
                if (!vigente) return
                setObras(lista(respuesta))
                setTotalPaginas(respuesta && respuesta.totalPages ? respuesta.totalPages : 1)
                setTotalObras(respuesta && respuesta.totalElements ? respuesta.totalElements : 0)
            })
            .catch((e) => {
                // Sin obras el back responde 204 y lista() deja []; un 404 tampoco se muestra como falla.
                if (vigente && e.status !== 404) setError(e.message)
            })
            .finally(() => {
                if (vigente) setCargando(false)
            })

        // Si se cambia de página antes de que llegue la respuesta, la vieja se descarta.
        return () => {
            vigente = false
        }
    }, [pagina])

    const cambiarPagina = (nueva) => {
        setCargando(true)
        setPagina(nueva)
    }

    // Abre o cierra una obra. Las variantes se piden la primera vez que se abre.
    const alternar = (obra) => {
        const abriendo = !abiertas[obra.id]
        setAbiertas((previas) => ({ ...previas, [obra.id]: abriendo }))

        const entrada = variantes[obra.id]
        if (!abriendo || (entrada && !entrada.error)) return

        setVariantes((previas) => ({ ...previas, [obra.id]: {} }))

        api.get("/api/variantes?obraId=" + obra.id)
            .then((respuesta) => {
                setVariantes((previas) => ({ ...previas, [obra.id]: { variantes: lista(respuesta) } }))
            })
            .catch((e) => {
                // Una obra sin variantes responde 204 (lista() la deja en []); el 404 también se toma como vacía.
                const vacia = e.status === 404
                setVariantes((previas) => ({ ...previas, [obra.id]: vacia ? { variantes: [] } : { error: true } }))
            })
    }

    // El back manda los estilos de la obra como ids: los nombres salen de la lista de estilos.
    const nombresDeEstilos = (obra) => {
        const nombres = []
        obra.estilo_ids.forEach((id) => {
            const estilo = estilos.find((e) => e.id === id)
            if (estilo) nombres.push(estilo.nombre_estilo)
        })
        return nombres.length > 0 ? nombres.join(", ") : "—"
    }

    // Los contadores de arriba salen de las obras que se están viendo. Con una sola página son
    // los totales; con varias, solo los de esta página.
    let publicadas = 0
    let conFaltantes = 0
    obras.forEach((obra) => {
        if (obra.en_venta) publicadas = publicadas + 1
        if (obra.variantes_sin_stock > 0) conFaltantes = conFaltantes + 1
    })

    // El título y el botón están siempre; solo lo que viene del back espera.
    let cuerpo

    if (cargando) {
        cuerpo = <Estado tipo="cargando" />
    } else if (error) {
        cuerpo = <Estado tipo="error" mensaje={error} />
    } else if (obras.length === 0) {
        cuerpo = (
            <Estado
                tipo="vacio"
                mensaje="Todavía no publicaste ninguna obra."
                accion="Publicar mi primera obra"
                onAccion={() => navegar("/panel/obras/nueva")}
            />
        )
    } else {
        cuerpo = (
            <>
                <table className="tabla">
                    <thead>
                        <tr>
                            <th>Obra</th>
                            <th>Estilo</th>
                            <th>Variantes</th>
                            <th>En venta</th>
                            <th></th>
                        </tr>
                    </thead>
                    {/* Un tbody por obra: así la fila y su detalle van juntas sin envoltorio extra. */}
                    {obras.map((obra) => {
                        const entrada = variantes[obra.id]

                        return (
                            <tbody key={obra.id}>
                                <FilaObra
                                    id={obra.id}
                                    nombreObra={obra.nombre_obra}
                                    enVenta={obra.en_venta}
                                    portada={obra.portada_url ? optimizada(obra.portada_url, 160) : null}
                                    estilos={nombresDeEstilos(obra)}
                                    cantidadVariantes={obra.cantidad_variantes}
                                    variantesSinStock={obra.variantes_sin_stock}
                                    abierta={abiertas[obra.id] === true}
                                    onAlternar={() => alternar(obra)}
                                />
                                {abiertas[obra.id] && (
                                    <tr>
                                        <td colSpan={5} style={{ background: "var(--canvas)" }}>
                                            {entrada && entrada.variantes && <DetalleObra variantes={entrada.variantes} />}
                                            {entrada && entrada.error && <DetalleObra variantes={null} />}
                                            {(!entrada || (!entrada.variantes && !entrada.error)) && <Estado tipo="cargando" />}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        )
                    })}
                </table>

                <Paginador pagina={pagina} totalPaginas={totalPaginas} onCambiar={cambiarPagina} />
            </>
        )
    }

    return (
        <div className="seccion">
            <div className="contenido">
                <div className="encabezado">
                    <div>
                        <h1 className="headline-lg titulo-oculto">Mis obras</h1>
                        {!cargando && obras.length > 0 && (
                            <p className="body-lg muted">
                                {totalPaginas > 1 && totalObras + " obras · en esta página: "}
                                {publicadas} publicadas · {conFaltantes} con variantes sin stock
                            </p>
                        )}
                    </div>
                    <Boton onClick={() => navegar("/panel/obras/nueva")}>Publicar obra</Boton>
                </div>

                {cuerpo}
            </div>
        </div>
    )
}

export default PanelObras
