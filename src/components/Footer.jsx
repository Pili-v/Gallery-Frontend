import { Link } from "react-router-dom"
import { getRol } from "../api/sesion"

const Footer = () => {
    const links = getRol() === "ADMIN"
        ? [["Usuarios", "/admin/usuarios"], ["Catálogos", "/admin/catalogos"], ["Encargos", "/encargos"]]
        : [["Catálogo", "/"], ["Artistas", "/artistas"], ["Encargos", "/encargos"]]
    return (
        <footer className="footer">
            <span className="header-marca" style={{ fontSize: 18 }}>Atelier&nbsp;Attack</span>
            <div className="footer-links nav-link">
                {links.map(([nombre, ruta]) => (
                    <Link key={ruta} to={ruta} style={{ color: "var(--ink-muted)", textDecoration: "none" }}>{nombre}</Link>
                ))}
            </div>
            <span className="catalog-number muted">2026</span>
        </footer>
    )
}

export default Footer
