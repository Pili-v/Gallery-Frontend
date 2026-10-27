// Son permisos para mostrar botones. El backend vuelve a comprobarlos con el JWT.
export function permisosEncargo(encargo, usuario, perfilArtista) {
    const esCliente = Boolean(encargo && usuario && encargo.usuario_id === usuario.id)
    const esArtista = Boolean(encargo && perfilArtista && encargo.artista_id === perfilArtista.id)
    const esAdmin = usuario?.rol_usuario === "ADMIN"
    const estado = encargo?.estado_encargo
    const artistaConRol = esArtista && ["ARTISTA", "ARTISTA_CLIENTE"].includes(usuario?.rol_usuario)
    return {
        esCliente: !esAdmin && esCliente,
        esArtista: !esAdmin && artistaConRol,
        puedeVer: Boolean(encargo && (esCliente || esArtista || esAdmin)),
        puedeVerMensajes: !esAdmin && (esCliente || esArtista),
        puedeEscribir: !esAdmin && (esCliente || esArtista),
        puedeCambiarEstado: !esAdmin && esArtista && ["ARTISTA", "ARTISTA_CLIENTE"].includes(usuario?.rol_usuario),
        // El flujo del back: el artista propone el precio mientras el encargo está pendiente; el cliente lo acepta
        // (queda aprobado, con el precio fijo y sin poder cancelarse; solo se cancela mientras está pendiente) y lo paga
        // cuando el artista lo termina.
        puedeDefinirPrecio: !esAdmin && artistaConRol && estado === "PENDIENTE",
        puedeAceptarPrecio: !esAdmin && esCliente && estado === "PENDIENTE" && encargo?.precio_acordado != null,
        puedeCancelar: !esAdmin && esCliente && estado === "PENDIENTE",
        puedePagar: !esAdmin && esCliente && estado === "TERMINADO"
    }
}
