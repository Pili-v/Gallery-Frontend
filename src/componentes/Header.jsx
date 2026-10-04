import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

// Dos niveles: franja de marca arriba y barra de navegación abajo.
// El menú cambia según el rol: cada uno ve solo lo que puede hacer.
export default function Header() {
  const { usuario, rol, salir } = useAuth();

  const menus = {
    visitante:       [["Catálogo", "/"], ["Artistas", "/artistas"], ["Ingresar", "/login"]],
    CLIENTE:         [["Catálogo", "/"], ["Artistas", "/artistas"], ["Encargos", "/encargos"], ["Mis compras", "/mis-compras"], ["Carrito", "/carrito"]],
    ARTISTA:         [["Catálogo", "/"], ["Mis obras", "/panel/obras"], ["Mis ventas", "/panel/ventas"], ["Encargos", "/encargos"]],
    ARTISTA_CLIENTE: [["Catálogo", "/"], ["Mis obras", "/panel/obras"], ["Encargos", "/encargos"], ["Mis compras", "/mis-compras"], ["Carrito", "/carrito"]],
    ADMIN:           [["Catálogo", "/"], ["Usuarios", "/admin/usuarios"], ["Catálogos", "/admin/catalogos"]],
  };

  const links = menus[rol] ?? menus.visitante;

  const iniciales = usuario
    ? (usuario.nombre_persona?.[0] ?? "") + (usuario.apellido_persona?.[0] ?? "")
    : "";

  return (
    <>
      <div className="barra-marca" />
      <header className="header">
        <div className="header-franja catalog-number">
          <span>Atelier Attack · Obra original, directo del artista</span>
          <span>Artistas de todo el país</span>
        </div>
        <div className="header-barra">
          <Link to="/" className="header-marca" style={{ textDecoration: "none", color: "inherit" }}>
            Atelier&nbsp;Attack
          </Link>
          <nav className="header-nav">
            {links.map(([texto, ruta]) => (
              <NavLink key={ruta} to={ruta}
                className={({ isActive }) => "nav-link" + (isActive ? " activo" : "")}>
                {texto}
              </NavLink>
            ))}
            {usuario && (
              <>
                <Link to="/mi-cuenta" className="avatar" style={{ textDecoration: "none" }}>
                  {iniciales.toUpperCase()}
                </Link>
                <a href="#" className="nav-link" onClick={(e) => { e.preventDefault(); salir(); }}>
                  Salir
                </a>
              </>
            )}
          </nav>
        </div>
      </header>
    </>
  );
}
