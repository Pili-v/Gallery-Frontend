import { useEffect, useState } from "react"

import { api, lista, subirArchivo } from "../api/cliente"
import { pesos } from "../api/formato"

import CampoFormulario from "../components/CampoFormulario"
import Boton from "../components/Boton"
import Estado from "../components/Estado"

const AdminCatalogos = () => {

    const [estilos, setEstilos] = useState([])
    const [tamanios, setTamanios] = useState([])
    const [marcos, setMarcos] = useState([])

    const [archivoMarco, setArchivoMarco] = useState(null)

    const [nuevoEstilo, setNuevoEstilo] = useState("")

    const [nuevoTamanio, setNuevoTamanio] = useState({
        nombre_tamanio: "",
        ancho_lienzo: "",
        largo_lienzo: ""
    })

    const [nuevoMarco, setNuevoMarco] = useState({
        nombre_marco: "",
        color_marco: "",
        precio_marco: ""
    })

    const [cargando, setCargando] = useState(true)
    const [error, setError] = useState("")
    const [guardando, setGuardando] = useState("")

    const [errorTamanio, setErrorTamanio] = useState("")
    const [errorMarco, setErrorMarco] = useState("")

    const capitalizarPalabras = (texto) => {

        return texto
            .toLowerCase()
            .split(" ")
            .map((palabra) => {

                if (!palabra) {
                    return ""
                }

                return (
                    palabra.charAt(0).toUpperCase() +
                    palabra.slice(1)
                )
            })
            .join(" ")
    }

    const limpiarSoloTexto = (texto) => {

        const sinNumerosNiSimbolos =
            texto.replace(
                /[^A-Za-zÁÉÍÓÚáéíóúÜüÑñ\s]/g,
                ""
            )

        return capitalizarPalabras(
            sinNumerosNiSimbolos
        )
    }

    const limpiarTextoConNumeros = (texto) => {

        const limpio =
            texto.replace(
                /[^A-Za-zÁÉÍÓÚáéíóúÜüÑñ0-9\s]/g,
                ""
            )

        return capitalizarPalabras(
            limpio
        )
    }

    const cargarCatalogos = () => {

        setCargando(true)
        setError("")

        Promise.all([
            api.get("/api/estilos"),
            api.get("/api/tamanios-lienzo"),
            api.get("/api/marcos")
        ])
            .then((respuestas) => {

                setEstilos(
                    lista(respuestas[0])
                )

                setTamanios(
                    lista(respuestas[1])
                )

                setMarcos(
                    lista(respuestas[2])
                )
            })
            .catch((e) => {

                setError(e.message)
            })
            .finally(() => {

                setCargando(false)
            })
    }

    useEffect(() => {

        cargarCatalogos()

    }, [])

    const handleEstilo = (e) => {

        setNuevoEstilo(
            limpiarSoloTexto(
                e.target.value
            )
        )
    }

    const crearEstilo = (e) => {

        e.preventDefault()

        if (!nuevoEstilo.trim()) {
            return
        }

        setGuardando("estilo")
        setError("")

        api.post(
            "/api/estilos",
            {
                nombreEstilo:
                    nuevoEstilo.trim()
            }
        )
            .then(() => {

                setNuevoEstilo("")

                return api.get(
                    "/api/estilos"
                )
            })
            .then((respuesta) => {

                setEstilos(
                    lista(respuesta)
                )
            })
            .catch((e) => {

                setError(e.message)
            })
            .finally(() => {

                setGuardando("")
            })
    }

    const handleTamanio = (e) => {

        const { name, value } = e.target

        let nuevoValor = value

        if (name === "nombre_tamanio") {

            nuevoValor =
                limpiarTextoConNumeros(
                    value
                )
        }

        if (
            name === "ancho_lienzo" ||
            name === "largo_lienzo"
        ) {

            if (
                value !== "" &&
                Number(value) < 0
            ) {
                nuevoValor = ""
            }
        }

        setNuevoTamanio({
            ...nuevoTamanio,
            [name]: nuevoValor
        })

        setErrorTamanio("")
    }

    const crearTamanio = (e) => {

        e.preventDefault()

        const ancho =
            Number(
                nuevoTamanio.ancho_lienzo
            )

        const largo =
            Number(
                nuevoTamanio.largo_lienzo
            )

        if (
            !nuevoTamanio.nombre_tamanio.trim()
        ) {

            setErrorTamanio(
                "Ingresá un nombre para el tamaño."
            )

            return
        }

        if (
            ancho <= 0 ||
            largo <= 0
        ) {

            setErrorTamanio(
                "El ancho y el largo deben ser mayores a 0."
            )

            return
        }

        setGuardando("tamanio")
        setError("")
        setErrorTamanio("")

        api.post(
            "/api/tamanios-lienzo",
            {
                nombre_tamanio:
                    nuevoTamanio
                        .nombre_tamanio
                        .trim(),

                ancho_lienzo:
                    ancho,

                largo_lienzo:
                    largo
            }
        )
            .then(() => {

                setNuevoTamanio({
                    nombre_tamanio: "",
                    ancho_lienzo: "",
                    largo_lienzo: ""
                })

                return api.get(
                    "/api/tamanios-lienzo"
                )
            })
            .then((respuesta) => {

                setTamanios(
                    lista(respuesta)
                )
            })
            .catch((e) => {

                setError(e.message)
            })
            .finally(() => {

                setGuardando("")
            })
    }

    const handleMarco = (e) => {

        const { name, value } = e.target

        let nuevoValor = value

        if (
            name === "nombre_marco" ||
            name === "color_marco"
        ) {

            nuevoValor =
                limpiarSoloTexto(
                    value
                )
        }

        if (
            name === "precio_marco" &&
            value !== "" &&
            Number(value) < 0
        ) {

            nuevoValor = ""
        }

        setNuevoMarco({
            ...nuevoMarco,
            [name]: nuevoValor
        })

        setErrorMarco("")
    }

    const crearMarco = (e) => {

        e.preventDefault()

        const precio =
            Number(
                nuevoMarco.precio_marco
            )

        if (
            !nuevoMarco.nombre_marco.trim()
        ) {

            setErrorMarco(
                "Ingresá un nombre para el marco."
            )

            return
        }

        if (
            !nuevoMarco.color_marco.trim()
        ) {

            setErrorMarco(
                "Ingresá un color para el marco."
            )

            return
        }

        if (precio <= 0) {

            setErrorMarco(
                "El precio debe ser mayor a 0."
            )

            return
        }

        if (!archivoMarco) {

            setErrorMarco(
                "Seleccioná una imagen para el marco."
            )

            return
        }

        setGuardando("marco")
        setError("")
        setErrorMarco("")

        const formData =
            new FormData()

        formData.append(
            "nombre_marco",
            nuevoMarco
                .nombre_marco
                .trim()
        )

        formData.append(
            "color_marco",
            nuevoMarco
                .color_marco
                .trim()
        )

        formData.append(
            "precio_marco",
            precio
        )

        formData.append(
            "archivo",
            archivoMarco
        )

        subirArchivo(
            "/api/marcos",
            formData
        )
            .then(() => {

                setNuevoMarco({
                    nombre_marco: "",
                    color_marco: "",
                    precio_marco: ""
                })

                setArchivoMarco(null)

                return api.get(
                    "/api/marcos"
                )
            })
            .then((respuesta) => {

                setMarcos(
                    lista(respuesta)
                )
            })
            .catch((e) => {

                setError(e.message)
            })
            .finally(() => {

                setGuardando("")
            })
    }

    if (cargando) {

        return (
            <div className="seccion">

                <div className="contenido">

                    <Estado
                        tipo="cargando"
                    />

                </div>

            </div>
        )
    }

    return (
        <div className="seccion">

            <div className="contenido">

                <h1 className="headline-lg">
                    Catálogos
                </h1>

                <p
                    className="body-lg muted"
                    style={{
                        margin:
                            "var(--xs) 0 var(--xl)"
                    }}
                >
                    Estilos, tamaños y marcos son del sistema,
                    no de un artista.
                </p>

                {error && (

                    <div
                        style={{
                            marginBottom:
                                "var(--md)"
                        }}
                    >
                        <Estado
                            tipo="error"
                            mensaje={error}
                        />
                    </div>

                )}

                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns:
                            "repeat(3, minmax(0, 1fr))",
                        gap: "var(--xl)",
                        alignItems: "start"
                    }}
                >

                    {/* ESTILOS */}

                    <div
                        className="cartela"
                        style={{
                            padding: "var(--lg)"
                        }}
                    >

                        <h3
                            className="headline-sm"
                            style={{
                                marginBottom:
                                    "var(--md)"
                            }}
                        >
                            Estilos
                        </h3>

                        <div
                            style={{
                                maxHeight: "260px",
                                overflowY: "auto"
                            }}
                        >

                            <table className="tabla">

                                <tbody>

                                    {estilos.map(
                                        (estilo) => (

                                            <tr
                                                key={
                                                    estilo.id
                                                }
                                            >
                                                <td>
                                                    {
                                                        estilo.nombreEstilo
                                                    }
                                                </td>
                                            </tr>

                                        )
                                    )}

                                </tbody>

                            </table>

                        </div>

                        <form
                            onSubmit={crearEstilo}
                            style={{
                                marginTop:
                                    "var(--lg)"
                            }}
                        >

                            <CampoFormulario
                                etiqueta="Nuevo estilo"
                                value={nuevoEstilo}
                                onChange={handleEstilo}
                            />

                            <Boton
                                tipo={
                                    guardando === "estilo"
                                        ? "deshabilitado"
                                        : "primario"
                                }
                                bloque
                                type="submit"
                            >
                                {
                                    guardando === "estilo"
                                        ? "Guardando..."
                                        : "Agregar"
                                }
                            </Boton>

                        </form>

                    </div>

                    {/* TAMAÑOS */}

                    <div
                        className="cartela"
                        style={{
                            padding: "var(--lg)"
                        }}
                    >

                        <h3
                            className="headline-sm"
                            style={{
                                marginBottom:
                                    "var(--md)"
                            }}
                        >
                            Tamaños
                        </h3>

                        <div
                            style={{
                                maxHeight: "260px",
                                overflowY: "auto"
                            }}
                        >

                            <table className="tabla">

                                <tbody>

                                    {tamanios.map(
                                        (tamanio) => (

                                            <tr
                                                key={
                                                    tamanio.id
                                                }
                                            >

                                                <td>
                                                    {
                                                        tamanio.nombre_tamanio
                                                    }
                                                </td>

                                                <td>
                                                    {
                                                        tamanio.ancho_lienzo
                                                    }
                                                    {" × "}
                                                    {
                                                        tamanio.largo_lienzo
                                                    }
                                                    {" cm"}
                                                </td>

                                            </tr>

                                        )
                                    )}

                                </tbody>

                            </table>

                        </div>

                        <form
                            onSubmit={crearTamanio}
                            style={{
                                marginTop:
                                    "var(--lg)"
                            }}
                        >

                            <CampoFormulario
                                etiqueta="Nombre"
                                name="nombre_tamanio"
                                value={
                                    nuevoTamanio.nombre_tamanio
                                }
                                onChange={handleTamanio}
                            />

                            <CampoFormulario
                                etiqueta="Ancho"
                                tipo="number"
                                name="ancho_lienzo"
                                min="0.01"
                                step="0.01"
                                value={
                                    nuevoTamanio.ancho_lienzo
                                }
                                onChange={handleTamanio}
                            />

                            <CampoFormulario
                                etiqueta="Largo"
                                tipo="number"
                                name="largo_lienzo"
                                min="0.01"
                                step="0.01"
                                value={
                                    nuevoTamanio.largo_lienzo
                                }
                                onChange={handleTamanio}
                            />

                            {errorTamanio && (

                                <p
                                    className="campo-error body-sm"
                                    style={{
                                        marginBottom:
                                            "var(--md)"
                                    }}
                                >
                                    {errorTamanio}
                                </p>

                            )}

                            <Boton
                                tipo={
                                    guardando === "tamanio"
                                        ? "deshabilitado"
                                        : "primario"
                                }
                                bloque
                                type="submit"
                            >
                                {
                                    guardando === "tamanio"
                                        ? "Guardando..."
                                        : "Agregar"
                                }
                            </Boton>

                        </form>

                    </div>

                    {/* MARCOS */}

                    <div
                        className="cartela"
                        style={{
                            padding: "var(--lg)"
                        }}
                    >

                        <h3
                            className="headline-sm"
                            style={{
                                marginBottom:
                                    "var(--md)"
                            }}
                        >
                            Marcos
                        </h3>

                        <div
                            style={{
                                maxHeight: "260px",
                                overflowY: "auto"
                            }}
                        >

                            <table className="tabla">

                                <tbody>

                                    {marcos.map(
                                        (marco) => (

                                            <tr
                                                key={
                                                    marco.id
                                                }
                                            >

                                                <td>
                                                    {
                                                        marco.nombre_marco
                                                    }

                                                    <br />

                                                    <span
                                                        className="body-sm muted"
                                                    >
                                                        {
                                                            marco.color_marco
                                                        }
                                                    </span>
                                                </td>

                                                <td
                                                    className="price-md"
                                                >
                                                    {
                                                        pesos(
                                                            marco.precio_marco
                                                        )
                                                    }
                                                </td>

                                            </tr>

                                        )
                                    )}

                                </tbody>

                            </table>

                        </div>

                        <form
                            onSubmit={crearMarco}
                            style={{
                                marginTop:
                                    "var(--lg)"
                            }}
                        >

                            <CampoFormulario
                                etiqueta="Nombre"
                                name="nombre_marco"
                                value={
                                    nuevoMarco.nombre_marco
                                }
                                onChange={handleMarco}
                            />

                            <CampoFormulario
                                etiqueta="Color"
                                name="color_marco"
                                value={
                                    nuevoMarco.color_marco
                                }
                                onChange={handleMarco}
                            />

                            <CampoFormulario
                                etiqueta="Precio"
                                tipo="number"
                                name="precio_marco"
                                min="0.01"
                                step="0.01"
                                value={
                                    nuevoMarco.precio_marco
                                }
                                onChange={handleMarco}
                            />

                            <div className="campo">

                                <label>
                                    Imagen
                                </label>

                                <input
                                    className="input"
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) =>
                                        setArchivoMarco(
                                            e.target.files[0]
                                        )
                                    }
                                />

                            </div>

                            {errorMarco && (

                                <p
                                    className="campo-error body-sm"
                                    style={{
                                        marginBottom:
                                            "var(--md)"
                                    }}
                                >
                                    {errorMarco}
                                </p>

                            )}

                            <Boton
                                tipo={
                                    guardando === "marco"
                                        ? "deshabilitado"
                                        : "primario"
                                }
                                bloque
                                type="submit"
                            >
                                {
                                    guardando === "marco"
                                        ? "Guardando..."
                                        : "Agregar"
                                }
                            </Boton>

                        </form>

                    </div>

                </div>

            </div>

        </div>
    )
}

export default AdminCatalogos
