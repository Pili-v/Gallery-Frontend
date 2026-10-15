import { estadosEncargo } from '../api/encargoDetalleContrato.mjs';

export default function EstadoEncargo({ estado }) {
  const sello = estadosEncargo[estado];
  return <span className={`sello sello-${sello?.clase ?? 'pendiente'}`}>{sello?.texto ?? 'Sin estado'}</span>;
}
