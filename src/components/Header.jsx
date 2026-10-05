import { Link, NavLink, useNavigate } from "react-router-dom"
import { getUsuario, getRol, cerrarSesion } from "../api/sesion"

// Barra de arriba. El menú cambia según el rol: cada uno ve solo lo suyo.
const Header = () => {

    const usuario = getUsuario()
    const rol = getRol()
    const navegar = useNavigate()

    const menus = {
        visitante: [["Catálogo", "/"], ["Artistas", "/artistas"], ["Ingresar", "/login"]],
        CLIENTE: [["Catálogo", "/"], ["Artistas", "/artistas"], ["Encargos", "/encargos"], ["Mis compras", "/mis-compras"], ["Carrito", "/carrito"]],
        ARTISTA: [["Catálogo", "/"], ["Mis obras", "/panel/obras"], ["Mis ventas", "/panel/ventas"], ["Encargos", "/encargos"]],
        ARTISTA_CLIENTE: [["Catálogo", "/"], ["Mis obras", "/panel/obras"], ["Encargos", "/encargos"], ["Mis compras", "/mis-compras"], ["Carrito", "/carrito"]],
        ADMIN: [["Catálogo", "/"], ["Usuarios", "/admin/usuarios"], ["Catálogos", "/admin/catalogos"]]
    }

    const links = menus[rol] || menus.visitante

    const iniciales = usuario
        ? ((usuario.nombre_persona || "")[0] || "") + ((usuario.apellido_persona || "")[0] || "")
        : ""

    const salir = (e) => {
        e.preventDefault()
        cerrarSesion()
        navegar("/login")
    }

    return (
        <>
            <div className="barra-marca"></div>
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
                        {links.map((link, index) => (
                            <NavLink key={index} to={link[1]}
                                className={({ isActive }) => "nav-link" + (isActive ? " activo" : "")}>
                                {link[0]}
                            </NavLink>
                        ))}
                        {usuario && (
                            <>
                                <Link to="/mi-cuenta" className="avatar" style={{ textDecoration: "none" }}>
                                    {iniciales.toUpperCase()}
                                </Link>
                                <a href="#" className="nav-link" onClick={salir}>Salir</a>
                            </>
                        )}
                    </nav>
                </div>
            </header>
        </>
    )
}

export default Header
