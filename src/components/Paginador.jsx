import Boton from "./Boton";

// Controles de paginación. La página es de base 0, igual que en el backend (PageRequest).
export default function Paginador({
  pagina,
  totalPaginas,
  tamanio,
  opcionesTamanio = [6, 9, 12],
  onPagina,
  onTamanio,
}) {
  if (totalPaginas <= 0) return null;

  return (
    <div className="entre" style={{ marginTop: "var(--xl)", flexWrap: "wrap" }}>
      <div className="fila">
        <Boton tipo="secundario" disabled={pagina === 0} onClick={() => onPagina(pagina - 1)}>
          Anterior
        </Boton>
        <span className="catalog-number muted">
          Página {pagina + 1} de {totalPaginas}
        </span>
        <Boton
          tipo="secundario"
          disabled={pagina >= totalPaginas - 1}
          onClick={() => onPagina(pagina + 1)}
        >
          Siguiente
        </Boton>
      </div>

      <label className="fila">
        <span className="cartela-meta">Obras por página</span>
        <select
          className="select"
          style={{ width: 90 }}
          value={tamanio}
          onChange={(e) => onTamanio(Number(e.target.value))}
        >
          {opcionesTamanio.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
