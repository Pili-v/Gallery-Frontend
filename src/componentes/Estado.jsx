// Los cuatro casos que toda pantalla que pide datos tiene que contemplar.
// tipo: "cargando" | "vacio" | "error" | "sinPermiso"
export default function Estado({ tipo, mensaje, accion, onAccion }) {
  if (tipo === "cargando") {
    return (
      <div className="estado" style={{ textAlign: "left" }}>
        {[70, 90, 55].map((ancho, i) => (
          <div key={i} className="esqueleto esqueleto-linea" style={{ width: ancho + "%" }} />
        ))}
      </div>
    );
  }

  if (tipo === "error") {
    return (
      <div className="estado estado-error">
        <b>No se pudo cargar.</b> <span className="muted">{mensaje}</span>
      </div>
    );
  }

  if (tipo === "sinPermiso") {
    return (
      <div className="estado">
        <p className="body-lg">No tenés permiso para ver esto.</p>
      </div>
    );
  }

  return (
    <div className="estado">
      <p className="body-lg">{mensaje}</p>
      {accion && (
        <button className="boton boton-secundario" style={{ marginTop: "var(--md)" }} onClick={onAccion}>
          {accion}
        </button>
      )}
    </div>
  );
}
