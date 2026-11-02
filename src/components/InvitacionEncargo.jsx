import { Link } from "react-router-dom"

// La invitación a pedir un encargo: qué es (una obra hecha a pedido), cómo funciona en tres pasos y el botón para
// empezar. Va al final del catálogo, dentro del ancho del contenido, en el bordó suave de la marca.
const PASOS = ["Elegís el artista", "Definís tamaño, lienzo y marco", "Acuerdan el precio y la pintan para vos"]

const InvitacionEncargo = () => {
    return (
        <section className="invitacion-encargo">
            <div>
                <h2 className="headline-md">Una obra hecha para vos</h2>
                <p className="body-lg mt-xs">¿No encontrás lo que buscás? Pedile un encargo a un artista.</p>
                <Link to="/encargos/nuevo" className="boton boton-primario mt-lg">
                    Pedir un encargo
                </Link>
            </div>

            <ol className="invitacion-encargo-pasos">
                {PASOS.map((paso, i) => (
                    <li key={paso}>
                        <span className="invitacion-encargo-numero">{i + 1}</span>
                        {paso}
                    </li>
                ))}
            </ol>
        </section>
    )
}

export default InvitacionEncargo
