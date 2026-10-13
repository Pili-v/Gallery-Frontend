import { useNavigate } from "react-router-dom"

import Boton from "../components/Boton"

const SinPermiso = () => {

    const navigate = useNavigate()

    return (
        <div className="seccion">

            <div
                className="contenido col-angosta centro"
                style={{
                    padding: "var(--xxl) 0"
                }}
            >

                <p className="catalog-number cartela-num">
                    Error 403
                </p>

                <h1
                    className="headline-lg"
                    style={{
                        margin: "var(--sm) 0"
                    }}
                >
                    No tenés permiso para ver esto
                </h1>

                <p className="body-lg muted">
                    Esta sección es de otro rol.
                    Si creés que es un error, pedile a un
                    administrador que revise tu cuenta.
                </p>

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

export default SinPermiso
