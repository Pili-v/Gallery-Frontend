// Compra confirmada — Área 4 · Compra
// Es la pantalla donde se ve lo que hace el checkout por dentro: una sola
// compra, pero una factura por cada artista que vendió algo.

import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { api } from "../api/cliente"
import { pesos, fecha } from "../api/formato"
import Estado from "../components/Estado"
import Boton from "../components/Boton"

const CompraConfirmada = () => {

    const [compra, setCompra] = useState(null)
    const [facturas, setFacturas] = useState([])
    const [cargando, setCargando] = useState(true)
    const [error, setError] = useState("")

    // El id viene de la URL: /compra/12 -> id = "12"
    const { id } = useParams()
    const navegar = useNavigate()

    useEffect(() => {
        const cargar = async () => {
            try {
                const laCompra = await api.get("/api/compras/" + id)
                const susFacturas = await api.get("/api/facturas/compra/" + id)

                // Cada factura trae el id del artista, no su nombre. Lo buscamos
                // para que la pantalla diga "Ana Gorriti" y no "artista 1".
                for (const factura of susFacturas) {
                    const artista = await api.get("/api/artistas/" + factura.artista_id)
                    factura.nombre_artistico = artista.nombre_artistico
                }

                setCompra(laCompra)
                setFacturas(susFacturas)
            } catch (e) {
                setError(e.message)
            } finally {
                setCargando(false)
            }
        }
        cargar()
    }, [id])

    if (cargando) return <div className="seccion"><div className="contenido"><Estado tipo="cargando" /></div></div>
    if (error) return <div className="seccion"><div className="contenido"><Estado tipo="error" mensaje={error} /></div></div>

    return (
        <div className="seccion">
            <div className="contenido col-media">

                <p className="catalog-number cartela-num">
                    Compra Nº {String(compra.id).padStart(6, "0")}
                </p>
                <h1 className="headline-lg" style={{ margin: "var(--xs) 0" }}>Compra confirmada</h1>
                <p className="body-lg muted">
                    {fecha(compra.fecha_compra)} · Total {pesos(compra.total_compra)}
                </p>

                <hr className="divisor" />

                <p className="catalog-number muted" style={{ marginBottom: "var(--md)" }}>
                    {facturas.length === 1
                        ? "Se emitió 1 factura"
                        : "Se emitieron " + facturas.length + " facturas, una por artista"}
                </p>

                {facturas.map((factura) => (
                    <div key={factura.id} className="cartela" style={{ marginBottom: "var(--md)" }}>
                        <div className="cartela-fila">
                            <span className="catalog-number cartela-num">
                                Factura Nº {String(factura.id).padStart(4, "0")}
                            </span>
                            <span className="cartela-meta">{factura.nombre_artistico}</span>
                        </div>
                        <div className="cartela-fila">
                            <span className="muted">Total de esta factura</span>
                            <span className="price-md">{pesos(factura.precio_total_factura)}</span>
                        </div>
                    </div>
                ))}

                <div className="fila" style={{ marginTop: "var(--lg)" }}>
                    <Boton onClick={() => navegar("/mis-compras")}>Ver mis compras</Boton>
                    <Boton tipo="secundario" onClick={() => navegar("/")}>Volver al catálogo</Boton>
                </div>

            </div>
        </div>
    )
}

export default CompraConfirmada  