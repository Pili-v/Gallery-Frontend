import { useEffect, useState } from "react"
import { useDispatch, useSelector } from "react-redux"

import { pesos, optimizada } from "../api/formato"

import CampoFormulario from "../components/CampoFormulario"
import AccionesCatalogo from "../components/AccionesCatalogo"
import Boton from "../components/Boton"
import Estado from "../components/Estado"

import {
    fetchEstilos,
    crearEstilo,
    actualizarEstilo,
    eliminarEstilo,
    limpiarErrorEstilos
} from "../redux/estilosSlice"

import {
    fetchTamanios,
    crearTamanio,
    actualizarTamanio,
    eliminarTamanio,
    limpiarErrorTamanios
} from "../redux/tamaniosSlice"

import {
    fetchMarcos,
    crearMarco,
    actualizarMarco,
    eliminarMarco,
    limpiarErrorMarcos
} from "../redux/marcosSlice"


const ESTILO_VACIO = ""

const TAMANIO_VACIO = {
    nombre_tamanio: "",
    ancho_lienzo: "",
    largo_lienzo: ""
}

const MARCO_VACIO = {
    nombre_marco: "",
    color_marco: "",
    precio_marco: ""
}


// Primera letra de cada palabra en mayúscula.
const capitalizarPalabras = (texto) => {
    return texto
        .toLowerCase()
        .split(" ")
        .map(
            (palabra) =>
                palabra.charAt(0).toUpperCase() +
                palabra.slice(1)
        )
        .join(" ")
}


// Solo permite letras.
const limpiarSoloTexto = (texto) =>
    capitalizarPalabras(
        texto.replace(
            /[^A-Za-zÁÉÍÓÚáéíóúÜüÑñ\s]/g,
            ""
        )
    )


// Permite letras y números.
const limpiarTextoConNumeros = (texto) =>
    capitalizarPalabras(
        texto.replace(
            /[^A-Za-zÁÉÍÓÚáéíóúÜüÑñ0-9\s]/g,
            ""
        )
    )


