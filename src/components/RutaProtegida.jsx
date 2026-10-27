import { Navigate, useLocation } from "react-router-dom"
import { getUsuario, getRol } from "../api/sesion"

// Envuelve una pantalla que no es para cualquiera.
// roles: lista de roles que pueden entrar. Si no se pasa, alcanza con estar logueado.
const RutaProtegida = ({ roles, children }) => {
    const usuario = getUsuario()
    const ubicacion = useLocation()

    // Sin sesión se va al login, recordando a qué pantalla quería entrar para volver después.
    if (!usuario) return <Navigate to="/login" replace state={{ volverA: ubicacion.pathname + ubicacion.search }} />
    if (roles && !roles.includes(getRol())) return <Navigate to="/403" replace />

    return children
}

export default RutaProtegida
