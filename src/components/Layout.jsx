import { useEffect, useRef } from "react"
import { Outlet } from "react-router-dom"
import Header from "./Header"
import Footer from "./Footer"
import SesionVencida from "./SesionVencida"

// El marco de todas las pantallas: header arriba, el contenido en el medio,
// footer abajo. Así nadie tiene que repetirlos en cada pantalla.
// El contenido ocupa como mínimo todo el alto de la ventana menos el del header (ver .vista en atelier.css):
// así el footer queda justo debajo de lo que se ve y aparece apenas se scrollea, aunque la pantalla sea corta.
// El alto del header cambia (por ejemplo, cuando se abre el menú en un celular): se mide y se vuelve a medir.
const Layout = () => {

    const pagina = useRef(null)
    const cabecera = useRef(null)

    useEffect(() => {
        const medir = () => pagina.current.style.setProperty("--alto-cabecera", cabecera.current.offsetHeight + "px")

        medir()
        const observador = new ResizeObserver(medir)
        observador.observe(cabecera.current)

        return () => observador.disconnect()
    }, [])

    return (
        <div className="pagina" ref={pagina}>
            <div ref={cabecera}>
                <Header />
            </div>
            <div className="vista">
                <Outlet />
            </div>
            <Footer />
            <SesionVencida />
        </div>
    )
}

export default Layout
