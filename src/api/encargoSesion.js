// Son permisos para mostrar botones. El backend vuelve a comprobarlos con el JWT.
export function permisosEncargo(encargo, usuario, perfilArtista) {
  const esCliente = Boolean(encargo && usuario && encargo.usuario_id === usuario.id);
  const esArtista = Boolean(encargo && perfilArtista && encargo.artista_id === perfilArtista.id);
  const esAdmin = usuario?.rol_usuario === 'ADMIN';
  return {
    puedeVer: Boolean(encargo && (esCliente || esArtista || esAdmin)),
    puedeEscribir: Boolean(encargo && (esCliente || esArtista || esAdmin)),
    puedeCambiarEstado: esArtista && ['ARTISTA', 'ARTISTA_CLIENTE', 'ADMIN'].includes(usuario?.rol_usuario),
  };
}
