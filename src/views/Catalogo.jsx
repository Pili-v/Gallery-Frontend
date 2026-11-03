// Catálogo — Área 3 · Catálogo
// Todo lo que viene del backend pasa por Redux: esta pantalla solo despacha acciones y lee el estado.
// Estilos y artistas se piden una sola vez (se comparten con las demás pantallas). Las obras se piden de a una
// PÁGINA (12) cada vez que cambia un filtro o la página; de esas obras se traen sus variantes e imágenes.
// Si el filtro no devuelve nada (lista vacía: 204) o es inválido (400), la pantalla avisa DENTRO de la zona de
// resultados, deja los filtros a la vista y ofrece un botón para quitarlos (no vuelve sola).
// La portada ocupa toda la pantalla al entrar (los filtros quedan debajo); "Ver todas las obras" es un enlace a #obras
// que baja hasta la barra de filtros: lo resuelve el navegador, sin mover el scroll desde el código.

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { useDispatch, useSelector } from "react-redux"
import { fetchEstilos } from "../redux/estilosSlice"
import { fetchArtistas } from "../redux/artistasSlice"
import { cargarObras } from "../redux/obrasSlice"
import TarjetaObra from "../components/TarjetaObra"
import Estado from "../components/Estado"
import Paginador from "../components/Paginador"
import FiltroEstilos from "../components/FiltroEstilos"
import FiltroPrecio from "../components/FiltroPrecio"
import FiltrosAplicados from "../components/FiltrosAplicados"
import InvitacionEncargo from "../components/InvitacionEncargo"
import { pesos, optimizada } from "../api/formato"

// Sin filtros: siempre los mismos valores (no copias), así quitar filtros cuando no hay ninguno no cambia el estado ni
// vuelve a pedir las obras.
const SIN_RANGO = { min: "", max: "" }
const SIN_ESTILOS = []
const POR_PAGINA = 12

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
    const [estiloIds, setEstiloIds] = useState(SIN_ESTILOS) // varios estilos: se muestran las obras de ALGUNO de ellos
    const [precioMin, setPrecioMin] = useState("")
    const [precioMax, setPrecioMax] = useState("")
    const [rango, setRango] = useState(SIN_RANGO)
    const [errorPrecio, setErrorPrecio] = useState("")
    const [orden, setOrden] = useState("recientes")
    const [texto, setTexto] = useState("")
    const [busqueda, setBusqueda] = useState("")

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
        setEstiloIds(SIN_ESTILOS)
        setPrecioMin("")
        setPrecioMax("")
        setRango(SIN_RANGO)
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
            return false
        }
        if (min !== "" && max !== "" && Number(min) > Number(max)) {
            setErrorPrecio("El mínimo no puede ser mayor que el máximo.")
            return false
        }
        setRango({ min, max })
        setPagina(0)
        return true
    }

    // Quitar un filtro desde su etiqueta (debajo de la barra): la búsqueda, un estilo o el rango de precio.
    const quitarFiltro = (clave) => {
        if (clave === "busqueda") {
            setTexto("")
            setBusqueda("")
        } else if (clave === "precio") {
            setPrecioMin("")
            setPrecioMax("")
            setRango(SIN_RANGO)
            setErrorPrecio("")
        } else {
            setEstiloIds(estiloIds.filter((id) => "estilo" + id !== clave))
        }
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

    // Los filtros aplicados, como etiquetas que se quitan de a una
    const filtrosAplicados = []
    if (busqueda !== "") filtrosAplicados.push({ clave: "busqueda", texto: "“" + busqueda + "”" })
    estilos.items
        .filter((e) => estiloIds.includes(e.id))
        .forEach((e) => filtrosAplicados.push({ clave: "estilo" + e.id, texto: e.nombre_estilo }))
    if (rango.min !== "" && rango.max !== "")
        filtrosAplicados.push({ clave: "precio", texto: pesos(Number(rango.min)) + " – " + pesos(Number(rango.max)) })
    else if (rango.min !== "") filtrosAplicados.push({ clave: "precio", texto: "Desde " + pesos(Number(rango.min)) })
    else if (rango.max !== "") filtrosAplicados.push({ clave: "precio", texto: "Hasta " + pesos(Number(rango.max)) })

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
        resultados = <Estado tipo="error" mensaje={aviso.mensaje} accion="Reintentar" onAccion={reintentar} />
    } else if (items.length === 0) {
        resultados = <Estado tipo="vacio" mensaje="Todavía no hay obras publicadas." />
    } else {
        resultados = (
            <div className="grilla-obras cuatro">
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
                    <h1 className="display-hero mt-sm">Obras Originales</h1>
                    <p className="body-lg muted mt-md ancho-texto">
                        Cada pieza se vende en el tamaño y el marco que elijas. Luego tienes la libertad de decidir si
                        lo enviamos a tu domicilio o lo retiras por nuestra sucursal principal.
                    </p>
                    <div className="fila mt-lg">
                        <a href="#obras" className="boton boton-primario" onClick={quitarFiltros}>
                            Ver todas las obras
                        </a>
                        <Link to="/encargos/nuevo" className="boton boton-secundario">
                            Pedir un encargo
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
                <section className="seccion-sm catalogo-obras" id="obras">
                    {/* Barra de filtros: buscador (obra o artista), estilos, precio y orden, en una sola línea. */}
                    <form className="barra-filtros" onSubmit={buscar} role="search">
                        <input
                            className="input barra-filtros-buscador"
                            type="search"
                            placeholder="Buscar por obra o por artista"
                            aria-label="Buscar por obra o por artista"
                            value={texto}
                            onChange={(e) => setTexto(e.target.value)}
                        />
                        <button type="submit" className="boton boton-secundario">
                            Buscar
                        </button>
                        <FiltroEstilos
                            estilos={estilos.items}
                            seleccionados={estiloIds}
                            onCambiar={cambiarEstilos}
                            conEtiquetas={false}
                        />
                        <FiltroPrecio
                            min={precioMin}
                            max={precioMax}
                            aplicado={rango}
                            error={errorPrecio}
                            onCambiarMin={setPrecioMin}
                            onCambiarMax={setPrecioMax}
                            onAplicar={aplicarFiltroPrecio}
                        />
                        <select
                            className="select barra-filtros-orden"
                            value={orden}
                            onChange={(e) => elegirOrden(e.target.value)}
                            aria-label="Ordenar obras"
                        >
                            <option value="recientes">Más recientes</option>
                            <option value="menor-precio">Menor precio</option>
                            <option value="mayor-precio">Mayor precio</option>
                        </select>
                    </form>

                    <FiltrosAplicados
                        cantidad={totalObras + (totalObras === 1 ? " obra" : " obras")}
                        filtros={filtrosAplicados}
                        onQuitar={quitarFiltro}
                        onQuitarTodo={quitarFiltros}
                    />

                    {resultados}

                    {!cargandoObras && !aviso && (
                        <Paginador pagina={pagina} totalPaginas={totalPaginas} onCambiar={setPagina} />
                    )}
                    <InvitacionEncargo />
                </section>
            </div>
        </div>
    )
}
