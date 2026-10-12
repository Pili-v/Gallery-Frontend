// Guarda quién entró. Va en localStorage, que es la memoria del navegador,
// para que no se pierda al recargar la página.
// El token solo lleva el email, así que al entrar también guardamos lo que
// devuelve GET /api/usuarios/me: de ahí salen el id, el rol y, si es artista,
// su perfil de artista.

export const guardarSesion = (token, perfilCompleto) => {
    localStorage.setItem("token", token)
    localStorage.setItem("usuario", JSON.stringify(perfilCompleto.usuario))

    if (perfilCompleto.perfil_artista) {
        localStorage.setItem("perfilArtista", JSON.stringify(perfilCompleto.perfil_artista))
    } else {
        localStorage.removeItem("perfilArtista")
    }
}

export const getToken = () => localStorage.getItem("token")

export const getUsuario = () => {
    const guardado = localStorage.getItem("usuario")
    return guardado ? JSON.parse(guardado) : null
}

// El perfil de artista es otra cosa que el usuario: tiene su propio id, y es el
// que piden endpoints como /api/artistas/{id}/facturas. Si no es artista, va null.
export const getPerfilArtista = () => {
    const guardado = localStorage.getItem("perfilArtista")
    return guardado ? JSON.parse(guardado) : null
}

export const getRol = () => getUsuario()?.rol_usuario ?? null

export const cerrarSesion = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("usuario")
    localStorage.removeItem("perfilArtista")
}
