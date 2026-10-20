// Mis compras — Área 4 · Compra
// Historial del usuario logueado. Esta pantalla solo lee: no modifica nada.


import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { api, lista } from "../api/cliente"
import { pesos, fecha } from "../api/formato"

import Estado from "../components/Estado"


// Una lista vacía no es una falla: el backend la informa con 404 o con 409
// según el endpoint. En los dos casos devolvemos [].
const listaVacia = (promesa) =>
    promesa.catch((e) => {
        if (e.status === 404 || e.status === 409) return []
        throw e
    })
const MisCompras = () => {
    const [compras, setCompras] = useState([])
    const [cargando, setCargando] = useState(true)
    const [error, setError] = useState(null)
    
    // El backend saca el usuario del token, por eso no hace falta mandarle el id.
    const cargarCompras = () => {
        listaVacia(api.get("/api/compras/me"))
            .then((misCompras) => setCompras(lista(misCompras)))
            .catch((e) => setError(e.message))
            .finally(() => setCargando(false))
    }

    useEffect(() => {
        cargarCompras()
    }, [])

    return (
        <div className="seccion">
            <div className="contenido">
                <h1 className="headline-lg">Mis compras</h1>
                <p className="body-lg muted" style={{ marginTop: "var(--xs)" }}>
                    Las compras que hiciste.
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
                ) : compras.length === 0 ? (
                    <div style={{ marginTop: "var(--lg)" }}>
                        <Estado tipo="vacio" mensaje="Todavía no hiciste ninguna compra." />
                    </div>
                ) : (
                    <table className="tabla" style={{ marginTop: "var(--lg)" }}>
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
                                            : compra.tipo_entrega
                                                ? "Retiro en el local"
                                                : "Encargo (sin envío)"}
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