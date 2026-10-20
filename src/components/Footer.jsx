// El mail de contacto va acá: si se crea uno propio para el proyecto, se cambia solo esta línea.
const EMAIL_CONTACTO = "contacto@atelierattack.com"

// Pie de la página: quiénes somos, cómo contactarnos y cómo se compra. Es el mismo para todos:
// no depende de quién esté logueado ni de su rol, y no repite los enlaces de la barra de arriba.
const Footer = () => {
    return (
        <footer className="footer">
            <div className="footer-bloque">
                <span className="header-marca" style={{ fontSize: 18 }}>Atelier&nbsp;Attack</span>
                <span className="body-sm">Obra original, directo del artista.</span>
            </div>

            <div className="footer-bloque">
                <span className="catalog-number">Contacto</span>
                <a href={"mailto:" + EMAIL_CONTACTO} className="body-sm" style={{ color: "var(--bordo)", textDecoration: "none" }}>
                    {EMAIL_CONTACTO}
                </a>
                <span className="body-sm">Buenos Aires, Argentina</span>
            </div>

            <div className="footer-bloque">
                <span className="catalog-number">Comprar</span>
                <span className="body-sm">Envío a domicilio o retiro en el local</span>
                <span className="body-sm">Visa · Mastercard · Amex</span>
            </div>

            <span className="footer-final catalog-number">© 2026 Atelier Attack</span>
        </footer>
    )
}

export default Footer
