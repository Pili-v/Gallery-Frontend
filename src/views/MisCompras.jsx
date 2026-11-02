// Mis compras — Área 4 · Compra
// Historial del usuario logueado. Esta pantalla solo lee: no modifica nada.
// Las compras viven en el estado global (comprasSlice): la pantalla despacha la acción y se suscribe al
// resultado. Los filtros (cómo se entregó y de cuándo es la compra) los aplica el back: cada vez que cambian
// se despacha de nuevo con los parámetros correspondientes.

import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { useDispatch, useSelector } from "react-redux"
import { cargarCompras } from "../redux/comprasSlice"
import { pesos, fecha } from "../api/formato"
import { PERIODOS } from "../api/filtros"

import Boton from "../components/Boton"
import CampoFormulario from "../components/CampoFormulario"
import Indicador from "../components/Indicador"
import Estado from "../components/Estado"

// Cómo se entregó una compra. Las de encargos no tienen tipo de entrega: no se envían.
const tipoDeEntrega = (compra) => {
    if (compra.tipo_entrega === "ENVIO_DOMICILIO") return "envio"
    if (compra.tipo_entrega) return "retiro"
    return "encargo"
}

const TEXTO_ENTREGA = {
    envio: "Envío a domicilio",
    retiro: "Retiro en el local",
    encargo: "Encargo (sin envío)"
}

const MisCompras = () => {
    // Los filtros son preferencias de ESTA pantalla: quedan en estado local.
    // Las compras vienen del back y las consumen otras pantallas: van al estado global.
    const [filtroDeEntrega, setFiltroDeEntrega] = useState("todas")
    const [filtroDePeriodo, setFiltroDePeriodo] = useState("0")

    const dispatch = useDispatch()
    const { items: compras, loading: cargando, error } = useSelector((state) => state.compras)

    const hayFiltros = filtroDeEntrega !== "todas" || filtroDePeriodo !== "0"

    // Se despacha al montar y cada vez que cambia un filtro. Si se cambia otro antes de que llegue la
    // respuesta, el slice descarta la vieja comparando el requestId.
    useEffect(() => {
        dispatch(cargarCompras({ entrega: filtroDeEntrega, periodo: filtroDePeriodo }))
    }, [dispatch, filtroDeEntrega, filtroDePeriodo])

    const quitarFiltros = () => {
        setFiltroDeEntrega("todas")
        setFiltroDePeriodo("0")
    }

    // Lo gastado en las compras que se ven (las que cumplen los filtros).
    let gastado = 0
    compras.forEach((compra) => {
        gastado = gastado + Number(compra.total_compra)
    })

    // Sin compras y sin filtros no hay nada que filtrar: solo se avisa. Con filtros se mantienen a la vista.
    const sinNada = !cargando && !error && compras.length === 0 && !hayFiltros

    return (
        <div className="seccion">
            <div className="contenido">
                <h1 className="headline-lg titulo-oculto">Mis compras</h1>
                <p className="body-lg muted titulo-oculto">Las compras que hiciste.</p>

                {!cargando && !sinNada && !error && (
                    <div className="filtros">
                        <CampoFormulario
                            tipo="select"
                            etiqueta="Entrega"
                            value={filtroDeEntrega}
                            onChange={(evento) => setFiltroDeEntrega(evento.target.value)}
                        >
                            <option value="todas">Todas</option>
                            <option value="envio">{TEXTO_ENTREGA.envio}</option>
                            <option value="retiro">{TEXTO_ENTREGA.retiro}</option>
                            <option value="encargo">{TEXTO_ENTREGA.encargo}</option>
                        </CampoFormulario>

                        <CampoFormulario
                            tipo="select"
                            etiqueta="Período"
                            value={filtroDePeriodo}
                            onChange={(evento) => setFiltroDePeriodo(evento.target.value)}
                        >
                            {PERIODOS.map((periodoPosible) => (
                                <option key={periodoPosible.valor} value={periodoPosible.valor}>
                                    {periodoPosible.texto}
                                </option>
                            ))}
                        </CampoFormulario>

                        {hayFiltros && (
                            <Boton type="button" tipo="secundario" onClick={quitarFiltros}>
                                Quitar filtros
                            </Boton>
                        )}

                        {/* Lo gastado y la cantidad de compras, a la derecha, igual que en Mis ventas (valen para lo filtrado). */}
                        <div className="filtros-totales">
                            <Indicador titulo="Gastado" valor={pesos(gastado)} />
                            <Indicador titulo="Compras" valor={compras.length} />
                        </div>
                    </div>
                )}

                {/* El título está siempre; solo lo que viene del back espera. */}
                {cargando ? (
                    <div>
                        <Estado tipo="cargando" />
                    </div>
                ) : error ? (
                    <div>
                        <Estado tipo="error" mensaje={error} />
                    </div>
                ) : compras.length === 0 ? (
                    hayFiltros ? (
                        <Estado
                            tipo="vacio"
                            mensaje="No hay compras con esos filtros."
                            accion="Quitar filtros"
                            onAccion={quitarFiltros}
                        />
                    ) : (
                        <div>
                            <Estado tipo="vacio" mensaje="Todavía no hiciste ninguna compra." />
                        </div>
                    )
                ) : (
                    <table className="tabla">
                        <thead>
                            <tr>
                                <th>Compra</th>
                                <th>Fecha</th>
                                <th>Entrega</th>
                                <th>Total</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {compras.map((compra) => (
                                <tr key={compra.id}>
                                    <td>Nº {String(compra.id).padStart(6, "0")}</td>
                                    <td>{fecha(compra.fecha_compra)}</td>
                                    <td>{TEXTO_ENTREGA[tipoDeEntrega(compra)]}</td>
                                    <td className="price-md">{pesos(compra.total_compra)}</td>
                                    <td>
                                        <Link className="texto-bordo" to={"/compra/" + compra.id}>
                                            Ver detalle
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    )
}

export default MisCompras
