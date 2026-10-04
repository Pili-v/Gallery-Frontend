import { Link } from "react-router-dom";
import FichaObra from "./FichaObra";
import Badge from "./Badge";

// Imagen + sello + ficha. Es lo que se repite en la grilla del catálogo,
// en el perfil del artista y en el panel del artista.
export default function TarjetaObra({ obra, variante, imagen }) {
  const sinStock = variante?.stock_variante === 0;
  const descuento = variante?.porcentaje_descuento > 0;

  return (
    <Link className="tarjeta-obra" to={`/obra/${obra.id}`}>
      <div className={"obra-imagen" + (sinStock ? " sin-stock" : "")}>
        {imagen && <img src={imagen} alt={obra.nombre_obra} />}
        {sinStock && <Badge tipo="sinstock">Sin stock</Badge>}
        {!sinStock && descuento && <Badge tipo="descuento">−{variante.porcentaje_descuento}%</Badge>}
      </div>
      <FichaObra obra={obra} variante={variante} />
    </Link>
  );
}
