import { useEffect, useState } from "react"

import CampoFormulario from "../components/CampoFormulario"
import Boton from "../components/Boton"
import Estado from "../components/Estado"

import { api } from "../api/cliente"
import { getToken, guardarSesion } from "../api/sesion"

const MiCuenta = () => {

    const [datos, setDatos] = useState({
        nombre_usuario: "",
        nombre_persona: "",
        apellido_persona: "",
        email_usuario: "",
        telefono_usuario: ""
    })

    const [errores, setErrores] = useState({})
    const [cargando, setCargando] = useState(true)
    const [guardando, setGuardando] = useState(false)
    const [errorGeneral, setErrorGeneral] = useState("")
    const [mensaje, setMensaje] = useState("")

    useEffect(() => {

        const cargarUsuario = async () => {

            try {

                const perfil = await api.get("/api/usuarios/me")

                setDatos({
                    nombre_usuario:
                        perfil.usuario.nombre_usuario ?? "",

                    nombre_persona:
                        perfil.usuario.nombre_persona ?? "",

                    apellido_persona:
                        perfil.usuario.apellido_persona ?? "",

                    email_usuario:
                        perfil.usuario.email_usuario ?? "",

                    telefono_usuario:
                        perfil.usuario.telefono_usuario ?? ""
                })

            } catch (e) {

                setErrorGeneral(
                    e.message || "No se pudo cargar la cuenta."
                )

            } finally {

                setCargando(false)
            }
        }

        cargarUsuario()

    }, [])

    const handleChange = (e) => {

        const { name, value } = e.target

        setDatos({
            ...datos,
            [name]: value
        })

        setErrores({
            ...errores,
            [name]: null
        })

        setMensaje("")
        setErrorGeneral("")
    }

    const validar = () => {

        const nuevosErrores = {}

        if (!datos.nombre_usuario.trim()) {
            nuevosErrores.nombre_usuario =
                "Ingresá un nombre de usuario."
        }

        if (!datos.nombre_persona.trim()) {
            nuevosErrores.nombre_persona =
                "Ingresá tu nombre."
        }

        if (!datos.apellido_persona.trim()) {
            nuevosErrores.apellido_persona =
                "Ingresá tu apellido."
        }

        if (!datos.email_usuario.trim()) {
            nuevosErrores.email_usuario =
                "Ingresá tu email."
        }

        if (!datos.telefono_usuario.trim()) {
            nuevosErrores.telefono_usuario =
                "Ingresá tu teléfono."
        }

        setErrores(nuevosErrores)

        return Object.keys(nuevosErrores).length === 0
    }

    const handleSubmit = async (e) => {

        e.preventDefault()

        if (!validar()) {
            return
        }

        setGuardando(true)
        setErrorGeneral("")
        setMensaje("")

        try {

            // Actualizamos al usuario dueño del token.
            await api.patch(
                "/api/usuarios/me",
                datos
            )

            // Volvemos a pedir el perfil completo actualizado.
            const perfil = await api.get(
                "/api/usuarios/me"
            )

            // Actualizamos también lo guardado en localStorage.
            guardarSesion(
                getToken(),
                perfil
            )

            setMensaje(
                "Los cambios se guardaron correctamente."
            )

        } catch (e) {

            setErrorGeneral(
                e.message || "No se pudieron guardar los cambios."
            )

        } finally {

            setGuardando(false)
        }
    }

    if (cargando) {
        return (
            <div className="seccion">
                <div className="contenido col-media">
                    <Estado tipo="cargando" />
                </div>
            </div>
        )
    }

    return (
        <div className="seccion">
            <div className="contenido col-media">

                <h1 className="headline-lg centro">
                    Mi cuenta
                </h1>

                <p
                    className="body-lg muted centro"
                    style={{ margin: "var(--xs) 0 var(--xl)" }}
                >
                    Consultá y actualizá tus datos personales.
                </p>

                {errorGeneral && (
                    <Estado
                        tipo="error"
                        mensaje={errorGeneral}
                    />
                )}

                <form
                    className="cartela"
                    style={{
                        padding: "var(--lg)",
                        marginTop: errorGeneral
                            ? "var(--md)"
                            : 0
                    }}
                    onSubmit={handleSubmit}
                >

                    <div className="fila-campos">

                        <CampoFormulario
                            etiqueta="Nombre"
                            name="nombre_persona"
                            value={datos.nombre_persona}
                            onChange={handleChange}
                            error={errores.nombre_persona}
                        />

                        <CampoFormulario
                            etiqueta="Apellido"
                            name="apellido_persona"
                            value={datos.apellido_persona}
                            onChange={handleChange}
                            error={errores.apellido_persona}
                        />

                    </div>

                    <CampoFormulario
                        etiqueta="Nombre de usuario"
                        name="nombre_usuario"
                        value={datos.nombre_usuario}
                        onChange={handleChange}
                        error={errores.nombre_usuario}
                    />

                    <CampoFormulario
                        etiqueta="Email"
                        tipo="email"
                        name="email_usuario"
                        value={datos.email_usuario}
                        onChange={handleChange}
                        error={errores.email_usuario}
                    />

                    <CampoFormulario
                        etiqueta="Teléfono"
                        name="telefono_usuario"
                        value={datos.telefono_usuario}
                        onChange={handleChange}
                        error={errores.telefono_usuario}
                    />

                    {mensaje && (
                        <p
                            className="body-sm"
                            style={{ marginBottom: "var(--md)" }}
                        >
                            {mensaje}
                        </p>
                    )}

                    <Boton
                        tipo={guardando ? "deshabilitado" : "primario"}
                        bloque
                        type="submit"
                    >
                        {guardando
                            ? "Guardando..."
                            : "Guardar cambios"
                        }
                    </Boton>

                </form>

            </div>
        </div>
    )
}

export default MiCuenta
