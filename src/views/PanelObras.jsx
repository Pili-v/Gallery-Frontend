// Mis obras — Área 5 · Artista
// Las obras del artista logueado, con su estilo, sus variantes y el stock. Esta pantalla solo lee.
// La lista llega paginada y cada obra trae lo que se ve en su fila (estilos, portada y cantidad de
// variantes). El detalle de las variantes se pide recién cuando se abre la obra.
// Los datos del back viven en Redux (misObrasSlice y estilosSlice); acá quedan los filtros, la página y qué
// obras están abiertas, que son cosas de esta pantalla.

import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useDispatch, useSelector } from "react-redux"
import { optimizada } from "../api/formato"
import { fetchEstilos } from "../redux/estilosSlice"
import { fetchMisObras, fetchVariantesDeObra, olvidarVariantes } from "../redux/misObrasSlice"

import Boton from "../components/Boton"
import CampoFormulario from "../components/CampoFormulario"
import Estado from "../components/Estado"
import FiltroEstilos from "../components/FiltroEstilos"
import Indicador from "../components/Indicador"
import FilaObra from "../components/FilaObra"
import DetalleObra from "../components/DetalleObra"
import Paginador from "../components/Paginador"

const POR_PAGINA = 10

const PanelObras = () => {
    const navegar = useNavigate()
    const dispatch = useDispatch()

    // Lo que viene del backend (Redux)
    const {
        items: obras,
        totalPaginas,
        totalObras,
        loading: cargando,
        error,
        variantes
    } = useSelector((state) => state.misObras)
    const { items: estilos } = useSelector((state) => state.estilos)

    // La página que se está viendo (empieza en 0, como en el back).
    const [pagina, setPagina] = useState(0)

    // Los filtros: los aplica el back y la lista vuelve paginada. "texto" es lo que se está escribiendo y "busqueda"
    // lo que se buscó (se aplica al apretar Buscar o Enter); los demás se aplican apenas se eligen.
    const [textoEscrito, setTextoEscrito] = useState("")
    const [nombreBuscado, setNombreBuscado] = useState("")
    const [estadoDeVenta, setEstadoDeVenta] = useState("todas")
    const [estadoDeStock, setEstadoDeStock] = useState("todas")
    const [estiloIds, setEstiloIds] = useState([])
    const hayFiltros =
        nombreBuscado !== "" || estadoDeVenta !== "todas" || estadoDeStock !== "todas" || estiloIds.length > 0

    // Qué obras están abiertas, por id de obra. Puede haber varias a la vez.
    const [abiertas, setAbiertas] = useState({})

    // Al entrar: los estilos (una sola vez para toda la app; las obras traen solo los ids) y se olvidan las variantes
    // que quedaron de otra visita, porque pudieron cambiar.
    useEffect(() => {
        dispatch(fetchEstilos())
        dispatch(olvidarVariantes())
    }, [dispatch])

    // Las obras: se vuelven a pedir cuando cambia un filtro o la página. Si llega una respuesta vieja (de un filtro o una
    // página anterior), el slice la descarta.
    useEffect(() => {
        const filtros = {
            nombreObra: nombreBuscado,
            enVenta: estadoDeVenta === "si" ? "true" : estadoDeVenta === "no" ? "false" : "",
            sinStock: estadoDeStock === "sin" ? "true" : "",
            estiloId: estiloIds
        }
        dispatch(fetchMisObras({ pagina, size: POR_PAGINA, filtros }))
    }, [dispatch, pagina, nombreBuscado, estadoDeVenta, estadoDeStock, estiloIds])

    const cambiarPagina = (nueva) => {
        setPagina(nueva)
    }

    // Con otro filtro vuelve a la primera página: la que se estaba viendo puede no existir con menos resultados.
    const cambiarFiltro = (actualizarFiltro, valorNuevo) => {
        actualizarFiltro(valorNuevo)
        setPagina(0)
    }

    const buscar = (evento) => {
        evento.preventDefault()
        cambiarFiltro(setNombreBuscado, textoEscrito.trim())
    }

    const quitarFiltros = () => {
        setTextoEscrito("")
        setNombreBuscado("")
        setEstadoDeVenta("todas")
        setEstadoDeStock("todas")
        setEstiloIds([])
        setPagina(0)
    }

    // Sin obras y sin filtros no hay nada que filtrar: solo se invita a publicar. Con filtros se mantienen a la vista.
    const sinNada = !cargando && !error && obras.length === 0 && !hayFiltros

    // Abre o cierra una obra. Las variantes se piden la primera vez que se abre (el thunk no repite el pedido si ya
    // llegaron; si había fallado, reintenta). Una obra sin variantes llega como lista vacía.
    const alternar = (obra) => {
        const abriendo = !abiertas[obra.id]
        setAbiertas((previas) => ({ ...previas, [obra.id]: abriendo }))
        if (abriendo) dispatch(fetchVariantesDeObra(obra.id))
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

    // El título y el botón están siempre; solo lo que viene del back espera.
    let cuerpo

    if (cargando) {
        cuerpo = <Estado tipo="cargando" />
    } else if (error) {
        cuerpo = <Estado tipo="error" mensaje={error} />
    } else if (obras.length === 0 && hayFiltros) {
        cuerpo = (
            <Estado
                tipo="vacio"
                mensaje="No hay obras con esos filtros."
                accion="Quitar filtros"
                onAccion={quitarFiltros}
            />
        )
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
                                            {(!entrada || entrada.loading) && <Estado tipo="cargando" />}
                                            {entrada && !entrada.loading && (
                                                <DetalleObra variantes={entrada.error ? null : entrada.items} />
                                            )}
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
                    <h1 className="headline-lg titulo-oculto">Mis obras</h1>
                    <Boton onClick={() => navegar("/panel/obras/nueva")}>Publicar obra</Boton>
                </div>

                {!sinNada && !error && (
                    <form className="filtros" onSubmit={buscar} role="search">
                        <div style={{ flex: "1 1 240px", maxWidth: 360 }}>
                            <CampoFormulario
                                etiqueta="Buscar obra"
                                placeholder="Nombre de la obra"
                                value={textoEscrito}
                                onChange={(evento) => setTextoEscrito(evento.target.value)}
                            />
                        </div>
                        <button type="submit" className="boton boton-secundario">
                            Buscar
                        </button>

                        <CampoFormulario
                            tipo="select"
                            etiqueta="En venta"
                            value={estadoDeVenta}
                            onChange={(evento) => cambiarFiltro(setEstadoDeVenta, evento.target.value)}
                        >
                            <option value="todas">Todas</option>
                            <option value="si">En venta</option>
                            <option value="no">No en venta</option>
                        </CampoFormulario>

                        <CampoFormulario
                            tipo="select"
                            etiqueta="Stock"
                            value={estadoDeStock}
                            onChange={(evento) => cambiarFiltro(setEstadoDeStock, evento.target.value)}
                        >
                            <option value="todas">Todas</option>
                            <option value="sin">Con variantes sin stock</option>
                        </CampoFormulario>

                        <FiltroEstilos
                            estilos={estilos}
                            seleccionados={estiloIds}
                            onCambiar={(ids) => cambiarFiltro(setEstiloIds, ids)}
                        />

                        {hayFiltros && (
                            <Boton type="button" tipo="secundario" onClick={quitarFiltros}>
                                Quitar filtros
                            </Boton>
                        )}

                        {/* El total de obras (las que cumplen los filtros), a la derecha, como en Mis ventas y Mis compras. */}
                        <div className="filtros-totales">
                            <Indicador titulo="Obras" valor={totalObras} />
                        </div>
                    </form>
                )}

                {cuerpo}
            </div>
        </div>
    )
}

export default PanelObras
