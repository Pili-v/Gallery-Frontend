import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"

import { SESION_VENCIDA } from "../api/cliente"
import { cerrarSesion } from "../api/sesion"

import Confirmacion from "./Confirmacion"

// Cartel que avisa que la sesión venció. cliente.js emite SESION_VENCIDA cuando el back
// responde 401 a un pedido con token. La pantalla de fondo no se toca; al apretar el botón
// se cierra la sesión y se va al login recordando la ruta, para volver ahí al ingresar.
const SesionVencida = () => {
    const navegar = useNavigate()

    // La ruta en la que estaba el usuario. null = no hay nada que avisar.
    const [ruta, setRuta] = useState(null)

    useEffect(() => {
        // Varios pedidos pueden fallar juntos: queda la ruta del primero.
        const alVencer = (e) => setRuta((actual) => (actual === null ? e.detail : actual))

        window.addEventListener(SESION_VENCIDA, alVencer)
        return () => window.removeEventListener(SESION_VENCIDA, alVencer)
    }, [])

    if (ruta === null) return null

    const iniciarSesion = () => {
        cerrarSesion()
        setRuta(null)
        navegar("/login", { state: { volverA: ruta } })
    }

    return (
        <Confirmacion
            titulo="Tu sesión venció"
            mensaje="Por seguridad, volvé a iniciar sesión para seguir. Vas a volver a esta misma página."
            textoConfirmar="Iniciar sesión"
            onConfirmar={iniciarSesion}
        />
    )
}

export default SesionVencida