const AdminCatalogos = () => {
    const dispatch = useDispatch()


    // -------------------------
    // ESTADO GLOBAL - REDUX
    // -------------------------

    const {
        items: estilos,
        loading: loadingEstilos,
        guardando: guardandoEstilo,
        eliminandoId: eliminandoEstiloId,
        error: errorEstilos
    } = useSelector((state) => state.estilos)


    const {
        items: tamanios,
        loading: loadingTamanios,
        guardando: guardandoTamanio,
        eliminandoId: eliminandoTamanioId,
        error: errorTamanios
    } = useSelector((state) => state.tamanios)


    const {
        items: marcos,
        loading: loadingMarcos,
        guardando: guardandoMarco,
        eliminandoId: eliminandoMarcoId,
        error: errorMarcos
    } = useSelector((state) => state.marcos)


    // -------------------------
    // ESTADO LOCAL
    // -------------------------

    // La pestaña es algo visual de esta pantalla.
    const [pestania, setPestania] = useState("estilos")

    // Los formularios siguen siendo estado local.
    const [nuevoEstilo, setNuevoEstilo] =
        useState(ESTILO_VACIO)

    const [nuevoTamanio, setNuevoTamanio] =
        useState(TAMANIO_VACIO)

    const [nuevoMarco, setNuevoMarco] =
        useState(MARCO_VACIO)

    const [archivoMarco, setArchivoMarco] =
        useState(null)

    // Permite limpiar visualmente el input file.
    const [claveArchivo, setClaveArchivo] =
        useState(0)


    // IDs de los elementos que estamos editando.
    const [editandoEstilo, setEditandoEstilo] =
        useState(null)

    const [editandoTamanio, setEditandoTamanio] =
        useState(null)

    const [editandoMarco, setEditandoMarco] =
        useState(null)


    // Confirmación visual de un DELETE.
    const [confirmando, setConfirmando] =
        useState(null)

    // Errores propios de validación/formulario.
    const [errorFormulario, setErrorFormulario] =
        useState("")


    // -------------------------
    // CARGA INICIAL
    // -------------------------

    useEffect(() => {
        // Cada slice decide si realmente necesita hacer el GET.
        dispatch(fetchEstilos())
        dispatch(fetchTamanios())
        dispatch(fetchMarcos())
    }, [dispatch])


    // Solo mostramos la pantalla de carga si todavía
    // estamos esperando datos iniciales.
    const cargando =
        (loadingEstilos && estilos.length === 0) ||
        (loadingTamanios && tamanios.length === 0) ||
        (loadingMarcos && marcos.length === 0)


    // Saber qué catálogo está guardando.
    const guardando =
        guardandoEstilo
            ? "estilo"
            : guardandoTamanio
              ? "tamanio"
              : guardandoMarco
                ? "marco"
                : ""


    // Mostramos el error Redux correspondiente
    // a la pestaña actual.
    const error =
        pestania === "estilos"
            ? errorEstilos
            : pestania === "tamanios"
              ? errorTamanios
              : errorMarcos


    const limpiarErroresRedux = () => {
        dispatch(limpiarErrorEstilos())
        dispatch(limpiarErrorTamanios())
        dispatch(limpiarErrorMarcos())
    }


    const cambiarPestania = (nueva) => {
        setPestania(nueva)
        setConfirmando(null)
        setErrorFormulario("")
        limpiarErroresRedux()
    }


    const esConfirmacion = (tipo, id) =>
        confirmando !== null &&
        confirmando.tipo === tipo &&
        confirmando.id === id


    // =====================================================
    // ESTILOS
    // =====================================================

    const editarEstilo = (estilo) => {
        setEditandoEstilo(estilo.id)
        setNuevoEstilo(estilo.nombre_estilo)
        setConfirmando(null)
        setErrorFormulario("")
        dispatch(limpiarErrorEstilos())
    }


    const cancelarEdicionEstilo = () => {
        setEditandoEstilo(null)
        setNuevoEstilo(ESTILO_VACIO)
        setErrorFormulario("")
    }


    const guardarEstilo = (e) => {
        e.preventDefault()

        if (guardando) {
            return
        }

        if (!nuevoEstilo.trim()) {
            setErrorFormulario(
                "Ingresá un nombre para el estilo."
            )
            return
        }

        setErrorFormulario("")
        dispatch(limpiarErrorEstilos())

        const datos = {
            nombre_estilo: nuevoEstilo.trim()
        }


        // Si hay un ID estamos editando.
        if (editandoEstilo) {
            dispatch(
                actualizarEstilo({
                    id: editandoEstilo,
                    datos
                })
            ).then((resultado) => {
                if (
                    actualizarEstilo.fulfilled.match(
                        resultado
                    )
                ) {
                    cancelarEdicionEstilo()
                }

                if (
                    actualizarEstilo.rejected.match(
                        resultado
                    )
                ) {
                    setErrorFormulario(
                        resultado.error.message
                    )
                }
            })

            return
        }


        // Si no hay ID estamos creando.
        dispatch(crearEstilo(datos)).then(
            (resultado) => {
                if (
                    crearEstilo.fulfilled.match(
                        resultado
                    )
                ) {
                    cancelarEdicionEstilo()
                }

                if (
                    crearEstilo.rejected.match(
                        resultado
                    )
                ) {
                    setErrorFormulario(
                        resultado.error.message
                    )
                }
            }
        )
    }


    const borrarEstilo = (id) => {
        dispatch(limpiarErrorEstilos())

        dispatch(eliminarEstilo(id)).then(
            (resultado) => {
                if (
                    eliminarEstilo.fulfilled.match(
                        resultado
                    )
                ) {
                    setConfirmando(null)

                    if (editandoEstilo === id) {
                        cancelarEdicionEstilo()
                    }
                }
            }
        )
    }


    // =====================================================
    // TAMAÑOS
    // =====================================================

    const handleTamanio = (e) => {
        const { name, value } = e.target

        let nuevoValor = value

        if (name === "nombre_tamanio") {
            nuevoValor =
                limpiarTextoConNumeros(value)
        }

        if (
            (
                name === "ancho_lienzo" ||
                name === "largo_lienzo"
            ) &&
            value !== "" &&
            Number(value) < 0
        ) {
            nuevoValor = ""
        }

        setNuevoTamanio({
            ...nuevoTamanio,
            [name]: nuevoValor
        })

        setErrorFormulario("")
    }


    const editarTamanio = (tamanio) => {
        setEditandoTamanio(tamanio.id)

        setNuevoTamanio({
            nombre_tamanio:
                tamanio.nombre_tamanio || "",
            ancho_lienzo:
                tamanio.ancho_lienzo || "",
            largo_lienzo:
                tamanio.largo_lienzo || ""
        })

        setConfirmando(null)
        setErrorFormulario("")
        dispatch(limpiarErrorTamanios())
    }


    const cancelarEdicionTamanio = () => {
        setEditandoTamanio(null)
        setNuevoTamanio(TAMANIO_VACIO)
        setErrorFormulario("")
    }


    const guardarTamanio = (e) => {
        e.preventDefault()

        if (guardando) {
            return
        }

        const ancho =
            Number(nuevoTamanio.ancho_lienzo)

        const largo =
            Number(nuevoTamanio.largo_lienzo)


        if (
            !nuevoTamanio.nombre_tamanio.trim()
        ) {
            setErrorFormulario(
                "Ingresá un nombre para el tamaño."
            )
            return
        }


        if (ancho <= 0 || largo <= 0) {
            setErrorFormulario(
                "El ancho y el largo deben ser mayores a 0."
            )
            return
        }


        setErrorFormulario("")
        dispatch(limpiarErrorTamanios())


        const datos = {
            nombre_tamanio:
                nuevoTamanio.nombre_tamanio.trim(),
            ancho_lienzo: ancho,
            largo_lienzo: largo
        }


        if (editandoTamanio) {
            dispatch(
                actualizarTamanio({
                    id: editandoTamanio,
                    datos
                })
            ).then((resultado) => {
                if (
                    actualizarTamanio.fulfilled.match(
                        resultado
                    )
                ) {
                    cancelarEdicionTamanio()
                }

                if (
                    actualizarTamanio.rejected.match(
                        resultado
                    )
                ) {
                    setErrorFormulario(
                        resultado.error.message
                    )
                }
            })

            return
        }


        dispatch(crearTamanio(datos)).then(
            (resultado) => {
                if (
                    crearTamanio.fulfilled.match(
                        resultado
                    )
                ) {
                    cancelarEdicionTamanio()
                }

                if (
                    crearTamanio.rejected.match(
                        resultado
                    )
                ) {
                    setErrorFormulario(
                        resultado.error.message
                    )
                }
            }
        )
    }


    const borrarTamanio = (id) => {
        dispatch(limpiarErrorTamanios())

        dispatch(eliminarTamanio(id)).then(
            (resultado) => {
                if (
                    eliminarTamanio.fulfilled.match(
                        resultado
                    )
                ) {
                    setConfirmando(null)

                    if (editandoTamanio === id) {
                        cancelarEdicionTamanio()
                    }
                }
            }
        )
    }


    // =====================================================
    // MARCOS
    // =====================================================

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

        setErrorFormulario("")
    }


    const editarMarco = (marco) => {
        setEditandoMarco(marco.id)

        setNuevoMarco({
            nombre_marco:
                marco.nombre_marco || "",
            color_marco:
                marco.color_marco || "",
            precio_marco:
                marco.precio_marco || ""
        })

        setArchivoMarco(null)

        setClaveArchivo(
            (clave) => clave + 1
        )

        setConfirmando(null)
        setErrorFormulario("")
        dispatch(limpiarErrorMarcos())
    }


    const cancelarEdicionMarco = () => {
        setEditandoMarco(null)
        setNuevoMarco(MARCO_VACIO)
        setArchivoMarco(null)

        setClaveArchivo(
            (clave) => clave + 1
        )

        setErrorFormulario("")
    }


    const guardarMarco = (e) => {
        e.preventDefault()

        if (guardando) {
            return
        }

        const precio =
            Number(nuevoMarco.precio_marco)


        if (!nuevoMarco.nombre_marco.trim()) {
            setErrorFormulario(
                "Ingresá un nombre para el marco."
            )
            return
        }


        if (!nuevoMarco.color_marco.trim()) {
            setErrorFormulario(
                "Ingresá un color para el marco."
            )
            return
        }


        if (precio <= 0) {
            setErrorFormulario(
                "El precio debe ser mayor a 0."
            )
            return
        }


        // Para crear la imagen es obligatoria.
        // Para editar puede mantenerse la anterior.
        if (!editandoMarco && !archivoMarco) {
            setErrorFormulario(
                "Seleccioná una imagen para el marco."
            )
            return
        }


        setErrorFormulario("")
        dispatch(limpiarErrorMarcos())


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


        if (editandoMarco) {
            dispatch(
                actualizarMarco({
                    id: editandoMarco,
                    formData
                })
            ).then((resultado) => {
                if (
                    actualizarMarco.fulfilled.match(
                        resultado
                    )
                ) {
                    cancelarEdicionMarco()
                }

                if (
                    actualizarMarco.rejected.match(
                        resultado
                    )
                ) {
                    setErrorFormulario(
                        resultado.error.message
                    )
                }
            })

            return
        }


        dispatch(crearMarco(formData)).then(
            (resultado) => {
                if (
                    crearMarco.fulfilled.match(
                        resultado
                    )
                ) {
                    cancelarEdicionMarco()
                }

                if (
                    crearMarco.rejected.match(
                        resultado
                    )
                ) {
                    setErrorFormulario(
                        resultado.error.message
                    )
                }
            }
        )
    }


    const borrarMarco = (id) => {
        dispatch(limpiarErrorMarcos())

        dispatch(eliminarMarco(id)).then(
            (resultado) => {
                if (
                    eliminarMarco.fulfilled.match(
                        resultado
                    )
                ) {
                    setConfirmando(null)

                    if (editandoMarco === id) {
                        cancelarEdicionMarco()
                    }
                }
            }
        )
    }


    // =====================================================
    // RENDER
    // =====================================================

    if (cargando) {
        return (
            <div className="seccion">
                <div className="contenido">
                    <Estado tipo="cargando" />
                </div>
            </div>
        )
    }


    const textoGuardar = (
        nombre,
        editando
    ) =>
        guardando === nombre
            ? "Guardando..."
            : editando
              ? "Guardar cambios"
              : "Agregar"


    const pestanias = [
        {
            clave: "estilos",
            texto: "Estilos",
            cantidad: estilos.length
        },
        {
            clave: "tamanios",
            texto: "Tamaños",
            cantidad: tamanios.length
        },
        {
            clave: "marcos",
            texto: "Marcos",
            cantidad: marcos.length
        }
    ]


    return (
        <div className="seccion">
            <div className="contenido">

                <h1 className="headline-lg titulo-oculto">
                    Catálogos
                </h1>


                <nav
                    className="pestanias mb-lg"
                    aria-label="Catálogos"
                >
                    {pestanias.map((item) => (
                        <button
                            key={item.clave}
                            type="button"
                            className={
                                "pestania" +
                                (
                                    pestania ===
                                    item.clave
                                        ? " activa"
                                        : ""
                                )
                            }
                            aria-pressed={
                                pestania ===
                                item.clave
                            }
                            onClick={() =>
                                cambiarPestania(
                                    item.clave
                                )
                            }
                        >
                            {item.texto} (
                            {item.cantidad})
                        </button>
                    ))}
                </nav>


                {error && (
                    <div className="mb-md">
                        <Estado
                            tipo="error"
                            mensaje={error}
                        />
                    </div>
                )}


                <div className="dos-columnas">

                    {/* =================================================
                        ESTILOS
                    ================================================= */}

                    {pestania === "estilos" && (
                        <>
                            {estilos.length === 0 ? (
                                <Estado
                                    tipo="vacio"
                                    mensaje="Todavía no hay estilos."
                                />
                            ) : (
                                <table className="tabla">
                                    <thead>
                                        <tr>
                                            <th>
                                                Estilo
                                            </th>
                                            <th></th>
                                        </tr>
                                    </thead>

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
                                                            estilo.nombre_estilo
                                                        }
                                                    </td>

                                                    <td>
                                                        <AccionesCatalogo
                                                            confirmando={esConfirmacion(
                                                                "estilo",
                                                                estilo.id
                                                            )}
                                                            eliminando={
                                                                eliminandoEstiloId ===
                                                                estilo.id
                                                            }
                                                            onEditar={() =>
                                                                editarEstilo(
                                                                    estilo
                                                                )
                                                            }
                                                            onEliminar={() =>
                                                                setConfirmando(
                                                                    {
                                                                        tipo: "estilo",
                                                                        id: estilo.id
                                                                    }
                                                                )
                                                            }
                                                            onConfirmar={() =>
                                                                borrarEstilo(
                                                                    estilo.id
                                                                )
                                                            }
                                                            onCancelar={() =>
                                                                setConfirmando(
                                                                    null
                                                                )
                                                            }
                                                        />
                                                    </td>
                                                </tr>
                                            )
                                        )}
                                    </tbody>
                                </table>
                            )}


                            <form
                                className="cartela pegado-arriba pad-lg"
                                onSubmit={
                                    guardarEstilo
                                }
                            >
                                <CampoFormulario
                                    etiqueta={
                                        editandoEstilo
                                            ? "Editar estilo"
                                            : "Nuevo estilo"
                                    }
                                    value={
                                        nuevoEstilo
                                    }
                                    error={
                                        errorFormulario
                                    }
                                    onChange={(e) => {
                                        setNuevoEstilo(
                                            limpiarSoloTexto(
                                                e.target
                                                    .value
                                            )
                                        )

                                        setErrorFormulario(
                                            ""
                                        )
                                    }}
                                />


                                <Boton
                                    tipo={
                                        guardando ===
                                        "estilo"
                                            ? "deshabilitado"
                                            : "primario"
                                    }
                                    bloque
                                    type="submit"
                                >
                                    {textoGuardar(
                                        "estilo",
                                        editandoEstilo
                                    )}
                                </Boton>


                                {editandoEstilo && (
                                    <div className="mt-sm">
                                        <Boton
                                            tipo="secundario"
                                            bloque
                                            type="button"
                                            onClick={
                                                cancelarEdicionEstilo
                                            }
                                        >
                                            Cancelar
                                            edición
                                        </Boton>
                                    </div>
                                )}
                            </form>
                        </>
                    )}


                    {/* =================================================
                        TAMAÑOS
                    ================================================= */}

                    {pestania === "tamanios" && (
                        <>
                            {tamanios.length === 0 ? (
                                <Estado
                                    tipo="vacio"
                                    mensaje="Todavía no hay tamaños."
                                />
                            ) : (
                                <table className="tabla">
                                    <thead>
                                        <tr>
                                            <th>
                                                Tamaño
                                            </th>
                                            <th>
                                                Medidas
                                            </th>
                                            <th></th>
                                        </tr>
                                    </thead>

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

                                                    <td className="muted">
                                                        {
                                                            tamanio.ancho_lienzo
                                                        }{" "}
                                                        ×{" "}
                                                        {
                                                            tamanio.largo_lienzo
                                                        }{" "}
                                                        cm
                                                    </td>

                                                    <td>
                                                        <AccionesCatalogo
                                                            confirmando={esConfirmacion(
                                                                "tamanio",
                                                                tamanio.id
                                                            )}
                                                            eliminando={
                                                                eliminandoTamanioId ===
                                                                tamanio.id
                                                            }
                                                            onEditar={() =>
                                                                editarTamanio(
                                                                    tamanio
                                                                )
                                                            }
                                                            onEliminar={() =>
                                                                setConfirmando(
                                                                    {
                                                                        tipo: "tamanio",
                                                                        id: tamanio.id
                                                                    }
                                                                )
                                                            }
                                                            onConfirmar={() =>
                                                                borrarTamanio(
                                                                    tamanio.id
                                                                )
                                                            }
                                                            onCancelar={() =>
                                                                setConfirmando(
                                                                    null
                                                                )
                                                            }
                                                        />
                                                    </td>
                                                </tr>
                                            )
                                        )}
                                    </tbody>
                                </table>
                            )}


                            <form
                                className="cartela pegado-arriba pad-lg"
                                onSubmit={
                                    guardarTamanio
                                }
                            >
                                <p className="catalog-number muted mb-sm">
                                    {editandoTamanio
                                        ? "Editar tamaño"
                                        : "Nuevo tamaño"}
                                </p>


                                <CampoFormulario
                                    etiqueta="Nombre"
                                    name="nombre_tamanio"
                                    value={
                                        nuevoTamanio.nombre_tamanio
                                    }
                                    onChange={
                                        handleTamanio
                                    }
                                />


                                <div className="fila-campos">
                                    <CampoFormulario
                                        etiqueta="Ancho (cm)"
                                        tipo="number"
                                        name="ancho_lienzo"
                                        min="0.01"
                                        step="0.01"
                                        value={
                                            nuevoTamanio.ancho_lienzo
                                        }
                                        onChange={
                                            handleTamanio
                                        }
                                    />

                                    <CampoFormulario
                                        etiqueta="Largo (cm)"
                                        tipo="number"
                                        name="largo_lienzo"
                                        min="0.01"
                                        step="0.01"
                                        value={
                                            nuevoTamanio.largo_lienzo
                                        }
                                        onChange={
                                            handleTamanio
                                        }
                                    />
                                </div>


                                {errorFormulario && (
                                    <p className="campo-error body-sm mb-md">
                                        {
                                            errorFormulario
                                        }
                                    </p>
                                )}


                                <Boton
                                    tipo={
                                        guardando ===
                                        "tamanio"
                                            ? "deshabilitado"
                                            : "primario"
                                    }
                                    bloque
                                    type="submit"
                                >
                                    {textoGuardar(
                                        "tamanio",
                                        editandoTamanio
                                    )}
                                </Boton>


                                {editandoTamanio && (
                                    <div className="mt-sm">
                                        <Boton
                                            tipo="secundario"
                                            bloque
                                            type="button"
                                            onClick={
                                                cancelarEdicionTamanio
                                            }
                                        >
                                            Cancelar
                                            edición
                                        </Boton>
                                    </div>
                                )}
                            </form>
                        </>
                    )}


                    {/* =================================================
                        MARCOS
                    ================================================= */}

                    {pestania === "marcos" && (
                        <>
                            {marcos.length === 0 ? (
                                <Estado
                                    tipo="vacio"
                                    mensaje="Todavía no hay marcos."
                                />
                            ) : (
                                <table className="tabla">
                                    <thead>
                                        <tr>
                                            <th></th>
                                            <th>
                                                Marco
                                            </th>
                                            <th>
                                                Color
                                            </th>
                                            <th>
                                                Precio
                                            </th>
                                            <th></th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {marcos.map(
                                            (marco) => (
                                                <tr
                                                    key={
                                                        marco.id
                                                    }
                                                >
                                                    <td className="celda-miniatura">
                                                        {marco.url && (
                                                            <img
                                                                src={optimizada(
                                                                    marco.url,
                                                                    96
                                                                )}
                                                                alt=""
                                                                width="48"
                                                                height="48"
                                                                className="miniatura-marco"
                                                            />
                                                        )}
                                                    </td>

                                                    <td>
                                                        {
                                                            marco.nombre_marco
                                                        }
                                                    </td>

                                                    <td className="muted">
                                                        {
                                                            marco.color_marco
                                                        }
                                                    </td>

                                                    <td className="price-md">
                                                        {pesos(
                                                            marco.precio_marco
                                                        )}
                                                    </td>

                                                    <td>
                                                        <AccionesCatalogo
                                                            confirmando={esConfirmacion(
                                                                "marco",
                                                                marco.id
                                                            )}
                                                            eliminando={
                                                                eliminandoMarcoId ===
                                                                marco.id
                                                            }
                                                            onEditar={() =>
                                                                editarMarco(
                                                                    marco
                                                                )
                                                            }
                                                            onEliminar={() =>
                                                                setConfirmando(
                                                                    {
                                                                        tipo: "marco",
                                                                        id: marco.id
                                                                    }
                                                                )
                                                            }
                                                            onConfirmar={() =>
                                                                borrarMarco(
                                                                    marco.id
                                                                )
                                                            }
                                                            onCancelar={() =>
                                                                setConfirmando(
                                                                    null
                                                                )
                                                            }
                                                        />
                                                    </td>
                                                </tr>
                                            )
                                        )}
                                    </tbody>
                                </table>
                            )}


                            <form
                                className="cartela pegado-arriba pad-lg"
                                onSubmit={
                                    guardarMarco
                                }
                            >
                                <p className="catalog-number muted mb-sm">
                                    {editandoMarco
                                        ? "Editar marco"
                                        : "Nuevo marco"}
                                </p>


                                <CampoFormulario
                                    etiqueta="Nombre"
                                    name="nombre_marco"
                                    value={
                                        nuevoMarco.nombre_marco
                                    }
                                    onChange={
                                        handleMarco
                                    }
                                />


                                <CampoFormulario
                                    etiqueta="Color"
                                    name="color_marco"
                                    value={
                                        nuevoMarco.color_marco
                                    }
                                    onChange={
                                        handleMarco
                                    }
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
                                    onChange={
                                        handleMarco
                                    }
                                />


                                <div className="campo">
                                    <label className="catalog-number muted">
                                        {editandoMarco
                                            ? "Nueva imagen (opcional)"
                                            : "Imagen"}
                                    </label>

                                    <input
                                        key={
                                            claveArchivo
                                        }
                                        className="input"
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => {
                                            setArchivoMarco(
                                                e.target
                                                    .files[0] ||
                                                    null
                                            )

                                            setErrorFormulario(
                                                ""
                                            )
                                        }}
                                    />
                                </div>


                                {errorFormulario && (
                                    <p className="campo-error body-sm mb-md">
                                        {
                                            errorFormulario
                                        }
                                    </p>
                                )}


                                <Boton
                                    tipo={
                                        guardando ===
                                        "marco"
                                            ? "deshabilitado"
                                            : "primario"
                                    }
                                    bloque
                                    type="submit"
                                >
                                    {textoGuardar(
                                        "marco",
                                        editandoMarco
                                    )}
                                </Boton>


                                {editandoMarco && (
                                    <div className="mt-sm">
                                        <Boton
                                            tipo="secundario"
                                            bloque
                                            type="button"
                                            onClick={
                                                cancelarEdicionMarco
                                            }
                                        >
                                            Cancelar
                                            edición
                                        </Boton>
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
