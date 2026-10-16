import { useEffect, useState } from "react"

import CampoFormulario from "../components/CampoFormulario"
import Boton from "../components/Boton"
import Estado from "../components/Estado"

import { api } from "../api/cliente"
import {
    getToken,
    guardarSesion
} from "../api/sesion"

const MiCuenta = () => {

    const [datos, setDatos] = useState({
        nombre_usuario: "",
        nombre_persona: "",
        apellido_persona: "",
        email_usuario: "",
        telefono_usuario: ""
    })

    const [contrasenias, setContrasenias] = useState({
        contrasenia_actual: "",
        contrasenia_nueva: ""
    })

    const [errores, setErrores] = useState({})
    const [erroresContrasenia, setErroresContrasenia] = useState({})

    const [cargando, setCargando] = useState(true)
    const [guardando, setGuardando] = useState(false)
    const [cambiandoContrasenia, setCambiandoContrasenia] = useState(false)

    const [errorGeneral, setErrorGeneral] = useState("")
    const [mensaje, setMensaje] = useState("")
    const [mensajeContrasenia, setMensajeContrasenia] = useState("")

    const limpiarNombre = (texto) => {

        const soloLetras = texto.replace(
            /[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s]/g,
            ""
        )

        return soloLetras
            .split(" ")
            .map((palabra) => {

                if (!palabra) {
                    return ""
                }

                return (
                    palabra.charAt(0).toUpperCase() +
                    palabra.slice(1).toLowerCase()
                )
            })
            .join(" ")
    }

    useEffect(() => {

        api.get("/api/usuarios/me")
            .then((perfil) => {

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
            })
            .catch((e) => {

                setErrorGeneral(
                    e.message || "No se pudo cargar la cuenta."
                )
            })
            .finally(() => {

                setCargando(false)
            })

    }, [])

    const handleChange = (e) => {

        const { name, value } = e.target

        let nuevoValor = value

        if (
            name === "nombre_persona" ||
            name === "apellido_persona"
        ) {
            nuevoValor = limpiarNombre(value)
        }

        if (name === "telefono_usuario") {

            nuevoValor = value
                .replace(/\D/g, "")
                .slice(0, 10)
        }

        setDatos({
            ...datos,
            [name]: nuevoValor
        })

        setErrores({
            ...errores,
            [name]: null
        })

        setMensaje("")
        setErrorGeneral("")
    }

    const handleContrasenia = (e) => {

        const { name, value } = e.target

        setContrasenias({
            ...contrasenias,
            [name]: value
        })

        setErroresContrasenia({
            ...erroresContrasenia,
            [name]: null
        })

        setMensajeContrasenia("")
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

    const validarContrasenia = () => {

        const nuevosErrores = {}

        if (!contrasenias.contrasenia_actual.trim()) {
            nuevosErrores.contrasenia_actual =
                "Ingresá tu contraseña actual."
        }

        if (!contrasenias.contrasenia_nueva.trim()) {
            nuevosErrores.contrasenia_nueva =
                "Ingresá la nueva contraseña."
        }

        setErroresContrasenia(nuevosErrores)

        return Object.keys(nuevosErrores).length === 0
    }

    const handleSubmit = (e) => {

        e.preventDefault()

        if (!validar()) {
            return
        }

        setGuardando(true)
        setErrorGeneral("")
        setMensaje("")

        api.patch(
            "/api/usuarios/me",
            datos
        )
            .then(() => {

                return api.get("/api/usuarios/me")
            })
            .then((perfil) => {

                guardarSesion(
                    getToken(),
                    perfil
                )

                setMensaje(
                    "Los cambios se guardaron correctamente."
                )
            })
            .catch((e) => {

                setErrorGeneral(
                    e.message ||
                    "No se pudieron guardar los cambios."
                )
            })
            .finally(() => {

                setGuardando(false)
            })
    }

    const handleCambioContrasenia = (e) => {

        e.preventDefault()

        if (!validarContrasenia()) {
            return
        }

        setCambiandoContrasenia(true)
        setErrorGeneral("")
        setMensajeContrasenia("")

        api.patch(
            "/api/usuarios/me/contrasenia",
            contrasenias
        )
            .then(() => {

                setContrasenias({
                    contrasenia_actual: "",
                    contrasenia_nueva: ""
                })

                setMensajeContrasenia(
                    "La contraseña se cambió correctamente."
                )
            })
            .catch((e) => {

                setErrorGeneral(
                    e.message ||
                    "No se pudo cambiar la contraseña."
                )
            })
            .finally(() => {

                setCambiandoContrasenia(false)
            })
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
                        tipo="tel"
                        name="telefono_usuario"
                        value={datos.telefono_usuario}
                        onChange={handleChange}
                        maxLength={10}
                        inputMode="numeric"
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

                <form
                    className="cartela"
                    style={{
                        padding: "var(--lg)",
                        marginTop: "var(--xl)"
                    }}
                    onSubmit={handleCambioContrasenia}
                >

                    <h2
                        className="headline-sm"
                        style={{ marginBottom: "var(--md)" }}
                    >
                        Cambiar contraseña
                    </h2>

                    <CampoFormulario
                        etiqueta="Contraseña actual"
                        tipo="password"
                        name="contrasenia_actual"
                        value={contrasenias.contrasenia_actual}
                        onChange={handleContrasenia}
                        error={erroresContrasenia.contrasenia_actual}
                    />

                    <CampoFormulario
                        etiqueta="Nueva contraseña"
                        tipo="password"
                        name="contrasenia_nueva"
                        value={contrasenias.contrasenia_nueva}
                        onChange={handleContrasenia}
                        error={erroresContrasenia.contrasenia_nueva}
                    />

                    {mensajeContrasenia && (
                        <p
                            className="body-sm"
                            style={{ marginBottom: "var(--md)" }}
                        >
                            {mensajeContrasenia}
                        </p>
                    )}

                    <Boton
                        tipo={
                            cambiandoContrasenia
                                ? "deshabilitado"
                                : "secundario"
                        }
                        bloque
                        type="submit"
                    >
                        {cambiandoContrasenia
                            ? "Cambiando..."
                            : "Cambiar contraseña"
                        }
                    </Boton>

                </form>

            </div>
        </div>
    )
}

export default MiCuenta