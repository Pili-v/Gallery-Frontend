// Compra confirmada — Área 4 · Compra
// Es la pantalla donde se ve lo que hace el checkout por dentro: una sola
// compra, pero una factura por cada artista que vendió algo.
// Los datos viven en el estado global (compraDetalleSlice): la pantalla despacha
// la acción con el id de la URL y se suscribe al resultado.

import { useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useDispatch, useSelector } from "react-redux"
import { cargarCompra } from "../redux/compraDetalleSlice"
import { pesos, fecha } from "../api/formato"
import Estado from "../components/Estado"
import Boton from "../components/Boton"

const CompraConfirmada = () => {
    // El id viene de la URL: /compra/12 -> id = "12"
    const { id } = useParams()
    const navegar = useNavigate()

    const dispatch = useDispatch()
    const { compra, facturas, loading: cargando, error } = useSelector((state) => state.compraDetalle)

    // Depende del id: si se navega a otra compra, se vuelve a despachar.
    useEffect(() => {
        dispatch(cargarCompra(id))
    }, [dispatch, id])

    if (cargando)
        return (
            <div className="seccion">
                <div className="contenido">
                    <Estado tipo="cargando" />
                </div>
            </div>
        )
    if (error)
        return (
            <div className="seccion">
                <div className="contenido">
                    <Estado tipo="error" mensaje={error} />
                </div>
            </div>
        )

    return (
        <div className="seccion">
            <div className="contenido col-media">
                <p className="catalog-number cartela-num">Compra Nº {String(compra.id).padStart(6, "0")}</p>
                <h1 className="headline-lg mt-xs">Compra confirmada</h1>
                <p className="body-lg muted">{fecha(compra.fecha_compra)}</p>

                {/* De donde sale el total: las obras y, si eligio envio, el costo de envio. */}
                <div className="resumen mt-md">
                    <div className="resumen-fila">
                        <span>Obras y marcos </span>
                        <span>{pesos(compra.total_compra - compra.costo_envio)}</span>
                    </div>
                    {compra.costo_envio > 0 && (
                        <div className="resumen-fila">
                            <span>Envío a domicilio</span>
                            <span>{pesos(compra.costo_envio)}</span>
                        </div>
                    )}
                    <div className="resumen-fila resumen-total">
                        <span>Total</span>
                        <span>{pesos(compra.total_compra)}</span>
                    </div>
                </div>

                <hr className="divisor" />

                <p className="catalog-number muted mb-md">
                    {facturas.length === 1
                        ? "Se emitió 1 factura"
                        : "Se emitieron " + facturas.length + " facturas, una por artista"}
                </p>

                {facturas.map((factura) => (
                    <div key={factura.id} className="cartela mb-md">
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

                <div className="fila mt-lg">
                    <Boton onClick={() => navegar("/mis-compras")}>Ver mis compras</Boton>
                    <Boton tipo="secundario" onClick={() => navegar("/")}>
                        Volver al catálogo
                    </Boton>
                </div>
            </div>
        </div>
    )
}

export default CompraConfirmada