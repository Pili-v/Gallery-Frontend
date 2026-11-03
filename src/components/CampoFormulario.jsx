import { useState } from "react"

// Etiqueta + campo + mensaje de error. Se usa en todos los formularios.
// Con tipo="password" suma un botón para ver la contraseña sin ocultar (y volver a ocultarla).
const CampoFormulario = ({ etiqueta, tipo = "text", error, textarea, children, ...props }) => {
    const [claveVisible, setClaveVisible] = useState(false)
    const clase = (textarea ? "textarea" : tipo === "select" ? "select" : "input") + (error ? " con-error" : "")
    const esClave = tipo === "password"

    return (
        <div className="campo">
            <label className="catalog-number muted">{etiqueta}</label>

            {textarea && <textarea className={clase} {...props} />}
            {!textarea && tipo === "select" && (
                <select className={clase} {...props}>
                    {children}
                </select>
            )}
            {!textarea && tipo !== "select" && !esClave && <input className={clase} type={tipo} {...props} />}
            {esClave && (
                <div className="campo-clave">
                    <input className={clase} type={claveVisible ? "text" : "password"} {...props} />
                    <button
                        type="button"
                        className="campo-clave-boton"
                        aria-pressed={claveVisible}
                        aria-label={claveVisible ? "Ocultar contraseña" : "Mostrar contraseña"}
                        onClick={() => setClaveVisible(!claveVisible)}
                    >
                        {claveVisible ? "Ocultar" : "Mostrar"}
                    </button>
                </div>
            )}

            {error && <div className="campo-error body-sm">{error}</div>}
        </div>
    )
}

export default CampoFormulario
