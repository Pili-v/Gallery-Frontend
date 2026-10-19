// Los estilos como botones que se prenden y se apagan. Se pueden elegir varios.
// Solo dibuja: ObraForm guarda cuáles están elegidos.
const SelectorEstilos = ({ estilos, elegidos, onAlternar }) => {
    return (
        <div className="fila" style={{ margin: "var(--xs) 0 var(--md)", flexWrap: "wrap" }}>
            {estilos.length === 0 && <span className="body-sm muted">Todavía no hay estilos cargados.</span>}
            {estilos.map((estilo) => (
                <button key={estilo.id} type="button"
                    className={"chip" + (elegidos.includes(estilo.id) ? " activo" : "")}
                    aria-pressed={elegidos.includes(estilo.id)}
                    onClick={() => onAlternar(estilo.id)}>
                    {estilo.nombre_estilo}
                </button>
            ))}
        </div>
    )
}

export default SelectorEstilos
