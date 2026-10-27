import Boton from "./Boton"

// Los botones Anterior y Siguiente de una lista paginada. Solo dibuja y avisa el cambio:
// la pantalla es la que pide la página al back.
// pagina empieza en 0, igual que page en el back. Con una sola página no se dibuja nada.
const Paginador = ({ pagina, totalPaginas, onCambiar }) => {
    if (totalPaginas <= 1) return null

    return (
        <div className="entre" style={{ marginTop: "var(--xl)" }}>
            <Boton tipo={pagina === 0 ? "deshabilitado" : "secundario"} onClick={() => onCambiar(pagina - 1)}>
                Anterior
            </Boton>
            <span className="catalog-number muted">
                Página {pagina + 1} de {totalPaginas}
            </span>
            <Boton
                tipo={pagina + 1 >= totalPaginas ? "deshabilitado" : "secundario"}
                onClick={() => onCambiar(pagina + 1)}
            >
                Siguiente
            </Boton>
        </div>
    )
}

export default Paginador
