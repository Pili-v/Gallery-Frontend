import { api, lista } from "../api/cliente"
import { getUsuario, getPerfilArtista } from "../api/sesion"
import { useEffect, useState } from "react"
import { useLocation, useNavigate, useSearchParams } from "react-router-dom"
import Estado from "../components/Estado"
import EstadoEncargo from "../components/EstadoEncargo"
import Boton from "../components/Boton"
import BuscadorArtista from "../components/BuscadorArtista"
import CampoFormulario from "../components/CampoFormulario"
import Indicador from "../components/Indicador"
import { normalizarNombre } from "../api/formato"

// Los estados en el orden en que avanza un encargo: así se listan en el filtro.
const ORDEN_ESTADOS = ["PENDIENTE", "APROBADO", "EN_PROCESO", "TERMINADO", "PAGADO", "CANCELADO"]

// Disposición (como Mis obras, Mis ventas y Mis compras): a la izquierda una columna fija con el botón para pedir, la
// vista (los que pedí o los que me pidieron), el total y el filtro por estado; a la derecha la tabla.

export default function Encargos() {
    const [parametros, setParametros] = useSearchParams()
    const navigate = useNavigate()
    const usuario = getUsuario()
    const perfilArtista = getPerfilArtista()
    const { state } = useLocation()
    const base = "/encargos"
    const esAdmin = usuario?.rol_usuario === "ADMIN"
    const puedePedir = ["CLIENTE", "ARTISTA_CLIENTE"].includes(usuario?.rol_usuario)
    const puedeRecibir = !esAdmin && Boolean(perfilArtista)
    const verRecibidos = puedeRecibir && (parametros.has("recibidos") || !puedePedir)
    return (
        <ListaEncargos
            key={`${base}-${esAdmin}-${verRecibidos}-${usuario?.id}-${perfilArtista?.id}`}
            {...{
                base,
                encargoCreado: state?.encargoCreado,
                navigate,
                parametros,
                setParametros,
                puedePedir,
                puedeRecibir,
                verRecibidos,
                esAdmin
            }}
        />
    )
}

