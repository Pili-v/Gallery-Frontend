import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useDispatch, useSelector } from "react-redux"

import CampoFormulario from "../components/CampoFormulario"
import Boton from "../components/Boton"

import {
    registrarUsuario,
    limpiarErrorSesion
} from "../redux/sesionSlice"


const Registro = () => {
    const navigate = useNavigate()
    const dispatch = useDispatch()

    // Leemos desde Redux el estado global relacionado con el registro.
    const { loading, operacion, error } = useSelector(
        (state) => state.sesion
    )

    const cargando = loading && operacion === "registro"

    // Los datos del formulario siguen siendo estado local.
    const [datos, setDatos] = useState({
        nombre_usuario: "",
        nombre_persona: "",
        apellido_persona: "",
        email_usuario: "",
        telefono_usuario: "",
        contrasenia_usuario: ""
    })

    const [errores, setErrores] = useState({})


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

        // Limpia un posible error anterior guardado en Redux.
        dispatch(limpiarErrorSesion())
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

        if (!datos.contrasenia_usuario.trim()) {
            nuevosErrores.contrasenia_usuario =
                "Ingresá una contraseña."
        }

        setErrores(nuevosErrores)

        return Object.keys(nuevosErrores).length === 0
    }


    const handleSubmit = (e) => {
        e.preventDefault()

        if (!validar()) {
            return
        }

        dispatch(limpiarErrorSesion())

        // La vista solamente despacha la acción.
        // El thunk registrarUsuario se encarga de hablar con el backend,
        // recibir el token y cargar la sesión.
        dispatch(registrarUsuario(datos)).then((resultado) => {
            if (registrarUsuario.fulfilled.match(resultado)) {
                navigate("/")
            }
        })
    }


    return (
        <div className="seccion">
            <div className="contenido col-acceso">
                <h1 className="headline-lg centro">
                    Crear cuenta
                </h1>

                <p className="body-lg muted centro">
                    Completá tus datos para registrarte.
                </p>

                <form
                    className="cartela pad-lg"
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

                    <CampoFormulario
                        etiqueta="Contraseña"
                        tipo="password"
                        name="contrasenia_usuario"
                        value={datos.contrasenia_usuario}
                        onChange={handleChange}
                        error={errores.contrasenia_usuario}
                    />

                    {error && (
                        <p className="campo-error body-sm mb-md">
                            {error}
                        </p>
                    )}

                    <Boton
                        tipo={cargando ? "deshabilitado" : "primario"}
                        bloque
                        type="submit"
                    >
                        {cargando
                            ? "Creando cuenta..."
                            : "Crear cuenta"}
                    </Boton>
                </form>

                <p className="body-sm centro muted mt-md">
                    ¿Ya tenés cuenta?{" "}
                    <Link
                        className="texto-bordo"
                        to="/login"
                    >
                        Ingresar
                    </Link>
                </p>
            </div>
        </div>
    )
}

export default Registro