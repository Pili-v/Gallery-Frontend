// El botón de todo el sitio. tipo: primario, secundario o deshabilitado.
export default function Boton({ tipo = "primario", bloque = false, children, ...props }) {
  const clases = ["boton", `boton-${tipo}`, bloque ? "boton-bloque" : ""].join(" ");
  return (
    <button className={clases} disabled={tipo === "deshabilitado"} {...props}>
      {children}
    </button>
  );
}
