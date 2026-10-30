import { Outlet, useLocation } from "react-router-dom"
import Header from "./Header"
import Footer from "./Footer"
import SesionVencida from "./SesionVencida"

// El marco de todas las pantallas: header arriba, el contenido en el medio,
// footer abajo. Así nadie tiene que repetirlos en cada pantalla.
// El header queda fijo: lo que scrollea es la zona de abajo (.desplazable), que contiene la vista y el footer.
// La vista ocupa como mínimo todo el alto de esa zona (ver .vista en atelier.css): así el footer queda justo
// debajo de lo que se ve y aparece apenas se scrollea, aunque la pantalla sea corta.
// La zona lleva como key la ruta: al cambiar de pantalla se arma de nuevo y arranca desde arriba (si no, conservaría el
// scroll de la anterior).
const Layout = () => {
    const { pathname } = useLocation()

    return (
        <div className="pagina">
            <div className="cabecera">
                <Header />
            </div>
            <div className="desplazable" key={pathname}>
                <div className="vista">
                    <Outlet />
                </div>
                <Footer />
            </div>
            <SesionVencida />
        </div>
    )
}

export default Layout
