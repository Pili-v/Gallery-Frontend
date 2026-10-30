// Detalle de obra — Área 3 · Catálogo
// Todo lo que viene del backend pasa por Redux: esta pantalla solo despacha acciones y lee el estado.
// La obra con sus variantes e imágenes sale de obraDetalleSlice; los marcos y los artistas se piden una sola
// vez para toda la app (si otra pantalla ya los pidió, no se vuelven a pedir).

import { useState, useEffect } from "react"
import { useParams, useNavigate, Link } from "react-router-dom"
import { useDispatch, useSelector } from "react-redux"
import { fetchMarcos } from "../redux/marcosSlice"
import { fetchArtistas } from "../redux/artistasSlice"
import { fetchObraDetalle, agregarAlCarrito } from "../redux/obraDetalleSlice"
import { getUsuario } from "../api/sesion"
import { pesos } from "../api/formato"
import Badge from "../components/Badge"
import Estado from "../components/Estado"
import Boton from "../components/Boton"
import VisorImagenes from "../components/Visorimagenes"
import ObrasRelacionadas from "../components/ObrasRelacionadas"

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
    const [marcoElegido, setMarcoElegido] = useState(null)

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
    const marcoSeleccionado = marcos.find((m) => m.id === marcoElegido) ?? marcos[0] ?? null

    const error = (esDeEstaObra && detalle.error) || marcosEstado.error || artistasEstado.error
    const cargando = !error && (!obra || !marcosEstado.cargado || !artistasEstado.cargado)
    const agregando = detalle.agregando

    // Agregar al carrito es lo único que escribe. Sin sesión, al login.
    const alAgregar = async () => {
        if (!getUsuario()) {
            navegar("/login")
            return
        }
        if (!varianteSeleccionada || !marcoSeleccionado) return

        const resultado = await dispatch(
            agregarAlCarrito({ varianteId: varianteSeleccionada.id, marcoId: marcoSeleccionado.id })
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
    const sinMarcos = !marcoSeleccionado
    const noDisponible = sinStock || sinVariantes || sinMarcos

    let textoBoton = "AGREGAR AL CARRITO"
    if (sinStock) textoBoton = "SIN STOCK"
    else if (sinVariantes) textoBoton = "SIN TAMAÑOS"
    else if (sinMarcos) textoBoton = "SIN MARCOS"
    else if (agregando) textoBoton = "AGREGANDO..."

    // Imágenes (Cloudinary) en el orden que las cargó el artista. El visor les pide el tamaño justo.
    const fotos = [...imagenes].sort((a, b) => (a.orden_imagen ?? 0) - (b.orden_imagen ?? 0)).map((img) => img.url)

    return (
        <div className="seccion pagina-detalle-obra">
            <div className="contenido dos-columnas">
                <div className="detalle-visual">
                    <VisorImagenes
                        key={obra.id}
                        imagenes={fotos}
                        alt={obra.nombre_obra}
                        atenuada={sinStock}
                        conMarco={!sinMarcos}
                        urlMarco={marcoSeleccionado ? marcoSeleccionado.url : null}
                        colorMarco={marcoSeleccionado ? marcoSeleccionado.color_marco : null}
                    >
                        {sinStock && <Badge tipo="sinstock">Sin stock</Badge>}
                        {!sinStock && descuento > 0 && <Badge tipo="descuento">−{descuento}%</Badge>}
                    </VisorImagenes>
                </div>

                <div className="detalle-info apilado">
                    <div>
                        <h1 className="headline-lg" style={{ margin: "var(--xs) 0 0" }}>
                            {obra.nombre_obra}
                        </h1>

                        <Link
                            to={"/artista/" + obra.artista_id}
                            className="vendedor"
                            style={{ marginTop: "var(--sm)", textDecoration: "none" }}
                        >
                            <span className="avatar">{(artista?.nombre_artistico ?? "A")[0]}</span>
                            <span className="cartela-artist">{artista?.nombre_artistico ?? "Artista"}</span>
                        </Link>
                    </div>

                    <p className="body-lg muted">{obra.descripcion_obra}</p>

                    {variantes.length > 0 && (
                        <div>
                            <span className="cartela-meta" style={{ display: "block", marginBottom: "var(--xs)" }}>
                                TAMAÑO
                            </span>
                            <div className="fila" style={{ flexWrap: "wrap" }}>
                                {variantes.map((v) => (
                                    <button
                                        key={v.id}
                                        className={"chip " + (varianteSeleccionada?.id === v.id ? "activo" : "")}
                                        onClick={() => setVarianteElegida(v.id)}
                                    >
                                        {v.nombre_tamanio}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {marcos.length > 0 && (
                        <div>
                            <span className="cartela-meta" style={{ display: "block", marginBottom: "var(--xs)" }}>
                                MARCO
                            </span>
                            <div className="fila" style={{ flexWrap: "wrap" }}>
                                {marcos.map((m) => (
                                    <button
                                        key={m.id}
                                        className={"chip " + (marcoSeleccionado?.id === m.id ? "activo" : "")}
                                        onClick={() => setMarcoElegido(m.id)}
                                    >
                                        {m.nombre_marco} · {pesos(m.precio_marco)}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="resumen">
                        <div className="resumen-fila">
                            <span>La obra</span>
                            <span>
                                {descuento > 0 && <span className="precio-tachado">{pesos(precio)}</span>}
                                {pesos(precioObra)}
                            </span>
                        </div>
                        <div className="resumen-fila">
                            <span>Marco {marcoSeleccionado?.nombre_marco}</span>
                            <span>{pesos(precioMarco)}</span>
                        </div>
                        <div className="resumen-fila resumen-total">
                            <span className="price-lg">{pesos(precioFinal)}</span>
                            <span className="cartela-meta">
                                {sinVariantes
                                    ? ""
                                    : sinStock
                                      ? "Sin stock"
                                      : varianteSeleccionada.stock_variante + " disponibles"}
                            </span>
                        </div>

                        {detalle.errorCarrito && (
                            <div className="campo-error body-sm" style={{ marginTop: "var(--sm)" }}>
                                {detalle.errorCarrito}
                            </div>
                        )}

                        <div style={{ marginTop: "var(--md)" }}>
                            <Boton
                                tipo={noDisponible ? "deshabilitado" : "primario"}
                                bloque
                                onClick={noDisponible || agregando ? undefined : alAgregar}
                            >
                                {textoBoton}
                            </Boton>
                        </div>
                    </div>
                </div>
            </div>

            {/* Complementos: otras obras del mismo artista y obras de estilos parecidos */}
            <div className="contenido apilado" style={{ marginTop: "var(--xxl)" }}>
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