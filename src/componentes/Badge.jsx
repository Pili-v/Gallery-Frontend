// Sello sobre la imagen de la obra: descuento o sin stock.
export default function Badge({ tipo, children }) {
  return <span className={`badge badge-${tipo}`}>{children}</span>;
}
