import { useEffect, useState } from "react"
import { useDispatch, useSelector } from "react-redux"

import CampoFormulario from "../components/CampoFormulario"
import Boton from "../components/Boton"
import Estado from "../components/Estado"

import {
    fetchSesionActual,
    actualizarUsuario,
    actualizarPerfilArtista,
    cambiarContrasenia,
    limpiarErrorSesion
} from "../redux/sesionSlice"


const MiCuenta = () => {
    const dispatch = useDispatch()

    // Datos globales de la sesión administrados por Redux.
    const {
        usuario,
        perfilArtista,
        loading,
        operacion,
        error
    } = useSelector((state) => state.sesion)

    // Nos permite saber qué operación concreta está cargando.
    const cargando = loading && operacion === "cargarSesion"
    const guardando = loading && operacion === "actualizarUsuario"
    const guardandoArtista = loading && operacion === "actualizarArtista"
    const cambiandoContrasenia = loading && operacion === "contrasenia"


    // -------------------------
    // ESTADO LOCAL DEL FORMULARIO
    // -------------------------

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

    const [mensaje, setMensaje] = useState("")
    const [mensajeContrasenia, setMensajeContrasenia] = useState("")

    // Perfil artista: solamente se muestra si el usuario tiene uno.
    const [artista, setArtista] = useState({
        nombre_artistico: "",
        acepta_encargos: true
    })

    const [errorNombreArtistico, setErrorNombreArtistico] = useState("")
    const [mensajeArtista, setMensajeArtista] = useState("")

    // Estado puramente visual de esta pantalla.
    const [seccion, setSeccion] = useState("datos")


    // -------------------------
    // CARGAR SESIÓN
    // -------------------------

    useEffect(() => {
        // Pedimos al backend los datos actuales del usuario.
        dispatch(fetchSesionActual())
    }, [dispatch])


    // Cuando cambia el usuario global de Redux,
    // sincronizamos los campos locales del formulario.
    useEffect(() => {
        if (!usuario) {
            return
        }

        setDatos({
            nombre_usuario: usuario.nombre_usuario ?? "",
            nombre_persona: usuario.nombre_persona ?? "",
            apellido_persona: usuario.apellido_persona ?? "",
            email_usuario: usuario.email_usuario ?? "",
            telefono_usuario: usuario.telefono_usuario ?? ""
        })
    }, [usuario])


    // Lo mismo para el perfil de artista.
    useEffect(() => {
        if (!perfilArtista) {
            return
        }

        setArtista({
            nombre_artistico: perfilArtista.nombre_artistico ?? "",
            acepta_encargos: perfilArtista.acepta_encargos
        })
    }, [perfilArtista])


    const tieneArtista = perfilArtista !== null


    // -------------------------
    // VALIDACIONES
    // -------------------------

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

        setMensaje("")

        // Limpia errores anteriores almacenados en Redux.
        dispatch(limpiarErrorSesion())
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


    // -------------------------
    // ACTUALIZAR DATOS PERSONALES
    // -------------------------

    const handleSubmit = (e) => {
        e.preventDefault()

        if (!validar()) {
            return
        }

        setMensaje("")
        dispatch(limpiarErrorSesion())

        // Redux se encarga del PATCH y de actualizar el usuario global.
        dispatch(actualizarUsuario(datos)).then((resultado) => {
            if (actualizarUsuario.fulfilled.match(resultado)) {
                setMensaje(
                    "Los cambios se guardaron correctamente."
                )
            }
        })
    }


    // -------------------------
    // ACTUALIZAR PERFIL ARTISTA
    // -------------------------

    const handleArtista = (e) => {
        e.preventDefault()

        if (guardandoArtista) {
            return
        }

        if (artista.nombre_artistico.trim() === "") {
            setErrorNombreArtistico(
                "El nombre artístico es obligatorio"
            )
            return
        }

        setErrorNombreArtistico("")
        setMensajeArtista("")
        dispatch(limpiarErrorSesion())

        const datosArtista = {
            nombre_artistico: artista.nombre_artistico.trim(),
            acepta_encargos: artista.acepta_encargos
        }

        // El thunk hace el PATCH y actualiza perfilArtista en Redux.
        dispatch(actualizarPerfilArtista(datosArtista)).then(
            (resultado) => {
                if (
                    actualizarPerfilArtista.fulfilled.match(
                        resultado
                    )
                ) {
                    setMensajeArtista(
                        "El perfil de artista se guardó correctamente."
                    )
                }
            }
        )
    }


    // -------------------------
    // CAMBIAR CONTRASEÑA
    // -------------------------

    const handleCambioContrasenia = (e) => {
        e.preventDefault()

        if (!validarContrasenia()) {
            return
        }

        setMensajeContrasenia("")
        dispatch(limpiarErrorSesion())

        dispatch(cambiarContrasenia(contrasenias)).then(
            (resultado) => {
                if (
                    cambiarContrasenia.fulfilled.match(
                        resultado
                    )
                ) {
                    setContrasenias({
                        contrasenia_actual: "",
                        contrasenia_nueva: ""
                    })

                    setMensajeContrasenia(
                        "La contraseña se cambió correctamente."
                    )
                }
            }
        )
    }


    // -------------------------
    // PANTALLA DE CARGA
    // -------------------------

    if (cargando && !usuario) {
        return (
            <div className="seccion">
                <div className="contenido col-media">
                    <Estado tipo="cargando" />
                </div>
            </div>
        )
    }


    // -------------------------
    // SECCIONES
    // -------------------------

    const secciones = [
        {
            clave: "datos",
            nombre: "Datos personales"
        }
    ]

    if (tieneArtista) {
        secciones.push({
            clave: "artista",
            nombre: "Perfil de artista"
        })
    }

    secciones.push({
        clave: "contrasenia",
        nombre: "Contraseña"
    })


    return (
        <div className="seccion">
            <div className="contenido">
                <h1 className="headline-lg titulo-oculto">
                    Mi cuenta
                </h1>

                <p className="body-lg muted titulo-oculto">
                    Consultá y actualizá tus datos personales.
                </p>

                <div className="panel-lista cuenta-panel">

                    {/* Menú local de secciones de Mi Cuenta. */}
                    <nav
                        className="cartela pad-lg pegado-arriba panel-lateral"
                        aria-label="Secciones de la cuenta"
                    >
                        <div className="panel-lateral-vista">
                            {secciones.map((item) => (
                                <button
                                    key={item.clave}
                                    type="button"
                                    className={
                                        "chip" +
                                        (
                                            seccion === item.clave
                                                ? " activo"
                                                : ""
                                        )
                                    }
                                    aria-pressed={
                                        seccion === item.clave
                                    }
                                    onClick={() =>
                                        setSeccion(item.clave)
                                    }
                                >
                                    {item.nombre}
                                </button>
                            ))}
                        </div>
                    </nav>


                    <div className="min-ancho-0">

                        {error && (
                            <Estado
                                tipo="error"
                                mensaje={error}
                            />
                        )}


                        {/* -------------------------
                            DATOS PERSONALES
                        ------------------------- */}

                        {seccion === "datos" && (
                            <form
                                className={
                                    "cartela pad-lg" +
                                    (error ? " mt-md" : "")
                                }
                                onSubmit={handleSubmit}
                            >
                                <h2 className="headline-sm mb-md">
                                    Datos personales
                                </h2>

                                <div className="fila-campos">
                                    <CampoFormulario
                                        etiqueta="Nombre"
                                        name="nombre_persona"
                                        value={datos.nombre_persona}
                                        onChange={handleChange}
                                        error={
                                            errores.nombre_persona
                                        }
                                    />

                                    <CampoFormulario
                                        etiqueta="Apellido"
                                        name="apellido_persona"
                                        value={
                                            datos.apellido_persona
                                        }
                                        onChange={handleChange}
                                        error={
                                            errores.apellido_persona
                                        }
                                    />
                                </div>


                                <div className="fila-campos">
                                    <CampoFormulario
                                        etiqueta="Nombre de usuario"
                                        name="nombre_usuario"
                                        value={
                                            datos.nombre_usuario
                                        }
                                        onChange={handleChange}
                                        error={
                                            errores.nombre_usuario
                                        }
                                    />

                                    <CampoFormulario
                                        etiqueta="Teléfono"
                                        tipo="tel"
                                        name="telefono_usuario"
                                        value={
                                            datos.telefono_usuario
                                        }
                                        onChange={handleChange}
                                        maxLength={10}
                                        inputMode="numeric"
                                        error={
                                            errores.telefono_usuario
                                        }
                                    />
                                </div>


                                <CampoFormulario
                                    etiqueta="Email"
                                    tipo="email"
                                    name="email_usuario"
                                    value={datos.email_usuario}
                                    onChange={handleChange}
                                    error={
                                        errores.email_usuario
                                    }
                                />


                                {mensaje && (
                                    <p className="body-sm mb-md">
                                        {mensaje}
                                    </p>
                                )}


                                <div className="fila al-final">
                                    <Boton
                                        tipo={
                                            guardando
                                                ? "deshabilitado"
                                                : "primario"
                                        }
                                        type="submit"
                                    >
                                        {guardando
                                            ? "Guardando..."
                                            : "Guardar cambios"}
                                    </Boton>
                                </div>
                            </form>
                        )}


                        {/* -------------------------
                            PERFIL ARTISTA
                        ------------------------- */}

                        {seccion === "artista" &&
                            tieneArtista && (
                                <form
                                    className="cartela pad-lg"
                                    onSubmit={handleArtista}
                                >
                                    <h2 className="headline-sm mb-md">
                                        Perfil de artista
                                    </h2>

                                    <CampoFormulario
                                        etiqueta="Nombre artístico"
                                        name="nombre_artistico"
                                        value={
                                            artista.nombre_artistico
                                        }
                                        maxLength={150}
                                        onChange={(e) => {
                                            setArtista({
                                                ...artista,
                                                nombre_artistico:
                                                    e.target.value
                                            })

                                            setErrorNombreArtistico("")
                                            setMensajeArtista("")
                                            dispatch(
                                                limpiarErrorSesion()
                                            )
                                        }}
                                        error={
                                            errorNombreArtistico
                                        }
                                    />


                                    <label className="body-sm mb-xs bloque">
                                        <input
                                            type="checkbox"
                                            checked={
                                                artista.acepta_encargos
                                            }
                                            onChange={(e) => {
                                                setArtista({
                                                    ...artista,
                                                    acepta_encargos:
                                                        e.target.checked
                                                })

                                                setMensajeArtista("")
                                                dispatch(
                                                    limpiarErrorSesion()
                                                )
                                            }}
                                        />{" "}
                                        Quiero recibir encargos de
                                        obras a medida
                                    </label>


                                    <p className="body-sm muted mb-md">
                                        Si lo desactivás, no vas a
                                        figurar como disponible para
                                        encargos nuevos. Los encargos
                                        que ya tenés en curso los
                                        podés seguir gestionando y
                                        cerrando.
                                    </p>


                                    {mensajeArtista && (
                                        <p className="body-sm mb-md">
                                            {mensajeArtista}
                                        </p>
                                    )}


                                    <div className="fila al-final">
                                        <Boton
                                            tipo={
                                                guardandoArtista
                                                    ? "deshabilitado"
                                                    : "primario"
                                            }
                                            type="submit"
                                        >
                                            {guardandoArtista
                                                ? "Guardando..."
                                                : "Guardar perfil de artista"}
                                        </Boton>
                                    </div>
                                </form>
                            )}


                        {/* -------------------------
                            CONTRASEÑA
                        ------------------------- */}

                        {seccion === "contrasenia" && (
                            <form
                                className="cartela pad-lg"
                                onSubmit={
                                    handleCambioContrasenia
                                }
                            >
                                <h2 className="headline-sm mb-md">
                                    Cambiar contraseña
                                </h2>

                                <CampoFormulario
                                    etiqueta="Contraseña actual"
                                    tipo="password"
                                    name="contrasenia_actual"
                                    value={
                                        contrasenias.contrasenia_actual
                                    }
                                    onChange={
                                        handleContrasenia
                                    }
                                    error={
                                        erroresContrasenia.contrasenia_actual
                                    }
                                />

                                <CampoFormulario
                                    etiqueta="Nueva contraseña"
                                    tipo="password"
                                    name="contrasenia_nueva"
                                    value={
                                        contrasenias.contrasenia_nueva
                                    }
                                    onChange={
                                        handleContrasenia
                                    }
                                    error={
                                        erroresContrasenia.contrasenia_nueva
                                    }
                                />


                                {mensajeContrasenia && (
                                    <p className="body-sm mb-md">
                                        {
                                            mensajeContrasenia
                                        }
                                    </p>
                                )}


                                <div className="fila al-final">
                                    <Boton
                                        tipo={
                                            cambiandoContrasenia
                                                ? "deshabilitado"
                                                : "primario"
                                        }
                                        type="submit"
                                    >
                                        {cambiandoContrasenia
                                            ? "Cambiando..."
                                            : "Cambiar contraseña"}
                                    </Boton>
                                </div>
                            </form>
                        )}

                    </div>
                </div>
            </div>
        </div>
    )
}

export default MiCuenta
