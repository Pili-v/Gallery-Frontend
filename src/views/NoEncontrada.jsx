import { useNavigate } from "react-router-dom"

import Boton from "../components/Boton"

const NoEncontrada = () => {
    const navigate = useNavigate()

    return (
        <div className="seccion">
            <div
                className="contenido col-angosta centro"
                style={{
                    padding: "var(--xxl) 0"
                }}
            >
                <p className="catalog-number cartela-num">Error 404</p>

                <h1
                    className="headline-lg"
                    style={{
                        margin: "var(--sm) 0"
                    }}
                >
                    Página no encontrada
                </h1>

                <p className="body-lg muted">La página que estás buscando no existe o fue movida.</p>

                <Boton
                    tipo="primario"
                    style={{
                        marginTop: "var(--lg)"
                    }}
                    onClick={() => navigate("/")}
                >
                    Volver al catálogo
                </Boton>
            </div>
        </div>
    )
}

export default NoEncontrada
