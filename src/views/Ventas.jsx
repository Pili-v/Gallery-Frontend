// Mis ventas — Área 5 · Artista
// Las facturas emitidas a nombre del artista logueado. Esta pantalla solo lee.

import { useEffect, useState } from "react"
import { api, lista } from "../api/cliente"
import { pesos, fecha } from "../api/formato"
import { PERIODOS, desdeDelPeriodo, parametrosDeFiltros } from "../api/filtros"

import Boton from "../components/Boton"
import CampoFormulario from "../components/CampoFormulario"
import Indicador from "../components/Indicador"
import Estado from "../components/Estado"
import DetalleVenta from "../components/DetalleVenta"
import Paginador from "../components/Paginador"

const POR_PAGINA = 10

const numero = (id) => "Nº " + String(id).padStart(6, "0")

const Ventas = () => {
    const [facturas, setFacturas] = useState([])
    const [cargando, setCargando] = useState(true)
    const [error, setError] = useState(null)
    // Qué facturas están abiertas, por id de factura. Puede haber varias a la vez.
    const [abiertas, setAbiertas] = useState({})

    // El detalle de cada venta abierta, por id de factura: sin entrada es que nunca se abrió, {} que se
    // está pidiendo, { detalle } lo que llegó y { error } que falló (al abrirla de nuevo se reintenta).
    // Una factura emitida no cambia, así que al volver a abrirla se usa esto y no se llama de nuevo al back.
    const [detalles, setDetalles] = useState({})

    // La página que se está viendo (empieza en 0, como en el back) y cuánto hay en total.
    const [pagina, setPagina] = useState(0)
    const [totalPaginas, setTotalPaginas] = useState(1)
    const [totalFacturas, setTotalFacturas] = useState(0)

    // Lo vendido en total: lo calcula el back con todas las facturas que cumplen los filtros, no solo las de esta página.
    const [totalVendido, setTotalVendido] = useState(0)

    // Los filtros (cómo se entregó y de cuándo es la venta): los aplica el back y valen para la lista y para el total.
    const [filtroDeEntrega, setFiltroDeEntrega] = useState("todas")
    const [filtroDePeriodo, setFiltroDePeriodo] = useState("0")
    const hayFiltros = filtroDeEntrega !== "todas" || filtroDePeriodo !== "0"

    // El backend saca el artista del token, por eso no hace falta mandarle el id.
    useEffect(() => {
        let vigente = true

        const filtros = {
            entrega: filtroDeEntrega === "todas" ? "" : filtroDeEntrega,
            desde: desdeDelPeriodo(filtroDePeriodo)
        }

        api.get("/api/artistas/me/facturas?page=" + pagina + "&size=" + POR_PAGINA + parametrosDeFiltros(filtros))
            .then((respuesta) => {
                if (!vigente) return
                setFacturas(lista(respuesta))
                setTotalPaginas(respuesta && respuesta.totalPages ? respuesta.totalPages : 1)
                setTotalFacturas(respuesta && respuesta.totalElements ? respuesta.totalElements : 0)
                setTotalVendido(respuesta && respuesta.total_vendido ? Number(respuesta.total_vendido) : 0)
            })
            .catch((e) => {
                // Sin ventas el back responde 204 y lista() deja []; un 404 tampoco se muestra como falla.
                if (vigente && e.status !== 404) setError(e.message)
            })
            .finally(() => {
                if (vigente) setCargando(false)
            })

        // Si se cambia de página o de filtro antes de que llegue la respuesta, la vieja se descarta.
        return () => {
            vigente = false
        }
    }, [pagina, filtroDeEntrega, filtroDePeriodo])

    const cambiarPagina = (nueva) => {
        setCargando(true)
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

    // Abre o cierra una venta. El detalle (comprador, entrega y obras con su nombre y portada) viene
    // en un solo pedido y solo se pide la primera vez: al volver a abrirla se usa lo guardado.
    const alternar = (factura) => {
        setAbiertas((previas) => ({ ...previas, [factura.id]: !previas[factura.id] }))

        const previa = detalles[factura.id]
        if (previa && !previa.error) return

        setDetalles((previos) => ({ ...previos, [factura.id]: {} }))

        api.get("/api/facturas/" + factura.id + "/detalle")
            .then((detalle) => setDetalles((previos) => ({ ...previos, [factura.id]: { detalle } })))
            // Si falla se guarda el error; al cerrar y abrir de nuevo se reintenta.
            .catch((e) => setDetalles((previos) => ({ ...previos, [factura.id]: { error: e.message } })))
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
                                    <tr onClick={() => alternar(f)} style={{ cursor: "pointer" }}>
                                        <td style={{ color: "var(--bordo)" }}>
                                            {abiertas[f.id] ? "▾" : "▸"} {numero(f.id)}
                                        </td>
                                        <td>{numero(f.compra_id)}</td>
                                        <td>{fecha(f.fecha_creacion_factura)}</td>
                                        <td>{f.cantidad_obras}</td>
                                        <td className="price-md">{pesos(f.precio_total_factura)}</td>
                                    </tr>
                                    {abiertas[f.id] && (
                                        <tr>
                                            <td colSpan={5} style={{ background: "var(--canvas)" }}>
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
