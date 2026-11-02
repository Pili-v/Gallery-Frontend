// Los cuatro casos que toda pantalla que pide datos tiene que contemplar.
// tipo: "cargando" | "vacio" | "error" | "sinPermiso"
const Estado = ({ tipo, mensaje, accion, onAccion }) => {
    if (tipo === "cargando") {
        return (
            <div className="estado texto-izquierda">
                <div className="esqueleto esqueleto-linea media"></div>
                <div className="esqueleto esqueleto-linea larga"></div>
                <div className="esqueleto esqueleto-linea corta"></div>
            </div>
        )
    }

    if (tipo === "error") {
        return (
            <div className="estado estado-error">
                <b>No se pudo cargar.</b> <span className="muted">{mensaje}</span>
            </div>
        )
    }

    return (
        <div className="estado">
            <p className="body-lg">{mensaje}</p>
            {accion && (
                <button className="boton boton-secundario mt-md" onClick={onAccion}>
                    {accion}
                </button>
            )}
        </div>
    )
}

export default Estado
