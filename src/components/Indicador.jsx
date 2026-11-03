// Un dato destacado de una lista (por ejemplo, "Vendido: $ 220.560" o "Compras: 3"): su título arriba y el valor
// abajo. Van en la columna lateral de la lista (.panel-lateral-totales) y en todas se ven igual (Mis obras, Mis ventas y
// Mis compras).
//   titulo: lo que se mide.  valor: el número o el importe ya formateado.
const Indicador = ({ titulo, valor }) => {
    return (
        <div className="indicador">
            <p className="catalog-number muted">{titulo}</p>
            <p className="price-lg">{valor}</p>
        </div>
    )
}

export default Indicador
