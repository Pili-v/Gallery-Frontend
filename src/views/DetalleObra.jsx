// Detalle de obra — Área 3 · Catálogo
// Todo lo que viene del backend pasa por Redux: esta pantalla solo despacha acciones y lee el estado.
// La obra (con sus variantes y su galería) se lee de obrasSlice, donde está una sola vez para toda la app. Se pide
// solo si no está guardada: si vino en una tarjeta del catálogo, ya está completa (regla de negocio del catálogo en
// docs/datos-con-redux.md). Los marcos y los artistas se piden una sola vez (si otra pantalla ya los pidió, no se vuelven
// a pedir). El error del pedido y si se está agregando al carrito son cosa de esta pantalla: quedan en su estado.
// Disposición: la obra (con sus miniaturas) y su descripción a la izquierda; a la derecha, la tarjeta de compra
// (precio, tamaño, marco y botón), que acompaña el scroll.
// Abre en el tamaño que mostraba la tarjeta (?variante=id en el enlace) o, si no viene, en el más barato con stock: la
// misma regla que la tarjeta. El descuento se aplica solo si está vigente, como lo cobra el back.

import { useState, useEffect } from "react"
import { useParams, useNavigate, useSearchParams, Link } from "react-router-dom"
import { useDispatch, useSelector } from "react-redux"
import { fetchMarcos } from "../redux/marcosSlice"
import { fetchArtistas } from "../redux/artistasSlice"
import { fetchObra } from "../redux/obrasSlice"
import { agregarAlCarrito, cambiarCantidad, quitarItem } from "../redux/carritoSlice"
import { pesos } from "../api/formato"
import { descuentoVigente, varianteParaMostrar } from "../api/precio"
import { colorDeMarco } from "../api/Coloresmarco"
import Badge from "../components/Badge"
import Estado from "../components/Estado"
import Boton from "../components/Boton"
import VisorImagenes from "../components/Visorimagenes"
import ObrasRelacionadas from "../components/ObrasRelacionadas"

// El valor de "sin marco" en la elección del marco (los marcos reales se eligen por su id).
const SIN_MARCO = "sin-marco"

// La key hace que, al pasar de una obra a otra, la pantalla arranque de cero (vuelve al primer tamaño y marco).
export default function DetalleObra() {
    const { id } = useParams()
    return <DetalleDeObra key={id} id={id} />
}

