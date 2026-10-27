// Quiero publicar — Área 5 · Cliente
// Un cliente crea su perfil de artista para empezar a publicar sus obras. El botón que lleva acá
// está en la barra de arriba y solo lo ven los clientes. Al crear el perfil, el back le pasa el
// rol a ARTISTA_CLIENTE (sigue pudiendo comprar).

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { api } from "../api/cliente"
import { getRol, getToken, guardarSesion } from "../api/sesion"

import Boton from "../components/Boton"
import CampoFormulario from "../components/CampoFormulario"

const QuieroPublicar = () => {
    const navegar = useNavigate()
    const rol = getRol()

    const [nombreArtistico, setNombreArtistico] = useState("")
    const [aceptaEncargos, setAceptaEncargos] = useState(true)
    const [enviando, setEnviando] = useState(false)
    const [error, setError] = useState("")

    // Quien ya publica (o administra) no tiene nada que crear: se lo dice y lo manda a donde corresponde.
    if (rol !== "CLIENTE") {
        const esAdmin = rol === "ADMIN"

        return (
            <div className="seccion">
                <div className="contenido col-media">
                    <h1 className="headline-lg">
                        {esAdmin ? "No necesitás un perfil de artista" : "Ya podés publicar tus obras"}
                    </h1>
                    <p className="body-lg muted">
                        {esAdmin
                            ? "Como administrador ya tenés todos los permisos."
                            : "Tu cuenta ya tiene perfil de artista."}
                    </p>
                    {!esAdmin && <Boton onClick={() => navegar("/panel/obras")}>Ir a mis obras</Boton>}
                </div>
            </div>
        )
    }

    // Crea el perfil y vuelve a pedir los datos de la cuenta: el rol cambió y la barra de arriba
    // y las pantallas de artista lo leen de lo que se guardó al entrar.
    const crearPerfil = (e) => {
        e.preventDefault()
        if (enviando) return

        setEnviando(true)
        setError("")

        api.post("/api/usuarios/me/perfil-artista", {
            nombre_artistico: nombreArtistico.trim(),
            acepta_encargos: aceptaEncargos
        })
            .then(() => api.get("/api/usuarios/me"))
            .then((cuenta) => {
                guardarSesion(getToken(), cuenta)
                navegar("/panel/obras")
            })
            .catch((falla) => {
                setError(falla.message)
                setEnviando(false)
            })
    }

    return (
        <div className="seccion">
            <div className="contenido col-media">
                <h1 className="headline-lg">¿Querés publicar tus obras?</h1>
                <p className="body-lg muted">
                    Creá tu perfil de artista y vendé tu obra original, directo a quien la compra.
                </p>

                <div className="cartela" style={{ padding: "var(--lg)", marginBottom: "var(--lg)" }}>
                    <p className="catalog-number muted" style={{ marginBottom: "var(--sm)" }}>
                        Qué vas a poder hacer
                    </p>
                    <p className="body-sm">
                        Publicar tus obras con fotos y variantes: tamaños, precios, stock y descuentos.
                    </p>
                    <p className="body-sm">Ver tus ventas y las facturas que se emiten a tu nombre.</p>
                    <p className="body-sm">Recibir encargos de quienes quieran una obra a medida.</p>
                    <p className="body-sm muted" style={{ marginTop: "var(--sm)" }}>
                        Seguís pudiendo comprar y hacer encargos como hasta ahora.
                    </p>
                </div>

                <form className="cartela" style={{ padding: "var(--lg)" }} onSubmit={crearPerfil}>
                    <p className="catalog-number muted" style={{ marginBottom: "var(--md)" }}>
                        Tu perfil de artista
                    </p>

                    <CampoFormulario
                        etiqueta="Nombre artístico"
                        name="nombre_artistico"
                        value={nombreArtistico}
                        maxLength={150}
                        required
                        onChange={(e) => setNombreArtistico(e.target.value)}
                    />

                    <label className="body-sm" style={{ display: "block", marginBottom: "var(--md)" }}>
                        <input
                            type="checkbox"
                            checked={aceptaEncargos}
                            onChange={(e) => setAceptaEncargos(e.target.checked)}
                        />{" "}
                        Quiero recibir encargos de obras a medida
                    </label>

                    {error && (
                        <p className="campo-error body-sm" style={{ marginBottom: "var(--md)" }}>
                            {error}
                        </p>
                    )}

                    <Boton tipo={enviando ? "deshabilitado" : "primario"} bloque type="submit">
                        {enviando ? "Creando tu perfil..." : "Crear mi perfil de artista"}
                    </Boton>
                </form>
            </div>
        </div>
    )
}

export default QuieroPublicar
