// Catálogos — administrador
// Estilos, tamaños y marcos son del sistema, no de un artista. Una pestaña por catálogo: la lista ocupa todo el
// ancho y el formulario de alta y edición queda a un costado, siempre a la vista (en pantallas angostas pasa abajo).
// Los tres catálogos se piden una sola vez al entrar. Después de cada alta, edición o baja la lista que ya está en
// pantalla se actualiza con lo que responde el back, sin volver a pedirlos.

import { useEffect, useState } from "react"

import { api, lista, subirArchivo } from "../api/cliente"
import { pesos, optimizada } from "../api/formato"

import CampoFormulario from "../components/CampoFormulario"
import AccionesCatalogo from "../components/AccionesCatalogo"
import Boton from "../components/Boton"
import Estado from "../components/Estado"

const ESTILO_VACIO = ""
const TAMANIO_VACIO = { nombre_tamanio: "", ancho_lienzo: "", largo_lienzo: "" }
const MARCO_VACIO = { nombre_marco: "", color_marco: "", precio_marco: "" }

// Primera letra de cada palabra en mayúscula, el resto en minúscula.
const capitalizarPalabras = (texto) => {
    return texto
        .toLowerCase()
        .split(" ")
        .map((palabra) => palabra.charAt(0).toUpperCase() + palabra.slice(1))
        .join(" ")
}

// Mientras se escribe se descartan los caracteres que no valen: solo letras (y números donde corresponde).
const limpiarSoloTexto = (texto) => capitalizarPalabras(texto.replace(/[^A-Za-zÁÉÍÓÚáéíóúÜüÑñ\s]/g, ""))
const limpiarTextoConNumeros = (texto) => capitalizarPalabras(texto.replace(/[^A-Za-zÁÉÍÓÚáéíóúÜüÑñ0-9\s]/g, ""))

// Reemplaza el elemento con el mismo id (una edición) o lo agrega al final (un alta).
const guardarEnLista = (elementos, guardado) => {
    if (elementos.some((elemento) => elemento.id === guardado.id)) {
        return elementos.map((elemento) => elemento.id === guardado.id ? guardado : elemento)
    }
    return [...elementos, guardado]
}

