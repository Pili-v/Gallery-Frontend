// Los filtros que están aplicados, como etiquetas que se quitan de a una, y la cantidad de resultados delante.
// Sin filtros solo muestra la cantidad.
//
// Props:
//   cantidad     : el texto con la cantidad de resultados (por ejemplo, "15 obras")
//   filtros      : [{ clave, texto }]: lo que se muestra en cada etiqueta
//   onQuitar     : recibe la clave del filtro que se quitó
//   onQuitarTodo : quita todos los filtros
const FiltrosAplicados = ({ cantidad, filtros, onQuitar, onQuitarTodo }) => {
    return (
        <div className="filtros-aplicados">
            <span className="muted">{cantidad}</span>
            {filtros.map((filtro) => (
                <button
                    type="button"
                    key={filtro.clave}
                    className="chip activo chip-chico"
                    onClick={() => onQuitar(filtro.clave)}
                    aria-label={"Quitar el filtro " + filtro.texto}
                >
                    {filtro.texto} <span aria-hidden="true">✕</span>
                </button>
            ))}
            {filtros.length > 1 && (
                <button type="button" className="boton-texto" onClick={onQuitarTodo}>
                    Quitar todo
                </button>
            )}
        </div>
    )
}

export default FiltrosAplicados
