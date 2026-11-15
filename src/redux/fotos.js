// Las fotos de una obra en el orden en que se muestran (la primera es la portada). Lo usa obrasSlice al guardar la
// galería que devuelve el back.
export const ordenarFotos = (imagenes) => [...imagenes].sort((a, b) => a.orden_imagen - b.orden_imagen)

// La URL de la portada de una obra (su primera foto), o null si no tiene fotos.
export const portadaDe = (obra) => (obra.imagenes && obra.imagenes.length > 0 ? obra.imagenes[0].url : null)
