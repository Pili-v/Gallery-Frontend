// Publicar y editar obra — Área 5 · Artista
// Es el mismo componente para las dos rutas: si la URL trae un id carga la obra y la edita; si no, va vacío y crea.
// La obra se pide fresca al entrar (fetchObra) y se lee de obrasSlice, donde está una sola vez para toda la app. Cada
// cambio es un thunk de obrasSlice (POST, PUT o DELETE) que actualiza la obra con la respuesta del back, así se ve
// igual en todas las pantallas. Lo que es solo de este formulario queda en su estado: lo escrito, "guardando…" y el
// error de cada sección (se leen del resultado del dispatch). Los estilos y los tamaños de lienzo salen de sus slices,
// que se piden una sola vez para toda la app.
//
// Se guarda por secciones, como en la edición de una publicación de Mercado Libre: cada parte tiene su propio botón
// y guarda solo lo suyo, sin tocar el resto.
//   1 · La obra: nombre, descripción, estilos y si está en venta. Al crearla, la pantalla pasa a editarla.
//   2 · Tamaños y precios: cada variante se agrega, guarda o quita por separado.
//   3 · Fotos: se arman los cambios y se guardan juntos ("Guardar fotos"), en un solo pedido que aplica todo o nada.
// Cuando el back responde, el slice actualiza la obra con lo que devolvió: no se vuelve a pedir.
// Las reglas de negocio las valida el back; acá solo los límites obvios, y se muestra el mensaje que devuelva.

