// Sello sobre la imagen de la obra: descuento o sin stock.
const Badge = ({ tipo, children }) => {
    return <span className={"badge badge-" + tipo}>{children}</span>
}

export default Badge
