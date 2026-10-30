// Catálogo — Área 3 · Catálogo
// Todo lo que viene del backend pasa por Redux: esta pantalla solo despacha acciones y lee el estado.
// Estilos y artistas se piden una sola vez (se comparten con las demás pantallas). Las obras se piden de a una
// PÁGINA (9) cada vez que cambia un filtro o la página; de esas obras se traen sus variantes e imágenes.
// Si el filtro no devuelve nada (lista vacía: 204) o es inválido (400), la pantalla avisa DENTRO de la zona de
// resultados, deja los filtros a la vista y ofrece un botón para quitarlos (no vuelve sola).

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { useDispatch, useSelector } from "react-redux"
import { fetchEstilos } from "../redux/estilosSlice"
import { fetchArtistas } from "../redux/artistasSlice"
import { cargarObras } from "../redux/obrasSlice"
import TarjetaObra from "../components/TarjetaObra"
import Estado from "../components/Estado"
import Boton from "../components/Boton"
import Paginador from "../components/Paginador"
import FiltroEstilos from "../components/FiltroEstilos"
import { pesos, optimizada } from "../api/formato"

const SIN_RANGO = { min: "", max: "" }
const POR_PAGINA = 3

export default function Catalogo() {
    const dispatch = useDispatch()

    // Lo que viene del backend (Redux)
    const estilos = useSelector((state) => state.estilos)
    const artistas = useSelector((state) => state.artistas)
    const {
        items: obras,
        extras,
        totalPaginas,
        totalObras,
        primeraObra,
        conFiltros,
        loading: cargandoObras,
        error: errorObras,
        codigo: codigoError
    } = useSelector((state) => state.obras)

    // Paginación
    const [pagina, setPagina] = useState(0)

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

    // Estilos y artistas: una sola vez (si otra pantalla ya los pidió, no se vuelven a pedir)
    useEffect(() => {
        dispatch(fetchEstilos())
        dispatch(fetchArtistas())
    }, [dispatch])

    // Obras: se vuelven a pedir cuando cambia un filtro, el orden o la página
    useEffect(() => {
        dispatch(cargarObras({ pagina, size: POR_PAGINA, orden, estiloIds, rango, busqueda }))
    }, [dispatch, pagina, orden, estiloIds, rango, busqueda])

    const errorApoyo = estilos.error || artistas.error
    const cargandoApoyo = !errorApoyo && !(estilos.cargado && artistas.cargado)

    // Qué avisar en la zona de resultados. conFiltros es el del pedido que se está mostrando.
    // Un 404 o un 400 con filtros es un aviso de filtro; sin filtros, un 404 es el catálogo vacío de verdad.
    let aviso = null // { mensaje (null = sin resultados), deFiltro }
    if (errorObras) {
        const esDeFiltro = codigoError === "404" || codigoError === "400"
        if (conFiltros && esDeFiltro) {
            aviso = { mensaje: codigoError === "404" ? null : errorObras, deFiltro: true }
        } else if (codigoError !== "404") {
            aviso = { mensaje: errorObras, deFiltro: false }
        }
    } else if (!cargandoObras && obras.length === 0 && conFiltros) {
        aviso = { mensaje: null, deFiltro: true }
    }

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

    // Reintentar: si falló lo de apoyo, esos pedidos se repiten; las obras se piden de nuevo con los mismos filtros.
    const reintentar = () => {
        dispatch(fetchEstilos())
        dispatch(fetchArtistas())
        dispatch(cargarObras({ pagina, size: POR_PAGINA, orden, estiloIds, rango, busqueda }))
    }


    // La API devuelve ids, no nombres: la vista los traduce
    const armarItem = (obra) => {
        const extra = extras[obra.id]
        const variante = extra?.variante
        const portada = [...(extra?.imagenes ?? [])].sort((x, y) => (x.orden_imagen ?? 0) - (y.orden_imagen ?? 0))[0]
        const artista = artistas.items.find((a) => a.id === obra.artista_id)
        const estilo = estilos.items.find((e) => (obra.estilo_ids ?? []).includes(e.id))

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
    const cantidadArtistas = artistas.items.length

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
        const nombresEstilos = estilos.items.filter((e) => estiloIds.includes(e.id)).map((e) => e.nombre_estilo)
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
                onAccion={reintentar}
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
                        <FiltroEstilos estilos={estilos.items} seleccionados={estiloIds} onCambiar={cambiarEstilos} />
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