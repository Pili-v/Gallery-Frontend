import { Link } from "react-router-dom"

// Una fila de la tabla de Mis obras. Solo dibuja lo que recibe: la pantalla pide los datos.
// Todo llega con la lista de obras: portada es la URL de la miniatura (null si la obra no tiene fotos),
// estilos el texto ya armado, y cantidadVariantes y variantesSinStock los conteos.
// Al hacer click en la fila se llama a onAlternar, que abre o cierra el detalle de la obra.
// Los datos de la obra llegan cada uno en su prop: id, nombreObra y enVenta.
const FilaObra = ({ id, nombreObra, enVenta, portada, estilos, cantidadVariantes, variantesSinStock, abierta, onAlternar }) => {
    return (
        <tr onClick={onAlternar} style={{ cursor: "pointer" }}>
            <td>
                <div className="fila">
                    <span style={{ color: "var(--bordo)" }}>{abierta ? "▾" : "▸"}</span>
                    <div className="linea-mini" style={{ width: 56, flex: "none", display: "grid", placeItems: "center" }}>
                        {portada && <img src={portada} alt={"Portada de " + nombreObra} />}
                        {portada === null && <span className="cartela-meta" style={{ fontSize: 10, textAlign: "center" }}>Sin foto</span>}
                    </div>
                    <span className="title-work" style={{ fontSize: 16 }}>
                        {nombreObra}
                    </span>
                </div>
            </td>
            <td className="muted">{estilos}</td>
            <td>
                {cantidadVariantes}
                {variantesSinStock > 0 && (
                    <span style={{ color: "var(--error)" }}> · {variantesSinStock} sin stock</span>
                )}
            </td>
            <td>{enVenta ? "Sí" : "No"}</td>
            <td>
                <Link
                    to={"/panel/obras/" + id + "/editar"}
                    style={{ color: "var(--bordo)" }}
                    onClick={(e) => e.stopPropagation()}
                >
                    Editar
                </Link>
            </td>
        </tr>
    )
}

export default FilaObra
