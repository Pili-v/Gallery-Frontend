// Detalle de obra — Área 3 · Catálogo
// Todo lo que viene del backend pasa por Redux: esta pantalla solo despacha acciones y lee el estado.
// La obra con sus variantes e imágenes sale de obraDetalleSlice; los marcos, los artistas y los estilos se piden una
// sola vez para toda la app (si otra pantalla ya los pidió, no se vuelven a pedir).
// Disposición: la obra (con sus miniaturas) y su descripción a la izquierda; a la derecha, la tarjeta de compra
// (precio, tamaño, marco y botón), que acompaña el scroll.

import { useState, useEffect } from "react"
import { useParams, useNavigate, Link } from "react-router-dom"
import { useDispatch, useSelector } from "react-redux"
import { fetchMarcos } from "../redux/marcosSlice"
import { fetchArtistas } from "../redux/artistasSlice"
import { fetchObraDetalle, agregarAlCarrito } from "../redux/obraDetalleSlice"
import { getUsuario } from "../api/sesion"
import { pesos } from "../api/formato"
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

    const detalle = useSelector((state) => state.obraDetalle)
    const marcosEstado = useSelector((state) => state.marcos)
    const artistasEstado = useSelector((state) => state.artistas)

    // Lo que el usuario eligió (estado de la pantalla, no del backend). Sin elegir, vale el primero de la lista.
    const [varianteElegida, setVarianteElegida] = useState(null)
    // El marco elegido (id). Por defecto la obra va sin marco: el marco es un agregado opcional.
    const [marcoElegido, setMarcoElegido] = useState(SIN_MARCO)

    // Marcos y artistas: una sola vez
    useEffect(() => {
        dispatch(fetchMarcos())
        dispatch(fetchArtistas())
    }, [dispatch])

    // La obra: depende del id, si se navega a otra obra se vuelve a pedir.
    useEffect(() => {
        dispatch(fetchObraDetalle(id))
    }, [dispatch, id])

    // El estado puede ser todavía el de otra obra (el pedido de esta recién sale): se ignora hasta que sea el de esta.
    const esDeEstaObra = detalle.id === id
    const obra = esDeEstaObra ? detalle.obra : null
    const variantes = esDeEstaObra ? detalle.variantes : []
    const imagenes = esDeEstaObra ? detalle.imagenes : []
    const marcos = marcosEstado.items
    const artista = obra ? artistasEstado.items.find((a) => a.id === obra.artista_id) : null

    const varianteSeleccionada = variantes.find((v) => v.id === varianteElegida) ?? variantes[0] ?? null
    const marcoSeleccionado = marcos.find((m) => m.id === marcoElegido) ?? null

    const error = (esDeEstaObra && detalle.error) || marcosEstado.error || artistasEstado.error
    const cargando = !error && (!obra || !marcosEstado.cargado || !artistasEstado.cargado)
    const agregando = detalle.agregando

    // Agregar al carrito es lo único que escribe. Sin sesión, al login.
    const alAgregar = async () => {
        if (!getUsuario()) {
            navegar("/login")
            return
        }
        if (!varianteSeleccionada) return

        const resultado = await dispatch(
            agregarAlCarrito({
                varianteId: varianteSeleccionada.id,
                marcoId: marcoSeleccionado ? marcoSeleccionado.id : null
            })
        )
        if (agregarAlCarrito.fulfilled.match(resultado)) navegar("/carrito")
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
    const descuento = varianteSeleccionada?.porcentaje_descuento ?? 0
    const precioObra = descuento ? precio * (1 - descuento / 100) : precio
    const precioMarco = marcoSeleccionado ? Number(marcoSeleccionado.precio_marco) : 0
    const precioFinal = precioObra + precioMarco
    const sinStock = varianteSeleccionada?.stock_variante === 0

    const sinVariantes = !varianteSeleccionada
    const noDisponible = sinStock || sinVariantes

    let textoBoton = "Agregar al carrito"
    if (sinStock) textoBoton = "Sin stock"
    else if (sinVariantes) textoBoton = "Sin tamaños"
    else if (agregando) textoBoton = "Agregando…"

    let disponibilidad = ""
    if (sinStock) disponibilidad = "Sin stock"
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

                    {detalle.errorCarrito && <div className="campo-error body-sm mt-md">{detalle.errorCarrito}</div>}

                    <div className="mt-lg">
                        <Boton
                            tipo={noDisponible ? "deshabilitado" : "primario"}
                            bloque
                            onClick={noDisponible || agregando ? undefined : alAgregar}
                        >
                            {textoBoton}
                        </Boton>
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
