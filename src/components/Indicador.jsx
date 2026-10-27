// Un dato destacado de una lista (por ejemplo, "Vendido: $ 220.560" o "Compras: 3"): una tarjeta chica con su título
// arriba y el valor abajo. Van dentro de un .filtros-totales, a la derecha de la fila de filtros, y en todas las listas
// se ven igual (Mis obras, Mis ventas y Mis compras).
//   titulo: lo que se mide.  valor: el número o el importe ya formateado.
const Indicador = ({ titulo, valor }) => {
    return (
        <div className="cartela">
            <p className="catalog-number muted">{titulo}</p>
            <p className="price-lg">{valor}</p>
        </div>
    )
}

export default Indicador
