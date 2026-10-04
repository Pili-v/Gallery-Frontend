// Etiqueta + control + mensaje de error. Se usa en todos los formularios.
export default function CampoFormulario({ etiqueta, tipo = "text", error, textarea, children, ...props }) {
  const clase = `${textarea ? "textarea" : tipo === "select" ? "select" : "input"} ${error ? "con-error" : ""}`;
  return (
    <div className="campo">
      <label className="catalog-number muted">{etiqueta}</label>
      {textarea
        ? <textarea className={clase} {...props} />
        : tipo === "select"
          ? <select className={clase} {...props}>{children}</select>
          : <input className={clase} type={tipo} {...props} />}
      {error && <div className="campo-error body-sm">{error}</div>}
    </div>
  );
}
