import { Navigate, useLocation } from "react-router-dom"
import { useSelector } from "react-redux"

// Envuelve una pantalla que no es para cualquiera.
// roles: lista de roles que pueden entrar. Si no se pasa, alcanza con estar logueado.
const RutaProtegida = ({ roles, children }) => {
    const usuario = useSelector((state) => state.sesion.usuario)
    const ubicacion = useLocation()

    // Sin sesión se va al login, recordando a qué pantalla quería entrar para volver después.
    if (!usuario) return <Navigate to="/login" replace state={{ volverA: ubicacion.pathname + ubicacion.search }} />
    if (roles && !roles.includes(usuario.rol_usuario)) return <Navigate to="/403" replace />

    return children
}

export default RutaProtegida
