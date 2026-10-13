import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"

import CampoFormulario from "../components/CampoFormulario"
import Boton from "../components/Boton"

import { api } from "../api/cliente"
import { guardarSesion } from "../api/sesion"

const Login = () => {

    const navigate = useNavigate()

    const [datos, setDatos] = useState({
        email_usuario: "",
        contrasenia_usuario: ""
    })

    const [errores, setErrores] = useState({})
    const [cargando, setCargando] = useState(false)
    const [errorGeneral, setErrorGeneral] = useState("")

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

        setErrorGeneral("")
    }

    const validar = () => {

        const nuevosErrores = {}

        if (!datos.email_usuario.trim()) {
            nuevosErrores.email_usuario = "Ingresá tu email."
        }

        if (!datos.contrasenia_usuario.trim()) {
            nuevosErrores.contrasenia_usuario = "Ingresá tu contraseña."
        }

        setErrores(nuevosErrores)

        return Object.keys(nuevosErrores).length === 0
    }

    const handleSubmit = async (e) => {

        e.preventDefault()

        if (!validar()) {
            return
        }

        setCargando(true)
        setErrorGeneral("")

        try {

            // 1. Mandamos email y contraseña al backend.
            const respuesta = await api.post(
                "/api/v1/auth/authenticate",
                datos
            )

            // 2. El backend devuelve el token.
            const token = respuesta.access_token

            // Lo guardamos temporalmente para que cliente.js
            // pueda mandarlo en el siguiente GET.
            localStorage.setItem("token", token)

            // 3. Pedimos los datos reales del usuario logueado.
            const perfil = await api.get("/api/usuarios/me")

            // 4. Guardamos la sesión completa.
            guardarSesion(token, perfil.usuario)

            // 5. Login terminado.
            navigate("/")

        } catch (e) {

            setErrorGeneral(
                e.message || "No se pudo iniciar sesión."
            )

        } finally {

            setCargando(false)
        }
    }

    return (
        <div className="seccion">
            <div className="contenido col-angosta">

                <h1 className="headline-lg centro">
                    Ingresar
                </h1>

                <p
                    className="body-lg muted centro"
                    style={{ margin: "var(--xs) 0 var(--xl)" }}
                >
                    Entrá para comprar o para publicar tu obra.
                </p>

                <form
                    className="cartela"
                    style={{ padding: "var(--lg)" }}
                    onSubmit={handleSubmit}
                >

                    <CampoFormulario
                        etiqueta="Email"
                        tipo="email"
                        name="email_usuario"
                        value={datos.email_usuario}
                        onChange={handleChange}
                        error={errores.email_usuario}
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
                        <p
                            className="campo-error body-sm"
                            style={{ marginBottom: "var(--md)" }}
                        >
                            {errorGeneral}
                        </p>
                    )}

                    <Boton
                        tipo={cargando ? "deshabilitado" : "primario"}
                        bloque
                        type="submit"
                    >
                        {cargando ? "Ingresando..." : "Ingresar"}
                    </Boton>

                </form>

                <p
                    className="body-sm centro muted"
                    style={{ marginTop: "var(--md)" }}
                >
                    ¿No tenés cuenta?{" "}
                    <Link
                        to="/registro"
                        style={{ color: "var(--bordo)" }}
                    >
                        Crear una
                    </Link>
                </p>

            </div>
        </div>
    )
}

export default Login