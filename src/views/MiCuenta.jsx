// Mi cuenta — Área 1 · Cuenta
// Esta pantalla está en docs/maquetas.html: miralá antes de escribirla.
// Los componentes compartidos ya están hechos en src/components.

import { useState } from "react"

import CampoFormulario from "../components/CampoFormulario"
import Boton from "../components/Boton"

const MiCuenta = () => {

    // Datos simulados por ahora.
    // Más adelante estos datos vendrán del backend.
    const [datos, setDatos] = useState({
        nombre_usuario: "elcrack",
        nombre_persona: "Thiago",
        apellido_persona: "Brizuela",
        email_usuario: "thiagui@gmail.com",
        telefono_usuario: "115453345"
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

        setErrores(nuevosErrores)

        return Object.keys(nuevosErrores).length === 0
    }

    const handleSubmit = (e) => {
        e.preventDefault()

        if (!validar()) {
            return
        }

        // Por ahora no actualiza el backend.
        // Solo verificamos que los datos editados estén en el estado.
        console.log("Datos actualizados de Mi Cuenta:", datos)
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

                    <Boton
                        tipo="primario"
                        bloque
                        type="submit"
                    >
                        Guardar cambios
                    </Boton>

                </form>

            </div>
        </div>
    )
}

export default MiCuenta
