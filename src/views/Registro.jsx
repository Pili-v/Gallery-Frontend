// Crear cuenta — Área 1 · Cuenta
// Esta pantalla está en docs/maquetas.html: miralá antes de escribirla.
// Los componentes compartidos ya están hechos en src/components.

import { useState } from "react"
import { Link } from "react-router-dom"

import CampoFormulario from "../components/CampoFormulario"
import Boton from "../components/Boton"

const Registro = () => {

    const [datos, setDatos] = useState({
        nombre_usuario: "",
        nombre_persona: "",
        apellido_persona: "",
        email_usuario: "",
        telefono_usuario: "",
        contrasenia_usuario: ""
    })

    const [errores, setErrores] = useState({})

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

        // Por ahora no se conecta al backend.
        // Solo verificamos que el formulario guarde correctamente los datos.
        console.log("Datos del registro:", datos)
    }

    return (
        <div className="seccion">
            <div className="contenido col-media">

                <h1 className="headline-lg centro">
                    Crear cuenta
                </h1>

                <p
                    className="body-lg muted centro"
                    style={{ margin: "var(--xs) 0 var(--xl)" }}
                >
                    Completá tus datos para registrarte.
                </p>

                <form
                    className="cartela"
                    style={{ padding: "var(--lg)" }}
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
                        Crear cuenta
                    </Boton>

                </form>

                <p
                    className="body-sm centro muted"
                    style={{ marginTop: "var(--md)" }}
                >
                    ¿Ya tenés cuenta?{" "}
                    <Link
                        to="/login"
                        style={{ color: "var(--bordo)" }}
                    >
                        Ingresar
                    </Link>
                </p>

            </div>
        </div>
    )
}

export default Registro
