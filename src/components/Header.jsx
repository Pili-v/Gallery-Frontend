import { useState } from "react"
import { Link, NavLink, useNavigate } from "react-router-dom"
import { getUsuario, getRol, cerrarSesion } from "../api/sesion"

// Barra de arriba. El menú cambia según el rol: cada uno ve solo lo suyo.
const Header = () => {
    const usuario = getUsuario()
    const rol = getRol()
    const navegar = useNavigate()

    // En pantallas angostas el menú se esconde detrás de un botón (ver .header-menu-boton en atelier.css).
    const [abierto, setAbierto] = useState(false)

    const menus = {
        visitante: [
            ["Catálogo", "/"],
            ["Artistas", "/artistas"],
            ["Ingresar", "/login"]
        ],
        CLIENTE: [
            ["Catálogo", "/"],
            ["Artistas", "/artistas"],
            ["Encargos", "/encargos"],
            ["Mis compras", "/mis-compras"],
            ["Carrito", "/carrito"]
        ],
        ARTISTA: [
            ["Catálogo", "/"],
            ["Artistas", "/artistas"],
            ["Mis obras", "/panel/obras"],
            ["Mis ventas", "/panel/ventas"],
            ["Encargos", "/encargos"]
        ],
        ARTISTA_CLIENTE: [
            ["Catálogo", "/"],
            ["Artistas", "/artistas"],
            ["Mis obras", "/panel/obras"],
            ["Mis ventas", "/panel/ventas"],
            ["Encargos", "/encargos"],
            ["Mis compras", "/mis-compras"],
            ["Carrito", "/carrito"]
        ],
        ADMIN: [
            ["Usuarios", "/admin/usuarios"],
            ["Catálogos", "/admin/catalogos"],
            ["Encargos", "/encargos"]
        ]
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
                    <button
                        type="button"
                        className="header-menu-boton"
                        aria-expanded={abierto}
                        aria-controls="menu-principal"
                        onClick={() => setAbierto(!abierto)}
                    >
                        {abierto ? "Cerrar" : "Menú"}
                    </button>
                    <nav
                        id="menu-principal"
                        className={"header-nav" + (abierto ? " abierto" : "")}
                        onClick={() => setAbierto(false)}
                    >
                        {links.map((link, index) => (
                            <NavLink
                                key={index}
                                to={link[1]}
                                className={({ isActive }) => "nav-link" + (isActive ? " activo" : "")}
                            >
                                {link[0]}
                            </NavLink>
                        ))}
                        {/* Solo los clientes: quien ya publica (o administra) no lo necesita. */}
                        {rol === "CLIENTE" && (
                            <Link
                                to="/quiero-publicar"
                                className="boton boton-secundario"
                                title="¿Querés publicar tus obras? Creá tu perfil de artista"
                                style={{ padding: "8px 14px", color: "var(--bordo)", whiteSpace: "nowrap" }}
                            >
                                ¿Querés publicar?
                            </Link>
                        )}
                        {usuario && (
                            <>
                                <Link to="/mi-cuenta" className="avatar" style={{ textDecoration: "none" }}>
                                    {iniciales.toUpperCase()}
                                </Link>
                                <a href="#" className="nav-link" onClick={salir}>
                                    Salir
                                </a>
                            </>
                        )}
                    </nav>
                </div>
            </header>
        </>
    )
}

export default Header
