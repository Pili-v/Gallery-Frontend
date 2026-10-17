// Publicar y editar obra — Área 5 · Artista
// Es el mismo componente para las dos rutas: si la URL trae un id carga la obra y la edita;
// si no, va vacío y crea. Las reglas de negocio las valida el backend: acá solo se limitan
// los rangos obvios (en TarjetaVariante) y se muestra el mensaje que devuelva el back.
// Las fotos se agregan más adelante, cuando esté la subida de imágenes.

import { useEffect, useRef, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { api, lista } from "../api/cliente"
import { getPerfilArtista } from "../api/sesion"

import Boton from "../components/Boton"
import Confirmacion from "../components/Confirmacion"
import CampoFormulario from "../components/CampoFormulario"
import Estado from "../components/Estado"
import SelectorEstilos from "../components/SelectorEstilos"
import TarjetaVariante from "../components/TarjetaVariante"

// Cada fila del formulario lleva una clave propia para React: las nuevas todavía no tienen id.
let contador = 0
const nuevaFila = () => {
    contador = contador + 1
    return {
        clave: "nueva" + contador,
        id: null,
        id_tamanio: "",
        precio_variante: "",
        stock_variante: "",
        porcentaje_descuento: "",
        descuento_hasta: ""
    }
}

// Lo que el back guardó, pasado a lo que muestran los campos (todo texto).
const filaDesdeVariante = (variante) => ({
    clave: "variante" + variante.id,
    id: variante.id,
    id_tamanio: String(variante.id_tamanio),
    precio_variante: String(variante.precio_variante),
    stock_variante: String(variante.stock_variante),
    porcentaje_descuento: variante.porcentaje_descuento === null ? "" : String(variante.porcentaje_descuento),
    descuento_hasta: variante.descuento_hasta || ""
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

const FormularioObra = ({ id }) => {
    const navegar = useNavigate()
    const editando = id !== undefined

    // Catálogos y datos que se piden al entrar. null = todavía no llegó.
    const [estilos, setEstilos] = useState(null)
    const [tamanios, setTamanios] = useState(null)
    const [obraCargada, setObraCargada] = useState(!editando)
    const [artistaDeLaObra, setArtistaDeLaObra] = useState(null)
    const [obraEliminada, setObraEliminada] = useState(false)
    const [errorCarga, setErrorCarga] = useState(null)

    // Lo que el artista está escribiendo.
    const [datos, setDatos] = useState({ nombre_obra: "", descripcion_obra: "", en_venta: true, estilo_ids: [] })
    const [filas, setFilas] = useState(() => (editando ? null : [nuevaFila()]))

    // Lo último que el back tiene guardado, como texto (JSON) para saber qué cambió y
    // mandar solo eso. La obra es un texto y las variantes un texto por id.
    const [guardado, setGuardado] = useState({ obra: null, variantes: {} })
    const [idObra, setIdObra] = useState(editando ? Number(id) : null)

    // Variantes ya guardadas que el artista quitó y todavía hay que borrar en el back.
    const [quitadas, setQuitadas] = useState([])

    const [guardando, setGuardando] = useState(false)
    const [confirmandoEliminar, setConfirmandoEliminar] = useState(false)

    // `guardando` solo cambia en el próximo render: si llegan dos envíos casi juntos, los dos
    // lo ven en falso. Esta marca cambia al instante y los frena (no se duplica nada).
    const enCurso = useRef(false)
    const [errorGeneral, setErrorGeneral] = useState("")

    useEffect(() => {
        // Una lista vacía llega como 204 (lista() la deja en []); un 404 también es "no hay datos", no una falla.
        const alFallarLista = (poner) => (e) => {
            if (e.status === 404) poner([])
            else setErrorCarga(e.message)
        }

        api.get("/api/estilos")
            .then((respuesta) => setEstilos(lista(respuesta)))
            .catch(alFallarLista(setEstilos))

        api.get("/api/tamanios-lienzo")
            .then((respuesta) => setTamanios(lista(respuesta)))
            .catch(alFallarLista(setTamanios))

        if (!editando) return

        api.get("/api/obras/" + id)
            .then((obra) => {
                const cargados = {
                    nombre_obra: obra.nombre_obra,
                    descripcion_obra: obra.descripcion_obra || "",
                    en_venta: obra.en_venta,
                    estilo_ids: obra.estilo_ids
                }
                setDatos(cargados)
                setArtistaDeLaObra(obra.artista_id)
                setObraEliminada(obra.eliminada === true)
                setGuardado((previo) => ({ ...previo, obra: JSON.stringify(cuerpoObra(cargados)) }))
                setObraCargada(true)
            })
            .catch((e) => setErrorCarga(e.message))

        api.get("/api/variantes?obraId=" + id)
            .then((respuesta) => {
                const variantes = lista(respuesta)
                const textos = {}
                variantes.forEach((variante) => {
                    textos[variante.id] = JSON.stringify(cuerpoVariante(filaDesdeVariante(variante)))
                })
                setFilas(variantes.map(filaDesdeVariante))
                setGuardado((previo) => ({ ...previo, variantes: textos }))
            })
            .catch((e) => {
                // Una obra sin variantes responde 204 (ya queda vacía con lista()); un 404 también se edita con la lista vacía.
                if (e.status === 404) setFilas([])
                else setErrorCarga(e.message)
            })
    }, [id, editando])

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

    const cambiarFila = (clave, campo, valor) => {
        setFilas(filas.map((fila) => (fila.clave === clave ? { ...fila, [campo]: valor } : fila)))
    }

    // Quitar una fila ya guardada la deja pendiente de borrar; una nueva simplemente se descarta.
    const quitarFila = (fila) => {
        setFilas(filas.filter((otra) => otra.clave !== fila.clave))
        if (fila.id !== null) setQuitadas([...quitadas, fila.id])
    }

    // Hace los pedidos de a uno, en orden. Cada uno que sale bien se anota en `guardado`,
    // así que si uno falla se corta ahí y al volver a guardar solo se repite lo que faltó
    // (no se duplica la obra ni las variantes).
    const correr = (tareas, indice, idActual) => {
        if (indice === tareas.length) {
            navegar("/panel/obras")
            return
        }

        const tarea = tareas[indice]
        let pedido

        if (tarea.tipo === "crearObra") pedido = api.post("/api/obras", tarea.cuerpo)
        else if (tarea.tipo === "editarObra") pedido = api.put("/api/obras/" + idActual, tarea.cuerpo)
        else if (tarea.tipo === "crearVariante") pedido = api.post("/api/variantes", { ...tarea.cuerpo, obra_id: idActual })
        else if (tarea.tipo === "editarVariante") pedido = api.put("/api/variantes/" + tarea.id, { ...tarea.cuerpo, obra_id: idActual })
        else pedido = api.delete("/api/variantes/" + tarea.id)

        pedido
            .then((respuesta) => {
                let idSiguiente = idActual

                if (tarea.tipo === "crearObra") {
                    idSiguiente = respuesta.id
                    setIdObra(respuesta.id)
                }
                if (tarea.tipo === "crearObra" || tarea.tipo === "editarObra") {
                    setGuardado((previo) => ({ ...previo, obra: JSON.stringify(tarea.cuerpo) }))
                }
                if (tarea.tipo === "crearVariante") {
                    setFilas((previas) => previas.map((fila) => (fila.clave === tarea.clave ? { ...fila, id: respuesta.id } : fila)))
                    setGuardado((previo) => ({ ...previo, variantes: { ...previo.variantes, [respuesta.id]: JSON.stringify(tarea.cuerpo) } }))
                }
                if (tarea.tipo === "editarVariante") {
                    setGuardado((previo) => ({ ...previo, variantes: { ...previo.variantes, [tarea.id]: JSON.stringify(tarea.cuerpo) } }))
                }
                if (tarea.tipo === "borrarVariante") {
                    setQuitadas((previas) => previas.filter((quitada) => quitada !== tarea.id))
                }

                correr(tareas, indice + 1, idSiguiente)
            })
            .catch((e) => {
                setErrorGeneral(e.message)
                setGuardando(false)
                enCurso.current = false
            })
    }

    const guardar = (e) => {
        e.preventDefault()
        if (enCurso.current) return
        enCurso.current = true

        // Solo se manda lo que cambió desde lo último que guardó el back.
        const tareas = []
        const cuerpoDeLaObra = cuerpoObra(datos)

        if (idObra === null) tareas.push({ tipo: "crearObra", cuerpo: cuerpoDeLaObra })
        else if (JSON.stringify(cuerpoDeLaObra) !== guardado.obra) tareas.push({ tipo: "editarObra", cuerpo: cuerpoDeLaObra })

        filas.forEach((fila) => {
            const cuerpo = cuerpoVariante(fila)
            if (fila.id === null) tareas.push({ tipo: "crearVariante", clave: fila.clave, cuerpo: cuerpo })
            else if (JSON.stringify(cuerpo) !== guardado.variantes[fila.id]) tareas.push({ tipo: "editarVariante", id: fila.id, cuerpo: cuerpo })
        })

        quitadas.forEach((idVariante) => tareas.push({ tipo: "borrarVariante", id: idVariante }))

        setErrorGeneral("")
        setGuardando(true)
        correr(tareas, 0, idObra)
    }

    // Eliminar: el back marca la obra como eliminada (deja de verse en todos lados) y conserva
    // sus variantes. Si no se puede (por ejemplo, error del back), vuelve el mensaje.
    const eliminar = () => {
        if (enCurso.current) return
        enCurso.current = true
        setErrorGeneral("")
        setGuardando(true)

        api.delete("/api/obras/" + idObra)
            .then(() => navegar("/panel/obras"))
            .catch((e) => {
                setErrorGeneral(e.message)
                setGuardando(false)
                setConfirmandoEliminar(false)
                enCurso.current = false
            })
    }

    // Si la sesión sabe cuál es el perfil del artista, se avisa antes de editar una obra ajena.
    // El back es el que decide de verdad: si no, rechaza el guardado.
    const perfil = getPerfilArtista()
    const esAjena = editando && artistaDeLaObra !== null && perfil && perfil.id !== artistaDeLaObra

    const listo = estilos && tamanios && filas && obraCargada

    let cuerpo
    if (errorCarga) {
        cuerpo = <Estado tipo="error" mensaje={errorCarga} />
    } else if (obraEliminada) {
        cuerpo = <Estado tipo="vacio" mensaje="Esta obra fue eliminada." />
    } else if (esAjena) {
        cuerpo = <Estado tipo="vacio" mensaje="Esta obra es de otro artista: no podés editarla." />
    } else if (!listo) {
        cuerpo = <Estado tipo="cargando" />
    } else {
        const usados = filas.map((fila) => fila.id_tamanio)

        cuerpo = (
            <form onSubmit={guardar}>
                <div className="cartela" style={{ padding: "var(--lg)" }}>
                    <p className="catalog-number muted" style={{ marginBottom: "var(--md)" }}>1 · La obra</p>

                    <CampoFormulario etiqueta="Nombre" name="nombre_obra" required
                        value={datos.nombre_obra} onChange={cambiarDato} />
                    <CampoFormulario etiqueta="Descripción" name="descripcion_obra" textarea
                        value={datos.descripcion_obra} onChange={cambiarDato} />

                    <label className="catalog-number muted">Estilos</label>
                    <SelectorEstilos estilos={estilos} elegidos={datos.estilo_ids} onAlternar={alternarEstilo} />

                    <label className="body-sm">
                        <input type="checkbox" checked={datos.en_venta}
                            onChange={(e) => setDatos({ ...datos, en_venta: e.target.checked })} /> En venta
                    </label>
                </div>

                <div className="cartela" style={{ padding: "var(--lg)", marginTop: "var(--md)" }}>
                    <p className="catalog-number muted" style={{ marginBottom: "var(--md)" }}>2 · Tamaños y precios</p>

                    {filas.length === 0 && (
                        <p className="body-sm muted">Todavía no hay tamaños: sin ellos la obra no se puede comprar.</p>
                    )}
                    {filas.map((fila) => (
                        <TarjetaVariante
                            key={fila.clave}
                            fila={fila}
                            tamanios={tamanios}
                            usados={usados.filter((usado) => usado !== fila.id_tamanio)}
                            onCambiar={cambiarFila}
                            onQuitar={quitarFila}
                        />
                    ))}

                    <Boton tipo="secundario" type="button" style={{ marginTop: "var(--md)" }}
                        onClick={() => setFilas([...filas, nuevaFila()])}>
                        Agregar un tamaño
                    </Boton>
                </div>

                {errorGeneral && (
                    <div className="estado estado-error" role="alert" style={{ marginTop: "var(--md)" }}>
                        <b>No se pudo completar la acción.</b> <span className="muted">{errorGeneral}</span>
                    </div>
                )}

                <div className="fila" style={{ marginTop: "var(--lg)" }}>
                    <Boton type="submit" tipo={guardando ? "deshabilitado" : "primario"}>
                        {guardando ? "Guardando…" : idObra === null ? "Publicar" : "Guardar cambios"}
                    </Boton>
                    <Boton type="button" tipo="secundario" onClick={() => navegar("/panel/obras")}>
                        Cancelar
                    </Boton>
                    {idObra !== null && (
                        <button type="button" disabled={guardando} onClick={() => setConfirmandoEliminar(true)} className="body-sm"
                            style={{ all: "unset", cursor: "pointer", color: "var(--error)", marginLeft: "auto" }}>
                            Eliminar obra
                        </button>
                    )}
                </div>
                {confirmandoEliminar && (
                    <Confirmacion
                        titulo="¿Eliminar la obra?"
                        mensaje="La obra se elimina y deja de mostrarse en todos lados. Esta acción no se puede deshacer desde acá."
                        textoConfirmar="Eliminar"
                        ocupado={guardando}
                        onConfirmar={eliminar}
                        onCancelar={() => setConfirmandoEliminar(false)}
                    />
                )}
            </form>
        )
    }

    return (
        <div className="seccion">
            <div className="contenido col-media">
                <h1 className="headline-lg">{editando ? "Editar obra" : "Publicar obra"}</h1>
                <p className="body-lg muted" style={{ margin: "var(--xs) 0 var(--xl)" }}>
                    {editando
                        ? "Cambiá los datos de la obra o de sus tamaños."
                        : "Primero la obra, después sus tamaños y sus precios."}
                </p>

                {cuerpo}
            </div>
        </div>
    )
}

// La key hace que, al pasar de una obra a otra, el formulario arranque de cero.
const ObraForm = () => {
    const { id } = useParams()
    return <FormularioObra key={id || "nueva"} id={id} />
}

export default ObraForm
