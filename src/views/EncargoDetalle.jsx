import { api, lista } from "../api/cliente"
import { getUsuario, getPerfilArtista } from "../api/sesion"
import { permisosEncargo } from "../api/encargoSesion.js"
import { useEffect, useRef, useState } from "react"
import { Link, useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom"
import AcuerdoPrecio from "../components/AcuerdoPrecio"
import Boton from "../components/Boton"
import Confirmacion from "../components/Confirmacion"
import CampoFormulario from "../components/CampoFormulario"
import Estado from "../components/Estado"
import EstadoEncargo from "../components/EstadoEncargo"
import { prepararMensaje, prepararCambioEstado } from "../api/encargoDetalleContrato.js"
import "./encargoDetalle.css"

// El back manda los mensajes del más nuevo al más viejo (para poder cargar la conversación desde lo último), igual
// para el cliente y para el artista. Acá se leen de arriba hacia abajo, del más viejo al más nuevo, y los que se
// envían se agregan al final: por eso se ordenan por fecha (y por id si coinciden) al cargarlos.
const enOrdenDeLectura = (mensajes) =>
    [...mensajes].sort((a, b) => new Date(a.fecha_creacion_mensaje) - new Date(b.fecha_creacion_mensaje) || a.id - b.id)

// Los mensajes del encargo. Si todavía no tiene ninguno el back responde 204 (sin cuerpo): lista(null) es [].
const pedirMensajes = (id) => api.get(`/api/encargos/${id}/mensajes`)

// Cada cuánto se vuelve a pedir el encargo mientras la pantalla está abierta (en milisegundos). Con 3 segundos
// la conversación se siente casi inmediata y son dos pedidos livianos por vez; si el back tarda, no se acumulan.
const CADA_CUANTO_SE_ACTUALIZA = 3000

export default function EncargoDetalle() {
    const { id } = useParams()
    const [parametros] = useSearchParams()
    const recibidos = parametros.has("recibidos")
    const base = "/encargos"
    // La URL solo cambia el regreso al listado; los permisos reales salen de la sesión.
    return <Detalle key={`${base}-${id}-${recibidos}`} id={id} recibidos={recibidos} base={base} />
}

function Detalle({ id, recibidos, base }) {
    const [datos, setDatos] = useState({ encargo: null, error: "" })
    const [cargando, setCargando] = useState(true)
    const [intento, setIntento] = useState(0)
    const [enviando, setEnviando] = useState(false)
    const [guardando, setGuardando] = useState(false)
    const usuario = getUsuario()
    const esAdmin = usuario?.rol_usuario === "ADMIN"
    const perfilArtista = getPerfilArtista()

    useEffect(() => {
        let activo = true
        let pedido
        api.get(`/api/encargos/${id}`)
            .then((respuesta) => {
                if (!respuesta) throw new Error("No se pudo cargar el encargo.")
                pedido = respuesta
                if (esAdmin) return []
                return pedirMensajes(id)
            })
            .then((mensajes) => {
                if (activo) setDatos({ encargo: { ...pedido, mensajes: enOrdenDeLectura(lista(mensajes)) }, error: "" })
            })
            .catch((error) => {
                if (activo) setDatos({ encargo: null, error: error.message })
            })
            .finally(() => {
                if (activo) setCargando(false)
            })
        return () => {
            activo = false
        }
    }, [id, intento, esAdmin])

    function reintentar() {
        setCargando(true)
        setIntento(intento + 1)
    }
    const [mensaje, setMensaje] = useState("")
    const [nuevoEstado, setNuevoEstado] = useState("")
    const [errorMensaje, setErrorMensaje] = useState("")
    const [errorEstado, setErrorEstado] = useState("")
    const [aviso, setAviso] = useState("")
    const navegar = useNavigate()
    const ubicacion = useLocation()
    // El acuerdo de precio tiene su propio pedido en curso, falla y confirmación (viene del pago si se acaba de pagar).
    const [trabajando, setTrabajando] = useState(false)
    const [errorPrecio, setErrorPrecio] = useState("")
    const [avisoPrecio, setAvisoPrecio] = useState(
        ubicacion.state?.pagado ? "Pago confirmado: el encargo quedó pagado." : ""
    )
    const [cancelando, setCancelando] = useState(false)
    const campoMensaje = useRef(null)
    const volver = `${base}${recibidos ? "?recibidos" : ""}`
    const { encargo, error } = datos
    const permisos = permisosEncargo(encargo, usuario, perfilArtista)
    const permitido = permisos.puedeVer

    // El estado, el precio y los mensajes los cambian el cliente y el artista desde sus pantallas: mientras esta
    // está abierta se vuelven a pedir cada tanto, sin mostrar "cargando" ni tocar lo que se está escribiendo.
    // Solo con la pestaña a la vista, y en pausa mientras se envía o se guarda algo (así una respuesta vieja no
    // pisa lo que se acaba de hacer). Si un pedido falla se ignora: el próximo lo reintenta.
    const ocupado = enviando || guardando || trabajando
    const hayEncargo = Boolean(datos.encargo)
    useEffect(() => {
        if (!hayEncargo || ocupado) return
        let activo = true
        let enCurso = false
        const intervalo = setInterval(() => {
            if (enCurso || document.visibilityState !== "visible") return
            enCurso = true
            let pedido
            api.get(`/api/encargos/${id}`)
                .then((respuesta) => {
                    pedido = respuesta
                    return pedido && !esAdmin ? pedirMensajes(id) : []
                })
                .then((mensajes) => {
                    // Un encargo sin mensajes responde vacío: eso es una lista vacía, no una falla.
                    if (!activo || !pedido) return
                    setDatos((actual) => ({
                        ...actual,
                        encargo: { ...pedido, mensajes: enOrdenDeLectura(lista(mensajes)) }
                    }))
                })
                .catch(() => {})
                .finally(() => {
                    enCurso = false
                })
        }, CADA_CUANTO_SE_ACTUALIZA)
        return () => {
            activo = false
            clearInterval(intervalo)
        }
    }, [id, esAdmin, hayEncargo, ocupado])

    function enviar(evento) {
        evento.preventDefault()
        if (enviando) return
        setAviso("")
        let cuerpo
        try {
            cuerpo = prepararMensaje(encargo.id, mensaje)
        } catch (error) {
            setErrorMensaje(error.message)
            return
        }
        setEnviando(true)
        setErrorMensaje("")
        api.post("/api/mensajes", cuerpo)
            .then((respuesta) => {
                if (!respuesta) return
                setDatos((actual) => ({
                    ...actual,
                    encargo: { ...actual.encargo, mensajes: [...actual.encargo.mensajes, respuesta] }
                }))
                setMensaje("")
                setAviso("Mensaje enviado.")
            })
            .catch((error) => setErrorMensaje(error.message))
            .finally(() => {
                setEnviando(false)
                campoMensaje.current?.focus()
            })
    }

    function guardarEstado(evento) {
        evento.preventDefault()
        if (guardando) return
        setAviso("")
        let cuerpo
        try {
            cuerpo = prepararCambioEstado(encargo.estados_siguientes, nuevoEstado)
        } catch (error) {
            setErrorEstado(error.message)
            return
        }
        setGuardando(true)
        setErrorEstado("")
        api.patch(`/api/encargos/${encargo.id}/estado`, cuerpo)
            .then((respuesta) => {
                if (!respuesta) return
                setDatos((actual) => ({ ...actual, encargo: { ...respuesta, mensajes: actual.encargo.mensajes } }))
                setNuevoEstado("")
                setAviso("Estado actualizado.")
            })
            .catch((error) => setErrorEstado(error.message))
            .finally(() => setGuardando(false))
    }

    function actualizarEncargo(respuesta) {
        setDatos((actual) => ({ ...actual, encargo: { ...respuesta, mensajes: actual.encargo.mensajes } }))
    }

    // Los tres pasos del acuerdo (proponer precio, aceptarlo y cancelar) se piden igual: uno a la vez.
    function pedirAcuerdo(pedido, confirmacion) {
        if (trabajando) return
        setTrabajando(true)
        setErrorPrecio("")
        setAvisoPrecio("")
        pedido
            .then((respuesta) => {
                if (!respuesta) return
                actualizarEncargo(respuesta)
                setAvisoPrecio(confirmacion)
            })
            .catch((error) => setErrorPrecio(error.message))
            .finally(() => {
                setTrabajando(false)
                setCancelando(false)
            })
    }

    function definirPrecio(valor) {
        pedirAcuerdo(
            api.patch(`/api/encargos/${encargo.id}/precio`, { precio_acordado: valor }),
            "Precio guardado: el cliente ya lo ve."
        )
    }

    function aceptarPrecio() {
        pedirAcuerdo(
            api.post(`/api/encargos/${encargo.id}/aceptar-precio`),
            "Aceptaste el precio: el encargo quedó aprobado y el precio ya no cambia."
        )
    }

    function cancelarEncargo() {
        pedirAcuerdo(
            api.patch(`/api/encargos/${encargo.id}/estado`, { nuevoEstado: "CANCELADO" }),
            "El encargo fue cancelado."
        )
    }

    if (cargando)
        return (
            <main className="seccion">
                <Estado tipo="cargando" />
            </main>
        )

    if (error || !encargo || !permitido) {
        return (
            <main className="seccion encargo-detalle">
                <div className="contenido col-media apilado">
                    <Link to={volver} className="detalle-volver body-sm">
                        ← Volver a encargos
                    </Link>
                    <h1 className="headline-lg">Detalle del encargo</h1>
                    <Estado
                        tipo={error ? "error" : "vacio"}
                        mensaje={
                            error ||
                            (!encargo
                                ? "No encontramos ese encargo. Volvé al listado para elegir uno."
                                : "No tenés permiso para ver este encargo.")
                        }
                    />
                    {error && (
                        <Boton tipo="secundario" onClick={reintentar}>
                            Reintentar
                        </Boton>
                    )}
                </div>
            </main>
        )
    }

    const esArtista = permisos.puedeCambiarEstado
    // Los nombres, los textos y los cambios de estado posibles ya vienen resueltos en el encargo.
    const artista = { usuario_id: encargo.artista_usuario_id, nombre: encargo.nombre_artista }
    const cliente = { nombre: encargo.nombre_cliente }
    const pintura = encargo.nombre_tipo_pintura
    const lienzo = encargo.nombre_tipo_lienzo
    const tamanio = encargo.nombre_tamanio
    const marco = encargo.nombre_marco
    const estadosSiguientes = encargo.estados_siguientes

    return (
        <main className="seccion encargo-detalle">
            <div className="contenido col-media">
                <Link to={volver} className="detalle-volver body-sm">
                    ← Volver a encargos
                </Link>
                <div className="encabezado detalle-cabecera">
                    <div>
                        <p className="catalog-number cartela-num">Encargo Nº {String(encargo.id).padStart(3, "0")}</p>
                        <h1 className="headline-lg">
                            {pintura} sobre {lienzo.toLowerCase()}, {tamanio.replace(/ cm$/, "")}
                        </h1>
                        <p className="body-lg muted">
                            {esArtista
                                ? `Pedido por ${cliente?.nombre ?? "Cliente"}`
                                : `Pedido a ${artista?.nombre ?? "Artista"}`}
                            {" · "}
                            <time dateTime={encargo.fecha_creacion_encargo}>
                                {new Date(encargo.fecha_creacion_encargo).toLocaleDateString("es-AR")}
                            </time>
                        </p>
                    </div>
                    <EstadoEncargo estado={encargo.estado_encargo} nombre={encargo.nombre_estado} />
                </div>
                <div className="aviso detalle-aviso">
                    <span className="catalog-number cartela-num">
                        Vista de {esAdmin ? "administración" : esArtista ? "artista" : "cliente"}
                    </span>
                    <p className="body-sm detalle-texto">
                        {esAdmin
                            ? "Consulta de solo lectura. Los mensajes son privados de los participantes."
                            : esArtista
                              ? "Sos el artista de este encargo: proponés el precio y actualizás su estado."
                              : "Podés escribir mensajes, aceptar el precio que proponga el artista y pagar cuando el encargo esté terminado."}
                    </p>
                </div>
                <hr className="divisor" />
                <section className="cartela detalle-ficha" aria-labelledby="descripcion-pedido">
                    <h2 id="descripcion-pedido" className="catalog-number muted">
                        Descripción del pedido
                    </h2>
                    <p className="body-lg detalle-texto detalle-contenido">{encargo.descripcion_encargo}</p>
                    <div className="fila detalle-chips">
                        <span className="chip">{pintura}</span>
                        <span className="chip">{lienzo}</span>
                        <span className="chip">{tamanio}</span>
                        <span className="chip">{marco}</span>
                    </div>
                    <hr className="divisor" />
                    {esArtista && estadosSiguientes.length > 0 ? (
                        <form onSubmit={guardarEstado}>
                            <div className="entre detalle-estado">
                                <label htmlFor="estado-encargo" className="muted">
                                    Cambiar el estado del encargo
                                </label>
                                <div className="fila detalle-controles">
                                    <select
                                        id="estado-encargo"
                                        className="select"
                                        value={nuevoEstado}
                                        aria-invalid={Boolean(errorEstado)}
                                        aria-describedby={errorEstado ? "estado-error" : undefined}
                                        onChange={(evento) => {
                                            setNuevoEstado(evento.target.value)
                                            setErrorEstado("")
                                            setAviso("")
                                        }}
                                    >
                                        <option value="">{encargo.nombre_estado} (actual)</option>
                                        {estadosSiguientes.map((estado) => (
                                            <option key={estado.valor} value={estado.valor}>
                                                {estado.nombre}
                                            </option>
                                        ))}
                                    </select>
                                    <Boton
                                        type="submit"
                                        tipo={nuevoEstado && !guardando ? "primario" : "deshabilitado"}
                                    >
                                        {guardando ? "Guardando..." : "Guardar"}
                                    </Boton>
                                </div>
                            </div>
                            {errorEstado && (
                                <p id="estado-error" className="campo-error body-sm" role="alert">
                                    {errorEstado}
                                </p>
                            )}
                        </form>
                    ) : (
                        <>
                            <div className="entre detalle-estado">
                                <span className="muted">Estado del encargo</span>
                                <EstadoEncargo estado={encargo.estado_encargo} nombre={encargo.nombre_estado} />
                            </div>
                            <p className="body-sm muted detalle-texto">
                                {esAdmin
                                    ? "Consulta de solo lectura."
                                    : permisos.puedeCancelar
                                      ? "El artista avanza el estado del encargo; vos podés cancelarlo mientras esté pendiente: una vez que aceptás el precio ya no se cancela."
                                      : estadosSiguientes.length === 0
                                        ? "No hay cambios de estado disponibles desde esta pantalla."
                                        : "Solo el artista puede cambiar el estado."}
                            </p>
                            {permisos.puedeCancelar && (
                                <Boton tipo="secundario" onClick={() => setCancelando(true)}>
                                    Cancelar encargo
                                </Boton>
                            )}
                        </>
                    )}
                </section>

                <div style={{ marginTop: "var(--lg)" }}>
                    <AcuerdoPrecio
                        estado={encargo.estado_encargo}
                        precio={encargo.precio_acordado}
                        esCliente={permisos.esCliente}
                        esArtista={permisos.esArtista}
                        puedeDefinir={permisos.puedeDefinirPrecio}
                        puedeAceptar={permisos.puedeAceptarPrecio}
                        puedePagar={permisos.puedePagar}
                        ocupado={trabajando}
                        error={errorPrecio}
                        aviso={avisoPrecio}
                        onDefinir={definirPrecio}
                        onAceptar={aceptarPrecio}
                        onPagar={() => navegar(`/encargos/${encargo.id}/pagar`)}
                    />
                </div>

                {permisos.puedeVerMensajes && (
                    <section className="detalle-mensajes" aria-labelledby="titulo-mensajes">
                        <h2 id="titulo-mensajes" className="headline-md">
                            Mensajes
                        </h2>
                        <p className="body-lg muted detalle-intro">
                            Para coordinar. La descripción original del pedido se mantiene sin cambios.
                        </p>
                        {encargo.mensajes.length === 0 ? (
                            <Estado
                                tipo="vacio"
                                mensaje="Todavía no hay mensajes. Escribí el primero para empezar a coordinar."
                            />
                        ) : (
                            <ol className="hilo detalle-hilo" aria-label="Conversación del encargo">
                                {encargo.mensajes.map((item) => (
                                    <li
                                        key={item.id}
                                        className={`mensaje ${item.usuario_emisor_id === usuario?.id ? "propio" : "ajeno"}`}
                                    >
                                        <p className="cartela-artist">
                                            {item.usuario_emisor_id === usuario?.id
                                                ? "Vos"
                                                : item.usuario_emisor_id === encargo.usuario_id
                                                  ? cliente.nombre
                                                  : item.usuario_emisor_id === artista?.usuario_id
                                                    ? artista.nombre
                                                    : `Usuario Nº ${item.usuario_emisor_id}`}
                                            {item.fecha_creacion_mensaje && (
                                                <time className="cartela-meta" dateTime={item.fecha_creacion_mensaje}>
                                                    {" · "}
                                                    {new Date(item.fecha_creacion_mensaje).toLocaleString("es-AR", {
                                                        day: "2-digit",
                                                        month: "2-digit",
                                                        hour: "2-digit",
                                                        minute: "2-digit"
                                                    })}
                                                </time>
                                            )}
                                        </p>
                                        <p className="body-lg detalle-texto detalle-contenido">
                                            {item.contenido_mensaje}
                                        </p>
                                    </li>
                                ))}
                            </ol>
                        )}
                        {permisos.puedeEscribir && (
                            <form className="detalle-enviar" onSubmit={enviar} noValidate>
                                <div className="fila detalle-editor">
                                    <CampoFormulario
                                        etiqueta="Tu mensaje"
                                        aria-label="Tu mensaje"
                                        placeholder="Escribir un mensaje"
                                        ref={campoMensaje}
                                        disabled={enviando}
                                        value={mensaje}
                                        maxLength={255}
                                        required
                                        aria-invalid={Boolean(errorMensaje)}
                                        aria-describedby={errorMensaje ? "mensaje-error" : "mensaje-ayuda"}
                                        onChange={(evento) => {
                                            setMensaje(evento.target.value)
                                            setErrorMensaje("")
                                            setAviso("")
                                        }}
                                    />
                                    <Boton type="submit" disabled={enviando}>
                                        {enviando ? "Enviando..." : "Enviar"}
                                    </Boton>
                                </div>
                                {errorMensaje && (
                                    <p id="mensaje-error" className="campo-error body-sm" role="alert">
                                        {errorMensaje}
                                    </p>
                                )}
                                <p id="mensaje-ayuda" className="body-sm muted">
                                    {mensaje.length}/255 caracteres.
                                </p>
                            </form>
                        )}
                        <p className="body-sm detalle-confirmacion" role="status">
                            {aviso}
                        </p>
                    </section>
                )}
                {cancelando && (
                    <Confirmacion
                        titulo="¿Cancelar el encargo?"
                        mensaje="El encargo se cancela y no se puede retomar. La conversación queda a la vista."
                        textoConfirmar="Cancelar encargo"
                        onConfirmar={cancelarEncargo}
                        onCancelar={() => setCancelando(false)}
                        ocupado={trabajando}
                    />
                )}
            </div>
        </main>
    )
}
