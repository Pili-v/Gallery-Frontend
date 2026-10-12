// Ingresar — Área 1 · Cuenta
// Esta pantalla está en docs/maquetas.html: miralá antes de escribirla.
// Los componentes compartidos ya están hechos en src/components.
import { useState } from "react"
import { Link } from "react-router-dom"

import CampoFormulario from "../components/CampoFormulario"
import Boton from "../components/Boton"

const Login = () => {

    // Estado local del formulario
    const [datos, setDatos] = useState({
        email_usuario: "",
        contrasenia_usuario: ""
    })

    // Estado local para guardar errores
    const [errores, setErrores] = useState({})

    // Se ejecuta cada vez que el usuario escribe en un input
    const handleChange = (e) => {

        const { name, value } = e.target

        setDatos({
            ...datos,
            [name]: value
        })

        // Si el usuario vuelve a escribir,
        // limpiamos el error de ese campo
        setErrores({
            ...errores,
            [name]: null
        })
    }

    // Validamos los campos antes de enviar el formulario
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

    // Se ejecuta cuando el usuario presiona Ingresar
    const handleSubmit = (e) => {

        // Evita que el formulario recargue la página
        e.preventDefault()

        if (!validar()) {
            return
        }

        // Por ahora solamente mostramos los datos.
        // La conexión con el backend se agregará más adelante.
        console.log("Datos del login:", datos)
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

                    <Boton
                        tipo="primario"
                        bloque
                        type="submit"
                    >
                        Ingresar
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