import { Outlet } from "react-router-dom"
import Header from "./Header"
import Footer from "./Footer"
import SesionVencida from "./SesionVencida"

// El marco de todas las pantallas: header arriba, el contenido en el medio,
// footer abajo. Así nadie tiene que repetirlos en cada pantalla.
const Layout = () => {
    return (
        <div className="pagina">
            <Header />
            <Outlet />
            <Footer />
            <SesionVencida />
        </div>
    )
}

export default Layout