function DetalleDeObra({ id }) {
    const dispatch = useDispatch()
    const navegar = useNavigate()
    const [parametros] = useSearchParams()

    const usuario = useSelector((state) => state.sesion.usuario)
    const obraGuardada = useSelector((state) => state.obras.porId[id])
    const marcosEstado = useSelector((state) => state.marcos)
    const artistasEstado = useSelector((state) => state.artistas)
    const { carrito, items: itemsCarrito } = useSelector((state) => state.carrito)

    // Lo que el usuario eligió (estado de la pantalla, no del backend). Sin elegir, vale el tamaño con el que abre.
    const [varianteElegida, setVarianteElegida] = useState(null)
    // El marco elegido (id). Por defecto la obra va sin marco: el marco es un agregado opcional.
    const [marcoElegido, setMarcoElegido] = useState(SIN_MARCO)
    // Si el pedido de la obra falló (por ejemplo, la obra ya no existe).
    const [errorObra, setErrorObra] = useState(null)
    // Agregar al carrito
    const [agregando, setAgregando] = useState(false)
    const [errorCarrito, setErrorCarrito] = useState(null)

    // Marcos y artistas: una sola vez
    useEffect(() => {
        dispatch(fetchMarcos())
        dispatch(fetchArtistas())
    }, [dispatch])

    // La obra: si ya está guardada y al día, el thunk no hace nada (no se pide ni se despacha). Si no se pidió por eso
    // (meta.condition), no es un error.
    useEffect(() => {
        dispatch(fetchObra({ id })).then((resultado) => {
            if (resultado.error && !resultado.meta.condition) setErrorObra(resultado.error.message)
        })
    }, [dispatch, id])

    // Los datos de ESTA obra, cuando están.
    const obra = obraGuardada ?? null
    const variantes = obra ? obra.variantes : []
    const imagenes = obra ? obra.imagenes : []
    const marcos = marcosEstado.items
    const artista = obra ? artistasEstado.items.find((a) => a.id === obra.artista_id) : null

    // El tamaño con el que abre: el del enlace de la tarjeta si es de esta obra; si no, el más barato con stock.
    const varianteDelEnlace = variantes.find((v) => String(v.id) === parametros.get("variante"))
    const variantePorDefecto = varianteDelEnlace ?? varianteParaMostrar(variantes)
    const varianteSeleccionada = variantes.find((v) => v.id === varianteElegida) ?? variantePorDefecto ?? null
    const marcoSeleccionado = marcos.find((m) => m.id === marcoElegido) ?? null

    const error = errorObra || marcosEstado.error || artistasEstado.error
    const cargando = !error && (!obra || !marcosEstado.cargado || !artistasEstado.cargado)

    // Si esta obra (con este tamaño y marco) ya está en el carrito, se muestra su cantidad en vez de "Agregar".
    const enCarrito = varianteSeleccionada
        ? itemsCarrito.find(
              (item) =>
                  item.variante_id === varianteSeleccionada.id &&
                  (item.marco_id ?? null) === (marcoSeleccionado ? marcoSeleccionado.id : null)
          )
        : null

    // Sumar o restar una unidad del ítem que ya está en el carrito. Al llegar a 0 el ítem se quita.
    const alCambiarCantidad = async (nuevaCantidad) => {
        setAgregando(true)
        setErrorCarrito(null)
        const accion =
            nuevaCantidad < 1
                ? quitarItem(enCarrito.id)
                : cambiarCantidad({
                      carritoId: carrito.id,
                      itemId: enCarrito.id,
                      varianteId: enCarrito.variante_id,
                      marcoId: enCarrito.marco_id,
                      cantidad: nuevaCantidad
                  })
        const resultado = await dispatch(accion)
        setAgregando(false)
        if (resultado.error) setErrorCarrito(resultado.error.message)
    }

    // Agregar al carrito es lo único que escribe. Sin sesión, al login.
    const alAgregar = async () => {
        if (!usuario) {
            navegar("/login")
            return
        }
        if (!varianteSeleccionada) return

        setAgregando(true)
        setErrorCarrito(null)
        const resultado = await dispatch(
            agregarAlCarrito({
                varianteId: varianteSeleccionada.id,
                marcoId: marcoSeleccionado ? marcoSeleccionado.id : null
            })
        )
        setAgregando(false)
        if (resultado.error) setErrorCarrito(resultado.error.message)
    }

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

    const precio = varianteSeleccionada?.precio_variante ?? 0
    const descuento = varianteSeleccionada ? descuentoVigente(varianteSeleccionada) : 0
    const precioObra = descuento ? precio * (1 - descuento / 100) : precio
    const precioMarco = marcoSeleccionado ? Number(marcoSeleccionado.precio_marco) : 0
    const precioFinal = precioObra + precioMarco
    const sinStock = varianteSeleccionada?.stock_variante === 0

    const sinVariantes = !varianteSeleccionada
    // El back devuelve también las obras dadas de baja o sacadas de la venta (una compra vieja puede necesitarlas):
    // se pueden ver, pero no comprar.
    const fueraDeVenta = Boolean(obra) && (obra.eliminada || !obra.en_venta)
    const noDisponible = fueraDeVenta || sinStock || sinVariantes

    let textoBoton = "Agregar al carrito"
    if (fueraDeVenta) textoBoton = "No disponible"
    else if (sinStock) textoBoton = "Sin stock"
    else if (sinVariantes) textoBoton = "Sin tamaños"
    else if (agregando) textoBoton = "Agregando…"

    let disponibilidad = ""
    if (fueraDeVenta) disponibilidad = obra.eliminada ? "Obra dada de baja" : "Fuera de venta"
    else if (sinStock) disponibilidad = "Sin stock"
    else if (varianteSeleccionada && varianteSeleccionada.stock_variante === 1) disponibilidad = "Última unidad"
    else if (varianteSeleccionada) disponibilidad = varianteSeleccionada.stock_variante + " disponibles"

    // Imágenes (Cloudinary) en el orden que las cargó el artista. El visor les pide el tamaño justo.
    const fotos = [...imagenes].sort((a, b) => (a.orden_imagen ?? 0) - (b.orden_imagen ?? 0)).map((img) => img.url)

    return (
        <div className="seccion pagina-detalle-obra">
            <div className="contenido dos-columnas detalle-obra">
                <div className="detalle-visual">
                    <VisorImagenes
                        key={obra.id}
                        imagenes={fotos}
                        alt={obra.nombre_obra}
                        conMarco={marcoSeleccionado !== null}
                        urlMarco={marcoSeleccionado ? marcoSeleccionado.url : null}
                        colorMarco={marcoSeleccionado ? marcoSeleccionado.color_marco : null}
                    >
                        {sinStock && <Badge tipo="sinstock">Sin stock</Badge>}
                        {!sinStock && descuento > 0 && <Badge tipo="descuento">−{descuento}%</Badge>}
                    </VisorImagenes>

                    {/* Debajo de la obra: así, aunque sea larga, no agranda la tarjeta de compra. */}
                    {obra.descripcion_obra && (
                        <section className="detalle-descripcion">
                            <h2 className="catalog-number muted">Sobre la obra</h2>
                            <p className="body-lg">{obra.descripcion_obra}</p>
                        </section>
                    )}
                </div>

                {/* La compra: acompaña el scroll para que el botón quede siempre a la vista. */}
                <aside className="cartela pad-lg pegado-arriba detalle-compra">
                    <h1 className="headline-lg titulo-obra">{obra.nombre_obra}</h1>
                    <Link to={"/artista/" + obra.artista_id} className="vendedor mt-sm sin-subrayado">
                        <span className="avatar">{(artista?.nombre_artistico ?? "A")[0]}</span>
                        <span className="cartela-artist">{artista?.nombre_artistico ?? "Artista"}</span>
                    </Link>

                    <div className="detalle-precio">
                        <span className="detalle-precio-total">{pesos(precioFinal)}</span>
                        <span className="cartela-meta">
                            Obra {descuento > 0 && <span className="precio-tachado">{pesos(precio)}</span>}
                            {pesos(precioObra)}
                            {marcoSeleccionado && " + marco " + pesos(precioMarco)}
                            {disponibilidad && " · " + disponibilidad}
                        </span>
                    </div>

                    {variantes.length > 0 && (
                        <div className="detalle-opcion">
                            <span className="cartela-meta">
                                Tamaño: <b>{varianteSeleccionada ? varianteSeleccionada.nombre_tamanio : ""}</b>
                            </span>
                            <div className="fila envolver gap-xs">
                                {variantes.map((v) => (
                                    <button
                                        key={v.id}
                                        type="button"
                                        className={"chip " + (varianteSeleccionada?.id === v.id ? "activo" : "")}
                                        aria-pressed={varianteSeleccionada?.id === v.id}
                                        onClick={() => setVarianteElegida(v.id)}
                                    >
                                        {v.nombre_tamanio}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {marcos.length > 0 && (
                        <div className="detalle-opcion">
                            <span className="cartela-meta">
                                Marco: <b>{marcoSeleccionado ? marcoSeleccionado.nombre_marco : "Sin marco"}</b>
                            </span>
                            <div className="fila envolver gap-xs">
                                <button
                                    type="button"
                                    className={"chip chip-marco " + (marcoSeleccionado === null ? "activo" : "")}
                                    aria-pressed={marcoSeleccionado === null}
                                    onClick={() => setMarcoElegido(SIN_MARCO)}
                                >
                                    <span className="muestra-marco vacia" />
                                    Sin marco
                                </button>
                                {marcos.map((m) => (
                                    <button
                                        key={m.id}
                                        type="button"
                                        className={
                                            "chip chip-marco " + (marcoSeleccionado?.id === m.id ? "activo" : "")
                                        }
                                        aria-pressed={marcoSeleccionado?.id === m.id}
                                        aria-label={m.nombre_marco + ", suma " + pesos(m.precio_marco)}
                                        title={m.nombre_marco}
                                        onClick={() => setMarcoElegido(m.id)}
                                    >
                                        {/* La muestra: un marquito del color del marco (es un dato, no un estilo fijo). */}
                                        <span
                                            className="muestra-marco"
                                            style={{ borderColor: colorDeMarco(m.color_marco) }}
                                        />
                                        +{pesos(m.precio_marco)}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {errorCarrito && <div className="campo-error body-sm mt-md">{errorCarrito}</div>}

                    <div className="mt-lg">
                        {enCarrito && !noDisponible ? (
                            <div className="apilado gap-sm">
                                <div className="detalle-cantidad">
                                    <button
                                        disabled={agregando}
                                        aria-label={
                                            enCarrito.cantidad === 1 ? "Quitar del carrito" : "Restar una unidad"
                                        }
                                        onClick={() => alCambiarCantidad(enCarrito.cantidad - 1)}
                                    >
                                        −
                                    </button>
                                    <span>
                                        <b>{enCarrito.cantidad}</b> en tu carrito
                                    </span>
                                    <button
                                        disabled={
                                            agregando || enCarrito.cantidad >= varianteSeleccionada.stock_variante
                                        }
                                        aria-label="Sumar una unidad"
                                        onClick={() => alCambiarCantidad(enCarrito.cantidad + 1)}
                                    >
                                        +
                                    </button>
                                </div>
                                <Link to="/carrito" className="boton boton-secundario boton-bloque">
                                    Ver carrito
                                </Link>
                            </div>
                        ) : (
                            <Boton
                                tipo={noDisponible ? "deshabilitado" : "primario"}
                                bloque
                                onClick={noDisponible || agregando ? undefined : alAgregar}
                            >
                                {textoBoton}
                            </Boton>
                        )}
                    </div>
                    <p className="cartela-meta mt-sm centro">Envío a domicilio o retiro en el local</p>
                </aside>
            </div>

            {/* Complementos: otras obras del mismo artista y obras de estilos parecidos */}
            <div className="contenido apilado mt-xxl">
                <ObrasRelacionadas
                    key={"artista-" + obra.id}
                    titulo={"Más obras de " + (artista?.nombre_artistico ?? "este artista")}
                    consultas={["artistaId=" + obra.artista_id]}
                    excluirId={obra.id}
                />
                <ObrasRelacionadas
                    key={"estilo-" + obra.id}
                    titulo="Obras parecidas"
                    consultas={(obra.estilo_ids ?? []).map((idEstilo) => "estiloId=" + idEstilo)}
                    excluirId={obra.id}
                    excluirArtistaId={obra.artista_id}
                />
            </div>
        </div>
    )
}
