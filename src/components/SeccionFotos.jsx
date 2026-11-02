// Las fotos de la obra en el formulario: se agregan, se reordenan, se reemplazan y se quitan.
// Solo dibuja y avisa los cambios: el estado y los pedidos viven en ObraForm.
// La primera foto es la portada (la que se ve en el catálogo).
//
// Como en el publicador de Mercado Libre, las fotos se ordenan arrastrándolas y se agregan soltando
// archivos en el recuadro punteado. Las dos cosas usan el arrastrar y soltar del navegador, con los
// eventos de React de cada foto (onDragStart, onDragOver, onDrop): la foto sobre la que se suelta es la
// que recibe el evento. Ese arrastre no anda con el dedo: en el celular (y con el teclado) se ordenan
// con las flechas ← y → de cada foto.
//
// Props:
//   fotos        : [{ clave, id, url, vista }]. vista es la foto elegida que todavía no se subió.
//   preparando   : true mientras se achican las fotos elegidas
//   error        : aviso de las fotos que no se pudieron usar
//   ocupado      : true mientras se guarda (se bloquea todo)
//   onAgregar    : (archivos) => void
//   onMover      : (clave, delta) => void   (-1 antes, +1 después)
//   onOrdenar    : (claveArrastrada, claveDestino) => void   (la arrastrada pasa al lugar del destino)
//   onQuitar     : (clave) => void
//   onReemplazar : (clave, archivo) => void

import { useState } from "react"

const TIPOS = "image/jpeg,image/png,image/webp,image/gif"

// Lo que se está arrastrando desde el escritorio son archivos; lo que se arrastra entre fotos, no.
const traeArchivos = (e) => Array.from(e.dataTransfer.types).includes("Files")

const SeccionFotos = ({ fotos, preparando, error, ocupado, onAgregar, onMover, onOrdenar, onQuitar, onReemplazar }) => {
    const bloqueado = ocupado || preparando

    // La foto que se está arrastrando y la foto sobre la que está el puntero (null si no hay arrastre).
    const [arrastrada, setArrastrada] = useState(null)
    const [destino, setDestino] = useState(null)
    const [soltandoArchivos, setSoltandoArchivos] = useState(false)

    const empezarArrastre = (e, clave) => {
        if (bloqueado) return
        e.dataTransfer.effectAllowed = "move"
        // Firefox no empieza el arrastre si no lleva algún dato.
        e.dataTransfer.setData("text/plain", clave)
        setArrastrada(clave)
    }

    // Pasar por encima de una foto: si lo que se arrastra es otra foto (no archivos), se marca como destino y
    // preventDefault le avisa al navegador que ahí se puede soltar.
    const pasarPorEncima = (e, clave) => {
        if (arrastrada === null) return
        e.preventDefault()
        e.dataTransfer.dropEffect = "move"
        if (destino !== clave) setDestino(clave)
    }

    // Se suelta (en una foto o fuera de ellas) o se cancela con Escape.
    const terminarArrastre = () => {
        setArrastrada(null)
        setDestino(null)
    }

    const soltar = (e, clave) => {
        if (arrastrada === null) return
        e.preventDefault()
        if (clave !== arrastrada) onOrdenar(arrastrada, clave)
        terminarArrastre()
    }

    return (
        <div>
            {fotos.length === 0 && (
                <p className="body-sm muted">Todavía no hay fotos. Una obra sin fotos no se muestra en el catálogo.</p>
            )}

            <div className="fotos-grilla">
                {fotos.map((foto, i) => {
                    const esLaArrastrada = arrastrada === foto.clave

                    return (
                        <div
                            key={foto.clave}
                            draggable={!bloqueado}
                            onDragStart={(e) => empezarArrastre(e, foto.clave)}
                            onDragOver={(e) => pasarPorEncima(e, foto.clave)}
                            onDrop={(e) => soltar(e, foto.clave)}
                            onDragEnd={terminarArrastre}
                            className={
                                "foto-tarjeta" +
                                (bloqueado ? " bloqueada" : "") +
                                (esLaArrastrada ? " arrastrada" : "") +
                                (destino === foto.clave && !esLaArrastrada ? " destino" : "")
                            }
                        >
                            <div className="foto-marco">
                                <img src={foto.vista || foto.url} alt={"Foto " + (i + 1)} draggable={false} />
                                {i === 0 && <span className="catalog-number foto-sello portada">Portada</span>}
                                {foto.vista && (
                                    <span className="catalog-number foto-sello nueva">
                                        {foto.id === null ? "Nueva" : "Reemplazo"}
                                    </span>
                                )}
                            </div>

                            <div className="fila envolver gap-xs mt-xs">
                                <label className="boton-mini">
                                    Reemplazar
                                    <input
                                        className="oculto"
                                        type="file"
                                        accept={TIPOS}
                                        disabled={bloqueado}
                                        onChange={(e) => {
                                            if (e.target.files[0]) onReemplazar(foto.clave, e.target.files[0])
                                            e.target.value = ""
                                        }}
                                    />
                                </label>
                                <button
                                    type="button"
                                    className="boton-mini"
                                    disabled={bloqueado || i === 0}
                                    aria-label={"Mover la foto " + (i + 1) + " antes"}
                                    title="Mover antes"
                                    onClick={() => onMover(foto.clave, -1)}
                                >
                                    ←
                                </button>
                                <button
                                    type="button"
                                    className="boton-mini"
                                    disabled={bloqueado || i === fotos.length - 1}
                                    aria-label={"Mover la foto " + (i + 1) + " después"}
                                    title="Mover después"
                                    onClick={() => onMover(foto.clave, 1)}
                                >
                                    →
                                </button>
                                <button
                                    type="button"
                                    className="boton-mini peligro"
                                    disabled={bloqueado}
                                    aria-label={"Quitar la foto " + (i + 1)}
                                    onClick={() => onQuitar(foto.clave)}
                                >
                                    Quitar
                                </button>
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Recuadro para agregar: se puede hacer click o soltar archivos encima */}
            <label
                onDragOver={(e) => {
                    if (bloqueado || !traeArchivos(e)) return
                    e.preventDefault()
                    setSoltandoArchivos(true)
                }}
                onDragLeave={() => setSoltandoArchivos(false)}
                onDrop={(e) => {
                    setSoltandoArchivos(false)
                    if (bloqueado || !traeArchivos(e)) return
                    e.preventDefault()
                    if (e.dataTransfer.files.length > 0) onAgregar(e.dataTransfer.files)
                }}
                className={"zona-soltar" + (soltandoArchivos ? " activa" : "") + (bloqueado ? " bloqueada" : "")}
            >
                {preparando
                    ? "Preparando fotos…"
                    : soltandoArchivos
                      ? "Soltá las fotos acá"
                      : "Arrastrá fotos hasta acá o tocá para elegirlas"}
                <input
                    className="oculto"
                    type="file"
                    accept={TIPOS}
                    multiple
                    disabled={bloqueado}
                    onChange={(e) => {
                        if (e.target.files.length > 0) onAgregar(e.target.files)
                        e.target.value = ""
                    }}
                />
            </label>
            <p className="body-sm muted mt-xs">
                Ordenalas arrastrándolas o con las flechas ← →: la primera es la que se ve en el catálogo. Se achican a
                1600 px y deben tener al menos 600 px de lado.
            </p>

            {error && (
                <div className="estado estado-error mt-sm" role="alert">
                    <span className="muted">{error}</span>
                </div>
            )}
        </div>
    )
}

export default SeccionFotos