import { useEffect, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { useDispatch, useSelector } from "react-redux"
import { fetchEstilos } from "../redux/estilosSlice"
import { fetchTamanios } from "../redux/tamaniosSlice"
import {
    fetchObra,
    crearObra,
    actualizarObra,
    eliminarObra,
    crearVariante,
    actualizarVariante,
    eliminarVariante,
    guardarGaleria
} from "../redux/obrasSlice"
import { prepararImagen } from "../api/Imagen"

import Boton from "../components/Boton"
import Confirmacion from "../components/Confirmacion"
import CampoFormulario from "../components/CampoFormulario"
import Estado from "../components/Estado"
import SeccionFotos from "../components/SeccionFotos"
import SelectorEstilos from "../components/SelectorEstilos"
import TarjetaVariante from "../components/TarjetaVariante"

// Cada variante nueva lleva una clave propia para React: todavía no tiene id.
let contador = 0
const nuevaClave = () => {
    contador = contador + 1
    return "nueva" + contador
}

const VARIANTE_VACIA = {
    id: null,
    id_tamanio: "",
    precio_variante: "",
    stock_variante: "",
    porcentaje_descuento: "",
    descuento_hasta: ""
}

// Lo que el back guardó, pasado a lo que muestran los campos (todo texto).
const filaDesdeVariante = (variante) => ({
    id: variante.id,
    id_tamanio: String(variante.id_tamanio),
    precio_variante: String(variante.precio_variante),
    stock_variante: String(variante.stock_variante),
    porcentaje_descuento: variante.porcentaje_descuento === null ? "" : String(variante.porcentaje_descuento),
    descuento_hasta: variante.descuento_hasta || ""
})

const datosDesdeObra = (obra) => ({
    nombre_obra: obra.nombre_obra,
    descripcion_obra: obra.descripcion_obra || "",
    en_venta: obra.en_venta,
    estilo_ids: obra.estilo_ids
})

// Lo que se manda al back. El texto de los campos pasa a número; vacío pasa a null.
const cuerpoObra = (datos) => ({
    nombre_obra: datos.nombre_obra,
    descripcion_obra: datos.descripcion_obra,
    en_venta: datos.en_venta,
    estilo_ids: [...datos.estilo_ids].sort((a, b) => a - b)
})

const cuerpoVariante = (fila) => ({
    id_tamanio: Number(fila.id_tamanio),
    precio_variante: Number(fila.precio_variante),
    stock_variante: Number(fila.stock_variante),
    porcentaje_descuento: fila.porcentaje_descuento === "" ? null : Number(fila.porcentaje_descuento),
    descuento_hasta: fila.descuento_hasta === "" ? null : fila.descuento_hasta
})

// 1 · La obra. Lo escrito vive acá; con "Crear obra" o "Guardar cambios" se manda solo esta parte.
const DatosDeLaObra = ({ obra, estilos }) => {
    const dispatch = useDispatch()
    const navegar = useNavigate()
    const [guardando, setGuardando] = useState(false)
    const [error, setError] = useState(null)
    const [datos, setDatos] = useState(() =>
        obra ? datosDesdeObra(obra) : { nombre_obra: "", descripcion_obra: "", en_venta: true, estilo_ids: [] }
    )

    // Una obra nueva siempre se puede crear; una guardada, solo si se cambió algo.
    const cambiado = !obra || JSON.stringify(cuerpoObra(datos)) !== JSON.stringify(cuerpoObra(datosDesdeObra(obra)))

    const cambiarDato = (e) => {
        const { name, value } = e.target
        setDatos({ ...datos, [name]: value })
    }

    const alternarEstilo = (idEstilo) => {
        const elegidos = datos.estilo_ids.includes(idEstilo)
            ? datos.estilo_ids.filter((elegido) => elegido !== idEstilo)
            : [...datos.estilo_ids, idEstilo]
        setDatos({ ...datos, estilo_ids: elegidos })
    }

    const guardar = (e) => {
        e.preventDefault()
        if (guardando || !cambiado) return
        setGuardando(true)
        setError(null)
        const pedido = obra ? actualizarObra({ id: obra.id, datos: cuerpoObra(datos) }) : crearObra(cuerpoObra(datos))
        dispatch(pedido).then((resultado) => {
            setGuardando(false)
            if (resultado.error) setError(resultado.error.message)
            // Recién creada: se pasa a editarla, así se habilitan sus tamaños y sus fotos.
            else if (!obra) navegar("/panel/obras/" + resultado.payload.id + "/editar", { replace: true })
        })
    }

    return (
        <form className="cartela pad-lg" onSubmit={guardar}>
            <p className="catalog-number muted mb-md">1 · La obra</p>

            <CampoFormulario
                etiqueta="Nombre"
                name="nombre_obra"
                required
                value={datos.nombre_obra}
                onChange={cambiarDato}
            />
            <CampoFormulario
                etiqueta="Descripción"
                name="descripcion_obra"
                textarea
                value={datos.descripcion_obra}
                onChange={cambiarDato}
            />

            <label className="catalog-number muted">Estilos</label>
            <SelectorEstilos estilos={estilos} elegidos={datos.estilo_ids} onAlternar={alternarEstilo} />

            <label className="body-sm">
                <input
                    type="checkbox"
                    checked={datos.en_venta}
                    onChange={(e) => setDatos({ ...datos, en_venta: e.target.checked })}
                />{" "}
                En venta
            </label>

            {error && <p className="campo-error body-sm mt-sm">{error}</p>}

            <div className="fila al-final mt-md">
                <Boton type="submit" tipo={cambiado && !guardando ? "primario" : "deshabilitado"}>
                    {guardando ? "Guardando…" : obra ? "Guardar cambios" : "Crear obra"}
                </Boton>
            </div>
        </form>
    )
}

// 2 · Tamaños y precios. Cada variante se guarda sola. Lo escrito y todavía no guardado vive acá (borradores, por
// clave); lo guardado viene del store. Una variante nueva, al guardarse, pasa a ser una guardada más.
const VariantesDeLaObra = ({ obraId, variantes, tamanios }) => {
    const dispatch = useDispatch()
    const [borradores, setBorradores] = useState({})
    // Por clave de fila: si se está guardando y el error del último intento.
    const [guardando, setGuardando] = useState({})
    const [errores, setErrores] = useState({})
    // Las nuevas que ya se guardaron (clave -> id): dejan de mostrarse como nuevas.
    const [creadas, setCreadas] = useState({})
    // Las variantes nuevas que se agregaron en el formulario (sus claves). Sin ninguna guardada, arranca con una.
    const [nuevas, setNuevas] = useState(() => (variantes.length === 0 ? [nuevaClave()] : []))
    // La variante guardada que se está por quitar (se confirma antes).
    const [quitando, setQuitando] = useState(null)

    const filas = [
        ...variantes.map((variante) => ({ clave: "variante" + variante.id, guardada: filaDesdeVariante(variante) })),
        // Las nuevas que ya se guardaron dejan de mostrarse acá: aparecen arriba como guardadas.
        ...nuevas.filter((clave) => creadas[clave] === undefined).map((clave) => ({ clave, guardada: null }))
    ]
    const actual = (fila) => borradores[fila.clave] ?? fila.guardada ?? VARIANTE_VACIA
    const usados = filas.map((fila) => actual(fila).id_tamanio)

    const cambiar = (clave, campo, valor) => {
        const fila = filas.find((otra) => otra.clave === clave)
        setBorradores({ ...borradores, [clave]: { ...actual(fila), [campo]: valor } })
    }

    // Despacha el pedido de una fila y anota cómo terminó.
    const enviar = (clave, pedido, alTerminarBien) => {
        setGuardando((previos) => ({ ...previos, [clave]: true }))
        setErrores((previos) => ({ ...previos, [clave]: null }))
        dispatch(pedido).then((resultado) => {
            setGuardando((previos) => ({ ...previos, [clave]: false }))
            if (resultado.error) setErrores((previos) => ({ ...previos, [clave]: resultado.error.message }))
            else if (alTerminarBien) alTerminarBien(resultado.payload)
        })
    }

    const guardar = (clave) => {
        const fila = actual(filas.find((otra) => otra.clave === clave))
        const datos = { ...cuerpoVariante(fila), obra_id: obraId }
        if (fila.id === null) {
            enviar(clave, crearVariante(datos), (creada) =>
                setCreadas((previas) => ({ ...previas, [clave]: creada.id }))
            )
        } else {
            enviar(clave, actualizarVariante({ id: fila.id, datos }))
        }
    }

    // Una nueva sin guardar simplemente se descarta; una guardada se borra en el back (después de confirmar).
    const quitar = (clave) => {
        const fila = actual(filas.find((otra) => otra.clave === clave))
        if (fila.id === null) setNuevas(nuevas.filter((otra) => otra !== clave))
        else setQuitando({ clave, id: fila.id })
    }

    const confirmarQuitar = () => {
        enviar(quitando.clave, eliminarVariante({ id: quitando.id, obraId }))
        setQuitando(null)
    }

    return (
        <section className="cartela pad-lg mt-md">
            <p className="catalog-number muted mb-md">2 · Tamaños y precios</p>

            {filas.length === 0 && (
                <p className="body-sm muted mb-md">Todavía no hay tamaños: sin ellos la obra no se puede comprar.</p>
            )}
            {filas.map((fila) => {
                const datos = actual(fila)
                const cambiado =
                    fila.guardada === null ||
                    JSON.stringify(cuerpoVariante(datos)) !== JSON.stringify(cuerpoVariante(fila.guardada))
                return (
                    <TarjetaVariante
                        key={fila.clave}
                        clave={fila.clave}
                        id={datos.id}
                        idTamanio={datos.id_tamanio}
                        precio={datos.precio_variante}
                        stock={datos.stock_variante}
                        porcentajeDescuento={datos.porcentaje_descuento}
                        descuentoHasta={datos.descuento_hasta}
                        tamanios={tamanios}
                        usados={usados.filter((usado) => usado !== datos.id_tamanio)}
                        cambiado={cambiado}
                        guardando={guardando[fila.clave] === true}
                        error={errores[fila.clave]}
                        onCambiar={cambiar}
                        onGuardar={guardar}
                        onQuitar={quitar}
                    />
                )
            })}

            <Boton tipo="secundario" type="button" onClick={() => setNuevas([...nuevas, nuevaClave()])}>
                Agregar tamaño
            </Boton>

            {quitando && (
                <Confirmacion
                    titulo="¿Quitar este tamaño?"
                    mensaje="Se borra el tamaño con su precio y su stock."
                    textoConfirmar="Quitar"
                    onConfirmar={confirmarQuitar}
                    onCancelar={() => setQuitando(null)}
                />
            )}
        </section>
    )
}

// 3 · Fotos. Los cambios se arman en un borrador (agregar, reemplazar, ordenar, quitar) y se mandan juntos con
// "Guardar fotos": el back aplica la galería completa en un solo pedido, todo o nada. "Descartar cambios" vuelve a
// las guardadas. Cuando el guardado sale bien, el borrador se descarta y se ven las guardadas (las que devolvió el
// back). Si falla, el borrador sigue ahí para reintentar.
const FotosDeLaObra = ({ obraId, imagenes }) => {
    const dispatch = useDispatch()
    // [{ clave, id (null si es nueva), url, vista (la elegida, sin subir), archivo }], o null si no se tocó nada.
    const [borrador, setBorrador] = useState(null)
    const [guardando, setGuardando] = useState(false)
    const [error, setError] = useState(null)
    const [preparando, setPreparando] = useState(false)
    const [motivos, setMotivos] = useState("")

    const guardadas = imagenes.map((imagen) => ({
        clave: "foto" + imagen.id,
        id: imagen.id,
        url: imagen.url,
        vista: null,
        archivo: null
    }))
    const fotos = borrador ?? guardadas

    // Hay algo para guardar si cambió el orden, la cantidad o algún archivo.
    const cambiado =
        borrador !== null &&
        (borrador.length !== guardadas.length ||
            borrador.some((foto, i) => foto.id !== guardadas[i].id || foto.archivo !== null))

    const editar = (nuevas) => setBorrador(nuevas)

    // Las fotos elegidas se achican de a una (prepararImagen rechaza las muy chicas o las que no son imágenes).
    // Las que sirven se agregan al final del borrador; de las otras queda el motivo.
    const agregar = (archivos) => {
        const elegidas = Array.from(archivos)
        const listas = []
        const rechazos = []

        setPreparando(true)
        setMotivos("")

        const preparar = (i) => {
            if (i === elegidas.length) {
                setPreparando(false)
                setMotivos(rechazos.join(" "))
                if (listas.length > 0) editar([...fotos, ...listas])
                return
            }
            prepararImagen(elegidas[i]).then((resultado) => {
                if (resultado.error) {
                    rechazos.push(elegidas[i].name + ": " + resultado.error)
                } else {
                    listas.push({
                        clave: nuevaClave(),
                        id: null,
                        url: null,
                        vista: URL.createObjectURL(resultado.archivo),
                        archivo: resultado.archivo
                    })
                }
                preparar(i + 1)
            })
        }
        preparar(0)
    }

    const reemplazar = (clave, archivo) => {
        setPreparando(true)
        setMotivos("")
        prepararImagen(archivo).then((resultado) => {
            if (resultado.error) {
                setMotivos(archivo.name + ": " + resultado.error)
            } else {
                editar(
                    fotos.map((foto) =>
                        foto.clave === clave
                            ? { ...foto, archivo: resultado.archivo, vista: URL.createObjectURL(resultado.archivo) }
                            : foto
                    )
                )
            }
            setPreparando(false)
        })
    }

    // Mueve una foto una posición hacia adelante (-1) o hacia atrás (+1).
    const mover = (clave, delta) => {
        const i = fotos.findIndex((foto) => foto.clave === clave)
        const j = i + delta
        if (i < 0 || j < 0 || j >= fotos.length) return
        const nuevas = [...fotos]
        nuevas[i] = fotos[j]
        nuevas[j] = fotos[i]
        editar(nuevas)
    }

    // Arrastrar una foto sobre otra: la arrastrada pasa al lugar de la otra y las demás se corren.
    const ordenar = (claveArrastrada, claveDestino) => {
        const desde = fotos.findIndex((foto) => foto.clave === claveArrastrada)
        const hasta = fotos.findIndex((foto) => foto.clave === claveDestino)
        if (desde < 0 || hasta < 0 || desde === hasta) return
        const nuevas = [...fotos]
        const [movida] = nuevas.splice(desde, 1)
        nuevas.splice(hasta, 0, movida)
        editar(nuevas)
    }

    const quitar = (clave) => editar(fotos.filter((foto) => foto.clave !== clave))

    const guardar = () => {
        if (guardando || preparando || !cambiado) return
        setGuardando(true)
        setError(null)
        const galeria = fotos.map((foto) => ({ id: foto.id, archivo: foto.archivo }))
        dispatch(guardarGaleria({ obraId, fotos: galeria })).then((resultado) => {
            setGuardando(false)
            if (resultado.error) setError(resultado.error.message)
            else setBorrador(null)
        })
    }

    const descartar = () => {
        setBorrador(null)
        setMotivos("")
        setError(null)
    }

    return (
        <section className="cartela pad-lg mt-md">
            <p className="catalog-number muted mb-md">3 · Fotos</p>

            <SeccionFotos
                fotos={fotos}
                preparando={preparando}
                error={motivos || error}
                ocupado={guardando}
                onAgregar={agregar}
                onMover={mover}
                onOrdenar={ordenar}
                onQuitar={quitar}
                onReemplazar={reemplazar}
            />

            <div className="fila al-final mt-md">
                {cambiado && !guardando && (
                    <button type="button" className="body-sm boton-texto" onClick={descartar}>
                        Descartar cambios
                    </button>
                )}
                <Boton
                    type="button"
                    tipo={cambiado && !guardando && !preparando ? "primario" : "deshabilitado"}
                    onClick={guardar}
                >
                    {guardando ? "Guardando…" : "Guardar fotos"}
                </Boton>
            </div>
        </section>
    )
}

const FormularioObra = ({ id }) => {
    const dispatch = useDispatch()
    const navegar = useNavigate()
    const editando = id !== undefined

    // Lo que viene del backend (Redux)
    const estilos = useSelector((state) => state.estilos)
    const tamanios = useSelector((state) => state.tamanios)
    const obraGuardada = useSelector((state) => (editando ? state.obras.porId[id] : null))
    const perfilArtista = useSelector((state) => state.sesion.perfilArtista)

    // El pedido de la obra (al editar): hasta que llega no se muestra el formulario, porque guardar una variante manda
    // también su stock y tiene que estar al día.
    const [pedido, setPedido] = useState({ listo: !editando, error: null })
    const [confirmandoEliminar, setConfirmandoEliminar] = useState(false)
    const [eliminando, setEliminando] = useState(false)
    const [errorEliminar, setErrorEliminar] = useState(null)

    // Estilos y tamaños: una sola vez para toda la app (si otra pantalla ya los pidió, no se vuelven a pedir)
    useEffect(() => {
        dispatch(fetchEstilos())
        dispatch(fetchTamanios())
    }, [dispatch])

    // La obra: si se edita, se pide fresca con sus variantes y fotos; si se publica una nueva, el formulario arranca
    // vacío.
    useEffect(() => {
        if (!editando) return
        dispatch(fetchObra({ id, siempre: true })).then((resultado) => {
            setPedido({ listo: true, error: resultado.error ? resultado.error.message : null })
        })
    }, [dispatch, id, editando])

    const obra = editando && pedido.listo ? (obraGuardada ?? null) : null
    const variantes = obra ? obra.variantes : []
    const imagenes = obra ? obra.imagenes : []
    const error = estilos.error || tamanios.error || pedido.error
    const listo = estilos.cargado && tamanios.cargado && pedido.listo

    // Si la sesión sabe cuál es el perfil del artista, se avisa antes de editar una obra ajena.
    // El back es el que decide de verdad: si no, rechaza cada guardado.
    const esAjena = obra !== null && perfilArtista && perfilArtista.id !== obra.artista_id

    // Eliminada: vuelve a Mis obras.
    const eliminar = () => {
        setConfirmandoEliminar(false)
        setEliminando(true)
        setErrorEliminar(null)
        dispatch(eliminarObra(obra.id)).then((resultado) => {
            setEliminando(false)
            if (resultado.error) setErrorEliminar(resultado.error.message)
            else navegar("/panel/obras")
        })
    }

    let cuerpo
    if (error) {
        cuerpo = <Estado tipo="error" mensaje={error} />
    } else if (!listo) {
        cuerpo = <Estado tipo="cargando" />
    } else if (obra && obra.eliminada) {
        cuerpo = <Estado tipo="vacio" mensaje="Esta obra fue eliminada." />
    } else if (esAjena) {
        cuerpo = <Estado tipo="vacio" mensaje="Esta obra es de otro artista: no podés editarla." />
    } else {
        // Para verse en el catálogo, la obra necesita al menos un tamaño y una foto.
        const incompleta = obra && (variantes.length === 0 || imagenes.length === 0)

        cuerpo = (
            <>
                {incompleta && (
                    <p className="aviso mb-md" role="status">
                        Agregá al menos un tamaño y una foto para que la obra se vea en el catálogo.
                    </p>
                )}

                <DatosDeLaObra obra={obra} estilos={estilos.items} />

                {obra ? (
                    <>
                        <VariantesDeLaObra obraId={obra.id} variantes={variantes} tamanios={tamanios.items} />
                        <FotosDeLaObra obraId={obra.id} imagenes={imagenes} />
                    </>
                ) : (
                    <p className="cartela pad-lg mt-md body-sm muted">
                        Después de crear la obra vas a poder agregarle sus tamaños, precios y fotos.
                    </p>
                )}

                {errorEliminar && <p className="campo-error body-sm mt-md">{errorEliminar}</p>}

                <div className="entre mt-lg">
                    <Link className="boton boton-secundario" to="/panel/obras">
                        Volver a Mis obras
                    </Link>
                    {obra && (
                        <button
                            type="button"
                            className="body-sm boton-texto peligro"
                            disabled={eliminando}
                            onClick={() => setConfirmandoEliminar(true)}
                        >
                            Eliminar obra
                        </button>
                    )}
                </div>

                {confirmandoEliminar && (
                    <Confirmacion
                        titulo="¿Eliminar la obra?"
                        mensaje="La obra se elimina y deja de mostrarse en todos lados. Esta acción no se puede deshacer desde acá."
                        textoConfirmar="Eliminar"
                        onConfirmar={eliminar}
                        onCancelar={() => setConfirmandoEliminar(false)}
                    />
                )}
            </>
        )
    }

    return (
        <div className="seccion">
            <div className="contenido col-media">
                <h1 className="headline-lg">{editando ? "Editar obra" : "Publicar obra"}</h1>
                <p className="body-lg muted mb-lg">
                    {editando
                        ? "Cada parte se guarda por separado, con su propio botón."
                        : "Primero la obra; después, sus tamaños y sus fotos."}
                </p>

                {cuerpo}
            </div>
        </div>
    )
}

// La key hace que, al pasar de una obra a otra (o de publicar a editar), el formulario arranque de cero.
const ObraForm = () => {
    const { id } = useParams()
    return <FormularioObra key={id || "nueva"} id={id} />
}

export default ObraForm
