import { useEffect, useState } from "react"

import CampoFormulario from "../components/CampoFormulario"
import Boton from "../components/Boton"
import Estado from "../components/Estado"

import { api } from "../api/cliente"
import { getToken, getUsuario, getPerfilArtista, guardarSesion } from "../api/sesion"

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

    // Perfil de artista: solo lo tienen los artistas (la cuenta trae perfil_artista); para el resto no se muestra.
    const [tieneArtista, setTieneArtista] = useState(false)
    const [artista, setArtista] = useState({ nombre_artistico: "", acepta_encargos: true })
    const [errorNombreArtistico, setErrorNombreArtistico] = useState("")
    const [guardandoArtista, setGuardandoArtista] = useState(false)
    const [mensajeArtista, setMensajeArtista] = useState("")

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

    useEffect(() => {
        api.get("/api/usuarios/me")
            .then((perfil) => {
                setDatos({
                    nombre_usuario: perfil.usuario.nombre_usuario ?? "",

                    nombre_persona: perfil.usuario.nombre_persona ?? "",

                    apellido_persona: perfil.usuario.apellido_persona ?? "",

                    email_usuario: perfil.usuario.email_usuario ?? "",

                    telefono_usuario: perfil.usuario.telefono_usuario ?? ""
                })

                if (perfil.perfil_artista) {
                    setTieneArtista(true)
                    setArtista({
                        nombre_artistico: perfil.perfil_artista.nombre_artistico ?? "",
                        acepta_encargos: perfil.perfil_artista.acepta_encargos
                    })
                }
            })
            .catch((e) => {
                setErrorGeneral(e.message || "No se pudo cargar la cuenta.")
            })
            .finally(() => {
                setCargando(false)
            })
    }, [])

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

    const validarContrasenia = () => {
        const nuevosErrores = {}

        if (!contrasenias.contrasenia_actual.trim()) {
            nuevosErrores.contrasenia_actual = "Ingresá tu contraseña actual."
        }

        if (!contrasenias.contrasenia_nueva.trim()) {
            nuevosErrores.contrasenia_nueva = "Ingresá la nueva contraseña."
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

        api.patch("/api/usuarios/me", datos)
            .then((usuarioActualizado) => {
                // El back responde con el usuario ya guardado: alcanza para actualizar la sesión, sin volver a pedir el perfil.
                guardarSesion(getToken(), { usuario: usuarioActualizado, perfil_artista: getPerfilArtista() })

                setMensaje("Los cambios se guardaron correctamente.")
            })
            .catch((e) => {
                setErrorGeneral(e.message || "No se pudieron guardar los cambios.")
            })
            .finally(() => {
                setGuardando(false)
            })
    }

    // Guarda el nombre artístico y si acepta encargos. Dejar de aceptar solo afecta a los encargos NUEVOS:
    // los que ya están en curso se pueden seguir gestionando y cerrando (el back valida esto al crearlos).
    const handleArtista = (e) => {
        e.preventDefault()

        if (guardandoArtista) {
            return
        }

        if (artista.nombre_artistico.trim() === "") {
            setErrorNombreArtistico("El nombre artístico es obligatorio")
            return
        }

        setGuardandoArtista(true)
        setErrorNombreArtistico("")
        setErrorGeneral("")
        setMensajeArtista("")

        api.patch("/api/artistas/me", {
            nombre_artistico: artista.nombre_artistico.trim(),
            acepta_encargos: artista.acepta_encargos
        })
            .then((perfilActualizado) => {
                // Igual que arriba: el back devuelve el perfil de artista ya guardado.
                guardarSesion(getToken(), { usuario: getUsuario(), perfil_artista: perfilActualizado })

                setMensajeArtista("El perfil de artista se guardó correctamente.")
            })
            .catch((e) => {
                setErrorGeneral(e.message || "No se pudo guardar el perfil de artista.")
            })
            .finally(() => {
                setGuardandoArtista(false)
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

        api.patch("/api/usuarios/me/contrasenia", contrasenias)
            .then(() => {
                setContrasenias({
                    contrasenia_actual: "",
                    contrasenia_nueva: ""
                })

                setMensajeContrasenia("La contraseña se cambió correctamente.")
            })
            .catch((e) => {
                setErrorGeneral(e.message || "No se pudo cambiar la contraseña.")
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
                <h1 className="headline-lg centro">Mi cuenta</h1>

                <p className="body-lg muted centro">Consultá y actualizá tus datos personales.</p>

                {errorGeneral && <Estado tipo="error" mensaje={errorGeneral} />}

                <form
                    className="cartela"
                    style={{
                        padding: "var(--lg)",
                        marginTop: errorGeneral ? "var(--md)" : 0
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
                        <p className="body-sm" style={{ marginBottom: "var(--md)" }}>
                            {mensaje}
                        </p>
                    )}

                    <Boton tipo={guardando ? "deshabilitado" : "primario"} bloque type="submit">
                        {guardando ? "Guardando..." : "Guardar cambios"}
                    </Boton>
                </form>

                {tieneArtista && (
                    <form
                        className="cartela"
                        style={{
                            padding: "var(--lg)",
                            marginTop: "var(--xl)"
                        }}
                        onSubmit={handleArtista}
                    >
                        <h2 className="headline-sm" style={{ marginBottom: "var(--md)" }}>
                            Perfil de artista
                        </h2>

                        <CampoFormulario
                            etiqueta="Nombre artístico"
                            name="nombre_artistico"
                            value={artista.nombre_artistico}
                            maxLength={150}
                            onChange={(e) => setArtista({ ...artista, nombre_artistico: e.target.value })}
                            error={errorNombreArtistico}
                        />

                        <label className="body-sm" style={{ display: "block", marginBottom: "var(--xs)" }}>
                            <input
                                type="checkbox"
                                checked={artista.acepta_encargos}
                                onChange={(e) => setArtista({ ...artista, acepta_encargos: e.target.checked })}
                            />{" "}
                            Quiero recibir encargos de obras a medida
                        </label>

                        <p className="body-sm muted" style={{ marginBottom: "var(--md)" }}>
                            Si lo desactivás, no vas a figurar como disponible para encargos nuevos. Los encargos que ya
                            tenés en curso los podés seguir gestionando y cerrando.
                        </p>

                        {mensajeArtista && (
                            <p className="body-sm" style={{ marginBottom: "var(--md)" }}>
                                {mensajeArtista}
                            </p>
                        )}

                        <Boton tipo={guardandoArtista ? "deshabilitado" : "primario"} bloque type="submit">
                            {guardandoArtista ? "Guardando..." : "Guardar perfil de artista"}
                        </Boton>
                    </form>
                )}

                <form
                    className="cartela"
                    style={{
                        padding: "var(--lg)",
                        marginTop: "var(--xl)"
                    }}
                    onSubmit={handleCambioContrasenia}
                >
                    <h2 className="headline-sm" style={{ marginBottom: "var(--md)" }}>
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
                        <p className="body-sm" style={{ marginBottom: "var(--md)" }}>
                            {mensajeContrasenia}
                        </p>
                    )}

                    <Boton tipo={cambiandoContrasenia ? "deshabilitado" : "secundario"} bloque type="submit">
                        {cambiandoContrasenia ? "Cambiando..." : "Cambiar contraseña"}
                    </Boton>
                </form>
            </div>
        </div>
    )
}

export default MiCuenta
