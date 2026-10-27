import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"

import CampoFormulario from "../components/CampoFormulario"
import Boton from "../components/Boton"

import { api } from "../api/cliente"
import { guardarSesion } from "../api/sesion"

const Registro = () => {
    const navigate = useNavigate()

    const [datos, setDatos] = useState({
        nombre_usuario: "",
        nombre_persona: "",
        apellido_persona: "",
        email_usuario: "",
        telefono_usuario: "",
        contrasenia_usuario: ""
    })

    const [errores, setErrores] = useState({})
    const [cargando, setCargando] = useState(false)
    const [errorGeneral, setErrorGeneral] = useState("")

    const limpiarNombre = (texto) => {
        const soloLetras = texto.replace(/[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s]/g, "")

        return soloLetras
            .split(" ")
            .map((palabra) => {
                if (!palabra) {
                    return ""
                }

                return palabra.charAt(0).toUpperCase() + palabra.slice(1).toLowerCase()
            })
            .join(" ")
    }

    const handleChange = (e) => {
        const { name, value } = e.target

        let nuevoValor = value

        if (name === "nombre_persona" || name === "apellido_persona") {
            nuevoValor = limpiarNombre(value)
        }

        if (name === "telefono_usuario") {
            nuevoValor = value.replace(/\D/g, "").slice(0, 10)
        }

        setDatos({
            ...datos,
            [name]: nuevoValor
        })

        setErrores({
            ...errores,
            [name]: null
        })

        setErrorGeneral("")
    }

    const validar = () => {
        const nuevosErrores = {}

        if (!datos.nombre_usuario.trim()) {
            nuevosErrores.nombre_usuario = "Ingresá un nombre de usuario."
        }

        if (!datos.nombre_persona.trim()) {
            nuevosErrores.nombre_persona = "Ingresá tu nombre."
        }

        if (!datos.apellido_persona.trim()) {
            nuevosErrores.apellido_persona = "Ingresá tu apellido."
        }

        if (!datos.email_usuario.trim()) {
            nuevosErrores.email_usuario = "Ingresá tu email."
        }

        if (!datos.telefono_usuario.trim()) {
            nuevosErrores.telefono_usuario = "Ingresá tu teléfono."
        }

        if (!datos.contrasenia_usuario.trim()) {
            nuevosErrores.contrasenia_usuario = "Ingresá una contraseña."
        }

        setErrores(nuevosErrores)

        return Object.keys(nuevosErrores).length === 0
    }

    const handleSubmit = (e) => {
        e.preventDefault()

        if (!validar()) {
            return
        }

        setCargando(true)
        setErrorGeneral("")

        api.post("/api/v1/auth/register", datos)
            .then((respuesta) => {
                const token = respuesta.access_token

                localStorage.setItem("token", token)

                return api.get("/api/usuarios/me")
            })
            .then((perfil) => {
                const token = localStorage.getItem("token")

                guardarSesion(token, perfil)

                navigate("/")
            })
            .catch((e) => {
                setErrorGeneral(e.message || "No se pudo crear la cuenta.")
            })
            .finally(() => {
                setCargando(false)
            })
    }

    return (
        <div className="seccion">
            <div className="contenido col-media">
                <h1 className="headline-lg centro">Crear cuenta</h1>

                <p className="body-lg muted centro">Completá tus datos para registrarte.</p>

                <form className="cartela" style={{ padding: "var(--lg)" }} onSubmit={handleSubmit}>
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

                    <CampoFormulario
                        etiqueta="Contraseña"
                        tipo="password"
                        name="contrasenia_usuario"
                        value={datos.contrasenia_usuario}
                        onChange={handleChange}
                        error={errores.contrasenia_usuario}
                    />

                    {errorGeneral && (
                        <p className="campo-error body-sm" style={{ marginBottom: "var(--md)" }}>
                            {errorGeneral}
                        </p>
                    )}

                    <Boton tipo={cargando ? "deshabilitado" : "primario"} bloque type="submit">
                        {cargando ? "Creando cuenta..." : "Crear cuenta"}
                    </Boton>
                </form>

                <p className="body-sm centro muted" style={{ marginTop: "var(--md)" }}>
                    ¿Ya tenés cuenta?{" "}
                    <Link to="/login" style={{ color: "var(--bordo)" }}>
                        Ingresar
                    </Link>
                </p>
            </div>
        </div>
    )
}

export default Registro
