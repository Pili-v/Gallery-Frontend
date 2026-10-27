// Catálogo — Área 3 · Catálogo
// Estilos y artistas se piden una sola vez. Las obras se piden de a una PÁGINA (12) cada
// vez que cambia un filtro o la página; de esas obras se traen sus variantes e imágenes. Si el filtro no devuelve nada
// (lista vacía: 204) o es inválido (400), la pantalla avisa DENTRO de la zona de resultados, deja
// los filtros a la vista y ofrece un botón para quitarlos (no vuelve sola). Sin async/await y sin tocar el DOM.

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { api, lista } from "../api/cliente"
import TarjetaObra from "../components/TarjetaObra"
import Estado from "../components/Estado"
import Boton from "../components/Boton"
import Paginador from "../components/Paginador"
import FiltroEstilos from "../components/FiltroEstilos"
import { pesos, optimizada } from "../api/formato"

// Una lista vacía ahora llega como 204 (cliente.js la entrega como null y lista(null) = []). Se deja este
// respaldo por si algún endpoint todavía responde 404 para "no hay"; el 404 de una obra/artista inexistente se maneja aparte.
const sin404 = (promesa) =>
    promesa.catch((e) => {
        if (e.status === 404) return []
        throw e
    })

const SIN_RANGO = { min: "", max: "" }
const POR_PAGINA = 9

