import { useEffect, useState } from "react"
import { useDispatch, useSelector } from "react-redux"

import { fecha, normalizarNombre } from "../api/formato"

import Estado from "../components/Estado"
import Boton from "../components/Boton"
import Paginador from "../components/Paginador"

import {
    fetchUsuarios,
    actualizarRolUsuario,
    limpiarErrorUsuarios
} from "../redux/usuariosSlice"


const ROLES = [
    "CLIENTE",
    "ARTISTA",
    "ARTISTA_CLIENTE",
    "ADMIN"
]

const USUARIOS_POR_PAGINA = 10


const AdminUsuarios = () => {
    const dispatch = useDispatch()

    // La lista real de usuarios vive ahora en Redux.
    const {
        items: usuarios,
        loading,
        error,
        guardandoId
    } = useSelector((state) => state.usuarios)

    // El usuario logueado ya viene del estado global de sesión.
    const usuarioActual = useSelector(
        (state) => state.sesion.usuario
    )


    // Los roles seleccionados antes de guardar son estado local.
    const [roles, setRoles] = useState({})

    // Búsqueda y paginación solo afectan esta pantalla.
    const [busqueda, setBusqueda] = useState("")
    const [paginaActual, setPaginaActual] = useState(1)


    // -------------------------
    // CARGAR USUARIOS
    // -------------------------

    useEffect(() => {
        dispatch(fetchUsuarios())
    }, [dispatch])


    // -------------------------
    // CAMBIAR ROL LOCALMENTE
    // -------------------------

    const handleRol = (usuarioId, nuevoRol) => {
        setRoles({
            ...roles,
            [usuarioId]: nuevoRol
        })
    }


    // -------------------------
    // GUARDAR ROL EN EL BACKEND
    // -------------------------

    const guardarRol = (usuarioId) => {
        dispatch(limpiarErrorUsuarios())

        // Si todavía no se modificó el select,
        // usamos el rol actual del usuario.
        const usuario = usuarios.find(
            (item) => item.id === usuarioId
        )

        const rol =
            roles[usuarioId] ?? usuario?.rol_usuario

        // La vista solamente despacha la acción.
        // El thunk realiza el PATCH al backend.
        dispatch(
            actualizarRolUsuario({
                usuarioId,
                rol
            })
        )
    }


    // -------------------------
    // BÚSQUEDA
    // -------------------------

    const handleBusqueda = (e) => {
        setBusqueda(e.target.value)
        setPaginaActual(1)
    }


    const usuariosFiltrados = usuarios.filter((usuario) => {
        if (!busqueda) {
            return true
        }

        const buscado = normalizarNombre(busqueda)

        const nombreCompleto =
            usuario.nombre_persona +
            " " +
            usuario.apellido_persona

        return (
            normalizarNombre(nombreCompleto).includes(buscado) ||
            normalizarNombre(usuario.email_usuario).includes(
                buscado
            ) ||
            normalizarNombre(
                usuario.nombre_usuario ?? ""
            ).includes(buscado)
        )
    })


    // -------------------------
    // PAGINACIÓN LOCAL
    // -------------------------

    const totalPaginas = Math.max(
        1,
        Math.ceil(
            usuariosFiltrados.length /
                USUARIOS_POR_PAGINA
        )
    )

    const inicio =
        (paginaActual - 1) * USUARIOS_POR_PAGINA

    const usuariosPagina = usuariosFiltrados.slice(
        inicio,
        inicio + USUARIOS_POR_PAGINA
    )


    // Mostramos carga solamente mientras todavía
    // no tenemos usuarios en el estado global.
    if (loading && usuarios.length === 0) {
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

                <h1 className="headline-lg titulo-oculto">
                    Usuarios y permisos
                </h1>


                {error && (
                    <div className="mb-md">
                        <Estado
                            tipo="error"
                            mensaje={error}
                        />
                    </div>
                )}


                {/* Búsqueda y cantidad de usuarios visibles. */}
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
                        {usuariosFiltrados.length === 1
                            ? "1 usuario"
                            : usuariosFiltrados.length +
                              " usuarios"}
                    </span>
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
                                {usuariosPagina.map(
                                    (usuario) => {
                                        const esUsuarioActual =
                                            usuarioActual?.id ===
                                            usuario.id

                                        // Si todavía no se modificó el select,
                                        // mostramos el rol que viene de Redux.
                                        const rolSeleccionado =
                                            roles[
                                                usuario.id
                                            ] ??
                                            usuario.rol_usuario

                                        const rolCambiado =
                                            rolSeleccionado !==
                                            usuario.rol_usuario

                                        return (
                                            <tr
                                                key={
                                                    usuario.id
                                                }
                                            >
                                                <td>
                                                    {
                                                        usuario.nombre_persona
                                                    }{" "}
                                                    {
                                                        usuario.apellido_persona
                                                    }
                                                </td>

                                                <td>
                                                    {
                                                        usuario.email_usuario
                                                    }
                                                </td>

                                                <td>
                                                    {fecha(
                                                        usuario.fecha_creacion
                                                    )}
                                                </td>

                                                <td>
                                                    <select
                                                        className="select ancho-auto"
                                                        value={
                                                            rolSeleccionado
                                                        }
                                                        onChange={(
                                                            e
                                                        ) =>
                                                            handleRol(
                                                                usuario.id,
                                                                e
                                                                    .target
                                                                    .value
                                                            )
                                                        }
                                                        disabled={
                                                            esUsuarioActual
                                                        }
                                                    >
                                                        {ROLES.map(
                                                            (
                                                                rol
                                                            ) => (
                                                                <option
                                                                    key={
                                                                        rol
                                                                    }
                                                                    value={
                                                                        rol
                                                                    }
                                                                >
                                                                    {
                                                                        rol
                                                                    }
                                                                </option>
                                                            )
                                                        )}
                                                    </select>
                                                </td>


                                                <td>
                                                    {esUsuarioActual && (
                                                        <span className="cartela-meta">
                                                            Sos vos
                                                        </span>
                                                    )}

                                                    {!esUsuarioActual &&
                                                        rolCambiado && (
                                                            <Boton
                                                                tipo={
                                                                    guardandoId ===
                                                                    usuario.id
                                                                        ? "deshabilitado"
                                                                        : "primario"
                                                                }
                                                                onClick={() =>
                                                                    guardarRol(
                                                                        usuario.id
                                                                    )
                                                                }
                                                            >
                                                                {guardandoId ===
                                                                usuario.id
                                                                    ? "Guardando..."
                                                                    : "Guardar"}
                                                            </Boton>
                                                        )}
                                                </td>
                                            </tr>
                                        )
                                    }
                                )}
                            </tbody>
                        </table>


                        <Paginador
                            pagina={paginaActual - 1}
                            totalPaginas={totalPaginas}
                            onCambiar={(nueva) =>
                                setPaginaActual(
                                    nueva + 1
                                )
                            }
                        />
                    </>
                )}


                <p className="body-sm muted mt-md">
                    El cambio de rol tiene efecto en la
                    siguiente petición: no hace falta volver
                    a entrar.
                </p>
            </div>
        </div>
    )
}

export default AdminUsuarios