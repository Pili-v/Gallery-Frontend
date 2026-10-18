import { Link } from "react-router-dom"

// Una fila de la tabla de Mis obras. Solo dibuja lo que recibe: la pantalla pide los datos.
// cantidadVariantes y variantesSinStock llegan en null mientras se están pidiendo (o si el pedido falló).
// portada es la URL de la miniatura: undefined mientras llega, null si la obra no tiene fotos.
// Al hacer click en la fila se llama a onAlternar, que abre o cierra el detalle de la obra.
const FilaObra = ({ obra, portada, estilos, cantidadVariantes, variantesSinStock, abierta, onAlternar }) => {
    const cargada = cantidadVariantes !== null

    return (
        <tr onClick={onAlternar} style={{ cursor: "pointer" }}>
            <td>
                <div className="fila">
                    <span style={{ color: "var(--bordo)" }}>{abierta ? "▾" : "▸"}</span>
                    <div className="linea-mini" style={{ width: 56, flex: "none", display: "grid", placeItems: "center" }}>
                        {portada && <img src={portada} alt={"Portada de " + obra.nombre_obra} />}
                        {portada === null && <span className="cartela-meta" style={{ fontSize: 10, textAlign: "center" }}>Sin foto</span>}
                    </div>
                    <span className="title-work" style={{ fontSize: 16 }}>
                        {obra.nombre_obra}
                    </span>
                </div>
            </td>
            <td className="muted">{estilos}</td>
            <td>
                {cargada ? cantidadVariantes : "—"}
                {cargada && variantesSinStock > 0 && (
                    <span style={{ color: "var(--error)" }}> · {variantesSinStock} sin stock</span>
                )}
            </td>
            <td>{obra.en_venta ? "Sí" : "No"}</td>
            <td>
                <Link
                    to={"/panel/obras/" + obra.id + "/editar"}
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