export default function Catalogo() {
    // Datos de apoyo (livianos, una sola vez)
    const [estilos, setEstilos] = useState([])
    const [artistas, setArtistas] = useState([])
    const [cargandoApoyo, setCargandoApoyo] = useState(true)
    const [errorApoyo, setErrorApoyo] = useState("")

    // Obras de la página actual y lo que se trajo de cada una (variante y fotos), por id de obra
    const [obras, setObras] = useState([])
    const [extras, setExtras] = useState({})
    const [cargandoObras, setCargandoObras] = useState(true)
    const [aviso, setAviso] = useState(null) // { mensaje (null = sin resultados), deFiltro }
    const [primeraObra, setPrimeraObra] = useState(null)
    const [intento, setIntento] = useState(0)

    // Paginación
    const [pagina, setPagina] = useState(0)
    const [totalPaginas, setTotalPaginas] = useState(1)
    const [totalObras, setTotalObras] = useState(0)

    // Filtros: lo que se escribe, y lo que está aplicado
    const [estiloIds, setEstiloIds] = useState([]) // varios estilos: se muestran las obras de ALGUNO de ellos
    const [precioMin, setPrecioMin] = useState("")
    const [precioMax, setPrecioMax] = useState("")
    const [rango, setRango] = useState({ ...SIN_RANGO })
    const [errorPrecio, setErrorPrecio] = useState("")
    const [orden, setOrden] = useState("recientes")
    const [texto, setTexto] = useState("")
    const [busqueda, setBusqueda] = useState("")

    const hayFiltros = estiloIds.length > 0 || rango.min !== "" || rango.max !== "" || busqueda !== ""

    // Estilos y artistas: una sola vez
    useEffect(() => {
        let vigente = true

        Promise.all([sin404(api.get("/api/estilos")), sin404(api.get("/api/artistas"))])
            .then(([susEstilos, susArtistas]) => {
                if (!vigente) return
                setEstilos(lista(susEstilos))
                setArtistas(lista(susArtistas))
            })
            .catch((e) => {
                if (vigente) setErrorApoyo(e.message)
            })
            .finally(() => {
                if (vigente) setCargandoApoyo(false)
            })

        return () => {
            vigente = false
        }
    }, [intento])

    // Obras: se vuelven a pedir cuando cambia un filtro o la página
    useEffect(() => {
        let vigente = true

        const partes = ["page=" + pagina, "size=" + POR_PAGINA, "orden=" + orden]
        if (estiloIds.length > 0) partes.push("estiloId=" + estiloIds.join(","))
        if (rango.min !== "") partes.push("precioMin=" + rango.min)
        if (rango.max !== "") partes.push("precioMax=" + rango.max)
        if (busqueda !== "") partes.push("q=" + encodeURIComponent(busqueda))
        const conFiltros = estiloIds.length > 0 || rango.min !== "" || rango.max !== "" || busqueda !== ""

        setCargandoObras(true)
        setAviso(null)

        api.get("/api/obras?" + partes.join("&"))
            .then((respuesta) => {
                const lasObras = lista(respuesta)
                if (vigente) {
                    setTotalPaginas(respuesta?.totalPages ?? 1)
                    setTotalObras(respuesta?.totalElements ?? lasObras.length)
                }
                // Variante e imágenes solo de las obras de ESTA página: las portadas de toda la página en un
                // solo pedido (portada=true) y las variantes de a una obra.
                const pedirPortadas =
                    lasObras.length > 0
                        ? sin404(
                              api.get(
                                  "/api/imagenes?portada=true&" + lasObras.map((obra) => "obraId=" + obra.id).join("&")
                              )
                          )
                        : Promise.resolve([])

                return Promise.all([
                    pedirPortadas,
                    Promise.all(lasObras.map((obra) => sin404(api.get("/api/variantes?obraId=" + obra.id))))
                ]).then(([susPortadas, susVariantes]) => {
                    const portadas = lista(susPortadas)
                    const datos = lasObras.map((obra, i) => {
                        const lasVariantes = lista(susVariantes[i])
                        return {
                            id: obra.id,
                            variante: lasVariantes.find((v) => v.stock_variante > 0) ?? lasVariantes[0],
                            imagenes: portadas.filter((p) => p.obra_id === obra.id)
                        }
                    })
                    return { lasObras, datos }
                })
            })
            .then(({ lasObras, datos }) => {
                if (!vigente) return
                setExtras((previos) => {
                    const nuevos = { ...previos }
                    datos.forEach((d) => {
                        nuevos[d.id] = d
                    })
                    return nuevos
                })
                setObras(lasObras)
                // Lista vacía (el back responde 204, sin cuerpo): con filtros se avisa DENTRO de los
                // resultados, con el botón para quitarlos; sin filtros se muestra el estado vacío.
                if (lasObras.length === 0 && conFiltros) setAviso({ mensaje: null, deFiltro: true })
                // La obra del hero es la primera del catálogo SIN filtros y en el orden por defecto
                if (!conFiltros && orden === "recientes" && pagina === 0 && lasObras.length > 0)
                    setPrimeraObra(lasObras[0])
            })
            .catch((e) => {
                if (!vigente) return
                setObras([])
                setTotalObras(0)
                const esDeFiltro = e.status === 404 || e.status === 400
                if (conFiltros && esDeFiltro) {
                    setAviso({ mensaje: e.status === 404 ? null : e.message, deFiltro: true })
                } else if (e.status === 404) {
                    setAviso(null) // catálogo vacío de verdad: se muestra el estado vacío
                } else {
                    setAviso({ mensaje: e.message, deFiltro: false })
                }
            })
            .finally(() => {
                if (vigente) setCargandoObras(false)
            })

        return () => {
            vigente = false
        }
    }, [estiloIds, rango, busqueda, orden, pagina, intento])

    // Cualquier cambio de filtro u orden vuelve a la primera página
    const cambiarEstilos = (ids) => {
        setEstiloIds(ids)
        setPagina(0)
    }

    const elegirOrden = (nuevo) => {
        setOrden(nuevo)
        setPagina(0)
    }

    // Buscar por texto (nombre de obra o de artista). Se aplica al enviar el formulario.
    const buscar = (e) => {
        e.preventDefault()
        setBusqueda(texto.trim())
        setPagina(0)
    }

    // El orden no es un filtro: queda como está al quitar filtros.
    const quitarFiltros = () => {
        setEstiloIds([])
        setPrecioMin("")
        setPrecioMax("")
        setRango({ ...SIN_RANGO })
        setErrorPrecio("")
        setTexto("")
        setBusqueda("")
        setAviso(null)
        setPagina(0)
    }

    const aplicarFiltroPrecio = () => {
        setErrorPrecio("")
        const min = precioMin.trim()
        const max = precioMax.trim()

        if ((min !== "" && Number(min) < 0) || (max !== "" && Number(max) < 0)) {
            setErrorPrecio("Los precios no pueden ser negativos.")
            return
        }
        if (min !== "" && max !== "" && Number(min) > Number(max)) {
            setErrorPrecio("El mínimo no puede ser mayor que el máximo.")
            return
        }
        setRango({ min, max })
        setPagina(0)
    }

    const reintentar = () => {
        setErrorApoyo("")
        setCargandoApoyo(true)
        setIntento((n) => n + 1)
    }

    // La API devuelve ids, no nombres: la vista los traduce
    const armarItem = (obra) => {
        const extra = extras[obra.id]
        const variante = extra?.variante
        const portada = [...(extra?.imagenes ?? [])].sort((x, y) => (x.orden_imagen ?? 0) - (y.orden_imagen ?? 0))[0]
        const artista = artistas.find((a) => a.id === obra.artista_id)
        const estilo = estilos.find((e) => (obra.estilo_ids ?? []).includes(e.id))

        return {
            obra: {
                ...obra,
                estilo: estilo ? estilo.nombre_estilo : "",
                artistaId: obra.artista_id,
                nombre_artistico: artista ? artista.nombre_artistico : "Artista"
            },
            variante,
            imagen: portada ? optimizada(portada.url, 600) : null
        }
    }

    // El orden lo resuelve el backend (sobre TODO el catálogo, no solo esta página).
    const items = obras.map(armarItem)

    const destacada = primeraObra ? armarItem(primeraObra) : null
    const cantidadArtistas = artistas.length

    if (cargandoApoyo) {
        return (
            <div className="seccion">
                <div className="contenido">
                    <Estado tipo="cargando" />
                </div>
            </div>
        )
    }
    if (errorApoyo) {
        return (
            <div className="seccion">
                <div className="contenido">
                    <Estado tipo="error" mensaje={errorApoyo} accion="Reintentar" onAccion={reintentar} />
                </div>
            </div>
        )
    }

    // El texto depende de qué filtro dejó la lista vacía: búsqueda, estilo, precio o una combinación.
    const mensajeSinResultados = () => {
        const nombresEstilos = estilos.filter((e) => estiloIds.includes(e.id)).map((e) => e.nombre_estilo)
        const textoEstilos =
            (nombresEstilos.length === 1 ? "del estilo " : "de los estilos ") + nombresEstilos.join(" o ")
        const hayPrecio = rango.min !== "" || rango.max !== ""

        let precioTexto = ""
        if (rango.min !== "" && rango.max !== "")
            precioTexto = "entre " + pesos(Number(rango.min)) + " y " + pesos(Number(rango.max))
        else if (rango.min !== "") precioTexto = "desde " + pesos(Number(rango.min))
        else if (rango.max !== "") precioTexto = "hasta " + pesos(Number(rango.max))

        // Lo que se buscó, más los filtros que se sumaron
        const partes = []
        if (busqueda !== "") partes.push("que coincidan con “" + busqueda + "”")
        if (nombresEstilos.length > 0) partes.push(textoEstilos)
        if (hayPrecio) partes.push(precioTexto)

        if (busqueda === "" && nombresEstilos.length > 0 && !hayPrecio)
            return "Todavía no hay obras " + textoEstilos + "."
        return "No hay obras " + partes.join(" ") + "."
    }

    // Lo que va en la zona de resultados
    let resultados
    if (cargandoObras) {
        resultados = <Estado tipo="cargando" />
    } else if (aviso && aviso.deFiltro) {
        resultados = (
            <Estado
                tipo="vacio"
                mensaje={aviso.mensaje ?? mensajeSinResultados()}
                accion="Quitar filtros"
                onAccion={quitarFiltros}
            />
        )
    } else if (aviso) {
        resultados = (
            <Estado
                tipo="error"
                mensaje={aviso.mensaje}
                accion="Reintentar"
                onAccion={() => setIntento((n) => n + 1)}
            />
        )
    } else if (items.length === 0) {
        resultados = <Estado tipo="vacio" mensaje="Todavía no hay obras publicadas." />
    } else {
        resultados = (
            <div className="grilla-obras">
                {items.map((item) => {
                    const variante = item.variante || {}
                    return (
                        <TarjetaObra
                            key={item.obra.id}
                            id={item.obra.id}
                            nombreObra={item.obra.nombre_obra}
                            estilo={item.obra.estilo}
                            artistaId={item.obra.artistaId}
                            nombreArtistico={item.obra.nombre_artistico}
                            nombreTamanio={variante.nombre_tamanio}
                            precio={variante.precio_variante}
                            porcentajeDescuento={variante.porcentaje_descuento}
                            stock={variante.stock_variante}
                            imagen={item.imagen}
                        />
                    )
                })}
            </div>
        )
    }

    return (
        <div>
            {/* Hero editorial */}
            <section className="hero">
                <div className="hero-texto">
                    <div className="hero-regla" />
                    <p className="catalog-number muted">
                        Actualmente contamos con {cantidadArtistas} Artistas · ENVÍOS A TODO EL PAÍS
                    </p>
                    <h1 className="display-hero" style={{ marginTop: "var(--sm)" }}>
                        Obras Originales
                    </h1>
                    <p className="body-lg muted" style={{ marginTop: "var(--md)", maxWidth: 460 }}>
                        Cada pieza se vende en el tamaño y el marco que elijas. Luego tienes la libertad de decidir si
                        lo enviamos a tu domicilio o lo retiras por nuestra sucursal principal.
                    </p>
                    <div className="fila" style={{ marginTop: "var(--lg)" }}>
                        <Boton tipo="primario" onClick={quitarFiltros}>
                            Ver todas las obras
                        </Boton>
                        <Link to="/encargos/nuevo">
                            <Boton tipo="secundario">Pedir un encargo</Boton>
                        </Link>
                    </div>
                </div>

                {destacada && (
                    <div className="hero-obra">
                        {destacada.imagen && <img src={destacada.imagen} alt={destacada.obra.nombre_obra} />}
                        <div className="hero-pie">
                            <span className="cartela-artist">
                                {destacada.obra.nombre_obra} · {destacada.obra.nombre_artistico}
                            </span>
                        </div>
                    </div>
                )}
            </section>

            <div className="contenido">
                <section className="seccion-sm">
                    {/* Buscador: nombre de la obra o del artista */}
                    <form className="fila" style={{ marginBottom: "var(--lg)" }} onSubmit={buscar} role="search">
                        <input
                            className="input"
                            style={{ maxWidth: 420 }}
                            type="search"
                            placeholder="Buscar por obra o por artista"
                            aria-label="Buscar por obra o por artista"
                            value={texto}
                            onChange={(e) => setTexto(e.target.value)}
                        />
                        <button type="submit" className="boton boton-secundario">
                            Buscar
                        </button>
                    </form>

                    {/* Precio y estilos (salen de la API; se pueden elegir varios): los filtros quedan siempre visibles. */}
                    <div className="fila" style={{ marginBottom: "var(--sm)", flexWrap: "wrap" }}>
                        <span className="cartela-meta">PRECIO</span>
                        <input
                            className="input"
                            style={{ width: 120 }}
                            type="number"
                            min="0"
                            placeholder="Mínimo"
                            value={precioMin}
                            onChange={(e) => setPrecioMin(e.target.value)}
                        />
                        <span className="muted">—</span>
                        <input
                            className="input"
                            style={{ width: 120 }}
                            type="number"
                            min="0"
                            placeholder="Máximo"
                            value={precioMax}
                            onChange={(e) => setPrecioMax(e.target.value)}
                        />
                        <Boton tipo="secundario" onClick={aplicarFiltroPrecio}>
                            Aplicar
                        </Boton>
                        <FiltroEstilos estilos={estilos} seleccionados={estiloIds} onCambiar={cambiarEstilos} />
                        {hayFiltros && (
                            <Boton tipo="secundario" onClick={quitarFiltros}>
                                Quitar filtros
                            </Boton>
                        )}
                    </div>
                    {errorPrecio && (
                        <p className="campo-error body-sm" style={{ marginBottom: "var(--sm)" }}>
                            {errorPrecio}
                        </p>
                    )}

                    <hr className="divisor" />

                    <div className="entre" style={{ margin: "var(--lg) 0" }}>
                        <span className="catalog-number muted">
                            {hayFiltros ? "Resultados" : "Todas las obras"} — {totalObras} resultados
                        </span>
                        <select
                            className="select"
                            style={{ width: 200 }}
                            value={orden}
                            onChange={(e) => elegirOrden(e.target.value)}
                            aria-label="Ordenar obras"
                        >
                            <option value="recientes">Más recientes</option>
                            <option value="menor-precio">Menor precio</option>
                            <option value="mayor-precio">Mayor precio</option>
                        </select>
                    </div>

                    {resultados}

                    {!cargandoObras && !aviso && (
                        <Paginador pagina={pagina} totalPaginas={totalPaginas} onCambiar={setPagina} />
                    )}
                </section>
            </div>

            <section className="seccion-oscura centro">
                <h2 className="headline-md">¿Buscás algo que todavía no existe?</h2>
                <p className="body-lg muted" style={{ marginTop: "var(--sm)" }}>
                    Pedile un encargo a un artista: elegís tamaño, lienzo y marco.
                </p>
                <div style={{ marginTop: "var(--lg)" }}>
                    <Link to="/encargos/nuevo">
                        <Boton tipo="primario">Pedir un encargo</Boton>
                    </Link>
                </div>
            </section>
        </div>
    )
}
