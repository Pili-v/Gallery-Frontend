// Mis obras — Área 5 · Artista
// Las obras del artista logueado, con su estilo, sus variantes y el stock. Esta pantalla solo lee.

import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { api, lista } from "../api/cliente"

import Boton from "../components/Boton"
import Estado from "../components/Estado"
import FilaObra from "../components/FilaObra"
import DetalleObra from "../components/DetalleObra"

const PanelObras = () => {
    const navegar = useNavigate()

    const [obras, setObras] = useState([])
    const [estilos, setEstilos] = useState([])
    const [cargando, setCargando] = useState(true)
    const [error, setError] = useState(null)
    // Qué obras están abiertas, por id de obra. Puede haber varias a la vez.
    const [abiertas, setAbiertas] = useState({})

    // Lo que no trae la lista de obras se pide por cada una y llega de a poco. En los dos
    // estados, por id de obra: sin entrada es que todavía no llegó, un array es lo que
    // llegó (vacío si no tiene) y null es que falló ese pedido.
    const [variantes, setVariantes] = useState({})
    const [estilosDeObra, setEstilosDeObra] = useState({})

    // El backend saca el artista del token, por eso no hace falta mandarle el id.
    useEffect(() => {
        api.get("/api/estilos")
            .then((respuesta) => setEstilos(lista(respuesta)))
            .catch(() => {})

        api.get("/api/artistas/me/obras")
            .then((respuesta) => {
                const propias = lista(respuesta)
                setObras(propias)

                propias.forEach((obra) => {
                    // La lista de obras no trae los estilos: están en el detalle de cada una.
                    api.get("/api/obras/" + obra.id)
                        .then((detalle) => {
                            setEstilosDeObra((previos) => ({ ...previos, [obra.id]: detalle.estilo_ids }))
                        })
                        .catch(() => setEstilosDeObra((previos) => ({ ...previos, [obra.id]: null })))

                    api.get("/api/variantes?obraId=" + obra.id)
                        .then((respuestaVariantes) => {
                            setVariantes((previas) => ({ ...previas, [obra.id]: lista(respuestaVariantes) }))
                        })
                        .catch((e) => {
                            // Una obra sin variantes responde 404: no es un error, es una lista vacía.
                            const valor = e.message === "Error 404" ? [] : null
                            setVariantes((previas) => ({ ...previas, [obra.id]: valor }))
                        })
                })
            })
            .catch((e) => {
                // Sin obras el backend responde 404 (y cliente.js no lee su "mensaje"): no es un error.
                if (e.message !== "Error 404") setError(e.message)
            })
            .finally(() => setCargando(false))
    }, [])

    // Cuántas variantes de una obra no tienen stock. Una sola alcanza para avisarlo.
    const variantesSinStock = (obra) => {
        let cantidad = 0
        variantes[obra.id].forEach((variante) => {
            if (variante.stock_variante === 0) cantidad = cantidad + 1
        })
        return cantidad
    }

    // El back manda los estilos de la obra como ids: los nombres salen de la lista de estilos.
    const nombresDeEstilos = (obra) => {
        const ids = estilosDeObra[obra.id]
        if (!ids) return "—"

        const nombres = []
        ids.forEach((id) => {
            const estilo = estilos.find((e) => e.id === id)
            if (estilo) nombres.push(estilo.nombreEstilo)
        })
        return nombres.length > 0 ? nombres.join(", ") : "—"
    }

    let publicadas = 0
    let conFaltantes = 0
    obras.forEach((obra) => {
        if (obra.en_venta) publicadas = publicadas + 1
        if (Array.isArray(variantes[obra.id]) && variantesSinStock(obra) > 0) conFaltantes = conFaltantes + 1
    })

    // El título y el botón están siempre; solo lo que viene del back espera.
    let cuerpo

    if (cargando) {
        cuerpo = <Estado tipo="cargando" />
    } else if (error) {
        cuerpo = <Estado tipo="error" mensaje={error} />
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
            <table className="tabla">
                <thead>
                    <tr>
                        <th>Obra</th>
                        <th>Estilo</th>
                        <th>Variantes</th>
                        <th>En venta</th>
                        <th></th>
                    </tr>
                </thead>
                {/* Un tbody por obra: así la fila y su detalle van juntas sin envoltorio extra. */}
                {obras.map((obra) => {
                    const cargada = Array.isArray(variantes[obra.id])

                    return (
                        <tbody key={obra.id}>
                            <FilaObra
                                obra={obra}
                                estilos={nombresDeEstilos(obra)}
                                cantidadVariantes={cargada ? variantes[obra.id].length : null}
                                variantesSinStock={cargada ? variantesSinStock(obra) : null}
                                abierta={abiertas[obra.id] === true}
                                onAlternar={() => setAbiertas((previas) => ({ ...previas, [obra.id]: !previas[obra.id] }))}
                            />
                            {abiertas[obra.id] && (
                                <tr>
                                    <td colSpan={5} style={{ background: "var(--canvas)" }}>
                                        {cargada || variantes[obra.id] === null
                                            ? <DetalleObra variantes={variantes[obra.id]} />
                                            : <Estado tipo="cargando" />}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    )
                })}
            </table>
        )
    }

    return (
        <div className="seccion">
            <div className="contenido">
                <div className="entre" style={{ marginBottom: "var(--xl)" }}>
                    <div>
                        <h1 className="headline-lg">Mis obras</h1>
                        {obras.length > 0 && (
                            <p className="body-lg muted">
                                {publicadas} publicadas · {conFaltantes} con variantes sin stock
                            </p>
                        )}
                    </div>
                    <Boton onClick={() => navegar("/panel/obras/nueva")}>Publicar obra</Boton>
                </div>

                {cuerpo}
            </div>
        </div>
    )
}

export default PanelObras
