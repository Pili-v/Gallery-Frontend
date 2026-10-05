// El botón de todo el sitio. tipo: primario, secundario o deshabilitado.
const Boton = ({ tipo = "primario", bloque = false, children, ...props }) => {
    return (
        <button
            className={"boton boton-" + tipo + (bloque ? " boton-bloque" : "")}
            disabled={tipo === "deshabilitado"}
            {...props}>
            {children}
        </button>
    )
}

export default Boton
