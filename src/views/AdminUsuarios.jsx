import { useEffect, useState } from "react"

import { api, lista } from "../api/cliente"
import { getUsuario } from "../api/sesion"
import { fecha, normalizarNombre } from "../api/formato"

import Estado from "../components/Estado"
import Boton from "../components/Boton"
import Paginador from "../components/Paginador"

const ROLES = ["CLIENTE", "ARTISTA", "ARTISTA_CLIENTE", "ADMIN"]

const USUARIOS_POR_PAGINA = 10

const AdminUsuarios = () => {
    const [usuarios, setUsuarios] = useState([])
    const [roles, setRoles] = useState({})
    const [cargando, setCargando] = useState(true)
    const [error, setError] = useState("")
    const [guardando, setGuardando] = useState(null)

    const [busqueda, setBusqueda] = useState("")
    const [paginaActual, setPaginaActual] = useState(1)

    const usuarioActual = getUsuario()

    const cargarUsuarios = () => {
        setCargando(true)
        setError("")

        api.get("/api/usuarios")
            .then((respuesta) => {
                const usuariosRecibidos = lista(respuesta)

                setUsuarios(usuariosRecibidos)

                const rolesIniciales = {}

                usuariosRecibidos.forEach((usuario) => {
                    rolesIniciales[usuario.id] = usuario.rol_usuario
                })

                setRoles(rolesIniciales)
            })
            .catch((e) => {
                setError(e.message)
            })
            .finally(() => {
                setCargando(false)
            })
    }

    useEffect(() => {
        cargarUsuarios()
    }, [])

    const handleRol = (usuarioId, nuevoRol) => {
        setRoles({
            ...roles,
            [usuarioId]: nuevoRol
        })
    }

    const guardarRol = (usuarioId) => {
        setGuardando(usuarioId)
        setError("")

        const rol = roles[usuarioId]

        api.patch("/api/usuarios/" + usuarioId + "/rol?rol=" + encodeURIComponent(rol))
            .then((usuarioActualizado) => {
                setUsuarios(usuarios.map((usuario) => (usuario.id === usuarioId ? usuarioActualizado : usuario)))
            })
            .catch((e) => {
                setError(e.message)
            })
            .finally(() => {
                setGuardando(null)
            })
    }

    const handleBusqueda = (e) => {
        setBusqueda(e.target.value)
        setPaginaActual(1)
    }

    const usuariosFiltrados = usuarios.filter((usuario) => {
        if (!busqueda) {
            return true
        }

        // Sin distinguir mayúsculas ni tildes: "ana" encuentra a "Ana Bosch" y "lucia" a "Lucía".
        const buscado = normalizarNombre(busqueda)
        const nombreCompleto = usuario.nombre_persona + " " + usuario.apellido_persona

        return (
            normalizarNombre(nombreCompleto).includes(buscado) ||
            normalizarNombre(usuario.email_usuario).includes(buscado) ||
            normalizarNombre(usuario.nombre_usuario ?? "").includes(buscado)
        )
    })

    const totalPaginas = Math.max(1, Math.ceil(usuariosFiltrados.length / USUARIOS_POR_PAGINA))

    const inicio = (paginaActual - 1) * USUARIOS_POR_PAGINA

    const usuariosPagina = usuariosFiltrados.slice(inicio, inicio + USUARIOS_POR_PAGINA)

    if (cargando) {
        return (
            <div className="seccion">
                <div className="contenido">
                    <Estado tipo="cargando" />
                </div>
            </div>
        )
    }

    return (
        <div className="seccion">
            <div className="contenido">
                <h1 className="headline-lg titulo-oculto">Usuarios y permisos</h1>

                {error && (
                    <div className="mb-md">
                        <Estado tipo="error" mensaje={error} />
                    </div>
                )}

                {/* El buscador en la misma barra que el catálogo, con la cantidad de usuarios que se ven. */}
                <div className="barra-filtros">
                    <input
                        className="input barra-filtros-buscador"
                        type="search"
                        placeholder="Buscar por nombre, usuario o email"
                        aria-label="Buscar usuario"
                        value={busqueda}
                        onChange={handleBusqueda}
                    />
                    <span className="muted">
                        {usuariosFiltrados.length === 1 ? "1 usuario" : usuariosFiltrados.length + " usuarios"}
                    </span>
                </div>

                {usuariosFiltrados.length === 0 ? (
                    <Estado tipo="vacio" mensaje="No se encontraron usuarios." />
                ) : (
                    <>
                        <table className="tabla">
                            <thead>
                                <tr>
                                    <th>Usuario</th>
                                    <th>Email</th>
                                    <th>Alta</th>
                                    <th>Rol</th>
                                    <th></th>
                                </tr>
                            </thead>

                            <tbody>
                                {usuariosPagina.map((usuario) => {
                                    const esUsuarioActual = usuarioActual?.id === usuario.id
                                    // El botón de guardar aparece solo si se eligió otro rol: así no hay un botón por fila.
                                    const rolCambiado = roles[usuario.id] !== usuario.rol_usuario

                                    return (
                                        <tr key={usuario.id}>
                                            <td>
                                                {usuario.nombre_persona} {usuario.apellido_persona}
                                            </td>

                                            <td>{usuario.email_usuario}</td>

                                            <td>{fecha(usuario.fecha_creacion)}</td>

                                            <td>
                                                <select
                                                    className="select ancho-auto"
                                                    value={roles[usuario.id]}
                                                    onChange={(e) => handleRol(usuario.id, e.target.value)}
                                                    disabled={esUsuarioActual}
                                                >
                                                    {ROLES.map((rol) => (
                                                        <option key={rol} value={rol}>
                                                            {rol}
                                                        </option>
                                                    ))}
                                                </select>
                                            </td>

                                            <td>
                                                {esUsuarioActual && <span className="cartela-meta">Sos vos</span>}
                                                {!esUsuarioActual && rolCambiado && (
                                                    <Boton
                                                        tipo={guardando === usuario.id ? "deshabilitado" : "primario"}
                                                        onClick={() => guardarRol(usuario.id)}
                                                    >
                                                        {guardando === usuario.id ? "Guardando..." : "Guardar"}
                                                    </Boton>
                                                )}
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>

                        {/* El paginador de toda la app (empieza en 0; esta pantalla cuenta desde 1). */}
                        <Paginador
                            pagina={paginaActual - 1}
                            totalPaginas={totalPaginas}
                            onCambiar={(nueva) => setPaginaActual(nueva + 1)}
                        />
                    </>
                )}

                <p className="body-sm muted mt-md">
                    El cambio de rol tiene efecto en la siguiente petición: no hace falta volver a entrar.
                </p>
            </div>
        </div>
    )
}

export default AdminUsuarios