const AdminCatalogos = () => {

    const [pestania, setPestania] = useState("estilos")

    const [estilos, setEstilos] = useState([])
    const [tamanios, setTamanios] = useState([])
    const [marcos, setMarcos] = useState([])

    const [nuevoEstilo, setNuevoEstilo] = useState(ESTILO_VACIO)
    const [nuevoTamanio, setNuevoTamanio] = useState(TAMANIO_VACIO)
    const [nuevoMarco, setNuevoMarco] = useState(MARCO_VACIO)
    const [archivoMarco, setArchivoMarco] = useState(null)
    // Cambia después de guardar un marco para que el campo de archivo vuelva a estar vacío.
    const [claveArchivo, setClaveArchivo] = useState(0)

    const [editandoEstilo, setEditandoEstilo] = useState(null)
    const [editandoTamanio, setEditandoTamanio] = useState(null)
    const [editandoMarco, setEditandoMarco] = useState(null)

    // La fila que espera la confirmación del borrado: { tipo, id }.
    const [confirmando, setConfirmando] = useState(null)

    const [cargando, setCargando] = useState(true)
    const [guardando, setGuardando] = useState("")
    const [eliminando, setEliminando] = useState("")

    const [error, setError] = useState("")
    const [errorFormulario, setErrorFormulario] = useState("")

    // Los tres catálogos, una sola vez al entrar.
    useEffect(() => {
        Promise.all([
            api.get("/api/estilos"),
            api.get("/api/tamanios-lienzo"),
            api.get("/api/marcos")
        ])
            .then((respuestas) => {
                setEstilos(lista(respuestas[0]))
                setTamanios(lista(respuestas[1]))
                setMarcos(lista(respuestas[2]))
            })
            .catch((e) => setError(e.message))
            .finally(() => setCargando(false))
    }, [])

    const cambiarPestania = (nueva) => {
        setPestania(nueva)
        setConfirmando(null)
        setError("")
        setErrorFormulario("")
    }

    const esConfirmacion = (tipo, id) => confirmando !== null && confirmando.tipo === tipo && confirmando.id === id

    // -------------------------
    // ESTILOS
    // -------------------------

    const editarEstilo = (estilo) => {
        setEditandoEstilo(estilo.id)
        setNuevoEstilo(estilo.nombre_estilo)
        setConfirmando(null)
        setError("")
        setErrorFormulario("")
    }

    const cancelarEdicionEstilo = () => {
        setEditandoEstilo(null)
        setNuevoEstilo(ESTILO_VACIO)
        setErrorFormulario("")
    }

    const guardarEstilo = (e) => {
        e.preventDefault()
        if (guardando) return

        if (!nuevoEstilo.trim()) {
            setErrorFormulario("Ingresá un nombre para el estilo.")
            return
        }

        setGuardando("estilo")
        setError("")
        setErrorFormulario("")

        const datos = { nombre_estilo: nuevoEstilo.trim() }
        const pedido = editandoEstilo
            ? api.put("/api/estilos/" + editandoEstilo, datos)
            : api.post("/api/estilos", datos)

        pedido
            .then((guardado) => {
                setEstilos((previos) => guardarEnLista(previos, guardado))
                cancelarEdicionEstilo()
            })
            .catch((e) => setErrorFormulario(e.message))
            .finally(() => setGuardando(""))
    }

    const eliminarEstilo = (id) => {
        setEliminando("estilo-" + id)
        setError("")

        api.delete("/api/estilos/" + id)
            .then(() => {
                setEstilos((previos) => previos.filter((estilo) => estilo.id !== id))
                setConfirmando(null)
                if (editandoEstilo === id) cancelarEdicionEstilo()
            })
            .catch((e) => setError(e.message))
            .finally(() => setEliminando(""))
    }

    // -------------------------
    // TAMAÑOS
    // -------------------------

    const handleTamanio = (e) => {
        const { name, value } = e.target
        let nuevoValor = value

        if (name === "nombre_tamanio") nuevoValor = limpiarTextoConNumeros(value)
        // Las medidas no pueden ser negativas: si se escribe un valor así, el campo queda vacío.
        if ((name === "ancho_lienzo" || name === "largo_lienzo") && value !== "" && Number(value) < 0) nuevoValor = ""

        setNuevoTamanio({ ...nuevoTamanio, [name]: nuevoValor })
        setErrorFormulario("")
    }

    const editarTamanio = (tamanio) => {
        setEditandoTamanio(tamanio.id)
        setNuevoTamanio({
            nombre_tamanio: tamanio.nombre_tamanio || "",
            ancho_lienzo: tamanio.ancho_lienzo || "",
            largo_lienzo: tamanio.largo_lienzo || ""
        })
        setConfirmando(null)
        setError("")
        setErrorFormulario("")
    }

    const cancelarEdicionTamanio = () => {
        setEditandoTamanio(null)
        setNuevoTamanio(TAMANIO_VACIO)
        setErrorFormulario("")
    }

    const guardarTamanio = (e) => {
        e.preventDefault()
        if (guardando) return

        const ancho = Number(nuevoTamanio.ancho_lienzo)
        const largo = Number(nuevoTamanio.largo_lienzo)

        if (!nuevoTamanio.nombre_tamanio.trim()) {
            setErrorFormulario("Ingresá un nombre para el tamaño.")
            return
        }

        if (ancho <= 0 || largo <= 0) {
            setErrorFormulario("El ancho y el largo deben ser mayores a 0.")
            return
        }

        setGuardando("tamanio")
        setError("")
        setErrorFormulario("")

        const datos = { nombre_tamanio: nuevoTamanio.nombre_tamanio.trim(), ancho_lienzo: ancho, largo_lienzo: largo }
        const pedido = editandoTamanio
            ? api.put("/api/tamanios-lienzo/" + editandoTamanio, datos)
            : api.post("/api/tamanios-lienzo", datos)

        pedido
            .then((guardado) => {
                setTamanios((previos) => guardarEnLista(previos, guardado))
                cancelarEdicionTamanio()
            })
            .catch((e) => setErrorFormulario(e.message))
            .finally(() => setGuardando(""))
    }

    const eliminarTamanio = (id) => {
        setEliminando("tamanio-" + id)
        setError("")

        api.delete("/api/tamanios-lienzo/" + id)
            .then(() => {
                setTamanios((previos) => previos.filter((tamanio) => tamanio.id !== id))
                setConfirmando(null)
                if (editandoTamanio === id) cancelarEdicionTamanio()
            })
            .catch((e) => setError(e.message))
            .finally(() => setEliminando(""))
    }

    // -------------------------
    // MARCOS
    // -------------------------

    const handleMarco = (e) => {
        const { name, value } = e.target
        let nuevoValor = value

        if (name === "nombre_marco" || name === "color_marco") nuevoValor = limpiarSoloTexto(value)
        if (name === "precio_marco" && value !== "" && Number(value) < 0) nuevoValor = ""

        setNuevoMarco({ ...nuevoMarco, [name]: nuevoValor })
        setErrorFormulario("")
    }

    const editarMarco = (marco) => {
        setEditandoMarco(marco.id)
        setNuevoMarco({
            nombre_marco: marco.nombre_marco || "",
            color_marco: marco.color_marco || "",
            precio_marco: marco.precio_marco || ""
        })
        setArchivoMarco(null)
        setClaveArchivo((clave) => clave + 1)
        setConfirmando(null)
        setError("")
        setErrorFormulario("")
    }

    const cancelarEdicionMarco = () => {
        setEditandoMarco(null)
        setNuevoMarco(MARCO_VACIO)
        setArchivoMarco(null)
        setClaveArchivo((clave) => clave + 1)
        setErrorFormulario("")
    }

    const guardarMarco = (e) => {
        e.preventDefault()
        if (guardando) return

        const precio = Number(nuevoMarco.precio_marco)

        if (!nuevoMarco.nombre_marco.trim()) {
            setErrorFormulario("Ingresá un nombre para el marco.")
            return
        }

        if (!nuevoMarco.color_marco.trim()) {
            setErrorFormulario("Ingresá un color para el marco.")
            return
        }

        if (precio <= 0) {
            setErrorFormulario("El precio debe ser mayor a 0.")
            return
        }

        // Para crear, la imagen es obligatoria. Para editar no: el back mantiene la anterior si no se manda otra.
        if (!editandoMarco && !archivoMarco) {
            setErrorFormulario("Seleccioná una imagen para el marco.")
            return
        }

        setGuardando("marco")
        setError("")
        setErrorFormulario("")

        const formData = new FormData()
        formData.append("nombre_marco", nuevoMarco.nombre_marco.trim())
        formData.append("color_marco", nuevoMarco.color_marco.trim())
        formData.append("precio_marco", precio)
        if (archivoMarco) formData.append("archivo", archivoMarco)

        const pedido = editandoMarco
            ? subirArchivo("/api/marcos/" + editandoMarco, formData, "PUT")
            : subirArchivo("/api/marcos", formData)

        pedido
            .then((guardado) => {
                setMarcos((previos) => guardarEnLista(previos, guardado))
                cancelarEdicionMarco()
            })
            .catch((e) => setErrorFormulario(e.message))
            .finally(() => setGuardando(""))
    }

    const eliminarMarco = (id) => {
        setEliminando("marco-" + id)
        setError("")

        api.delete("/api/marcos/" + id)
            .then(() => {
                setMarcos((previos) => previos.filter((marco) => marco.id !== id))
                setConfirmando(null)
                if (editandoMarco === id) cancelarEdicionMarco()
            })
            .catch((e) => setError(e.message))
            .finally(() => setEliminando(""))
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

    // El texto del botón de guardar, igual en los tres formularios.
    const textoGuardar = (nombre, editando) => guardando === nombre ? "Guardando..." : editando ? "Guardar cambios" : "Agregar"

    const pestanias = [
        { clave: "estilos", texto: "Estilos", cantidad: estilos.length },
        { clave: "tamanios", texto: "Tamaños", cantidad: tamanios.length },
        { clave: "marcos", texto: "Marcos", cantidad: marcos.length }
    ]

    return (
        <div className="seccion" style={{ paddingTop: "var(--xl)" }}>
            <div className="contenido">

                {/* El espacio sobre el título es el mismo que hay entre el título y las pestañas. */}
                <h1 className="headline-lg" style={{ marginBottom: "var(--xl)" }}>Catálogos</h1>

                <nav className="pestanias" aria-label="Catálogos" style={{ marginBottom: "var(--lg)" }}>
                    {pestanias.map((item) => (
                        <button
                            key={item.clave}
                            type="button"
                            className={"pestania" + (pestania === item.clave ? " activa" : "")}
                            aria-pressed={pestania === item.clave}
                            onClick={() => cambiarPestania(item.clave)}>
                            {item.texto} ({item.cantidad})
                        </button>
                    ))}
                </nav>

                {error && <div style={{ marginBottom: "var(--md)" }}><Estado tipo="error" mensaje={error} /></div>}

                <div className="dos-columnas">

                    {/* ESTILOS */}

                    {pestania === "estilos" && (
                        <>
                            {estilos.length === 0
                                ? <Estado tipo="vacio" mensaje="Todavía no hay estilos." />
                                : <table className="tabla">
                                    <thead>
                                        <tr><th>Estilo</th><th></th></tr>
                                    </thead>
                                    <tbody>
                                        {estilos.map((estilo) => (
                                            <tr key={estilo.id}>
                                                <td>{estilo.nombre_estilo}</td>
                                                <td>
                                                    <AccionesCatalogo
                                                        confirmando={esConfirmacion("estilo", estilo.id)}
                                                        eliminando={eliminando === "estilo-" + estilo.id}
                                                        onEditar={() => editarEstilo(estilo)}
                                                        onEliminar={() => setConfirmando({ tipo: "estilo", id: estilo.id })}
                                                        onConfirmar={() => eliminarEstilo(estilo.id)}
                                                        onCancelar={() => setConfirmando(null)} />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>}

                            <form className="cartela" onSubmit={guardarEstilo} style={{ padding: "var(--lg)", position: "sticky", top: "var(--md)" }}>
                                <CampoFormulario
                                    etiqueta={editandoEstilo ? "Editar estilo" : "Nuevo estilo"}
                                    value={nuevoEstilo}
                                    error={errorFormulario}
                                    onChange={(e) => { setNuevoEstilo(limpiarSoloTexto(e.target.value)); setErrorFormulario("") }} />

                                <Boton tipo={guardando === "estilo" ? "deshabilitado" : "primario"} bloque type="submit">
                                    {textoGuardar("estilo", editandoEstilo)}
                                </Boton>

                                {editandoEstilo && (
                                    <div style={{ marginTop: "var(--sm)" }}>
                                        <Boton tipo="secundario" bloque type="button" onClick={cancelarEdicionEstilo}>Cancelar edición</Boton>
                                    </div>
                                )}
                            </form>
                        </>
                    )}

                    {/* TAMAÑOS */}

                    {pestania === "tamanios" && (
                        <>
                            {tamanios.length === 0
                                ? <Estado tipo="vacio" mensaje="Todavía no hay tamaños." />
                                : <table className="tabla">
                                    <thead>
                                        <tr><th>Tamaño</th><th>Medidas</th><th></th></tr>
                                    </thead>
                                    <tbody>
                                        {tamanios.map((tamanio) => (
                                            <tr key={tamanio.id}>
                                                <td>{tamanio.nombre_tamanio}</td>
                                                <td className="muted">{tamanio.ancho_lienzo} × {tamanio.largo_lienzo} cm</td>
                                                <td>
                                                    <AccionesCatalogo
                                                        confirmando={esConfirmacion("tamanio", tamanio.id)}
                                                        eliminando={eliminando === "tamanio-" + tamanio.id}
                                                        onEditar={() => editarTamanio(tamanio)}
                                                        onEliminar={() => setConfirmando({ tipo: "tamanio", id: tamanio.id })}
                                                        onConfirmar={() => eliminarTamanio(tamanio.id)}
                                                        onCancelar={() => setConfirmando(null)} />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>}

                            <form className="cartela" onSubmit={guardarTamanio} style={{ padding: "var(--lg)", position: "sticky", top: "var(--md)" }}>
                                <p className="catalog-number muted" style={{ marginBottom: "var(--sm)" }}>
                                    {editandoTamanio ? "Editar tamaño" : "Nuevo tamaño"}
                                </p>

                                <CampoFormulario etiqueta="Nombre" name="nombre_tamanio" value={nuevoTamanio.nombre_tamanio} onChange={handleTamanio} />
                                <CampoFormulario etiqueta="Ancho (cm)" tipo="number" name="ancho_lienzo" min="0.01" step="0.01" value={nuevoTamanio.ancho_lienzo} onChange={handleTamanio} />
                                <CampoFormulario etiqueta="Largo (cm)" tipo="number" name="largo_lienzo" min="0.01" step="0.01" value={nuevoTamanio.largo_lienzo} onChange={handleTamanio} />

                                {errorFormulario && <p className="campo-error body-sm" style={{ marginBottom: "var(--md)" }}>{errorFormulario}</p>}

                                <Boton tipo={guardando === "tamanio" ? "deshabilitado" : "primario"} bloque type="submit">
                                    {textoGuardar("tamanio", editandoTamanio)}
                                </Boton>

                                {editandoTamanio && (
                                    <div style={{ marginTop: "var(--sm)" }}>
                                        <Boton tipo="secundario" bloque type="button" onClick={cancelarEdicionTamanio}>Cancelar edición</Boton>
                                    </div>
                                )}
                            </form>
                        </>
                    )}

                    {/* MARCOS */}

                    {pestania === "marcos" && (
                        <>
                            {marcos.length === 0
                                ? <Estado tipo="vacio" mensaje="Todavía no hay marcos." />
                                : <table className="tabla">
                                    <thead>
                                        <tr><th></th><th>Marco</th><th>Color</th><th>Precio</th><th></th></tr>
                                    </thead>
                                    <tbody>
                                        {marcos.map((marco) => (
                                            <tr key={marco.id}>
                                                <td style={{ width: 64 }}>
                                                    {marco.url && <img src={optimizada(marco.url, 96)} alt="" width="48" height="48" style={{ objectFit: "contain", display: "block" }} />}
                                                </td>
                                                <td>{marco.nombre_marco}</td>
                                                <td className="muted">{marco.color_marco}</td>
                                                <td className="price-md">{pesos(marco.precio_marco)}</td>
                                                <td>
                                                    <AccionesCatalogo
                                                        confirmando={esConfirmacion("marco", marco.id)}
                                                        eliminando={eliminando === "marco-" + marco.id}
                                                        onEditar={() => editarMarco(marco)}
                                                        onEliminar={() => setConfirmando({ tipo: "marco", id: marco.id })}
                                                        onConfirmar={() => eliminarMarco(marco.id)}
                                                        onCancelar={() => setConfirmando(null)} />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>}

                            <form className="cartela" onSubmit={guardarMarco} style={{ padding: "var(--lg)", position: "sticky", top: "var(--md)" }}>
                                <p className="catalog-number muted" style={{ marginBottom: "var(--sm)" }}>
                                    {editandoMarco ? "Editar marco" : "Nuevo marco"}
                                </p>

                                <CampoFormulario etiqueta="Nombre" name="nombre_marco" value={nuevoMarco.nombre_marco} onChange={handleMarco} />
                                <CampoFormulario etiqueta="Color" name="color_marco" value={nuevoMarco.color_marco} onChange={handleMarco} />
                                <CampoFormulario etiqueta="Precio" tipo="number" name="precio_marco" min="0.01" step="0.01" value={nuevoMarco.precio_marco} onChange={handleMarco} />

                                <div className="campo">
                                    <label className="catalog-number muted">
                                        {editandoMarco ? "Nueva imagen (opcional)" : "Imagen"}
                                    </label>
                                    <input
                                        key={claveArchivo}
                                        className="input"
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => { setArchivoMarco(e.target.files[0] || null); setErrorFormulario("") }} />
                                </div>

                                {errorFormulario && <p className="campo-error body-sm" style={{ marginBottom: "var(--md)" }}>{errorFormulario}</p>}

                                <Boton tipo={guardando === "marco" ? "deshabilitado" : "primario"} bloque type="submit">
                                    {textoGuardar("marco", editandoMarco)}
                                </Boton>

                                {editandoMarco && (
                                    <div style={{ marginTop: "var(--sm)" }}>
                                        <Boton tipo="secundario" bloque type="button" onClick={cancelarEdicionMarco}>Cancelar edición</Boton>
                                    </div>
                                )}
                            </form>
                        </>
                    )}

                </div>

            </div>
        </div>
    )
}

export default AdminCatalogos
