import { useEffect } from "react"
import {
    useDispatch,
    useSelector
} from "react-redux"

import Estado from "../components/Estado"

import {
    fetchMetricas
} from "../redux/metricasSlice"

import {
    pesos
} from "../api/formato"


const AdminMetricas = () => {
    const dispatch = useDispatch()

    const {
        datos,
        loading,
        error
    } = useSelector(
        (state) => state.metricas
    )


    useEffect(() => {
        dispatch(fetchMetricas())
    }, [dispatch])


    if (loading && !datos) {
        return (
            <div className="seccion">
                <div className="contenido">
                    <Estado tipo="cargando" />
                </div>
            </div>
        )
    }


    if (error && !datos) {
        return (
            <div className="seccion">
                <div className="contenido">
                    <Estado
                        tipo="error"
                        mensaje={error}
                    />
                </div>
            </div>
        )
    }


    if (!datos) {
        return null
    }


    const actividadComercial = [
        {
            titulo: "Ventas totales",
            valor: datos.ventas_totales,
            descripcion:
                "Operaciones realizadas en la plataforma"
        },
        {
            titulo: "Ventas de hoy",
            valor: datos.ventas_hoy,
            descripcion:
                "Operaciones realizadas durante el día"
        },
        {
            titulo: "Ingresos totales",
            valor: pesos(
                datos.ingresos_totales
            ),
            descripcion:
                "Facturación acumulada"
        },
        {
            titulo: "Ingresos de hoy",
            valor: pesos(
                datos.ingresos_hoy
            ),
            descripcion:
                "Facturación del día actual"
        },
        {
            titulo: "Encargos totales",
            valor: datos.encargos_totales,
            descripcion:
                "Encargos creados en Gallery"
        },
        {
            titulo: "Encargos activos",
            valor: datos.encargos_activos,
            descripcion:
                "Encargos todavía en curso"
        }
    ]


    const plataforma = [
        {
            titulo: "Usuarios registrados",
            valor:
                datos.usuarios_registrados,
            descripcion:
                "Cuentas creadas en la plataforma"
        },
        {
            titulo: "Obras publicadas",
            valor:
                datos.obras_publicadas,
            descripcion:
                "Obras visibles actualmente en el catálogo"
        }
    ]


    const renderMetricas = (metricas) => (
        <div className="metricas-grid">
            {metricas.map((metrica) => (
                <article
                    className="cartela pad-lg metrica-cartela"
                    key={metrica.titulo}
                >
                    <p className="cartela-meta">
                        {metrica.titulo}
                    </p>

                    <p className="metrica-valor">
                        {metrica.valor}
                    </p>

                    <p className="body-sm muted">
                        {metrica.descripcion}
                    </p>
                </article>
            ))}
        </div>
    )


    return (
        <div className="seccion">
            <div className="contenido">

                <h1 className="headline-lg titulo-oculto">
                    Métricas
                </h1>


                {error && (
                    <div className="mb-md">
                        <Estado
                            tipo="error"
                            mensaje={error}
                        />
                    </div>
                )}


                <section className="mb-xl">
                    <h2 className="headline-sm mb-md">
                        Actividad comercial
                    </h2>

                    {renderMetricas(
                        actividadComercial
                    )}
                </section>


                <section>
                    <h2 className="headline-sm mb-md">
                        Estado de la plataforma
                    </h2>

                    {renderMetricas(
                        plataforma
                    )}
                </section>

            </div>
        </div>
    )
}


export default AdminMetricas