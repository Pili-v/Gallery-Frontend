import { useEffect, useState } from "react"

import { api, lista } from "../api/cliente"
import { getUsuario } from "../api/sesion"
import { fecha } from "../api/formato"

import Estado from "../components/Estado"
import Boton from "../components/Boton"

const ROLES = [
    "CLIENTE",
    "ARTISTA",
    "ARTISTA_CLIENTE",
    "ADMIN"
]

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
                    rolesIniciales[usuario.id] =
                        usuario.rol_usuario
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

        api.patch(
            "/api/usuarios/" +
            usuarioId +
            "/rol?rol=" +
            encodeURIComponent(rol)
        )
            .then((usuarioActualizado) => {

                setUsuarios(
                    usuarios.map((usuario) =>
                        usuario.id === usuarioId
                            ? usuarioActualizado
                            : usuario
                    )
                )
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

        const nombreCompleto =
            usuario.nombre_persona +
            " " +
            usuario.apellido_persona

        return (
            nombreCompleto.includes(busqueda) ||
            usuario.email_usuario.includes(busqueda) ||
            usuario.nombre_usuario?.includes(busqueda)
        )
    })

    const totalPaginas = Math.max(
        1,
        Math.ceil(
            usuariosFiltrados.length /
            USUARIOS_POR_PAGINA
        )
    )

    const inicio =
        (paginaActual - 1) * USUARIOS_POR_PAGINA

    const usuariosPagina =
        usuariosFiltrados.slice(
            inicio,
            inicio + USUARIOS_POR_PAGINA
        )

    const paginaAnterior = () => {

        if (paginaActual > 1) {
            setPaginaActual(
                paginaActual - 1
            )
        }
    }

    const paginaSiguiente = () => {

        if (paginaActual < totalPaginas) {
            setPaginaActual(
                paginaActual + 1
            )
        }
    }

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
        <div className="seccion" style={{ paddingTop: "var(--xl)" }}>
            <div className="contenido">

                {/* El espacio sobre el título es el mismo que hay entre el título y lo que sigue. */}
                <h1 className="headline-lg" style={{ marginBottom: "var(--xl)" }}>
                    Usuarios y permisos
                </h1>

                {error && (
                    <div
                        style={{
                            marginBottom: "var(--md)"
                        }}
                    >
                        <Estado
                            tipo="error"
                            mensaje={error}
                        />
                    </div>
                )}

                <div
                    style={{
                        marginBottom: "var(--md)"
                    }}
                >
                    <input
                        className="input"
                        type="text"
                        placeholder="Buscar usuario..."
                        value={busqueda}
                        onChange={handleBusqueda}
                    />
                </div>

                {usuariosFiltrados.length === 0 ? (

                    <Estado
                        tipo="vacio"
                        mensaje="No se encontraron usuarios."
                    />

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

                                    const esUsuarioActual =
                                        usuarioActual?.id ===
                                        usuario.id

                                    return (
                                        <tr key={usuario.id}>

                                            <td>
                                                {usuario.nombre_persona}{" "}
                                                {usuario.apellido_persona}
                                            </td>

                                            <td>
                                                {usuario.email_usuario}
                                            </td>

                                            <td>
                                                {fecha(
                                                    usuario.fecha_creacion
                                                )}
                                            </td>

                                            <td>

                                                <select
                                                    className="select"
                                                    style={{
                                                        width: "auto"
                                                    }}
                                                    value={
                                                        roles[
                                                            usuario.id
                                                        ]
                                                    }
                                                    onChange={(e) =>
                                                        handleRol(
                                                            usuario.id,
                                                            e.target.value
                                                        )
                                                    }
                                                    disabled={
                                                        esUsuarioActual
                                                    }
                                                >

                                                    {ROLES.map((rol) => (
                                                        <option
                                                            key={rol}
                                                            value={rol}
                                                        >
                                                            {rol}
                                                        </option>
                                                    ))}

                                                </select>

                                            </td>

                                            <td>

                                                {esUsuarioActual ? (

                                                    <Boton
                                                        tipo="deshabilitado"
                                                    >
                                                        Sos vos
                                                    </Boton>

                                                ) : (

                                                    <Boton
                                                        tipo={
                                                            guardando ===
                                                            usuario.id
                                                                ? "deshabilitado"
                                                                : "secundario"
                                                        }
                                                        onClick={() =>
                                                            guardarRol(
                                                                usuario.id
                                                            )
                                                        }
                                                    >
                                                        {guardando ===
                                                        usuario.id
                                                            ? "Guardando..."
                                                            : "Guardar"
                                                        }
                                                    </Boton>

                                                )}

                                            </td>

                                        </tr>
                                    )
                                })}

                            </tbody>

                        </table>

                        <div
                            style={{
                                display: "flex",
                                justifyContent: "center",
                                alignItems: "center",
                                gap: "var(--md)",
                                marginTop: "var(--lg)"
                            }}
                        >

                            <Boton
                                tipo={
                                    paginaActual === 1
                                        ? "deshabilitado"
                                        : "secundario"
                                }
                                onClick={paginaAnterior}
                            >
                                Anterior
                            </Boton>

                            <span className="body-sm muted">
                                Página {paginaActual} de {totalPaginas}
                            </span>

                            <Boton
                                tipo={
                                    paginaActual === totalPaginas
                                        ? "deshabilitado"
                                        : "secundario"
                                }
                                onClick={paginaSiguiente}
                            >
                                Siguiente
                            </Boton>

                        </div>
                    </>
                )}

                <p
                    className="body-sm muted"
                    style={{
                        marginTop: "var(--md)"
                    }}
                >
                    El cambio de rol tiene efecto en la siguiente petición:
                    no hace falta volver a entrar.
                </p>

            </div>
        </div>
    )
}

export default AdminUsuarios
