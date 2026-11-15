import { useEffect, useState } from "react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import { useDispatch, useSelector } from "react-redux"
import { fetchArtistas } from "../redux/artistasSlice"
import { fetchTamanios } from "../redux/tamaniosSlice"
import { fetchMarcos } from "../redux/marcosSlice"
import { fetchOpcionesEncargo, crearEncargo } from "../redux/encargosSlice"
import Boton from "../components/Boton"
import CampoFormulario from "../components/CampoFormulario"
import BuscadorArtista from "../components/BuscadorArtista"
import Estado from "../components/Estado"
import { prepararEncargo } from "../api/encargoContrato.js"

// Cómo sigue un encargo después de enviarlo (el mismo flujo que explica el precio en el detalle).
const PASOS = [
    "El artista lo revisa y propone un precio",
    "Lo aceptás y empieza a pintarlo",
    "Lo pagás cuando está terminado"
]

// Disposición: el formulario a la izquierda y, a la derecha, una tarjeta fija con el pedido como va quedando, cómo sigue
// y el botón de enviar. Todo es un solo formulario, así el botón de la tarjeta envía los campos de la izquierda.
// Las opciones salen del store, una sola vez para toda la app: artistas, tamaños y marcos (datos de referencia) y los
// tipos de pintura y de lienzo (encargosSlice). Lo escrito, "enviando…" y los errores son de esta pantalla.

const inicial = {
    artista_id: "",
    tamanio_id: "",
    marco_id: "",
    tipo_pintura: "",
    tipo_lienzo: "",
    descripcion_encargo: ""
}

