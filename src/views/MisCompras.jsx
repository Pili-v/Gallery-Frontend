// Mis compras — Área 4 · Compra
// Historial del usuario logueado. Esta pantalla solo lee: no modifica nada.

import { useEffect, useState } from "react"
import { Link } from "react-router-dom"

import { api } from "../api/cliente"
import { pesos, fecha } from "../api/formato"

import Estado from "../components/Estado"

const MisCompras = () => {
    const [compras, setCompras] = useState([])
    const [cargando, setCargando] = useState(true)
    const [error, setError] = useState(null)

    // El backend saca el usuario del token, por eso no hace falta mandarle el id.
    const cargarCompras = async () => {
        try {
            const misCompras = await api.get("/api/compras/me")
            setCompras(misCompras)
        } catch (e) {
            setError(e.message)
        } finally {
            setCargando(false)
        }
    }

    useEffect(() => {
        cargarCompras()
    }, [])

    // Los tres estados de siempre antes de dibujar la tabla.
    if (cargando) return <Estado tipo="cargando" />
    if (error) return <Estado tipo="error" mensaje={error} />

    return (
        <div className="seccion">
            <div className="contenido col-media">
                <h1 className="headline-lg">Mis compras</h1>

                {compras.length === 0 ? (
                    <Estado tipo="vacio" mensaje="Todavía no hiciste ninguna compra." />
                ) : (
                    <table className="tabla" style={{ marginTop: "var(--md)" }}>
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
                                    <td>
                                        {compra.tipo_entrega === "ENVIO_DOMICILIO"
                                            ? "Envío a domicilio"
                                            : "Retiro en el local"}
                                    </td>
                                    <td className="price-md">{pesos(compra.total_compra)}</td>
                                    <td>
                                        <Link to={"/compra/" + compra.id} style={{ color: "var(--bordo)" }}>
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
