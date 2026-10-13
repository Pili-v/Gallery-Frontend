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

    const cargarCatalogos = async () => {

        try {

            const respuestaEstilos =
                await api.get("/api/estilos")

            const respuestaTamanios =
                await api.get("/api/tamanios-lienzo")

            const respuestaMarcos =
                await api.get("/api/marcos")

            setEstilos(lista(respuestaEstilos))
            setTamanios(lista(respuestaTamanios))
            setMarcos(lista(respuestaMarcos))

        } catch (e) {

            setError(e.message)

        } finally {

            setCargando(false)
        }
    }

    useEffect(() => {
        cargarCatalogos()
    }, [])

    const crearEstilo = async (e) => {

        e.preventDefault()

        if (!nuevoEstilo.trim()) {
            return
        }

        setGuardando("estilo")
        setError("")

        try {

            await api.post(
                "/api/estilos",
                {
                    nombreEstilo: nuevoEstilo
                }
            )

            setNuevoEstilo("")

            const respuesta =
                await api.get("/api/estilos")

            setEstilos(lista(respuesta))

        } catch (e) {

            setError(e.message)

        } finally {

            setGuardando("")
        }
    }

    const handleTamanio = (e) => {

        const { name, value } = e.target

        setNuevoTamanio({
            ...nuevoTamanio,
            [name]: value
        })
    }

    const crearTamanio = async (e) => {

        e.preventDefault()

        if (
            !nuevoTamanio.nombre_tamanio.trim() ||
            !nuevoTamanio.ancho_lienzo ||
            !nuevoTamanio.largo_lienzo
        ) {
            return
        }

        setGuardando("tamanio")
        setError("")

        try {

            await api.post(
                "/api/tamanios-lienzo",
                {
                    nombre_tamanio:
                        nuevoTamanio.nombre_tamanio,

                    ancho_lienzo:
                        Number(nuevoTamanio.ancho_lienzo),

                    largo_lienzo:
                        Number(nuevoTamanio.largo_lienzo)
                }
            )

            setNuevoTamanio({
                nombre_tamanio: "",
                ancho_lienzo: "",
                largo_lienzo: ""
            })

            const respuesta =
                await api.get("/api/tamanios-lienzo")

            setTamanios(lista(respuesta))

        } catch (e) {

            setError(e.message)

        } finally {

            setGuardando("")
        }
    }

    const handleMarco = (e) => {

        const { name, value } = e.target

        setNuevoMarco({
            ...nuevoMarco,
            [name]: value
        })
    }

    const crearMarco = async (e) => {

    e.preventDefault()

    if (
        !nuevoMarco.nombre_marco.trim() ||
        !nuevoMarco.color_marco.trim() ||
        !nuevoMarco.precio_marco ||
        !archivoMarco
    ) {
        return
    }

    setGuardando("marco")
    setError("")

    try {

        const formData = new FormData()

        formData.append(
            "nombre_marco",
            nuevoMarco.nombre_marco
        )

        formData.append(
            "color_marco",
            nuevoMarco.color_marco
        )

        formData.append(
            "precio_marco",
            nuevoMarco.precio_marco
        )

        formData.append(
            "archivo",
            archivoMarco
        )

        await subirArchivo(
            "/api/marcos",
            formData
        )

        setNuevoMarco({
            nombre_marco: "",
            color_marco: "",
            precio_marco: ""
        })

        setArchivoMarco(null)

        const respuesta =
            await api.get("/api/marcos")

        setMarcos(lista(respuesta))

    } catch (e) {

        setError(e.message)

    } finally {

        setGuardando("")
    }
}

    if (cargando) {
        return (
            <div className="seccion">
                <div className="contenido">
                    <Estado tipo="cargando" />
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
                        margin: "var(--xs) 0 var(--xl)"
                    }}
                >
                    Estilos, tamaños y marcos son del sistema,
                    no de un artista.
                </p>

                {error && (
                    <div
                        style={{
                            marginBottom: "var(--md)"
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
                            "repeat(3, 1fr)",
                        gap: "var(--xl)"
                    }}
                >

                    {/* ESTILOS */}

                    <div>

                        <h3
                            className="headline-sm"
                            style={{
                                marginBottom: "var(--sm)"
                            }}
                        >
                            Estilos
                        </h3>

                        <table className="tabla">
                            <tbody>

                                {estilos.map((estilo) => (
                                    <tr key={estilo.id}>
                                        <td>
                                            {estilo.nombreEstilo}
                                        </td>
                                    </tr>
                                ))}

                            </tbody>
                        </table>

                        <form
                            onSubmit={crearEstilo}
                            style={{
                                marginTop: "var(--md)"
                            }}
                        >

                            <CampoFormulario
                                etiqueta="Nuevo estilo"
                                value={nuevoEstilo}
                                onChange={(e) =>
                                    setNuevoEstilo(
                                        e.target.value
                                    )
                                }
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
                                {guardando === "estilo"
                                    ? "Guardando..."
                                    : "Agregar"
                                }
                            </Boton>

                        </form>

                    </div>

                    {/* TAMAÑOS */}

                    <div>

                        <h3
                            className="headline-sm"
                            style={{
                                marginBottom: "var(--sm)"
                            }}
                        >
                            Tamaños
                        </h3>

                        <table className="tabla">
                            <tbody>

                                {tamanios.map((tamanio) => (
                                    <tr key={tamanio.id}>
                                        <td>
                                            {tamanio.nombre_tamanio}
                                        </td>

                                        <td>
                                            {tamanio.ancho_lienzo}
                                            {" × "}
                                            {tamanio.largo_lienzo}
                                            {" cm"}
                                        </td>
                                    </tr>
                                ))}

                            </tbody>
                        </table>

                        <form
                            onSubmit={crearTamanio}
                            style={{
                                marginTop: "var(--md)"
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
                                value={
                                    nuevoTamanio.ancho_lienzo
                                }
                                onChange={handleTamanio}
                            />

                            <CampoFormulario
                                etiqueta="Largo"
                                tipo="number"
                                name="largo_lienzo"
                                value={
                                    nuevoTamanio.largo_lienzo
                                }
                                onChange={handleTamanio}
                            />

                            <Boton
                                tipo={
                                    guardando === "tamanio"
                                        ? "deshabilitado"
                                        : "primario"
                                }
                                bloque
                                type="submit"
                            >
                                {guardando === "tamanio"
                                    ? "Guardando..."
                                    : "Agregar"
                                }
                            </Boton>

                        </form>

                    </div>

                    {/* MARCOS */}

                    <div>

                        <h3
                            className="headline-sm"
                            style={{
                                marginBottom: "var(--sm)"
                            }}
                        >
                            Marcos
                        </h3>

                        <table className="tabla">
                            <tbody>

                                {marcos.map((marco) => (
                                    <tr key={marco.id}>

                                        <td>
                                            {marco.nombre_marco}
                                            <br />

                                            <span
                                                className="body-sm muted"
                                            >
                                                {marco.color_marco}
                                            </span>
                                        </td>

                                        <td className="price-md">
                                            {pesos(
                                                marco.precio_marco
                                            )}
                                        </td>

                                    </tr>
                                ))}

                            </tbody>
                        </table>

                        <form
                            onSubmit={crearMarco}
                            style={{
                                marginTop: "var(--md)"
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
                                        setArchivoMarco(e.target.files[0])
                                    }
                                />

                            </div>

                            <Boton
                                tipo={
                                    guardando === "marco"
                                        ? "deshabilitado"
                                        : "primario"
                                }
                                bloque
                                type="submit"
                            >
                                {guardando === "marco"
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
