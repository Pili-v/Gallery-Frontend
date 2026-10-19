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

    const [archivoMarco, setArchivoMarco] = useState(null)

    const [editandoEstilo, setEditandoEstilo] = useState(null)
    const [editandoTamanio, setEditandoTamanio] = useState(null)
    const [editandoMarco, setEditandoMarco] = useState(null)

    const [confirmando, setConfirmando] = useState(null)

    const [cargando, setCargando] = useState(true)
    const [guardando, setGuardando] = useState("")
    const [eliminando, setEliminando] = useState("")

    const [error, setError] = useState("")
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

        const limpio = texto.replace(
            /[^A-Za-zÁÉÍÓÚáéíóúÜüÑñ\s]/g,
            ""
        )

        return capitalizarPalabras(limpio)
    }

    const limpiarTextoConNumeros = (texto) => {

        const limpio = texto.replace(
            /[^A-Za-zÁÉÍÓÚáéíóúÜüÑñ0-9\s]/g,
            ""
        )

        return capitalizarPalabras(limpio)
    }

    const cargarCatalogos = () => {

        setError("")

        return Promise.all([
            api.get("/api/estilos"),
            api.get("/api/tamanios-lienzo"),
            api.get("/api/marcos")
        ])
            .then((respuestas) => {

                setEstilos(lista(respuestas[0]))
                setTamanios(lista(respuestas[1]))
                setMarcos(lista(respuestas[2]))
            })
            .catch((e) => {

                setError(e.message)
            })
    }

    useEffect(() => {

        cargarCatalogos()
            .finally(() => {
                setCargando(false)
            })

    }, [])

    // -------------------------
    // ESTILOS
    // -------------------------

    const handleEstilo = (e) => {

        setNuevoEstilo(
            limpiarSoloTexto(e.target.value)
        )
    }

    const editarEstilo = (estilo) => {

        setEditandoEstilo(estilo.id)
        setNuevoEstilo(estilo.nombre_estilo)
        setConfirmando(null)
        setError("")
    }

    const cancelarEdicionEstilo = () => {

        setEditandoEstilo(null)
        setNuevoEstilo("")
    }

    const guardarEstilo = (e) => {

        e.preventDefault()

        if (!nuevoEstilo.trim()) {
            return
        }

        setGuardando("estilo")
        setError("")

        const datos = {
            nombre_estilo: nuevoEstilo.trim()
        }

        const pedido = editandoEstilo
            ? api.put(
                "/api/estilos/" + editandoEstilo,
                datos
            )
            : api.post(
                "/api/estilos",
                datos
            )

        pedido
            .then(() => {

                setNuevoEstilo("")
                setEditandoEstilo(null)

                return cargarCatalogos()
            })
            .finally(() => {

                setGuardando("")
            })
    }

    const eliminarEstilo = (id) => {

        setEliminando("estilo-" + id)
        setError("")

        api.delete("/api/estilos/" + id)
            .then(() => {

                setConfirmando(null)

                if (editandoEstilo === id) {
                    cancelarEdicionEstilo()
                }

                return cargarCatalogos()
            })
            .catch((e) => {

                setError(e.message)
            })
            .finally(() => {

                setEliminando("")
            })
    }

    // -------------------------
    // TAMAÑOS
    // -------------------------

    const handleTamanio = (e) => {

        const { name, value } = e.target

        let nuevoValor = value

        if (name === "nombre_tamanio") {

            nuevoValor =
                limpiarTextoConNumeros(value)
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

    const editarTamanio = (tamanio) => {

        setEditandoTamanio(tamanio.id)

        setNuevoTamanio({
            nombre_tamanio:
                tamanio.nombre_tamanio ?? "",

            ancho_lienzo:
                tamanio.ancho_lienzo ?? "",

            largo_lienzo:
                tamanio.largo_lienzo ?? ""
        })

        setConfirmando(null)
        setError("")
        setErrorTamanio("")
    }

    const cancelarEdicionTamanio = () => {

        setEditandoTamanio(null)

        setNuevoTamanio({
            nombre_tamanio: "",
            ancho_lienzo: "",
            largo_lienzo: ""
        })

        setErrorTamanio("")
    }

    const guardarTamanio = (e) => {

        e.preventDefault()

        const ancho =
            Number(nuevoTamanio.ancho_lienzo)

        const largo =
            Number(nuevoTamanio.largo_lienzo)

        if (!nuevoTamanio.nombre_tamanio.trim()) {

            setErrorTamanio(
                "Ingresá un nombre para el tamaño."
            )

            return
        }

        if (ancho <= 0 || largo <= 0) {

            setErrorTamanio(
                "El ancho y el largo deben ser mayores a 0."
            )

            return
        }

        setGuardando("tamanio")
        setError("")
        setErrorTamanio("")

        const datos = {

            nombre_tamanio:
                nuevoTamanio.nombre_tamanio.trim(),

            ancho_lienzo: ancho,

            largo_lienzo: largo
        }

        const pedido = editandoTamanio
            ? api.put(
                "/api/tamanios-lienzo/" +
                editandoTamanio,
                datos
            )
            : api.post(
                "/api/tamanios-lienzo",
                datos
            )

        pedido
            .then(() => {

                cancelarEdicionTamanio()

                return cargarCatalogos()
            })
            .catch((e) => {

                setError(e.message)
            })
            .finally(() => {

                setGuardando("")
            })
    }

    const eliminarTamanio = (id) => {

        setEliminando("tamanio-" + id)
        setError("")

        api.delete(
            "/api/tamanios-lienzo/" + id
        )
            .then(() => {

                setConfirmando(null)

                if (editandoTamanio === id) {
                    cancelarEdicionTamanio()
                }

                return cargarCatalogos()
            })
            .catch((e) => {

                setError(e.message)
            })
            .finally(() => {

                setEliminando("")
            })
    }

    // -------------------------
    // MARCOS
    // -------------------------

    const handleMarco = (e) => {

        const { name, value } = e.target

        let nuevoValor = value

        if (
            name === "nombre_marco" ||
            name === "color_marco"
        ) {

            nuevoValor =
                limpiarSoloTexto(value)
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

    const editarMarco = (marco) => {

        setEditandoMarco(marco.id)

        setNuevoMarco({
            nombre_marco:
                marco.nombre_marco ?? "",

            color_marco:
                marco.color_marco ?? "",

            precio_marco:
                marco.precio_marco ?? ""
        })

        setArchivoMarco(null)
        setConfirmando(null)
        setError("")
        setErrorMarco("")
    }

    const cancelarEdicionMarco = () => {

        setEditandoMarco(null)

        setNuevoMarco({
            nombre_marco: "",
            color_marco: "",
            precio_marco: ""
        })

        setArchivoMarco(null)
        setErrorMarco("")
    }

    const guardarMarco = (e) => {

        e.preventDefault()

        const precio =
            Number(nuevoMarco.precio_marco)

        if (!nuevoMarco.nombre_marco.trim()) {

            setErrorMarco(
                "Ingresá un nombre para el marco."
            )

            return
        }

        if (!nuevoMarco.color_marco.trim()) {

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

        /*
         * Para crear, la imagen sigue siendo obligatoria.
         * Para editar no: el backend mantiene la imagen
         * anterior si no se manda un archivo nuevo.
         */
        if (!editandoMarco && !archivoMarco) {

            setErrorMarco(
                "Seleccioná una imagen para el marco."
            )

            return
        }

        setGuardando("marco")
        setError("")
        setErrorMarco("")

        const formData = new FormData()

        formData.append(
            "nombre_marco",
            nuevoMarco.nombre_marco.trim()
        )

        formData.append(
            "color_marco",
            nuevoMarco.color_marco.trim()
        )

        formData.append(
            "precio_marco",
            precio
        )

        if (archivoMarco) {

            formData.append(
                "archivo",
                archivoMarco
            )
        }

        const pedido = editandoMarco
            ? subirArchivo(
                "/api/marcos/" + editandoMarco,
                formData,
                "PUT"
            )
            : subirArchivo(
                "/api/marcos",
                formData
            )

        pedido
            .then(() => {

                cancelarEdicionMarco()

                return cargarCatalogos()
            })
            .catch((e) => {

                setError(e.message)
            })
            .finally(() => {

                setGuardando("")
            })
    }

    const eliminarMarco = (id) => {

        setEliminando("marco-" + id)
        setError("")

        api.delete(
            "/api/marcos/" + id
        )
            .then(() => {

                setConfirmando(null)

                if (editandoMarco === id) {
                    cancelarEdicionMarco()
                }

                return cargarCatalogos()
            })
            .catch((e) => {

                setError(e.message)
            })
            .finally(() => {

                setEliminando("")
            })
    }

    // -------------------------
    // CONFIRMACIÓN
    // -------------------------

    const pedirConfirmacion = (tipo, id) => {

        setConfirmando({
            tipo,
            id
        })
    }

    const cancelarConfirmacion = () => {

        setConfirmando(null)
    }

    const esConfirmacion = (tipo, id) => {

        return (
            confirmando?.tipo === tipo &&
            confirmando?.id === id
        )
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
                                maxHeight: "300px",
                                overflowY: "auto"
                            }}
                        >

                            <table className="tabla">

                                <tbody>

                                    {estilos.map((estilo) => (

                                        <tr key={estilo.id}>

                                            <td>
                                                {estilo.nombre_estilo}
                                            </td>

                                            <td
                                                style={{
                                                    textAlign: "right"
                                                }}
                                            >

                                                {esConfirmacion(
                                                    "estilo",
                                                    estilo.id
                                                ) ? (

                                                    <div
                                                        style={{
                                                            display: "flex",
                                                            gap: "var(--xs)",
                                                            justifyContent: "flex-end"
                                                        }}
                                                    >

                                                        <Boton
                                                            tipo="secundario"
                                                            onClick={
                                                                cancelarConfirmacion
                                                            }
                                                        >
                                                            Cancelar
                                                        </Boton>

                                                        <Boton
                                                            tipo={
                                                                eliminando ===
                                                                "estilo-" + estilo.id
                                                                    ? "deshabilitado"
                                                                    : "primario"
                                                            }
                                                            onClick={() =>
                                                                eliminarEstilo(
                                                                    estilo.id
                                                                )
                                                            }
                                                        >
                                                            {eliminando ===
                                                            "estilo-" + estilo.id
                                                                ? "Eliminando..."
                                                                : "Confirmar"
                                                            }
                                                        </Boton>

                                                    </div>

                                                ) : (

                                                    <div
                                                        style={{
                                                            display: "flex",
                                                            gap: "var(--xs)",
                                                            justifyContent: "flex-end"
                                                        }}
                                                    >

                                                        <Boton
                                                            tipo="secundario"
                                                            onClick={() =>
                                                                editarEstilo(
                                                                    estilo
                                                                )
                                                            }
                                                        >
                                                            Editar
                                                        </Boton>

                                                        <Boton
                                                            tipo="secundario"
                                                            onClick={() =>
                                                                pedirConfirmacion(
                                                                    "estilo",
                                                                    estilo.id
                                                                )
                                                            }
                                                        >
                                                            Eliminar
                                                        </Boton>

                                                    </div>

                                                )}

                                            </td>

                                        </tr>

                                    ))}

                                </tbody>

                            </table>

                        </div>

                        <form
                            onSubmit={guardarEstilo}
                            style={{
                                marginTop:
                                    "var(--lg)"
                            }}
                        >

                            <CampoFormulario
                                etiqueta={
                                    editandoEstilo
                                        ? "Editar estilo"
                                        : "Nuevo estilo"
                                }
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
                                {guardando === "estilo"
                                    ? "Guardando..."
                                    : editandoEstilo
                                        ? "Guardar cambios"
                                        : "Agregar"
                                }
                            </Boton>

                            {editandoEstilo && (

                                <div
                                    style={{
                                        marginTop: "var(--sm)"
                                    }}
                                >
                                    <Boton
                                        tipo="secundario"
                                        bloque
                                        type="button"
                                        onClick={
                                            cancelarEdicionEstilo
                                        }
                                    >
                                        Cancelar edición
                                    </Boton>
                                </div>

                            )}

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
                                maxHeight: "300px",
                                overflowY: "auto"
                            }}
                        >

                            <table className="tabla">

                                <tbody>

                                    {tamanios.map((tamanio) => (

                                        <tr key={tamanio.id}>

                                            <td>
                                                {tamanio.nombre_tamanio}

                                                <br />

                                                <span className="body-sm muted">
                                                    {tamanio.ancho_lienzo}
                                                    {" × "}
                                                    {tamanio.largo_lienzo}
                                                    {" cm"}
                                                </span>
                                            </td>

                                            <td
                                                style={{
                                                    textAlign: "right"
                                                }}
                                            >

                                                {esConfirmacion(
                                                    "tamanio",
                                                    tamanio.id
                                                ) ? (

                                                    <div
                                                        style={{
                                                            display: "flex",
                                                            gap: "var(--xs)",
                                                            justifyContent: "flex-end"
                                                        }}
                                                    >

                                                        <Boton
                                                            tipo="secundario"
                                                            onClick={
                                                                cancelarConfirmacion
                                                            }
                                                        >
                                                            Cancelar
                                                        </Boton>

                                                        <Boton
                                                            tipo={
                                                                eliminando ===
                                                                "tamanio-" + tamanio.id
                                                                    ? "deshabilitado"
                                                                    : "primario"
                                                            }
                                                            onClick={() =>
                                                                eliminarTamanio(
                                                                    tamanio.id
                                                                )
                                                            }
                                                        >
                                                            {eliminando ===
                                                            "tamanio-" + tamanio.id
                                                                ? "Eliminando..."
                                                                : "Confirmar"
                                                            }
                                                        </Boton>

                                                    </div>

                                                ) : (

                                                    <div
                                                        style={{
                                                            display: "flex",
                                                            gap: "var(--xs)",
                                                            justifyContent: "flex-end"
                                                        }}
                                                    >

                                                        <Boton
                                                            tipo="secundario"
                                                            onClick={() =>
                                                                editarTamanio(
                                                                    tamanio
                                                                )
                                                            }
                                                        >
                                                            Editar
                                                        </Boton>

                                                        <Boton
                                                            tipo="secundario"
                                                            onClick={() =>
                                                                pedirConfirmacion(
                                                                    "tamanio",
                                                                    tamanio.id
                                                                )
                                                            }
                                                        >
                                                            Eliminar
                                                        </Boton>

                                                    </div>

                                                )}

                                            </td>

                                        </tr>

                                    ))}

                                </tbody>

                            </table>

                        </div>

                        <form
                            onSubmit={guardarTamanio}
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
                                {guardando === "tamanio"
                                    ? "Guardando..."
                                    : editandoTamanio
                                        ? "Guardar cambios"
                                        : "Agregar"
                                }
                            </Boton>

                            {editandoTamanio && (

                                <div
                                    style={{
                                        marginTop:
                                            "var(--sm)"
                                    }}
                                >
                                    <Boton
                                        tipo="secundario"
                                        bloque
                                        type="button"
                                        onClick={
                                            cancelarEdicionTamanio
                                        }
                                    >
                                        Cancelar edición
                                    </Boton>
                                </div>

                            )}

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
                                maxHeight: "300px",
                                overflowY: "auto"
                            }}
                        >

                            <table className="tabla">

                                <tbody>

                                    {marcos.map((marco) => (

                                        <tr key={marco.id}>

                                            <td>

                                                {marco.nombre_marco}

                                                <br />

                                                <span className="body-sm muted">
                                                    {marco.color_marco}
                                                </span>

                                                <br />

                                                <span className="price-md">
                                                    {pesos(
                                                        marco.precio_marco
                                                    )}
                                                </span>

                                            </td>

                                            <td
                                                style={{
                                                    textAlign: "right"
                                                }}
                                            >

                                                {esConfirmacion(
                                                    "marco",
                                                    marco.id
                                                ) ? (

                                                    <div
                                                        style={{
                                                            display: "flex",
                                                            gap: "var(--xs)",
                                                            justifyContent: "flex-end"
                                                        }}
                                                    >

                                                        <Boton
                                                            tipo="secundario"
                                                            onClick={
                                                                cancelarConfirmacion
                                                            }
                                                        >
                                                            Cancelar
                                                        </Boton>

                                                        <Boton
                                                            tipo={
                                                                eliminando ===
                                                                "marco-" + marco.id
                                                                    ? "deshabilitado"
                                                                    : "primario"
                                                            }
                                                            onClick={() =>
                                                                eliminarMarco(
                                                                    marco.id
                                                                )
                                                            }
                                                        >
                                                            {eliminando ===
                                                            "marco-" + marco.id
                                                                ? "Eliminando..."
                                                                : "Confirmar"
                                                            }
                                                        </Boton>

                                                    </div>

                                                ) : (

                                                    <div
                                                        style={{
                                                            display: "flex",
                                                            gap: "var(--xs)",
                                                            justifyContent: "flex-end"
                                                        }}
                                                    >

                                                        <Boton
                                                            tipo="secundario"
                                                            onClick={() =>
                                                                editarMarco(
                                                                    marco
                                                                )
                                                            }
                                                        >
                                                            Editar
                                                        </Boton>

                                                        <Boton
                                                            tipo="secundario"
                                                            onClick={() =>
                                                                pedirConfirmacion(
                                                                    "marco",
                                                                    marco.id
                                                                )
                                                            }
                                                        >
                                                            Eliminar
                                                        </Boton>

                                                    </div>

                                                )}

                                            </td>

                                        </tr>

                                    ))}

                                </tbody>

                            </table>

                        </div>

                        <form
                            onSubmit={guardarMarco}
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

                                <label className="catalog-number muted">
                                    {editandoMarco
                                        ? "Nueva imagen (opcional)"
                                        : "Imagen"
                                    }
                                </label>

                                <input
                                    className="input"
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) =>
                                        setArchivoMarco(
                                            e.target.files[0] ||
                                            null
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
                                {guardando === "marco"
                                    ? "Guardando..."
                                    : editandoMarco
                                        ? "Guardar cambios"
                                        : "Agregar"
                                }
                            </Boton>

                            {editandoMarco && (

                                <div
                                    style={{
                                        marginTop:
                                            "var(--sm)"
                                    }}
                                >
                                    <Boton
                                        tipo="secundario"
                                        bloque
                                        type="button"
                                        onClick={
                                            cancelarEdicionMarco
                                        }
                                    >
                                        Cancelar edición
                                    </Boton>
                                </div>

                            )}

                        </form>

                    </div>

                </div>

            </div>

        </div>
    )
}

export default AdminCatalogos
