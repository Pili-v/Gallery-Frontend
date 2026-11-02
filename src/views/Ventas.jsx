// Mis ventas — Área 5 · Artista
// Las facturas emitidas a nombre del artista logueado. Esta pantalla solo lee.
// Los datos del back viven en Redux (misVentasSlice); acá quedan los filtros, la página y qué ventas están abiertas,
// que son cosas de esta pantalla.

import { useEffect, useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import { pesos, fecha } from "../api/formato"
import { PERIODOS, desdeDelPeriodo } from "../api/filtros"
import { fetchMisVentas, fetchDetalleDeVenta } from "../redux/misVentasSlice"

import Boton from "../components/Boton"
import CampoFormulario from "../components/CampoFormulario"
import Indicador from "../components/Indicador"
import Estado from "../components/Estado"
import DetalleVenta from "../components/DetalleVenta"
import Paginador from "../components/Paginador"

const POR_PAGINA = 10

const numero = (id) => "Nº " + String(id).padStart(6, "0")

const Ventas = () => {
    const dispatch = useDispatch()

    // Lo que viene del backend (Redux). totalVendido lo calcula el back con todas las facturas que cumplen los
    // filtros, no solo las de esta página. detalles: el de cada venta que se abrió, por id de factura.
    const {
        items: facturas,
        totalPaginas,
        totalFacturas,
        totalVendido,
        loading: cargando,
        error,
        detalles
    } = useSelector((state) => state.misVentas)

    // Qué facturas están abiertas, por id de factura. Puede haber varias a la vez.
    const [abiertas, setAbiertas] = useState({})

    // La página que se está viendo (empieza en 0, como en el back).
    const [pagina, setPagina] = useState(0)

    // Los filtros (cómo se entregó y de cuándo es la venta): los aplica el back y valen para la lista y para el total.
    const [filtroDeEntrega, setFiltroDeEntrega] = useState("todas")
    const [filtroDePeriodo, setFiltroDePeriodo] = useState("0")
    const hayFiltros = filtroDeEntrega !== "todas" || filtroDePeriodo !== "0"

    // Las ventas: se vuelven a pedir cuando cambia un filtro o la página. Si llega una respuesta vieja (de un filtro o
    // una página anterior), el slice la descarta.
    useEffect(() => {
        const filtros = {
            entrega: filtroDeEntrega === "todas" ? "" : filtroDeEntrega,
            desde: desdeDelPeriodo(filtroDePeriodo)
        }
        dispatch(fetchMisVentas({ pagina, size: POR_PAGINA, filtros }))
    }, [dispatch, pagina, filtroDeEntrega, filtroDePeriodo])

    const cambiarPagina = (nueva) => {
        setPagina(nueva)
    }

    // Con otro filtro vuelve a la primera página: la que se estaba viendo puede no existir con menos resultados.
    const cambiarFiltro = (poner, valor) => {
        poner(valor)
        setPagina(0)
    }

    const quitarFiltros = () => {
        setFiltroDeEntrega("todas")
        setFiltroDePeriodo("0")
        setPagina(0)
    }

    // Sin ventas y sin filtros no hay nada que filtrar: solo se avisa. Con filtros se mantienen a la vista.
    const sinNada = !cargando && !error && facturas.length === 0 && !hayFiltros

    // Abre o cierra una venta. El detalle (comprador, entrega y obras con su nombre y portada) viene en un solo pedido
    // y solo se pide la primera vez: el thunk no lo repite si ya llegó (si había fallado, reintenta).
    const alternar = (factura) => {
        const abriendo = !abiertas[factura.id]
        setAbiertas((previas) => ({ ...previas, [factura.id]: abriendo }))
        if (abriendo) dispatch(fetchDetalleDeVenta(factura.id))
    }

    // El detalle de una venta abierta: cada dato va en su propia prop.
    const detalleDe = (factura) => {
        const entrada = detalles[factura.id] || {}
        const detalle = entrada.detalle || {}

        return (
            <DetalleVenta
                error={entrada.error}
                cargado={Boolean(entrada.detalle)}
                fechaCompra={detalle.fecha_compra}
                nombreComprador={detalle.nombre_comprador}
                tipoEntrega={detalle.tipo_entrega}
                direccionEntrega={detalle.direccion_entrega}
                items={detalle.items}
            />
        )
    }

    return (
        <div className="seccion">
            <div className="contenido">
                <h1 className="headline-lg titulo-oculto">Mis ventas</h1>
                <p className="body-lg muted titulo-oculto">Las facturas emitidas a tu nombre.</p>

                {!sinNada && !error && (
                    <div className="filtros">
                        <CampoFormulario
                            tipo="select"
                            etiqueta="Entrega"
                            value={filtroDeEntrega}
                            onChange={(evento) => cambiarFiltro(setFiltroDeEntrega, evento.target.value)}
                        >
                            <option value="todas">Todas</option>
                            <option value="envio">Envío a domicilio</option>
                            <option value="retiro">Retiro en el local</option>
                            <option value="encargo">Encargo (sin envío)</option>
                        </CampoFormulario>

                        <CampoFormulario
                            tipo="select"
                            etiqueta="Período"
                            value={filtroDePeriodo}
                            onChange={(evento) => cambiarFiltro(setFiltroDePeriodo, evento.target.value)}
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

                        {/* Lo vendido y la cantidad de facturas, a la derecha, a la altura de los filtros (valen para lo filtrado). */}
                        <div className="filtros-totales">
                            <Indicador titulo="Vendido" valor={pesos(totalVendido)} />
                            <Indicador titulo="Facturas" valor={totalFacturas} />
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
                ) : facturas.length === 0 ? (
                    hayFiltros ? (
                        <Estado
                            tipo="vacio"
                            mensaje="No hay ventas con esos filtros."
                            accion="Quitar filtros"
                            onAccion={quitarFiltros}
                        />
                    ) : (
                        <div>
                            <Estado tipo="vacio" mensaje="Todavía no vendiste ninguna obra." />
                        </div>
                    )
                ) : (
                    <>
                        <table className="tabla">
                            <thead>
                                <tr>
                                    <th>Factura</th>
                                    <th>Compra</th>
                                    <th>Fecha</th>
                                    <th>Obras</th>
                                    <th>Total</th>
                                </tr>
                            </thead>
                            {/* Un tbody por factura: así la fila y su detalle van juntas sin envoltorio extra. */}
                            {facturas.map((f) => (
                                <tbody key={f.id}>
                                    <tr onClick={() => alternar(f)} className="fila-abrible">
                                        <td className="texto-bordo">
                                            {abiertas[f.id] ? "▾" : "▸"} {numero(f.id)}
                                        </td>
                                        <td>{numero(f.compra_id)}</td>
                                        <td>{fecha(f.fecha_creacion_factura)}</td>
                                        <td>{f.cantidad_obras}</td>
                                        <td className="price-md">{pesos(f.precio_total_factura)}</td>
                                    </tr>
                                    {abiertas[f.id] && (
                                        <tr>
                                            <td className="fondo-canvas" colSpan={5}>
                                                {detalleDe(f)}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            ))}
                        </table>

                        <Paginador pagina={pagina} totalPaginas={totalPaginas} onCambiar={cambiarPagina} />
                    </>
                )}
            </div>
        </div>
    )
}

export default Ventas
