import { api, lista as convertirLista } from "../api/cliente"
import { useEffect, useState } from "react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import Boton from "../components/Boton"
import CampoFormulario from "../components/CampoFormulario"
import BuscadorArtista from "../components/BuscadorArtista"
import Estado from "../components/Estado"
import { prepararEncargo } from "../api/encargoContrato.js"
import "./encargoNuevo.css"

const inicial = {
    artista_id: "",
    tamanio_id: "",
    marco_id: "",
    tipo_pintura: "",
    tipo_lienzo: "",
    descripcion_encargo: ""
}

export default function EncargoNuevo() {
    const [parametros] = useSearchParams()
    const [formulario, setFormulario] = useState(() => ({
        ...inicial,
        artista_id: parametros.get("artistaId") || ""
    }))
    const [artistas, setArtistas] = useState([])
    const [tamanios, setTamanios] = useState([])
    const [marcos, setMarcos] = useState([])
    const [pinturas, setPinturas] = useState([])
    const [lienzos, setLienzos] = useState([])
    const [cargando, setCargando] = useState(true)
    const [errorCarga, setErrorCarga] = useState("")
    const [enviando, setEnviando] = useState(false)
    const [intento, setIntento] = useState(0)

    useEffect(() => {
        let activo = true
        api.get("/api/artistas")
            .then((respuesta) => {
                if (activo) {
                    const disponibles = convertirLista(respuesta)
                        .filter((item) => item.acepta_encargos)
                        .map((item) => ({ id: item.id, nombre: item.nombre_artistico }))
                    setArtistas(disponibles)
                    setFormulario((actual) => ({
                        ...actual,
                        artista_id: disponibles.some((item) => String(item.id) === actual.artista_id)
                            ? actual.artista_id
                            : ""
                    }))
                }
                return api.get("/api/tamanios-lienzo")
            })
            .then((respuesta) => {
                if (activo)
                    setTamanios(convertirLista(respuesta).map((item) => ({ id: item.id, nombre: item.nombre_tamanio })))
                return api.get("/api/marcos")
            })
            .then((respuesta) => {
                if (activo)
                    setMarcos(convertirLista(respuesta).map((item) => ({ id: item.id, nombre: item.nombre_marco })))
                return api.get("/api/encargos/opciones")
            })
            .then((respuesta) => {
                // Los tipos de pintura y de lienzo los define el back (son sus enums): acá solo se muestran.
                if (activo) {
                    setPinturas(respuesta.tipos_pintura)
                    setLienzos(respuesta.tipos_lienzo)
                }
            })
            .catch((error) => {
                if (activo) setErrorCarga(`No se pudieron cargar las opciones del pedido: ${error.message}`)
            })
            .finally(() => {
                if (activo) setCargando(false)
            })
        return () => {
            activo = false
        }
    }, [intento])
    const [errores, setErrores] = useState({})
    const [errorGuardado, setErrorGuardado] = useState("")
    const navigate = useNavigate()
    const lista = "/encargos"

    function cambiar(evento) {
        const { name, value } = evento.target
        setFormulario((actual) => ({ ...actual, [name]: value }))
        setErrores((actual) => ({ ...actual, [name]: undefined }))
        setErrorGuardado("")
    }

    function enviar(evento) {
        evento.preventDefault()
        if (enviando || cargando || errorCarga) return
        const resultado = prepararEncargo(formulario, pinturas, lienzos)
        setErrores(resultado.errores)
        if (!resultado.datos) {
            evento.currentTarget.elements.namedItem(Object.keys(resultado.errores)[0])?.focus()
            return
        }
        setEnviando(true)
        setErrorGuardado("")
        api.post("/api/encargos", resultado.datos)
            .then((encargo) => {
                if (encargo) navigate(lista, { state: { encargoCreado: encargo.id } })
            })
            .catch((error) => setErrorGuardado(error.message || "No se pudo enviar el pedido. Podés reintentar."))
            .finally(() => setEnviando(false))
    }

    function propiedades(nombre, etiqueta) {
        return {
            name: nombre,
            etiqueta,
            value: formulario[nombre],
            onChange: cambiar,
            required: true,
            error: errores[nombre],
            "aria-label": etiqueta,
            "aria-invalid": Boolean(errores[nombre])
        }
    }

    return (
        <main className="seccion encargo-nuevo">
            <div className="contenido col-media">
                <Link className="encargo-volver body-sm" to={lista}>
                    ← Volver a encargos
                </Link>
                <h1 className="headline-lg">Pedir un encargo</h1>
                <p className="body-lg muted">Contale al artista qué cuadro te gustaría recibir.</p>
                {cargando && <Estado tipo="cargando" />}
                {errorCarga && (
                    <div className="apilado">
                        <Estado tipo="error" mensaje={errorCarga} />
                        <Boton
                            onClick={() => {
                                setErrorCarga("")
                                setCargando(true)
                                setIntento(intento + 1)
                            }}
                        >
                            Reintentar
                        </Boton>
                    </div>
                )}
                {!cargando &&
                    !errorCarga &&
                    (!artistas.length || !tamanios.length || !marcos.length || !pinturas.length || !lienzos.length) && (
                        <Estado
                            tipo="vacio"
                            mensaje="Faltan artistas disponibles, tamaños o marcos para poder pedir un encargo."
                        />
                    )}
                <form className="cartela encargo-formulario" onSubmit={enviar} noValidate>
                    <p className="body-sm muted encargo-obligatorios">Todos los campos son obligatorios.</p>
                    <BuscadorArtista
                        artistas={artistas}
                        value={formulario.artista_id}
                        error={errores.artista_id}
                        disabled={cargando || Boolean(errorCarga) || enviando}
                        onChange={(value) => cambiar({ target: { name: "artista_id", value } })}
                    />
                    <div className="fila-campos">
                        <CampoFormulario tipo="select" {...propiedades("tipo_pintura", "Tipo de pintura")}>
                            <option value="">Seleccioná una pintura</option>
                            {pinturas.map((opcion) => (
                                <option key={opcion.valor} value={opcion.valor}>
                                    {opcion.nombre}
                                </option>
                            ))}
                        </CampoFormulario>
                        <CampoFormulario tipo="select" {...propiedades("tipo_lienzo", "Tipo de lienzo")}>
                            <option value="">Seleccioná un lienzo</option>
                            {lienzos.map((opcion) => (
                                <option key={opcion.valor} value={opcion.valor}>
                                    {opcion.nombre}
                                </option>
                            ))}
                        </CampoFormulario>
                    </div>
                    <div className="fila-campos">
                        <CampoFormulario tipo="select" {...propiedades("tamanio_id", "Tamaño")}>
                            <option value="">Seleccioná un tamaño</option>
                            {tamanios.map((opcion) => (
                                <option key={opcion.id} value={opcion.id}>
                                    {opcion.nombre}
                                </option>
                            ))}
                        </CampoFormulario>
                        <CampoFormulario tipo="select" {...propiedades("marco_id", "Marco")}>
                            <option value="">Seleccioná un marco</option>
                            {marcos.map((opcion) => (
                                <option key={opcion.id} value={opcion.id}>
                                    {opcion.nombre}
                                </option>
                            ))}
                        </CampoFormulario>
                    </div>
                    <CampoFormulario
                        textarea
                        rows={5}
                        maxLength={255}
                        placeholder="Por ejemplo: un paisaje con tonos verdes y ocres para un living con luz de tarde."
                        aria-describedby="descripcion-ayuda"
                        {...propiedades("descripcion_encargo", "Qué te gustaría")}
                    />
                    <p id="descripcion-ayuda" className="body-sm muted encargo-contador">
                        Describí el tema, los colores y el estilo. {formulario.descripcion_encargo.length}/255
                        caracteres.
                    </p>
                    <div aria-live="polite">
                        {Object.values(errores).some(Boolean) && (
                            <p className="campo-error body-sm">Revisá los campos indicados antes de enviar.</p>
                        )}
                        {errorGuardado && <Estado tipo="error" mensaje={errorGuardado} />}
                    </div>
                    <Boton
                        type="submit"
                        bloque
                        disabled={
                            enviando ||
                            cargando ||
                            Boolean(errorCarga) ||
                            !artistas.length ||
                            !tamanios.length ||
                            !marcos.length ||
                            !pinturas.length ||
                            !lienzos.length
                        }
                    >
                        {enviando ? "Enviando..." : "Enviar el pedido"}
                    </Boton>
                </form>
            </div>
        </main>
    )
}