export default function EncargoNuevo() {
    const [parametros] = useSearchParams()
    const dispatch = useDispatch()
    // Lo que se escribió. El artista del enlace (?artistaId=) solo vale si acepta encargos (ver formulario, abajo).
    const [escrito, setFormulario] = useState(() => ({
        ...inicial,
        artista_id: parametros.get("artistaId") || ""
    }))
    const [enviando, setEnviando] = useState(false)

    const artistasEstado = useSelector((state) => state.artistas)
    const tamaniosEstado = useSelector((state) => state.tamanios)
    const marcosEstado = useSelector((state) => state.marcos)
    const opciones = useSelector((state) => state.encargos.opciones)

    // Las opciones: una sola vez para toda la app (si otra pantalla ya las pidió, no se vuelven a pedir).
    const pedirOpciones = () => {
        dispatch(fetchArtistas())
        dispatch(fetchTamanios())
        dispatch(fetchMarcos())
        dispatch(fetchOpcionesEncargo())
    }
    useEffect(() => {
        dispatch(fetchArtistas())
        dispatch(fetchTamanios())
        dispatch(fetchMarcos())
        dispatch(fetchOpcionesEncargo())
    }, [dispatch])

    const artistas = artistasEstado.items
        .filter((item) => item.acepta_encargos)
        .map((item) => ({ id: item.id, nombre: item.nombre_artistico }))
    const tamanios = tamaniosEstado.items.map((item) => ({ id: item.id, nombre: item.nombre_tamanio }))
    const marcos = marcosEstado.items.map((item) => ({ id: item.id, nombre: item.nombre_marco }))
    // Los tipos de pintura y de lienzo los define el back (son sus enums): acá solo se muestran.
    const pinturas = opciones.tiposPintura
    const lienzos = opciones.tiposLienzo

    const fallo = artistasEstado.error || tamaniosEstado.error || marcosEstado.error || opciones.error
    const errorCarga = fallo ? `No se pudieron cargar las opciones del pedido: ${fallo}` : ""
    const cargando =
        !errorCarga && !(artistasEstado.cargado && tamaniosEstado.cargado && marcosEstado.cargado && opciones.cargadas)

    // El artista elegido tiene que estar entre los que aceptan encargos; si no, queda sin elegir.
    const formulario = {
        ...escrito,
        artista_id: artistas.some((item) => String(item.id) === escrito.artista_id) ? escrito.artista_id : ""
    }

    const [errores, setErrores] = useState({})
    const [errorGuardado, setErrorGuardado] = useState("")
    const navigate = useNavigate()
    const lista = "/encargos"

    function cambiar(evento) {
        const { name, value } = evento.target
        setFormulario((actual) => ({ ...actual, [name]: value }))
        setErrores((actual) => ({ ...actual, [name]: undefined }))
        setErrorGuardado("")
    }

    function enviar(evento) {
        evento.preventDefault()
        if (enviando || cargando || errorCarga) return
        const resultado = prepararEncargo(formulario, pinturas, lienzos)
        setErrores(resultado.errores)
        if (!resultado.datos) {
            evento.currentTarget.elements.namedItem(Object.keys(resultado.errores)[0])?.focus()
            return
        }
        setEnviando(true)
        setErrorGuardado("")
        dispatch(crearEncargo(resultado.datos)).then((respuesta) => {
            setEnviando(false)
            if (respuesta.error) {
                setErrorGuardado(respuesta.error.message || "No se pudo enviar el pedido. Podés reintentar.")
            } else {
                navigate(lista, { state: { encargoCreado: respuesta.payload.id } })
            }
        })
    }

    // El pedido como va quedando, con los nombres de lo elegido (vacío si todavía no se eligió).
    const nombreDe = (opciones, clave, valor) => {
        const elegida = opciones.find((opcion) => String(opcion[clave]) === String(valor))
        return elegida ? elegida.nombre : ""
    }
    const elegido = {
        artista: nombreDe(artistas, "id", formulario.artista_id),
        pintura: nombreDe(pinturas, "valor", formulario.tipo_pintura),
        lienzo: nombreDe(lienzos, "valor", formulario.tipo_lienzo),
        tamanio: nombreDe(tamanios, "id", formulario.tamanio_id),
        marco: nombreDe(marcos, "id", formulario.marco_id)
    }
    let tituloPedido = "Elegí la pintura, el lienzo y el tamaño"
    if (elegido.pintura && elegido.lienzo) {
        tituloPedido = elegido.pintura + " sobre " + elegido.lienzo.toLowerCase()
        if (elegido.tamanio) tituloPedido = tituloPedido + ", " + elegido.tamanio
    }
    const faltanOpciones = !artistas.length || !tamanios.length || !marcos.length || !pinturas.length || !lienzos.length

    function propiedades(nombre, etiqueta) {
        return {
            name: nombre,
            etiqueta,
            value: formulario[nombre],
            onChange: cambiar,
            required: true,
            error: errores[nombre],
            "aria-label": etiqueta,
            "aria-invalid": Boolean(errores[nombre])
        }
    }

    return (
        <main className="seccion encargo-nuevo">
            <div className="contenido">
                <Link className="encargo-volver body-sm" to={lista}>
                    ← Volver a encargos
                </Link>
                {/* El título no se ve en escritorio (la tarjeta del pedido ya dice qué es); sí en celular y para lectores. */}
                <h1 className="headline-lg titulo-oculto">Pedir un encargo</h1>
                <p className="body-lg muted titulo-oculto">Contale al artista qué cuadro te gustaría recibir.</p>
                {cargando && <Estado tipo="cargando" />}
                {errorCarga && (
                    <div className="apilado">
                        <Estado tipo="error" mensaje={errorCarga} />
                        <Boton onClick={pedirOpciones}>Reintentar</Boton>
                    </div>
                )}
                {!cargando && !errorCarga && faltanOpciones && (
                    <Estado
                        tipo="vacio"
                        mensaje="Faltan artistas disponibles, tamaños o marcos para poder pedir un encargo."
                    />
                )}
                <form className="encargo-pedido" onSubmit={enviar} noValidate>
                    <div className="cartela encargo-formulario">
                        <p className="body-sm muted encargo-obligatorios">Todos los campos son obligatorios.</p>
                        <BuscadorArtista
                            artistas={artistas}
                            value={formulario.artista_id}
                            error={errores.artista_id}
                            disabled={cargando || Boolean(errorCarga) || enviando}
                            onChange={(value) => cambiar({ target: { name: "artista_id", value } })}
                        />
                        <div className="fila-campos">
                            <CampoFormulario tipo="select" {...propiedades("tipo_pintura", "Tipo de pintura")}>
                                <option value="">Seleccioná una pintura</option>
                                {pinturas.map((opcion) => (
                                    <option key={opcion.valor} value={opcion.valor}>
                                        {opcion.nombre}
                                    </option>
                                ))}
                            </CampoFormulario>
                            <CampoFormulario tipo="select" {...propiedades("tipo_lienzo", "Tipo de lienzo")}>
                                <option value="">Seleccioná un lienzo</option>
                                {lienzos.map((opcion) => (
                                    <option key={opcion.valor} value={opcion.valor}>
                                        {opcion.nombre}
                                    </option>
                                ))}
                            </CampoFormulario>
                        </div>
                        <div className="fila-campos">
                            <CampoFormulario tipo="select" {...propiedades("tamanio_id", "Tamaño")}>
                                <option value="">Seleccioná un tamaño</option>
                                {tamanios.map((opcion) => (
                                    <option key={opcion.id} value={opcion.id}>
                                        {opcion.nombre}
                                    </option>
                                ))}
                            </CampoFormulario>
                            <CampoFormulario tipo="select" {...propiedades("marco_id", "Marco")}>
                                <option value="">Seleccioná un marco</option>
                                {marcos.map((opcion) => (
                                    <option key={opcion.id} value={opcion.id}>
                                        {opcion.nombre}
                                    </option>
                                ))}
                            </CampoFormulario>
                        </div>
                        <CampoFormulario
                            textarea
                            rows={5}
                            maxLength={255}
                            placeholder="Por ejemplo: un paisaje con tonos verdes y ocres para un living con luz de tarde."
                            aria-describedby="descripcion-ayuda"
                            {...propiedades("descripcion_encargo", "Qué te gustaría")}
                        />
                        <p id="descripcion-ayuda" className="body-sm muted encargo-contador">
                            Describí el tema, los colores y el estilo. {formulario.descripcion_encargo.length}/255
                            caracteres.
                        </p>
                    </div>

                    <aside className="cartela pad-lg pegado-arriba encargo-resumen">
                        <p className="catalog-number muted">Tu pedido</p>
                        <p className={"title-work encargo-resumen-titulo" + (elegido.pintura ? "" : " muted")}>
                            {tituloPedido}
                        </p>
                        {(elegido.artista || elegido.marco) && (
                            <p className="body-sm muted">
                                {[elegido.artista && "Para " + elegido.artista, elegido.marco]
                                    .filter(Boolean)
                                    .join(" · ")}
                            </p>
                        )}

                        <ol className="encargo-pasos">
                            {PASOS.map((paso, indice) => (
                                <li key={paso}>
                                    <span className="encargo-pasos-numero">{indice + 1}</span>
                                    {paso}
                                </li>
                            ))}
                        </ol>

                        <div aria-live="polite">
                            {Object.values(errores).some(Boolean) && (
                                <p className="campo-error body-sm">Revisá los campos indicados antes de enviar.</p>
                            )}
                            {errorGuardado && <Estado tipo="error" mensaje={errorGuardado} />}
                        </div>
                        <Boton
                            type="submit"
                            bloque
                            disabled={enviando || cargando || Boolean(errorCarga) || faltanOpciones}
                        >
                            {enviando ? "Enviando..." : "Enviar el pedido"}
                        </Boton>
                    </aside>
                </form>
            </div>
        </main>
    )
}