function ListaEncargos({
    base,
    encargoCreado,
    navigate,
    parametros,
    setParametros,
    puedePedir,
    puedeRecibir,
    verRecibidos,
    esAdmin
}) {
    const [datos, setDatos] = useState({ items: [], error: "" })
    const [cargando, setCargando] = useState(true)
    const [intento, setIntento] = useState(0)
    const [artistas, setArtistas] = useState([])
    const [busquedaArtista, setBusquedaArtista] = useState("")
    const [artistaElegido, setArtistaElegido] = useState("")
    const [filtroEstado, setFiltroEstado] = useState("")

    useEffect(() => {
        let activo = true
        // El backend obtiene el usuario o el artista desde el token de la sesión.
        const ruta = esAdmin
            ? "/api/encargos"
            : verRecibidos
              ? "/api/artistas/me/encargos"
              : "/api/usuarios/me/encargos"
        // Solo ADMIN necesita la lista de artistas (para filtrar): los nombres de cada encargo ya vienen en la respuesta.
        const pedidoArtistas = esAdmin ? api.get("/api/artistas") : Promise.resolve([])
        Promise.all([api.get(ruta), pedidoArtistas])
            .then(([respuesta, perfiles]) => {
                if (!activo) return
                setDatos({ items: lista(respuesta), error: "" })
                setArtistas(lista(perfiles).map((item) => ({ ...item, nombre: item.nombre_artistico })))
            })
            .catch((error) => {
                if (activo) setDatos({ items: [], error: error.message })
            })
            .finally(() => {
                if (activo) setCargando(false)
            })
        return () => {
            activo = false
        }
    }, [esAdmin, verRecibidos, intento])

    function reintentar() {
        setCargando(true)
        setIntento(intento + 1)
    }
    const idsArtistas = new Set(
        artistas
            .filter((artista) => normalizarNombre(artista.nombre).includes(normalizarNombre(busquedaArtista)))
            .map((artista) => String(artista.id))
    )
    const deLosArtistas = esAdmin
        ? datos.items.filter((encargo) =>
              artistaElegido
                  ? String(encargo.artista_id) === artistaElegido
                  : !busquedaArtista.trim() || idsArtistas.has(String(encargo.artista_id))
          )
        : datos.items
    // El filtro por estado se aplica sobre lo que ya llegó: no hace falta pedir de nuevo.
    const encargos = filtroEstado
        ? deLosArtistas.filter((encargo) => encargo.estado_encargo === filtroEstado)
        : deLosArtistas

    // Solo se ofrecen los estados que tienen algún encargo, con el nombre que manda el back.
    const estados = ORDEN_ESTADOS.map((estado) => datos.items.find((encargo) => encargo.estado_encargo === estado))
        .filter(Boolean)
        .map((encargo) => ({ valor: encargo.estado_encargo, nombre: encargo.nombre_estado }))

    function cambiarVista(recibir) {
        const siguientes = new URLSearchParams(parametros)
        if (recibir) siguientes.set("recibidos", "")
        else siguientes.delete("recibidos")
        setParametros(siguientes)
    }

    const tabla = (
        <div className="encargos-tabla" role="region" aria-label="Listado de encargos" tabIndex={0}>
            <table className="tabla">
                <caption className="solo-lectores">
                    {esAdmin
                        ? "Todos los encargos"
                        : verRecibidos
                          ? "Encargos recibidos de clientes"
                          : "Encargos pedidos a artistas"}
                </caption>
                <thead>
                    <tr>
                        <th scope="col">Nº</th>
                        <th scope="col">{verRecibidos ? "Cliente" : "Artista"}</th>
                        <th scope="col">Obra</th>
                        <th scope="col">Pedido</th>
                        <th scope="col">Estado</th>
                        <th scope="col">
                            <span className="solo-lectores">Acciones</span>
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {encargos.map((encargo) => {
                        const persona = verRecibidos ? encargo.nombre_cliente : encargo.nombre_artista
                        const accion =
                            verRecibidos && ["PENDIENTE", "EN_PROCESO"].includes(encargo.estado_encargo)
                                ? "Responder"
                                : "Ver"
                        return (
                            <tr key={encargo.id}>
                                <td>{String(encargo.id).padStart(3, "0")}</td>
                                <td>{persona}</td>
                                {/* Pintura y lienzo en una frase, como en el título del detalle: "Óleo sobre lienzo". */}
                                <td>
                                    {encargo.nombre_tipo_pintura} sobre{" "}
                                    {(encargo.nombre_tipo_lienzo ?? "").toLowerCase()}
                                </td>
                                <td>{new Date(encargo.fecha_creacion_encargo).toLocaleDateString("es-AR")}</td>
                                <td>
                                    <EstadoEncargo estado={encargo.estado_encargo} nombre={encargo.nombre_estado} />
                                </td>
                                <td>
                                    <a
                                        href="#"
                                        aria-label={`${accion} encargo ${encargo.id}`}
                                        onClick={(evento) => {
                                            evento.preventDefault()
                                            navigate(`${base}/${encargo.id}${verRecibidos ? "?recibidos" : ""}`)
                                        }}
                                    >
                                        {accion}
                                    </a>
                                </td>
                            </tr>
                        )
                    })}
                </tbody>
            </table>
        </div>
    )

    let cuerpo
    if (cargando) {
        cuerpo = <Estado tipo="cargando" />
    } else if (datos.error) {
        cuerpo = (
            <div className="apilado">
                <Estado tipo="error" mensaje={datos.error} />
                <Boton tipo="secundario" onClick={reintentar}>
                    Reintentar
                </Boton>
            </div>
        )
    } else if (encargos.length === 0 && filtroEstado) {
        cuerpo = (
            <Estado
                tipo="vacio"
                mensaje="No hay encargos en ese estado."
                accion="Quitar filtro"
                onAccion={() => setFiltroEstado("")}
            />
        )
    } else if (encargos.length === 0) {
        cuerpo = (
            <Estado
                tipo="vacio"
                mensaje={
                    esAdmin
                        ? busquedaArtista
                            ? "No hay encargos para los artistas que coinciden con tu búsqueda."
                            : "Todavía no hay encargos registrados."
                        : verRecibidos
                          ? "Todavía no recibiste encargos."
                          : "Todavía no hiciste encargos."
                }
            />
        )
    } else {
        cuerpo = tabla
    }

    return (
        <main className="seccion encargos-pagina">
            <div className="contenido">
                <h1 className="headline-lg titulo-oculto">Encargos</h1>
                <div className="panel-lista">
                    <aside className="cartela pad-lg pegado-arriba panel-lateral">
                        {puedePedir && !verRecibidos && (
                            <Boton onClick={() => navigate(`${base}/nuevo`)}>Pedir un encargo</Boton>
                        )}

                        {/* Qué encargos se ven: los que pidió o los que le pidieron (si además es artista). */}
                        {!esAdmin && puedeRecibir && (
                            <div className="panel-lateral-vista" role="group" aria-label="Vista de encargos">
                                <p className="catalog-number muted">Vista</p>
                                {puedePedir && (
                                    <button
                                        type="button"
                                        className={"chip" + (verRecibidos ? "" : " activo")}
                                        aria-pressed={!verRecibidos}
                                        onClick={() => cambiarVista(false)}
                                    >
                                        Los que pedí
                                    </button>
                                )}
                                <button
                                    type="button"
                                    className={"chip" + (verRecibidos ? " activo" : "")}
                                    aria-pressed={verRecibidos}
                                    onClick={() => cambiarVista(true)}
                                >
                                    Los que me pidieron
                                </button>
                            </div>
                        )}

                        <div className="panel-lateral-totales">
                            <Indicador titulo="Encargos" valor={cargando || datos.error ? "—" : encargos.length} />
                        </div>

                        <div className="panel-lateral-filtros">
                            {esAdmin && (
                                <BuscadorArtista
                                    artistas={artistas}
                                    value={artistaElegido}
                                    onChange={setArtistaElegido}
                                    onSearch={setBusquedaArtista}
                                    required={false}
                                    disabled={cargando || Boolean(datos.error)}
                                />
                            )}

                            <CampoFormulario
                                tipo="select"
                                etiqueta="Estado"
                                value={filtroEstado}
                                disabled={cargando || Boolean(datos.error)}
                                onChange={(evento) => setFiltroEstado(evento.target.value)}
                            >
                                <option value="">Todos</option>
                                {estados.map((estado) => (
                                    <option key={estado.valor} value={estado.valor}>
                                        {estado.nombre}
                                    </option>
                                ))}
                            </CampoFormulario>

                            {filtroEstado && (
                                <button type="button" className="boton-texto" onClick={() => setFiltroEstado("")}>
                                    Quitar filtro
                                </button>
                            )}
                        </div>
                    </aside>

                    <div className="min-ancho-0">
                        {encargoCreado && (
                            <p className="aviso mb-lg" role="status">
                                El encargo Nº {encargoCreado} se envió al artista.
                            </p>
                        )}
                        {cuerpo}
                    </div>
                </div>
            </div>
        </main>
    )
}
