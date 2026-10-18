// Las fotos de la obra en el formulario: se agregan, se reordenan, se reemplazan y se quitan.
// Solo dibuja y avisa los cambios: el estado y los pedidos viven en ObraForm.
// La primera foto es la portada (la que se ve en el catálogo).
//
// Como en el publicador de Mercado Libre, las fotos se ordenan arrastrándolas y se agregan soltando
// archivos en el recuadro punteado. El arrastre entre fotos usa eventos de puntero (pointer events),
// que son los mismos para mouse, dedo y lápiz: la API de drag and drop del navegador no anda en el
// celular. Con mouse se arrastra la foto desde cualquier parte; con el dedo, desde el agarre ⠿ (el
// resto de la foto sigue sirviendo para desplazar la página). El agarre también se maneja con el
// teclado: con el foco en él, las flechas ← y → cambian la foto de lugar.
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

import { useEffect, useState } from "react"

const TIPOS = "image/jpeg,image/png,image/webp,image/gif"

// Cuánto antes de llegar al borde de la pantalla empieza a desplazarse la página mientras se arrastra.
const BORDE_PX = 70
const VELOCIDAD_PX = 14

const botonChico = {
    all: "unset", cursor: "pointer", color: "var(--bordo)", fontSize: 13, padding: "2px 6px",
    border: "1px solid var(--border)", background: "var(--surface)"
}

// Lo que se está arrastrando desde el escritorio son archivos; lo que se arrastra entre fotos, no.
const traeArchivos = (e) => Array.from(e.dataTransfer.types).includes("Files")

// La clave de la foto que está debajo del puntero (null si no hay ninguna).
const claveBajoPuntero = (x, y) => {
    const elemento = document.elementFromPoint(x, y)
    const tarjeta = elemento && elemento.closest("[data-foto]")
    return tarjeta ? tarjeta.getAttribute("data-foto") : null
}

