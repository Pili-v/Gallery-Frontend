import { useEffect, useState } from "react"
import { useLocation, useNavigate, useSearchParams } from "react-router-dom"
import { useDispatch, useSelector } from "react-redux"
import { fetchEncargos, setFiltroEstado, entrarEnVista } from "../redux/encargosSlice"
import { fetchArtistas } from "../redux/artistasSlice"
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
// Los encargos viven en encargosSlice (cada uno una sola vez; la lista guarda sus ids) y se piden cada vez que se entra
// o se cambia de vista: los cambia también la otra parte. El filtro de estado también vive ahí (y se reinicia al cambiar
// de vista); la búsqueda de artista del administrador es de esta pantalla, igual que su campo.

export default function Encargos() {
    const [parametros, setParametros] = useSearchParams()
    const navigate = useNavigate()
    const usuario = useSelector((state) => state.sesion.usuario)
    const perfilArtista = useSelector((state) => state.sesion.perfilArtista)
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
    const dispatch = useDispatch()
    const { porId, lista, filtros } = useSelector((state) => state.encargos)
    const todosLosArtistas = useSelector((state) => state.artistas.items)
    const [busquedaArtista, setBusquedaArtista] = useState("")
    const [artistaElegido, setArtistaElegido] = useState("")
    const vista = esAdmin ? "todos" : verRecibidos ? "recibidos" : "pedidos"
    // El filtro de estado vale solo para la vista a la que pertenece (el slice lo reinicia al cambiar de vista).
    const filtroEstado = filtros.vista === vista ? filtros.estado : ""
    const cargando = lista.loading
    const datos = { items: lista.ids.map((id) => porId[id]).filter(Boolean), error: lista.error }
    // Solo ADMIN usa la lista de artistas (para filtrar): los nombres de cada encargo ya vienen en la respuesta.
    const artistas = todosLosArtistas.map((item) => ({ ...item, nombre: item.nombre_artistico }))

    // El backend obtiene el usuario o el artista desde el token de la sesión. Los artistas son datos de referencia:
    // una sola vez para toda la app.
    useEffect(() => {
        dispatch(entrarEnVista(vista))
        dispatch(fetchEncargos(vista))
        if (vista === "todos") dispatch(fetchArtistas())
    }, [dispatch, vista])

    function reintentar() {
        dispatch(fetchEncargos(vista))
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
                onAccion={() => dispatch(setFiltroEstado(""))}
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
                                onChange={(evento) => dispatch(setFiltroEstado(evento.target.value))}
                            >
                                <option value="">Todos</option>
                                {estados.map((estado) => (
                                    <option key={estado.valor} value={estado.valor}>
                                        {estado.nombre}
                                    </option>
                                ))}
                            </CampoFormulario>

                            {filtroEstado && (
                                <button
                                    type="button"
                                    className="boton-texto"
                                    onClick={() => dispatch(setFiltroEstado(""))}
                                >
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
