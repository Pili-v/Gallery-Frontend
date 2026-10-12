import { Link } from "react-router-dom";
import { pesos } from "../api/formato";

// La ficha de la publicación: número, obra, vendedor, medidas, precio y stock.
// Es la pieza que da identidad al sitio y aparece en toda pantalla con una obra.

export default function FichaObra({ obra, variante }) {
  const precio = variante?.precio_variante;
  const descuento = variante?.porcentaje_descuento;
  const precioFinal = descuento ? precio * (1 - descuento / 100) : precio;

  return (
    <div className="cartela">
      <div className="cartela-fila">
        <span className="catalog-number cartela-num">Nº {String(obra.id).padStart(3, "0")}</span>
        <span className="cartela-meta">{obra.estilo ?? ""}</span>
      </div>

      <div className="cartela-fila" style={{ display: "block" }}>
        <Link
          to={`/obra/${obra.id}`}
          className="title-work"
          style={{ display: "block", color: "inherit", textDecoration: "none" }}
        >
          {obra.nombre_obra}
        </Link>

        {obra.artistaId ? (
          <Link
            to={`/artista/${obra.artistaId}`}
            className="vendedor"
            style={{ marginTop: 4, textDecoration: "none" }}
          >
            <span className="avatar">{(obra.nombre_artistico ?? "A")[0]}</span>
            <span className="cartela-artist">{obra.nombre_artistico ?? "Artista"}</span>
          </Link>
        ) : (
          // Sin artistaId (por ejemplo, en el propio perfil del artista) no tiene
          // sentido linkear a sí mismo: se muestra como texto plano, no como link.
          <div className="vendedor" style={{ marginTop: 4 }}>
            <span className="avatar">{(obra.nombre_artistico ?? "A")[0]}</span>
            <span className="cartela-artist">{obra.nombre_artistico ?? "Artista"}</span>
          </div>
        )}
      </div>

      <div className="cartela-fila">
        <span className="cartela-meta">{variante?.nombre_tamanio ?? ""}</span>
        <span className="price-md">
          {descuento > 0 && <span className="precio-tachado cartela-meta">{pesos(precio)}</span>}
          {pesos(precioFinal)}
        </span>
      </div>

      <div className="cartela-fila">
        <Disponibilidad stock={variante?.stock_variante} />
      </div>
    </div>
  );
}

function Disponibilidad({ stock }) {
  if (stock === 0) return <span className="cartela-meta">Sin stock</span>;
  if (stock === 1) return <span className="cartela-meta disponible poco">Última unidad</span>;
  return <span className="cartela-meta disponible">{stock} disponibles</span>;
}
