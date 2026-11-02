import { useState } from "react"
import { pesos } from "../api/formato"

// Filtro de precio para la barra de filtros: un botón ("Precio") abre un panel con mínimo y máximo y un botón Aplicar.
// Con un rango aplicado el botón lo muestra ("Hasta $ 20.000"). Las validaciones las hace la pantalla: onAplicar
// devuelve true si el rango quedó aplicado (y el panel se cierra) o false si hay un error (se muestra en el panel).
//
// Props:
//   min, max        : lo que está escrito en cada campo (texto)
//   aplicado        : el rango aplicado ({ min, max }, texto; "" = sin límite)
//   error           : el aviso de un rango inválido ("" si no hay)
//   onCambiarMin/Max: recibe el texto nuevo del campo
//   onAplicar       : aplica lo escrito; devuelve true si salió bien
const FiltroPrecio = ({ min, max, aplicado, error, onCambiarMin, onCambiarMax, onAplicar }) => {
    const [abierto, setAbierto] = useState(false)

    const hayRango = aplicado.min !== "" || aplicado.max !== ""
    let texto = "Precio"
    if (aplicado.min !== "" && aplicado.max !== "")
        texto = pesos(Number(aplicado.min)) + " – " + pesos(Number(aplicado.max))
    else if (aplicado.min !== "") texto = "Desde " + pesos(Number(aplicado.min))
    else if (aplicado.max !== "") texto = "Hasta " + pesos(Number(aplicado.max))

    // Se cierra al salir con el teclado o al hacer click afuera, y con Esc.
    const alSalir = (e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setAbierto(false)
    }
    const alTeclear = (e) => {
        if (e.key === "Escape") setAbierto(false)
    }

    const aplicar = (e) => {
        e.preventDefault()
        if (onAplicar()) setAbierto(false)
    }

    return (
        <div className="desplegable-control" onBlur={alSalir} onKeyDown={alTeclear}>
            <button
                type="button"
                className={"desplegable-boton" + (hayRango ? " activo" : "")}
                aria-haspopup="true"
                aria-expanded={abierto}
                onClick={() => setAbierto(!abierto)}
            >
                <span>{texto}</span>
            </button>

            {abierto && (
                // Un div y no un form: el filtro vive dentro del formulario de búsqueda.
                <div className="desplegable-panel panel-precio" role="group" aria-label="Elegir un rango de precio">
                    <div className="fila">
                        <input
                            className="input"
                            type="number"
                            min="0"
                            placeholder="Mínimo"
                            aria-label="Precio mínimo"
                            value={min}
                            onChange={(e) => onCambiarMin(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && aplicar(e)}
                        />
                        <span className="muted">—</span>
                        <input
                            className="input"
                            type="number"
                            min="0"
                            placeholder="Máximo"
                            aria-label="Precio máximo"
                            value={max}
                            onChange={(e) => onCambiarMax(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && aplicar(e)}
                        />
                    </div>
                    {error && <p className="campo-error body-sm">{error}</p>}
                    <button type="button" className="boton boton-primario boton-bloque mt-md" onClick={aplicar}>
                        Aplicar
                    </button>
                </div>
            )}
        </div>
    )
}

export default FiltroPrecio