const SeccionFotos = ({ fotos, preparando, error, ocupado, onAgregar, onMover, onOrdenar, onQuitar, onReemplazar }) => {
    const bloqueado = ocupado || preparando

    // El arrastre en curso: { clave, x0, y0, scroll0, dx, dy } (desde dónde salió y cuánto se movió).
    const [arrastre, setArrastre] = useState(null)
    const [destino, setDestino] = useState(null)
    const [soltandoArchivos, setSoltandoArchivos] = useState(false)

    const claveArrastrada = arrastre ? arrastre.clave : null

    // Mientras se arrastra, los eventos se escuchan en toda la ventana: el puntero puede salir de la foto.
    useEffect(() => {
        if (claveArrastrada === null) return

        const mover = (e) => {
            setArrastre((previo) => previo && {
                ...previo,
                dx: e.clientX - previo.x0,
                dy: e.clientY - previo.y0 + (window.scrollY - previo.scroll0)
            })
            setDestino(claveBajoPuntero(e.clientX, e.clientY))

            // Cerca de los bordes la página se desplaza sola, para poder llegar a fotos que no se ven.
            if (e.clientY < BORDE_PX) window.scrollBy(0, -VELOCIDAD_PX)
            else if (e.clientY > window.innerHeight - BORDE_PX) window.scrollBy(0, VELOCIDAD_PX)
        }

        const soltar = (e) => {
            // pointercancel (el sistema se quedó con el gesto) cancela: no se reordena.
            const claveDestino = e.type === "pointerup" ? claveBajoPuntero(e.clientX, e.clientY) : null
            if (claveDestino !== null && claveDestino !== claveArrastrada) onOrdenar(claveArrastrada, claveDestino)
            setArrastre(null)
            setDestino(null)
        }

        window.addEventListener("pointermove", mover)
        window.addEventListener("pointerup", soltar)
        window.addEventListener("pointercancel", soltar)
        return () => {
            window.removeEventListener("pointermove", mover)
            window.removeEventListener("pointerup", soltar)
            window.removeEventListener("pointercancel", soltar)
        }
    }, [claveArrastrada, onOrdenar])

    const empezarArrastre = (e, clave) => {
        if (bloqueado || e.button !== 0) return

        const enElAgarre = e.target.closest("[data-agarre]") !== null
        // Con el dedo solo se arrastra desde el agarre: si no, no se podría desplazar la página.
        if (e.pointerType === "touch" && !enElAgarre) return
        // Los botones de la foto (Reemplazar, Quitar) siguen siendo botones.
        if (!enElAgarre && e.target.closest("button, label, input") !== null) return

        e.preventDefault()
        setArrastre({ clave, x0: e.clientX, y0: e.clientY, scroll0: window.scrollY, dx: 0, dy: 0 })
    }

    const moverConTeclado = (e, clave) => {
        if (bloqueado) return
        if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
            e.preventDefault()
            onMover(clave, -1)
        } else if (e.key === "ArrowRight" || e.key === "ArrowDown") {
            e.preventDefault()
            onMover(clave, 1)
        }
    }

    return (
        <div>
            {fotos.length === 0 && (
                <p className="body-sm muted">
                    Todavía no hay fotos. Una obra sin fotos no se muestra en el catálogo.
                </p>
            )}

            <div style={{ display: "grid", gap: "var(--md)", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))" }}>
                {fotos.map((foto, i) => {
                    const sePuedeArrastrar = !bloqueado
                    const esLaArrastrada = claveArrastrada === foto.clave

                    return (
                        <div
                            key={foto.clave}
                            data-foto={foto.clave}
                            onPointerDown={(e) => empezarArrastre(e, foto.clave)}
                            onDragStart={(e) => e.preventDefault()}
                            style={{
                                position: "relative",
                                border: "1px solid var(--border)", padding: "var(--sm)", background: "var(--surface)",
                                cursor: sePuedeArrastrar ? (esLaArrastrada ? "grabbing" : "grab") : "default",
                                userSelect: "none", WebkitUserSelect: "none",
                                // La foto que se lleva el puntero sigue su movimiento y deja pasar los eventos
                                // a las de abajo: así se sabe sobre cuál se la suelta.
                                transform: esLaArrastrada ? "translate(" + arrastre.dx + "px, " + arrastre.dy + "px)" : "none",
                                pointerEvents: esLaArrastrada ? "none" : "auto",
                                zIndex: esLaArrastrada ? 10 : "auto",
                                boxShadow: esLaArrastrada ? "0 8px 24px rgba(0, 0, 0, 0.25)" : "none",
                                opacity: esLaArrastrada ? 0.9 : 1,
                                outline: destino === foto.clave && !esLaArrastrada ? "2px dashed var(--bordo)" : "none",
                                outlineOffset: 2
                            }}
                        >
                            <div style={{ position: "relative", aspectRatio: "4 / 5", background: "var(--canvas)" }}>
                                <img src={foto.vista || foto.url} alt={"Foto " + (i + 1)} draggable={false}
                                    style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }} />
                                {i === 0 && (
                                    <span className="catalog-number" style={{ position: "absolute", top: 4, left: 4, background: "var(--bordo)", color: "#fff", padding: "1px 6px" }}>
                                        Portada
                                    </span>
                                )}
                                {foto.vista && (
                                    <span className="catalog-number" style={{ position: "absolute", bottom: 4, left: 4, background: "var(--surface)", padding: "1px 6px" }}>
                                        {foto.id === null ? "Nueva" : "Reemplazo"}
                                    </span>
                                )}

                                {/* El agarre: el único lugar desde donde se arrastra con el dedo. touch-action: none
                                    le dice al navegador que no use ese gesto para desplazar la página. */}
                                <button type="button" data-agarre disabled={bloqueado}
                                    aria-label={"Mover la foto " + (i + 1) + ". Con las flechas izquierda y derecha cambia de lugar"}
                                    title="Arrastrá para ordenar"
                                    onKeyDown={(e) => moverConTeclado(e, foto.clave)}
                                    style={{
                                        all: "unset", position: "absolute", top: 4, right: 4, width: 32, height: 32,
                                        display: "grid", placeItems: "center", boxSizing: "border-box",
                                        background: "var(--surface)", border: "1px solid var(--border)", color: "var(--bordo)",
                                        fontSize: 18, lineHeight: 1, touchAction: "none",
                                        cursor: sePuedeArrastrar ? (esLaArrastrada ? "grabbing" : "grab") : "default"
                                    }}>
                                    ⠿
                                </button>
                            </div>

                            <div className="fila" style={{ flexWrap: "wrap", gap: 4, marginTop: "var(--xs)" }}>
                                <label style={{ ...botonChico, display: "inline-block" }}>
                                    Reemplazar
                                    <input type="file" accept={TIPOS} disabled={bloqueado} style={{ display: "none" }}
                                        onChange={(e) => {
                                            if (e.target.files[0]) onReemplazar(foto.clave, e.target.files[0])
                                            e.target.value = ""
                                        }} />
                                </label>
                                <button type="button" style={{ ...botonChico, color: "var(--error)" }} disabled={bloqueado}
                                    aria-label={"Quitar la foto " + (i + 1)} onClick={() => onQuitar(foto.clave)}>Quitar</button>
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
                style={{
                    display: "block", marginTop: "var(--md)", padding: "var(--lg)", textAlign: "center",
                    border: "2px dashed " + (soltandoArchivos ? "var(--bordo)" : "var(--border)"),
                    background: soltandoArchivos ? "var(--canvas)" : "transparent",
                    color: soltandoArchivos ? "var(--bordo)" : "var(--ink-muted)",
                    cursor: bloqueado ? "default" : "pointer"
                }}
            >
                {preparando
                    ? "Preparando fotos…"
                    : soltandoArchivos
                        ? "Soltá las fotos acá"
                        : "Arrastrá fotos hasta acá o tocá para elegirlas"}
                <input type="file" accept={TIPOS} multiple disabled={bloqueado} style={{ display: "none" }}
                    onChange={(e) => {
                        if (e.target.files.length > 0) onAgregar(e.target.files)
                        e.target.value = ""
                    }} />
            </label>
            <p className="body-sm muted" style={{ marginTop: "var(--xs)" }}>
                Ordenalas arrastrando el ícono ⠿ de cada foto: la primera es la que se ve en el catálogo. Se achican a 1600 px y deben tener al menos 600 px de lado.
            </p>

            {error && (
                <div className="estado estado-error" role="alert" style={{ marginTop: "var(--sm)" }}>
                    <span className="muted">{error}</span>
                </div>
            )}
        </div>
    )
}

export default SeccionFotos
