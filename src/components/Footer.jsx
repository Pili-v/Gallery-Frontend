import { Link } from "react-router-dom"

const Footer = () => {
    return (
        <footer className="footer">
            <span className="header-marca" style={{ fontSize: 18 }}>Atelier&nbsp;Attack</span>
            <div className="footer-links nav-link">
                <Link to="/" style={{ color: "var(--ink-muted)", textDecoration: "none" }}>Catálogo</Link>
                <Link to="/artistas" style={{ color: "var(--ink-muted)", textDecoration: "none" }}>Artistas</Link>
                <Link to="/encargos" style={{ color: "var(--ink-muted)", textDecoration: "none" }}>Encargos</Link>
            </div>
            <span className="catalog-number muted">2026</span>
        </footer>
    )
}

export default Footer
