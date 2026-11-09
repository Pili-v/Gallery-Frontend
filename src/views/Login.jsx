import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useDispatch, useSelector } from "react-redux"

import CampoFormulario from "../components/CampoFormulario"
import Boton from "../components/Boton"

import {
    iniciarSesion,
    limpiarErrorSesion
} from "../redux/sesionSlice"


const Login = () => {
    const navigate = useNavigate()
    const dispatch = useDispatch()

    // Leemos del estado global de sesión el estado de carga y los errores.
    const { loading, operacion, error } = useSelector(
        (state) => state.sesion
    )

    const cargando = loading && operacion === "login"

    // Los datos del formulario siguen siendo estado local.
    const [datos, setDatos] = useState({
        email_usuario: "",
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

        // Limpia un posible error anterior de Redux cuando el usuario vuelve a escribir.
        dispatch(limpiarErrorSesion())
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


    const handleSubmit = (e) => {
        e.preventDefault()

        if (!validar()) {
            return
        }

        dispatch(limpiarErrorSesion())

        // La vista solo despacha la acción.
        // El thunk se encarga de autenticarse y obtener los datos del usuario.
        dispatch(iniciarSesion(datos)).then((resultado) => {
            if (iniciarSesion.fulfilled.match(resultado)) {
                navigate("/")
            }
        })
    }


    return (
        <div className="seccion">
            <div className="contenido col-acceso">
                <h1 className="headline-lg centro">
                    Ingresar
                </h1>

                <p className="body-lg muted centro">
                    Entrá para comprar o para publicar tu obra.
                </p>

                <form
                    className="cartela pad-lg"
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
                        {cargando ? "Ingresando..." : "Ingresar"}
                    </Boton>
                </form>

                <p className="body-sm centro muted mt-md">
                    ¿No tenés cuenta?{" "}
                    <Link
                        className="texto-bordo"
                        to="/registro"
                    >
                        Crear una
                    </Link>
                </p>
            </div>
        </div>
    )
}

export default Login
