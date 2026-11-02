import { useNavigate } from "react-router-dom"

import Boton from "../components/Boton"

const NoEncontrada = () => {
    const navigate = useNavigate()

    return (
        <div className="seccion">
            <div className="contenido col-angosta centro pagina-aviso">
                <p className="catalog-number cartela-num">Error 404</p>

                <h1 className="headline-lg pagina-aviso-titulo">Página no encontrada</h1>

                <p className="body-lg muted">La página que estás buscando no existe o fue movida.</p>

                <Boton className="mt-lg" tipo="primario" onClick={() => navigate("/")}>
                    Volver al catálogo
                </Boton>
            </div>
        </div>
    )
}

export default NoEncontrada
