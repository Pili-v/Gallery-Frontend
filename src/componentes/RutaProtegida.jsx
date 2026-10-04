import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import Estado from "./Estado";

// Envuelve una ruta que no es para cualquiera.
// roles: lista de roles que pueden entrar. Si no se pasa, alcanza con estar logueado.
export default function RutaProtegida({ roles, children }) {
  const { usuario, rol, cargando } = useAuth();

  if (cargando) return <div className="contenido seccion"><Estado tipo="cargando" /></div>;
  if (!usuario) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(rol)) return <Navigate to="/403" replace />;

  return children;
}
