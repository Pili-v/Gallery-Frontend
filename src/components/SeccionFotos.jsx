// Las fotos de la obra en el formulario: se agregan, se reordenan, se reemplazan y se quitan.
// Solo dibuja y avisa los cambios: el estado y los pedidos viven en ObraForm.
// La primera foto es la portada (la que se ve en el catálogo).
//
// Props:
//   fotos        : [{ clave, id, url, vista }]. vista es la foto elegida que todavía no se subió.
//   preparando   : true mientras se achican las fotos elegidas
//   error        : aviso de las fotos que no se pudieron usar
//   ocupado      : true mientras se guarda (se bloquean los botones)
//   onAgregar    : (archivos) => void
//   onMover      : (clave, delta) => void   (-1 antes, +1 después)
//   onQuitar     : (clave) => void
//   onReemplazar : (clave, archivo) => void

const TIPOS = "image/jpeg,image/png,image/webp,image/gif"

const botonChico = {
    all: "unset", cursor: "pointer", color: "var(--bordo)", fontSize: 13, padding: "2px 6px",
    border: "1px solid var(--border)", background: "var(--surface)"
}

const SeccionFotos = ({ fotos, preparando, error, ocupado, onAgregar, onMover, onQuitar, onReemplazar }) => {
    const bloqueado = ocupado || preparando

    return (
        <div>
            {fotos.length === 0 && (
                <p className="body-sm muted">
                    Todavía no hay fotos. Una obra sin fotos no se muestra en el catálogo.
                </p>
            )}

            <div style={{ display: "grid", gap: "var(--md)", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))" }}>
                {fotos.map((foto, i) => (
                    <div key={foto.clave} style={{ border: "1px solid var(--border)", padding: "var(--sm)", background: "var(--surface)" }}>
                        <div style={{ position: "relative", aspectRatio: "4 / 5", background: "var(--canvas)" }}>
                            <img src={foto.vista || foto.url} alt={"Foto " + (i + 1)}
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
                        </div>

                        <div className="fila" style={{ flexWrap: "wrap", gap: 4, marginTop: "var(--xs)" }}>
                            <button type="button" style={botonChico} disabled={bloqueado || i === 0}
                                aria-label={"Mover la foto " + (i + 1) + " antes"} onClick={() => onMover(foto.clave, -1)}>←</button>
                            <button type="button" style={botonChico} disabled={bloqueado || i === fotos.length - 1}
                                aria-label={"Mover la foto " + (i + 1) + " después"} onClick={() => onMover(foto.clave, 1)}>→</button>
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
                ))}
            </div>

            <label className="boton boton-secundario" style={{ marginTop: "var(--md)", cursor: bloqueado ? "default" : "pointer" }}>
                {preparando ? "Preparando fotos…" : "Agregar fotos"}
                <input type="file" accept={TIPOS} multiple disabled={bloqueado} style={{ display: "none" }}
                    onChange={(e) => {
                        if (e.target.files.length > 0) onAgregar(e.target.files)
                        e.target.value = ""
                    }} />
            </label>
            <p className="body-sm muted" style={{ marginTop: "var(--xs)" }}>
                La primera foto es la que se ve en el catálogo. Se achican a 1600 px y deben tener al menos 600 px de lado.
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
