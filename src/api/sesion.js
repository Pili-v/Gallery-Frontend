// Guarda quién entró. Va en localStorage, que es la memoria del navegador,
// para que no se pierda al recargar la página.
// El token solo lleva el email, así que al entrar también guardamos
// el usuario que devuelve GET /api/usuarios/me: de ahí salen el id y el rol.

export const guardarSesion = (token, usuario) => {
    localStorage.setItem("token", token)
    localStorage.setItem("usuario", JSON.stringify(usuario))
}

export const getToken = () => localStorage.getItem("token")

export const getUsuario = () => {
    const guardado = localStorage.getItem("usuario")
    return guardado ? JSON.parse(guardado) : null
}

export const getRol = () => getUsuario()?.rol_usuario ?? null

export const cerrarSesion = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("usuario")
}
