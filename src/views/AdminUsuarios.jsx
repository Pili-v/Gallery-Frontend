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

const AdminUsuarios = () => {

    const [usuarios, setUsuarios] = useState([])
    const [roles, setRoles] = useState({})
    const [cargando, setCargando] = useState(true)
    const [error, setError] = useState("")
    const [guardando, setGuardando] = useState(null)

    const usuarioActual = getUsuario()

    const cargarUsuarios = async () => {

        try {

            const respuesta = await api.get("/api/usuarios")
            const usuariosRecibidos = lista(respuesta)

            setUsuarios(usuariosRecibidos)

            const rolesIniciales = {}

            usuariosRecibidos.forEach((usuario) => {
                rolesIniciales[usuario.id] = usuario.rol_usuario
            })

            setRoles(rolesIniciales)

        } catch (e) {

            setError(e.message)

        } finally {

            setCargando(false)
        }
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

    const guardarRol = async (usuarioId) => {

        setGuardando(usuarioId)
        setError("")

        try {

            const rol = roles[usuarioId]

            const usuarioActualizado = await api.patch(
                "/api/usuarios/" +
                usuarioId +
                "/rol?rol=" +
                encodeURIComponent(rol)
            )

            setUsuarios(
                usuarios.map((usuario) =>
                    usuario.id === usuarioId
                        ? usuarioActualizado
                        : usuario
                )
            )

        } catch (e) {

            setError(e.message)

        } finally {

            setGuardando(null)
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
        <div className="seccion">
            <div className="contenido">

                <h1 className="headline-lg">
                    Usuarios y permisos
                </h1>

                <p
                    className="body-lg muted"
                    style={{ margin: "var(--xs) 0 var(--xl)" }}
                >
                    Asignar el rol define qué puede hacer cada cuenta.
                </p>

                {error && (
                    <div style={{ marginBottom: "var(--md)" }}>
                        <Estado
                            tipo="error"
                            mensaje={error}
                        />
                    </div>
                )}

                {usuarios.length === 0 ? (

                    <Estado
                        tipo="vacio"
                        mensaje="No hay usuarios registrados."
                    />

                ) : (

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

                            {usuarios.map((usuario) => {

                                const esUsuarioActual =
                                    usuarioActual?.id === usuario.id

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
                                            {fecha(usuario.fecha_creacion)}
                                        </td>

                                        <td>

                                            <select
                                                className="select"
                                                style={{ width: "auto" }}
                                                value={
                                                    roles[usuario.id]
                                                }
                                                onChange={(e) =>
                                                    handleRol(
                                                        usuario.id,
                                                        e.target.value
                                                    )
                                                }
                                                disabled={esUsuarioActual}
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
                                                        guardando === usuario.id
                                                            ? "deshabilitado"
                                                            : "secundario"
                                                    }
                                                    onClick={() =>
                                                        guardarRol(usuario.id)
                                                    }
                                                >
                                                    {guardando === usuario.id
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
                )}

                <p
                    className="body-sm muted"
                    style={{ marginTop: "var(--md)" }}
                >
                    El cambio de rol tiene efecto en la siguiente petición:
                    no hace falta volver a entrar.
                </p>

            </div>
        </div>
    )
}

export default AdminUsuarios
