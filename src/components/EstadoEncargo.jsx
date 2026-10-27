import { estiloDeEstado } from "../api/encargoDetalleContrato.js"

// El sello de un estado. El texto lo manda el back (nombre_estado); acá solo se elige el estilo.
export default function EstadoEncargo({ estado, nombre }) {
    return <span className={`sello sello-${estiloDeEstado[estado] || "pendiente"}`}>{nombre || "Sin estado"}</span>
}
