// Mis ventas — Área 5 · Artista
// Las facturas emitidas a nombre del artista logueado. Esta pantalla solo lee.

import { useEffect, useState } from "react"
import { api, lista } from "../api/cliente"
import { pesos, fecha, optimizada, portadaDe } from "../api/formato"

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

    // Cuántas obras tiene cada factura, por id de factura. Llegan de a una.
    const [cantidades, setCantidades] = useState({})

    // Lo que ya se pidió de cada venta, por id de factura. Una factura emitida no
    // cambia, así que al volver a abrirla se usa esto y no se llama de nuevo al back.
    const [detalles, setDetalles] = useState({})

    // Lo mismo, pero por cada obra vendida (id del item de factura): cada una se pide
    // por separado, así que cada una está cargando, lista o con error por su cuenta.
    const [lineas, setLineas] = useState({})

    // La página que se está viendo (empieza en 0, como en el back) y cuánto hay en total.
    const [pagina, setPagina] = useState(0)
    const [totalPaginas, setTotalPaginas] = useState(1)
    const [totalFacturas, setTotalFacturas] = useState(0)

    // El backend saca el artista del token, por eso no hace falta mandarle el id.
    useEffect(() => {
        let vigente = true

        api.get("/api/artistas/me/facturas?page=" + pagina + "&size=" + POR_PAGINA)
            .then((respuesta) => {
                if (!vigente) return
                const propias = lista(respuesta)
                setFacturas(propias)
                setTotalPaginas(respuesta && respuesta.totalPages ? respuesta.totalPages : 1)
                setTotalFacturas(respuesta && respuesta.totalElements ? respuesta.totalElements : 0)

                // La factura no dice cuántas obras tiene: hay que pedir sus items.
                propias.forEach((factura) => {
                    api.get("/api/items-factura/factura/" + factura.id)
                        .then((items) => {
                            let total = 0
                            lista(items).forEach((item) => {
                                total = total + item.cantidad_items
                            })
                            setCantidades((previas) => ({ ...previas, [factura.id]: total }))
                        })
                        .catch(() => {})
                })
            })
            .catch((e) => {
                 // Sin ventas el back responde 204 y lista() deja []; un 404 tampoco se muestra como falla.
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

    // Pide los datos de una obra vendida. El item de factura solo trae ids (variante, marco):
    // los nombres salen de la variante, su obra y el marco. Se guarda con los nombres de
    // campo que espera LineaItem.
    const cargarLinea = (item) => {
        setLineas((previas) => ({ ...previas, [item.id]: {} }))

        let variante = null
        let obra = null

        api.get("/api/variantes/" + item.variante_id)
            .then((respuesta) => {
                variante = respuesta
                return api.get("/api/obras/" + variante.obra_id)
            })
            .then((respuesta) => {
                obra = respuesta
                return api.get("/api/marcos/" + item.marco_id)
            })
            .then((marco) => {
                const linea = {
                    id: item.id,
                    nombre_obra: obra.nombre_obra,
                    nombre_tamanio: variante.nombre_tamanio,
                    nombre_marco: marco.nombre_marco,
                    cantidad: item.cantidad_items,
                    descuento: item.descuento,
                    subtotal: item.total_item,
                    imagen: null
                }
                setLineas((previas) => ({ ...previas, [item.id]: { linea } }))

                // La portada llega aparte: si falla o la obra no tiene fotos, la fila queda sin miniatura.
                api.get("/api/imagenes?obraId=" + obra.id)
                    .then((respuesta) => {
                        const portada = portadaDe(lista(respuesta), obra.id)
                        if (!portada) return
                        const conImagen = { ...linea, imagen: optimizada(portada.url, 160) }
                        setLineas((previas) => ({ ...previas, [item.id]: { linea: conImagen } }))
                    })
                    .catch(() => {})
            })
            .catch((e) => setLineas((previas) => ({ ...previas, [item.id]: { error: e.message } })))
    }

    // Abre o cierra una venta. Solo pide al back la primera vez.
    const alternar = (factura) => {
        setAbiertas((previas) => ({ ...previas, [factura.id]: !previas[factura.id] }))

        const previa = detalles[factura.id]
        if (previa && !previa.error) {
            // Ya está cargada: solo se reintentan las obras que habían fallado.
            if (previa.items) {
                previa.items.forEach((item) => {
                    if (lineas[item.id] && lineas[item.id].error) cargarLinea(item)
                })
            }
            return
        }
        setDetalles((previos) => ({ ...previos, [factura.id]: {} }))

        let items = []

        api.get("/api/items-factura/factura/" + factura.id)
            .then((respuesta) => {
                items = lista(respuesta)
                return api.get("/api/compras/" + factura.compra_id)
            })
            .then((compra) => {
                setDetalles((previos) => ({ ...previos, [factura.id]: { compra, items } }))
                items.forEach(cargarLinea)
            })
            // Si falla se guarda el error; al cerrar y abrir de nuevo se reintenta.
            .catch((e) => setDetalles((previos) => ({ ...previos, [factura.id]: { error: e.message } })))
    }

    // El detalle de una venta abierta: cada dato de la compra va en su propia prop.
    const detalleDe = (factura) => {
        const entrada = detalles[factura.id] || {}
        const compra = entrada.compra || {}

        return (
            <DetalleVenta
                error={entrada.error}
                cargado={Boolean(entrada.compra)}
                fechaCompra={compra.fecha_compra}
                tipoEntrega={compra.tipo_entrega}
                direccionEntrega={compra.direccion_entrega}
                items={entrada.items}
                lineas={lineas}
            />
        )
    }

    let vendido = 0
    facturas.forEach((factura) => {
        vendido = vendido + Number(factura.precio_total_factura)
    })

    return (
        <div className="seccion">
            <div className="contenido">
                <h1 className="headline-lg">Mis ventas</h1>
                <p className="body-lg muted" style={{ marginTop: "var(--xs)" }}>
                    Las facturas emitidas a tu nombre.
                </p>

                {/* El título está siempre; solo lo que viene del back espera. */}
                {cargando ? (
                    <div style={{ marginTop: "var(--lg)" }}>
                        <Estado tipo="cargando" />
                    </div>
                ) : error ? (
                    <div style={{ marginTop: "var(--lg)" }}>
                        <Estado tipo="error" mensaje={error} />
                    </div>
                ) : facturas.length === 0 ? (
                    <div style={{ marginTop: "var(--lg)" }}>
                        <Estado tipo="vacio" mensaje="Todavía no vendiste ninguna obra." />
                    </div>
                ) : (
                    <>
                        <div className="fila" style={{ margin: "var(--lg) 0" }}>
                            <div className="cartela" style={{ padding: "var(--md) var(--lg)" }}>
                                {/* La suma sale de las facturas que se están viendo: con varias páginas no es el total. */}
                                <p className="catalog-number muted">{totalPaginas > 1 ? "Vendido en esta página" : "Vendido"}</p>
                                <p className="price-lg">{pesos(vendido)}</p>
                            </div>
                            <div className="cartela" style={{ padding: "var(--md) var(--lg)" }}>
                                <p className="catalog-number muted">Facturas</p>
                                <p className="price-lg">{totalFacturas}</p>
                            </div>
                        </div>

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
                                        <td>{cantidades[f.id] || "—"}</td>
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
