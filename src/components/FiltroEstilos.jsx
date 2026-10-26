import { useState } from "react";
import "./filtroEstilos.css";

// Filtro de estilos de elección múltiple, para el catálogo y la lista de artistas.
// Un solo botón ("Estilos") abre una lista con casillas; lo elegido queda a la vista como
// etiquetas que se sacan con un click. Sin nada elegido se muestran todos. Con varios, se
// muestran los que tengan ALGUNO de los estilos elegidos.
//
// Props:
//   estilos      : lista de estilos de la API ({ id, nombre_estilo })
//   seleccionados: ids elegidos (array; vacío = todos)
//   onCambiar    : recibe el array nuevo de ids. La pantalla es la que vuelve a pedir al back.
const FiltroEstilos = ({ estilos, seleccionados, onCambiar }) => {
    const [abierto, setAbierto] = useState(false)

    if (estilos.length === 0) return null

    const alternar = (id) => {
        onCambiar(seleccionados.includes(id) ? seleccionados.filter((x) => x !== id) : [...seleccionados, id])
    }

    // Se cierra al salir con el teclado o al hacer click afuera, y con Esc.
    const alSalir = (e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setAbierto(false)
    }
    const alTeclear = (e) => {
        if (e.key === "Escape") setAbierto(false)
    }

    const elegidos = estilos.filter((estilo) => seleccionados.includes(estilo.id))

    return (
        <div className="filtro-estilos fila">
            <div className="filtro-estilos-control" onBlur={alSalir} onKeyDown={alTeclear}>
                <button
                    type="button"
                    className={"desplegable-boton " + (seleccionados.length > 0 ? "activo" : "")}
                    aria-haspopup="true"
                    aria-expanded={abierto}
                    onClick={() => setAbierto(!abierto)}
                >
                    <span>Estilos{seleccionados.length > 0 ? " (" + seleccionados.length + ")" : ""}</span>
                    <span aria-hidden="true">▾</span>
                </button>

                {abierto && (
                    // El mouseDown no saca el foco del botón: así el panel no se cierra al tocar una casilla.
                    <div className="desplegable-panel" role="group" aria-label="Elegir estilos" onMouseDown={(e) => e.preventDefault()}>
                        <ul className="desplegable-lista">
                            {estilos.map((estilo) => (
                                <li key={estilo.id}>
                                    <label className="desplegable-opcion filtro-estilos-opcion">
                                        <input
                                            type="checkbox"
                                            checked={seleccionados.includes(estilo.id)}
                                            onChange={() => alternar(estilo.id)}
                                        />
                                        {estilo.nombre_estilo}
                                    </label>
                                </li>
                            ))}
                        </ul>
                        {seleccionados.length > 0 && (
                            <button type="button" className="desplegable-pie" onClick={() => onCambiar([])}>
                                Limpiar selección
                            </button>
                        )}
                    </div>
                )}
            </div>

            {elegidos.map((estilo) => (
                <button
                    type="button"
                    key={estilo.id}
                    className="chip activo"
                    onClick={() => alternar(estilo.id)}
                    aria-label={"Quitar el estilo " + estilo.nombre_estilo}
                >
                    {estilo.nombre_estilo} ✕
                </button>
            ))}
        </div>
    )
}

export default FiltroEstilos