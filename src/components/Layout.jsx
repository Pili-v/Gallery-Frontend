import { Outlet } from "react-router-dom"
import Header from "./Header"
import Footer from "./Footer"

// El marco de todas las pantallas: header arriba, el contenido en el medio,
// footer abajo. Así nadie tiene que repetirlos en cada pantalla.
const Layout = () => {
    return (
        <div className="pagina">
            <Header />
            <Outlet />
            <Footer />
        </div>
    )
}

export default Layout
