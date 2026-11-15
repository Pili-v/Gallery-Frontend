// Mis obras — Área 5 · Artista
// Las obras del artista logueado, con su estilo, sus variantes y el stock. Esta pantalla solo lee.
// La lista llega paginada y cada obra trae todo lo que se ve: estilos, fotos y variantes (al abrirla se ven sin
// otro pedido). Los ids de la página, los filtros y la página viven en misObrasSlice; las obras, en obrasSlice. Al ir
// a editar una obra y volver, se vuelve a la misma página con los mismos filtros (y se pide de nuevo). Acá queda solo
// qué obras están abiertas, que es cosa de esta pantalla.
// Criterio de datos en docs/datos-con-redux.md.
// Disposición: el botón de publicar, el total y los filtros en una columna fija a la izquierda; la tabla a la derecha.

import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useDispatch, useSelector } from "react-redux"
import { optimizada } from "../api/formato"
import { portadaDe } from "../redux/fotos"
import { fetchEstilos } from "../redux/estilosSlice"
import {
    fetchMisObras,
    setPagina,
    setTextoEscrito,
    buscarPorNombre,
    setEstadoDeVenta,
    setEstadoDeStock,
    setEstiloIds,
    quitarFiltros as quitarFiltrosDelStore
} from "../redux/misObrasSlice"

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
    const { ids, totalPaginas, totalObras, loading: cargando, error, filtros } = useSelector((state) => state.misObras)
    const obrasGuardadas = useSelector((state) => state.obras.porId)
    const obras = ids.map((id) => obrasGuardadas[id]).filter(Boolean)
    const { items: estilos } = useSelector((state) => state.estilos)

    // Los filtros los aplica el back y la lista vuelve paginada. textoEscrito es lo que se está escribiendo y
    // nombreBuscado lo que se buscó (se aplica al apretar Buscar o Enter); los demás se aplican apenas se eligen.
    const { pagina, textoEscrito, nombreBuscado, estadoDeVenta, estadoDeStock, estiloIds } = filtros

    const hayFiltros =
        nombreBuscado !== "" || estadoDeVenta !== "todas" || estadoDeStock !== "todas" || estiloIds.length > 0

    // Qué obras están abiertas, por id de obra. Puede haber varias a la vez.
    const [abiertas, setAbiertas] = useState({})

    // Los estilos: una sola vez para toda la app (las obras traen solo los ids).
    useEffect(() => {
        dispatch(fetchEstilos())
    }, [dispatch])

    // Las obras: se piden al entrar y cada vez que cambia un filtro o la página. Si llega una respuesta vieja (de un
    // filtro o una página anterior), el slice la descarta.
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
        dispatch(setPagina(nueva))
    }

    const buscar = (evento) => {
        evento.preventDefault()
        dispatch(buscarPorNombre())
    }

    const quitarFiltros = () => {
        dispatch(quitarFiltrosDelStore())
    }

    // Sin obras y sin filtros no hay nada que filtrar: solo se invita a publicar. Con filtros se mantienen a la vista.
    const sinNada = !cargando && !error && obras.length === 0 && !hayFiltros
    const conLateral = !sinNada && !error

    // Abre o cierra una obra: sus variantes ya llegaron con la lista.
    const alternar = (obra) => {
        setAbiertas((previas) => ({ ...previas, [obra.id]: !previas[obra.id] }))
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
                            <th>Estado</th>
                            <th></th>
                        </tr>
                    </thead>
                    {/* Un tbody por obra: así la fila y su detalle van juntas sin envoltorio extra. */}
                    {obras.map((obra) => {
                        return (
                            <tbody key={obra.id}>
                                <FilaObra
                                    id={obra.id}
                                    nombreObra={obra.nombre_obra}
                                    enVenta={obra.en_venta}
                                    portada={portadaDe(obra) ? optimizada(portadaDe(obra), 160) : null}
                                    estilos={nombresDeEstilos(obra)}
                                    cantidadVariantes={obra.variantes.length}
                                    variantesSinStock={
                                        obra.variantes.filter((variante) => variante.stock_variante === 0).length
                                    }
                                    abierta={abiertas[obra.id] === true}
                                    onAlternar={() => alternar(obra)}
                                />
                                {abiertas[obra.id] && (
                                    <tr>
                                        <td className="fondo-canvas" colSpan={5}>
                                            <DetalleObra variantes={obra.variantes} />
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
                {conLateral ? (
                    <>
                        <h1 className="headline-lg titulo-oculto">Mis obras</h1>
                        <div className="panel-lista">
                            <aside className="cartela pad-lg pegado-arriba panel-lateral">
                                <Boton onClick={() => navegar("/panel/obras/nueva")}>Publicar obra</Boton>

                                {/* El total de obras (las que cumplen los filtros), como en Mis ventas y Mis compras. */}
                                <div className="panel-lateral-totales">
                                    <Indicador titulo="Obras" valor={totalObras} />
                                </div>

                                <form className="panel-lateral-filtros" onSubmit={buscar} role="search">
                                    <div className="panel-lateral-busqueda">
                                        <CampoFormulario
                                            etiqueta="Buscar obra"
                                            placeholder="Nombre de la obra"
                                            value={textoEscrito}
                                            onChange={(evento) => dispatch(setTextoEscrito(evento.target.value))}
                                        />
                                        {/* Un botón cuadrado con la lupa, así el campo usa casi todo el ancho. */}
                                        <button type="submit" className="boton boton-secundario boton-lupa">
                                            <svg viewBox="0 0 20 20" aria-hidden="true">
                                                <circle cx="8.5" cy="8.5" r="5.5" />
                                                <path d="M12.5 12.5L17 17" />
                                            </svg>
                                            <span className="solo-lectores">Buscar</span>
                                        </button>
                                    </div>

                                    <CampoFormulario
                                        tipo="select"
                                        etiqueta="En venta"
                                        value={estadoDeVenta}
                                        onChange={(evento) => dispatch(setEstadoDeVenta(evento.target.value))}
                                    >
                                        <option value="todas">Todas</option>
                                        <option value="si">En venta</option>
                                        <option value="no">No en venta</option>
                                    </CampoFormulario>

                                    <CampoFormulario
                                        tipo="select"
                                        etiqueta="Stock"
                                        value={estadoDeStock}
                                        onChange={(evento) => dispatch(setEstadoDeStock(evento.target.value))}
                                    >
                                        <option value="todas">Todas</option>
                                        <option value="sin">Con variantes sin stock</option>
                                    </CampoFormulario>

                                    <FiltroEstilos
                                        estilos={estilos}
                                        seleccionados={estiloIds}
                                        onCambiar={(ids) => dispatch(setEstiloIds(ids))}
                                    />

                                    {hayFiltros && (
                                        <button type="button" className="boton-texto" onClick={quitarFiltros}>
                                            Quitar filtros
                                        </button>
                                    )}
                                </form>
                            </aside>

                            <div className="min-ancho-0">{cuerpo}</div>
                        </div>
                    </>
                ) : (
                    <>
                        {/* Sin obras (o si falló el pedido) no hay nada que filtrar: el título y el botón, y el aviso. */}
                        <div className="encabezado">
                            <h1 className="headline-lg titulo-oculto">Mis obras</h1>
                            <Boton onClick={() => navegar("/panel/obras/nueva")}>Publicar obra</Boton>
                        </div>
                        {cuerpo}
                    </>
                )}
            </div>
        </div>
    )
}

export default PanelObras
